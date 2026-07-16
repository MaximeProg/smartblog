"""038 — Traduction du blog dans son intégralité (template_config par tenant + UI fixe)

tenant_content_translations : traduction complète du template_config d'un
tenant (accueil/à propos/contact/header/footer), même mécanisme que
platform_page_translations (hash source, upsert atomique, RLS).

ui_translations : traduction de l'interface fixe du blog public (namespace
next-intl `publicBlog`) pour les langues au-delà de en/fr (qui restent des
fichiers statiques inchangés) — table platform-wide, sans RLS (pas de tenant).

Revision ID: 038
Revises: 037
Create Date: 2026-07-16
"""
from alembic import op

revision = "038"
down_revision = "037"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE tenant_content_translations (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            lang            VARCHAR(5) NOT NULL,
            template_config JSONB NOT NULL,
            source_hash     VARCHAR(64) NOT NULL,
            translated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (tenant_id, lang)
        )
    """)
    op.execute("CREATE INDEX ix_tenant_content_translations_tenant ON tenant_content_translations(tenant_id)")
    op.execute("ALTER TABLE tenant_content_translations ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_content_translations_isolation ON tenant_content_translations
        USING (is_super_admin() OR tenant_id = current_tenant_id())
    """)

    op.execute("""
        CREATE TABLE ui_translations (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            namespace     VARCHAR(50) NOT NULL,
            lang          VARCHAR(5) NOT NULL,
            messages      JSONB NOT NULL,
            source_hash   VARCHAR(64) NOT NULL,
            translated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (namespace, lang)
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS ui_translations")
    op.execute("DROP POLICY IF EXISTS tenant_content_translations_isolation ON tenant_content_translations")
    op.execute("DROP TABLE IF EXISTS tenant_content_translations")
