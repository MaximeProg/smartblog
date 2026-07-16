"""030 — Suppression pages/menus + colonnes Stripe/PayPal orphelines + durcissement RLS

Le Site Builder pages/blocks (migration 008) a été abandonné lors du rebuild du
dashboard (2026-07-02/03) au profit du Studio VWB basé sur template_config.
Plus aucun code frontend n'appelle pagesApi/menusApi — suppression des tables.

Stripe/PayPal ont été retirés par décision PDG le 2026-07-12 (voir commentaire
en tête de app/api/v1/payments.py) ; seul NowPayments reste actif. Le fichier
mort app/services/payment_service.py (jamais importé) a été supprimé, ainsi
que les colonnes tenants.stripe_account_id/paypal_merchant_id, plus référencées
nulle part dans le code.

Durcit aussi le RLS PostgreSQL : seules les tables des migrations 001-007
avaient `ENABLE ROW LEVEL SECURITY`. Toutes les tables tenant-scoped ajoutées
depuis (008-029) reposaient uniquement sur le filtrage applicatif. Cette
migration ajoute les policies manquantes.

Tables volontairement laissées sans RLS car catalogues publics/plateforme,
non liés à un tenant : subscription_plans, blog_template_categories,
blog_templates.

Revision ID: 030
Revises: 029
Create Date: 2026-07-16
"""
from alembic import op

revision = "030"
down_revision = "029"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Suppression pages/menus (orphelins) ──────────────────────────
    op.execute("DROP TABLE IF EXISTS menus")
    op.execute("DROP TABLE IF EXISTS pages")
    op.execute("DROP TYPE IF EXISTS page_type")
    op.execute("DROP TYPE IF EXISTS page_status")

    # ── Suppression colonnes Stripe/PayPal (retirés PDG 2026-07-12,
    # payment_service.py mort supprimé, seul NowPayments reste actif) ──
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS stripe_account_id")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS paypal_merchant_id")

    # ── RLS standard (tenant_id = current_tenant_id()) ───────────────
    single_tenant_tables = [
        "article_likes",
        "article_shares",
        "affiliate_cashout_requests",
        "slug_redirects",
        "bookmarks",
        "newsletter_access",
        "tenant_api_keys",
        "support_tickets",
    ]
    for table in single_tenant_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"""
            CREATE POLICY {table}_isolation ON {table}
            USING (is_super_admin() OR tenant_id = current_tenant_id())
        """)

    # ── RLS double-tenant (relations affiliés entre deux tenants) ────
    op.execute("ALTER TABLE affiliate_relationships ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY affiliate_relationships_isolation ON affiliate_relationships
        USING (
            is_super_admin()
            OR descendant_id = current_tenant_id()
            OR ancestor_id = current_tenant_id()
        )
    """)

    op.execute("ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY affiliate_commissions_isolation ON affiliate_commissions
        USING (
            is_super_admin()
            OR affiliate_tenant_id = current_tenant_id()
            OR source_tenant_id = current_tenant_id()
        )
    """)

    # ── RLS via jointure (pas de tenant_id direct) ────────────────────
    op.execute("ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY support_messages_isolation ON support_messages
        USING (
            is_super_admin()
            OR EXISTS (
                SELECT 1 FROM support_tickets st
                WHERE st.id = support_messages.ticket_id
                AND st.tenant_id = current_tenant_id()
            )
        )
    """)

    # ── RLS scope utilisateur (pas de tenant_id) ──────────────────────
    op.execute("ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY push_subscriptions_isolation ON push_subscriptions
        USING (is_super_admin() OR user_id = current_app_user_id())
    """)

    # ── RLS admin uniquement (comptabilité plateforme + logs) ─────────
    admin_only_tables = [
        "chart_of_accounts",
        "journal_entries",
        "journal_entry_lines",
        "activity_logs",
        "platform_notifications",
    ]
    for table in admin_only_tables:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"""
            CREATE POLICY {table}_admin_only ON {table}
            USING (is_super_admin())
        """)


def downgrade() -> None:
    admin_only_tables = [
        "chart_of_accounts",
        "journal_entries",
        "journal_entry_lines",
        "activity_logs",
        "platform_notifications",
    ]
    for table in admin_only_tables:
        op.execute(f"DROP POLICY IF EXISTS {table}_admin_only ON {table}")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")

    op.execute("DROP POLICY IF EXISTS push_subscriptions_isolation ON push_subscriptions")
    op.execute("ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY")

    op.execute("DROP POLICY IF EXISTS support_messages_isolation ON support_messages")
    op.execute("ALTER TABLE support_messages DISABLE ROW LEVEL SECURITY")

    op.execute("DROP POLICY IF EXISTS affiliate_commissions_isolation ON affiliate_commissions")
    op.execute("ALTER TABLE affiliate_commissions DISABLE ROW LEVEL SECURITY")

    op.execute("DROP POLICY IF EXISTS affiliate_relationships_isolation ON affiliate_relationships")
    op.execute("ALTER TABLE affiliate_relationships DISABLE ROW LEVEL SECURITY")

    single_tenant_tables = [
        "article_likes",
        "article_shares",
        "affiliate_cashout_requests",
        "slug_redirects",
        "bookmarks",
        "newsletter_access",
        "tenant_api_keys",
        "support_tickets",
    ]
    for table in single_tenant_tables:
        op.execute(f"DROP POLICY IF EXISTS {table}_isolation ON {table}")
        op.execute(f"ALTER TABLE {table} DISABLE ROW LEVEL SECURITY")

    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_account_id VARCHAR(255)")
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS paypal_merchant_id VARCHAR(255)")

    # ── Recrée pages/menus (miroir de la migration 008) ───────────────
    op.execute("CREATE TYPE page_status AS ENUM ('draft', 'published', 'private')")
    op.execute("CREATE TYPE page_type AS ENUM ('standard', 'system', 'dynamic')")

    op.execute("""
        CREATE TABLE pages (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
            title       VARCHAR(500) NOT NULL,
            slug        VARCHAR(500) NOT NULL,
            status      page_status NOT NULL DEFAULT 'draft',
            page_type   page_type   NOT NULL DEFAULT 'standard',
            is_homepage BOOLEAN     NOT NULL DEFAULT FALSE,
            blocks      JSONB       NOT NULL DEFAULT '[]',
            meta_title        VARCHAR(500),
            meta_description  TEXT,
            og_image_url      TEXT,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            published_at TIMESTAMPTZ,
            deleted_at   TIMESTAMPTZ,
            UNIQUE (tenant_id, slug)
        )
    """)
    op.execute("CREATE INDEX ix_pages_tenant_id ON pages (tenant_id)")
    op.execute(
        "CREATE INDEX ix_pages_tenant_status ON pages (tenant_id, status) "
        "WHERE deleted_at IS NULL"
    )
    op.execute(
        "CREATE INDEX ix_pages_homepage ON pages (tenant_id, is_homepage) "
        "WHERE deleted_at IS NULL AND is_homepage = TRUE"
    )

    op.execute("""
        CREATE TABLE menus (
            id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name      VARCHAR(255) NOT NULL,
            location  VARCHAR(50)  NOT NULL DEFAULT 'primary',
            items     JSONB        NOT NULL DEFAULT '[]',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (tenant_id, location)
        )
    """)
    op.execute("CREATE INDEX ix_menus_tenant_id ON menus (tenant_id)")
