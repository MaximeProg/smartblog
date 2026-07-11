"""020 — Blog templates and template categories"""
from alembic import op

revision = "020"
down_revision = "019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS blog_template_categories (
            id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
            name        VARCHAR(100) NOT NULL,
            slug        VARCHAR(100) NOT NULL UNIQUE,
            description TEXT,
            is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
            sort_order  INTEGER      NOT NULL DEFAULT 0,
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS blog_templates (
            id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
            name          VARCHAR(200) NOT NULL,
            description   TEXT,
            category_id   UUID         REFERENCES blog_template_categories(id),
            thumbnail_url VARCHAR(500),
            theme         VARCHAR(50)  NOT NULL DEFAULT 'minimal',
            config        JSONB        NOT NULL DEFAULT '{}',
            is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
            is_featured   BOOLEAN      NOT NULL DEFAULT FALSE,
            sort_order    INTEGER      NOT NULL DEFAULT 0,
            created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("""
        INSERT INTO blog_template_categories (name, slug, description, sort_order) VALUES
            ('Business',  'business',  'Professional business and corporate blogs', 1),
            ('Lifestyle', 'lifestyle', 'Personal and lifestyle content',            2),
            ('Tech',      'tech',      'Technology and developer blogs',             3),
            ('News',      'news',      'News and media publications',                4),
            ('Creative',  'creative',  'Portfolio and creative showcases',           5)
        ON CONFLICT (slug) DO NOTHING
    """)
    op.execute("""
        INSERT INTO blog_templates (name, description, theme, category_id, is_featured, sort_order)
        SELECT v.name, v.description, v.theme,
               (SELECT id FROM blog_template_categories WHERE slug = v.cat_slug LIMIT 1),
               v.is_featured, v.sort_order
        FROM (VALUES
            ('Minimal Blog',  'Clean minimalist design, ideal for writers',          'minimal',   'lifestyle', TRUE,  1),
            ('Magazine',      'Dynamic multi-column layout for high-volume content',  'magazine',  'news',      TRUE,  2),
            ('Business Pro',  'Professional template for company and brand blogs',    'business',  'business',  TRUE,  3),
            ('Tech Insider',  'Dark-first layout for developer and tech content',     'tech',      'tech',      FALSE, 4),
            ('Portfolio',     'Showcase creative work with an image-forward design',  'portfolio', 'creative',  FALSE, 5),
            ('News Feed',     'Fast-paced news format with breaking article alerts',  'news',      'news',      FALSE, 6)
        ) AS v(name, description, theme, cat_slug, is_featured, sort_order)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS blog_templates")
    op.execute("DROP TABLE IF EXISTS blog_template_categories")
