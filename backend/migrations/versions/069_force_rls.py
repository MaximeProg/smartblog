"""069 — RLS étape 2/2 : activer FORCE ROW LEVEL SECURITY pour de vrai (2026-08-06)

Contexte complet dans le commit "RLS étape 1/2" (câblage tenant/user/
super-admin vers Postgres, sans changement de comportement). Ici, le
deuxième verrou est réellement fermé.

Pourquoi ENABLE seul ne suffisait pas : Postgres exempte automatiquement le
rôle PROPRIÉTAIRE d'une table de ses propres policies RLS, à moins que
FORCE ROW LEVEL SECURITY ne soit aussi posé. Le rôle applicatif
(DATABASE_URL) est propriétaire de toutes les tables (il les a créées via
les migrations) — RLS était donc décoratif pour tout le trafic applicatif
depuis le début, malgré ENABLE déjà présent sur ~35 tables.

Deux groupes de tables, traités différemment :

1. Policies DÉJÀ correctes (`is_super_admin() OR tenant_id = current_tenant_id()`
   ou équivalent user-scoped) — juste FORCE, rien d'autre à changer.

2. Policies INCOMPLÈTES trouvées lors de l'audit — écrites dans un style
   antérieur (migrations 003, 005, 006, 007) qui teste directement
   `tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE)` SANS
   jamais vérifier `is_super_admin()`. Forcer RLS sur ces tables telles
   quelles aurait rendu invisibles TOUTES leurs lignes pour les super
   admins (tenant_id vide dans leur contexte) — cassant net les vues
   admin sur les paiements (`transactions`), les pubs (`ads`, réseaux
   sociaux), les commentaires/newsletters (`media`, `comments`,
   `comment_bans`, `newsletter_subscribers`, `newsletter_campaigns`),
   l'usage produit (`page_views`, `daily_analytics`, `article_access`),
   le push (`push_tokens`, `push_notifications`) et les webhooks
   (`webhook_endpoints`). Ces 15 policies sont donc d'abord recréées avec
   le même bypass `is_super_admin() OR ...` que partout ailleurs, avant
   que FORCE ne soit posé sur elles.

Contextes système déjà protégés (voir commit précédent) : le worker ARQ
(admin_session()) et get_db_no_rls() (résolution de domaine, mode
maintenance, polling de payout) posent désormais explicitement
is_super_admin=true — ils continueront de voir toutes les lignes sous
FORCE, exactement comme avant.

Revision ID: 069
Revises: 068
Create Date: 2026-08-06
"""
from alembic import op

revision = "069"
down_revision = "068"
branch_labels = None
depends_on = None


# ── Groupe 2 : policies à corriger avant FORCE (nom de policy -> table) ──
# Toutes suivent exactement le même schéma d'origine (003/005/006/007) :
# `tenant_isolation_{table}` USING/WITH CHECK sur tenant_id::TEXT = ...
_BROKEN_POLICIES = [
    "media", "comments", "comment_bans", "newsletter_subscribers", "newsletter_campaigns",
    "social_accounts", "social_posts", "ads",
    "page_views", "daily_analytics", "transactions", "article_access", "push_tokens", "push_notifications",
    "webhook_endpoints",
]

# ── Groupe 1 : déjà correctes, juste besoin de FORCE ─────────────────────
_ALREADY_CORRECT = [
    "tenant_users", "custom_domains", "user_invitations",
    "categories", "tags", "articles", "article_tags", "article_versions",
    "article_likes", "article_shares", "slug_redirects", "bookmarks",
    "newsletter_access", "tenant_api_keys", "support_tickets",
    "support_messages", "push_subscriptions",
    "chart_of_accounts", "journal_entries", "journal_entry_lines", "activity_logs", "platform_notifications",
    "article_translations", "tenant_content_translations", "tenant_card_translations", "domain_orders",
    "affiliate_cashout_requests", "affiliate_relationships", "affiliate_commissions",
    "user_subscriptions",
]


def upgrade() -> None:
    # ── Groupe 2 : corrige d'abord le bypass manquant ────────────────────
    for table in _BROKEN_POLICIES:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_{table} ON {table}")
        op.execute(f"""
            CREATE POLICY tenant_isolation_{table} ON {table}
                USING (is_super_admin() OR tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
                WITH CHECK (is_super_admin() OR tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
        """)

    # ── FORCE sur les deux groupes ────────────────────────────────────────
    for table in _BROKEN_POLICIES + _ALREADY_CORRECT:
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")


def downgrade() -> None:
    for table in _BROKEN_POLICIES + _ALREADY_CORRECT:
        op.execute(f"ALTER TABLE {table} NO FORCE ROW LEVEL SECURITY")

    for table in _BROKEN_POLICIES:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation_{table} ON {table}")
        op.execute(f"""
            CREATE POLICY tenant_isolation_{table} ON {table}
                USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
                WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
        """)
