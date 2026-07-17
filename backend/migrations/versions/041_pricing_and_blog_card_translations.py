"""041 — Traduction des plans tarifaires et des cartes de blogs (annuaire public)

subscription_plan_translations : traduction nom/description/features d'un
plan tarifaire — table platform-wide (les plans ne sont pas tenant-scoped),
même mécanisme hash+cache que les autres tables de traduction.

tenant_card_translations : traduction légère (nom+description) d'un tenant
pour son affichage sur la page "Explorer les blogs" — même pattern que les
previews d'articles (article_translations), tenant-scoped donc RLS.

Revision ID: 041
Revises: 040
Create Date: 2026-07-17
"""
from alembic import op

revision = "041"
down_revision = "040"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE subscription_plan_translations (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            plan_id       VARCHAR(50) NOT NULL,
            lang          VARCHAR(5) NOT NULL,
            name          TEXT NOT NULL,
            description   TEXT,
            features      JSONB NOT NULL DEFAULT '[]'::jsonb,
            source_hash   VARCHAR(64) NOT NULL,
            translated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (plan_id, lang)
        )
    """)

    op.execute("""
        CREATE TABLE tenant_card_translations (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            lang          VARCHAR(5) NOT NULL,
            name          TEXT NOT NULL,
            description   TEXT,
            source_hash   VARCHAR(64) NOT NULL,
            translated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (tenant_id, lang)
        )
    """)
    op.execute("CREATE INDEX ix_tenant_card_translations_tenant ON tenant_card_translations(tenant_id)")
    op.execute("ALTER TABLE tenant_card_translations ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_card_translations_isolation ON tenant_card_translations
        USING (is_super_admin() OR tenant_id = current_tenant_id())
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS tenant_card_translations_isolation ON tenant_card_translations")
    op.execute("DROP TABLE IF EXISTS tenant_card_translations")
    op.execute("DROP TABLE IF EXISTS subscription_plan_translations")
