"""037 — Traductions d'articles (article_translations)

Une traduction est une vue de lecture générée (title/excerpt/seo/content HTML
traduits), jamais un brouillon ré-éditable — l'auteur édite toujours l'article
source, retraduire régénère la vue. Pas de colonne slug : l'URL traduite
réutilise le slug source, seul le préfixe de langue change (voir plan).

RLS activé, même policy que `articles` (migration 002).

Revision ID: 037
Revises: 036
Create Date: 2026-07-16
"""
from alembic import op

revision = "037"
down_revision = "036"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE article_translations (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            lang            VARCHAR(5) NOT NULL,
            title           VARCHAR(500) NOT NULL,
            excerpt         TEXT,
            content         TEXT NOT NULL,
            seo_title       VARCHAR(200),
            seo_description TEXT,
            source_hash     VARCHAR(64) NOT NULL,
            translated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (article_id, lang)
        )
    """)
    op.execute("CREATE INDEX ix_article_translations_tenant ON article_translations(tenant_id)")
    op.execute("CREATE INDEX ix_article_translations_article ON article_translations(article_id)")

    op.execute("ALTER TABLE article_translations ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY article_translations_isolation ON article_translations
        USING (is_super_admin() OR tenant_id = current_tenant_id())
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS article_translations_isolation ON article_translations")
    op.execute("DROP TABLE IF EXISTS article_translations")
