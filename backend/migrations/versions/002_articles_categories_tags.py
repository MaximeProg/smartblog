"""Articles, categories, tags, article_versions

Revision ID: 002_articles
Revises: 001_initial
Create Date: 2026-06-26
"""
from alembic import op

revision = "002_articles"
down_revision = "001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── categories ────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
            name VARCHAR(200) NOT NULL,
            slug VARCHAR(200) NOT NULL,
            description TEXT,
            cover_image_url TEXT,
            seo_title VARCHAR(200),
            seo_description TEXT,
            sort_order INTEGER NOT NULL DEFAULT 0,
            articles_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (tenant_id, slug)
        )
    """)
    op.execute("CREATE INDEX ix_categories_tenant_id ON categories (tenant_id)")

    # ── tags ──────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE tags (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) NOT NULL,
            articles_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (tenant_id, slug)
        )
    """)
    op.execute("CREATE INDEX ix_tags_tenant_id ON tags (tenant_id)")

    # ── articles ──────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE articles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            author_id UUID REFERENCES users(id) ON DELETE SET NULL,
            category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
            title VARCHAR(500) NOT NULL,
            slug VARCHAR(500) NOT NULL,
            excerpt TEXT,
            content TEXT,
            content_json JSONB,
            article_type article_type NOT NULL DEFAULT 'article',
            status article_status NOT NULL DEFAULT 'draft',
            visibility content_visibility NOT NULL DEFAULT 'public',
            cover_image_url TEXT,
            cover_image_alt VARCHAR(500),
            audio_url TEXT,
            video_url TEXT,
            audio_duration_seconds INTEGER,
            seo_title VARCHAR(200),
            seo_description TEXT,
            seo_keywords TEXT[],
            canonical_url TEXT,
            og_image_url TEXT,
            reading_time_minutes INTEGER,
            word_count INTEGER,
            price NUMERIC(10, 2),
            currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
            views_count INTEGER NOT NULL DEFAULT 0,
            likes_count INTEGER NOT NULL DEFAULT 0,
            comments_count INTEGER NOT NULL DEFAULT 0,
            shares_count INTEGER NOT NULL DEFAULT 0,
            is_featured BOOLEAN NOT NULL DEFAULT false,
            allow_comments BOOLEAN NOT NULL DEFAULT true,
            comments_closed_at TIMESTAMPTZ,
            published_at TIMESTAMPTZ,
            scheduled_at TIMESTAMPTZ,
            unpublished_at TIMESTAMPTZ,
            current_version INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at TIMESTAMPTZ,
            UNIQUE (tenant_id, slug)
        )
    """)
    op.execute("CREATE INDEX ix_articles_tenant_id ON articles (tenant_id)")
    op.execute("CREATE INDEX ix_articles_status ON articles (tenant_id, status)")
    op.execute("CREATE INDEX ix_articles_published_at ON articles (tenant_id, published_at DESC)")
    op.execute("CREATE INDEX ix_articles_author_id ON articles (author_id)")

    # ── article_tags ──────────────────────────────────────────────
    op.execute("""
        CREATE TABLE article_tags (
            article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
            tenant_id UUID NOT NULL,
            PRIMARY KEY (article_id, tag_id)
        )
    """)

    # ── article_versions ──────────────────────────────────────────
    op.execute("""
        CREATE TABLE article_versions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            tenant_id UUID NOT NULL,
            version_number INTEGER NOT NULL,
            title VARCHAR(500) NOT NULL,
            content TEXT,
            content_json JSONB,
            change_summary VARCHAR(500),
            created_by UUID NOT NULL REFERENCES users(id),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX ix_article_versions_article_id ON article_versions (article_id)")

    # ── Triggers updated_at ───────────────────────────────────────
    for table in ("categories", "articles"):
        op.execute(f"""
            CREATE TRIGGER trg_{table}_updated_at
            BEFORE UPDATE ON {table}
            FOR EACH ROW EXECUTE FUNCTION update_updated_at()
        """)

    # ── RLS ───────────────────────────────────────────────────────
    for table in ("categories", "tags", "articles", "article_tags", "article_versions"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"""
            CREATE POLICY {table}_isolation ON {table}
            USING (is_super_admin() OR tenant_id = current_tenant_id())
        """)


def downgrade() -> None:
    for table in ("article_versions", "article_tags", "articles", "tags", "categories"):
        op.execute(f"DROP TABLE IF EXISTS {table} CASCADE")
