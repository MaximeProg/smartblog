"""050 — Achat automatisé de noms de domaine (OpenProvider)

Étend `custom_domains` (déjà RLS depuis 001_initial_schema) avec les colonnes
nécessaires pour distinguer un domaine "externe" (rattaché, flux existant
inchangé) d'un domaine "acheté" via un registrar. Ajoute `domain_orders`,
le pipeline d'achat (paiement → enregistrement registrar), séparé de
`custom_domains` car l'enregistrement peut échouer après un paiement réussi.

Ajoute aussi `DOMAIN_PURCHASE` à l'enum transaction_type (même pipeline de
paiement crypto que abonnement/article payant, cf. app/api/v1/payments.py).

Revision ID: 050
Revises: 049
Create Date: 2026-07-19
"""
from alembic import op

revision = "050"
down_revision = "049"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── transaction_type: nouvelle valeur ─────────────────────────────
    op.execute("ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'domain_purchase'")

    # ── custom_domains: colonnes achat ────────────────────────────────
    op.execute("CREATE TYPE domain_source AS ENUM ('external', 'purchased')")
    op.execute("""
        ALTER TABLE custom_domains
            ADD COLUMN source domain_source NOT NULL DEFAULT 'external',
            ADD COLUMN is_primary BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN registrar VARCHAR(50),
            ADD COLUMN registrar_domain_id VARCHAR(100),
            ADD COLUMN purchased_at TIMESTAMPTZ,
            ADD COLUMN expires_at TIMESTAMPTZ,
            ADD COLUMN auto_renew BOOLEAN NOT NULL DEFAULT false,
            ADD COLUMN purchase_price NUMERIC(10, 2),
            ADD COLUMN renewal_price NUMERIC(10, 2),
            ADD COLUMN last_synced_at TIMESTAMPTZ
    """)

    # ── domain_orders: pipeline d'achat ────────────────────────────────
    op.execute("""
        CREATE TYPE domain_order_status AS ENUM (
            'pending_payment', 'paid', 'registering', 'registered',
            'registration_failed', 'refund_pending', 'refunded'
        )
    """)
    op.execute("""
        CREATE TABLE domain_orders (
            id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id            UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id              UUID REFERENCES users(id) ON DELETE SET NULL,
            transaction_id       UUID REFERENCES transactions(id) ON DELETE SET NULL,
            custom_domain_id     UUID REFERENCES custom_domains(id) ON DELETE SET NULL,

            domain_name          VARCHAR(255) NOT NULL,
            tld                  VARCHAR(30) NOT NULL,
            years                SMALLINT NOT NULL DEFAULT 1,
            registrar            VARCHAR(50) NOT NULL,
            registrant_info      JSONB NOT NULL,

            status               domain_order_status NOT NULL DEFAULT 'pending_payment',
            registrar_order_id   VARCHAR(100),
            registrar_domain_id  VARCHAR(100),
            purchase_price       NUMERIC(10, 2),
            renewal_price        NUMERIC(10, 2),
            currency             VARCHAR(10) NOT NULL DEFAULT 'USD',
            error_message        TEXT,

            created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
            registered_at        TIMESTAMPTZ
        )
    """)
    op.execute("CREATE INDEX ix_domain_orders_tenant ON domain_orders(tenant_id)")
    op.execute("CREATE INDEX ix_domain_orders_status ON domain_orders(status)")

    op.execute("ALTER TABLE domain_orders ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY domain_orders_isolation ON domain_orders
        USING (is_super_admin() OR tenant_id = current_tenant_id())
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS domain_orders")
    op.execute("DROP TYPE IF EXISTS domain_order_status")
    op.execute("""
        ALTER TABLE custom_domains
            DROP COLUMN IF EXISTS source,
            DROP COLUMN IF EXISTS is_primary,
            DROP COLUMN IF EXISTS registrar,
            DROP COLUMN IF EXISTS registrar_domain_id,
            DROP COLUMN IF EXISTS purchased_at,
            DROP COLUMN IF EXISTS expires_at,
            DROP COLUMN IF EXISTS auto_renew,
            DROP COLUMN IF EXISTS purchase_price,
            DROP COLUMN IF EXISTS renewal_price,
            DROP COLUMN IF EXISTS last_synced_at
    """)
    op.execute("DROP TYPE IF EXISTS domain_source")
    # Note: PostgreSQL ne supporte pas DROP VALUE sur un enum — 'domain_purchase'
    # reste dans transaction_type après downgrade (comportement standard du projet,
    # cf. migrations précédentes ajoutant des valeurs d'enum).
