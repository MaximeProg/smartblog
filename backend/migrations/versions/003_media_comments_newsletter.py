"""003 media comments newsletter

Revision ID: 003_media_comments_newsletter
Revises: 002_articles
Create Date: 2026-06-26
"""
from alembic import op

revision = "003_media_comments_newsletter"
down_revision = "002_articles"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Cleanup idempotent ──────────────────────────────────────────
    op.execute("DROP TABLE IF EXISTS newsletter_campaigns CASCADE")
    op.execute("DROP TABLE IF EXISTS newsletter_subscribers CASCADE")
    op.execute("DROP TABLE IF EXISTS comment_bans CASCADE")
    op.execute("DROP TABLE IF EXISTS comments CASCADE")
    op.execute("DROP TABLE IF EXISTS media CASCADE")
    op.execute("DROP TYPE IF EXISTS media_type CASCADE")
    op.execute("DROP TYPE IF EXISTS comment_status CASCADE")
    op.execute("DROP TYPE IF EXISTS subscriber_status CASCADE")
    op.execute("DROP TYPE IF EXISTS campaign_status CASCADE")

    # ─── Fonction trigger (idempotent) ──────────────────────────────
    op.execute("""
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$
    """)

    # ─── ENUMs ───────────────────────────────────────────────────────
    op.execute("CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document')")
    op.execute("""
        CREATE TYPE comment_status AS ENUM (
            'pending', 'approved', 'rejected', 'spam', 'shadow_banned'
        )
    """)
    op.execute("""
        CREATE TYPE subscriber_status AS ENUM (
            'pending', 'active', 'unsubscribed', 'bounced'
        )
    """)
    op.execute("""
        CREATE TYPE campaign_status AS ENUM (
            'draft', 'scheduled', 'sending', 'sent', 'canceled'
        )
    """)

    # ─── Table media ─────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE media (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            uploaded_by             UUID REFERENCES users(id) ON DELETE SET NULL,
            cloudinary_public_id    TEXT NOT NULL UNIQUE,
            cloudinary_url          TEXT NOT NULL,
            cloudinary_secure_url   TEXT NOT NULL,
            cloudinary_resource_type VARCHAR(20) NOT NULL DEFAULT 'image',
            media_type              media_type NOT NULL,
            original_filename       VARCHAR(500),
            alt_text                VARCHAR(500),
            caption                 TEXT,
            file_size_bytes         BIGINT,
            width                   INTEGER,
            height                  INTEGER,
            duration_seconds        INTEGER,
            format                  VARCHAR(20),
            extra                   JSONB,
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_media_tenant ON media(tenant_id)")
    op.execute("CREATE INDEX idx_media_type ON media(tenant_id, media_type)")
    op.execute("CREATE INDEX idx_media_created ON media(created_at DESC)")

    # ─── Table comments ───────────────────────────────────────────────
    op.execute("""
        CREATE TABLE comments (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            parent_id       UUID REFERENCES comments(id) ON DELETE CASCADE,
            author_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
            author_name     VARCHAR(255),
            author_email    VARCHAR(255),
            author_website  VARCHAR(500),
            content         TEXT NOT NULL,
            status          comment_status NOT NULL DEFAULT 'pending',
            likes_count     INTEGER NOT NULL DEFAULT 0,
            replies_count   INTEGER NOT NULL DEFAULT 0,
            ip_address      VARCHAR(45),
            user_agent      VARCHAR(500),
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_comments_article ON comments(article_id)")
    op.execute("CREATE INDEX idx_comments_tenant ON comments(tenant_id)")
    op.execute("CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL")
    op.execute("CREATE INDEX idx_comments_status ON comments(tenant_id, status)")
    op.execute("CREATE INDEX idx_comments_author ON comments(author_user_id) WHERE author_user_id IS NOT NULL")

    # ─── Table comment_bans ───────────────────────────────────────────
    op.execute("""
        CREATE TABLE comment_bans (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            email       VARCHAR(255),
            ip_address  VARCHAR(45),
            reason      VARCHAR(500),
            created_by  UUID NOT NULL REFERENCES users(id),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT chk_ban_target CHECK (email IS NOT NULL OR ip_address IS NOT NULL)
        )
    """)
    op.execute("CREATE INDEX idx_comment_bans_tenant ON comment_bans(tenant_id)")
    op.execute("CREATE INDEX idx_comment_bans_email ON comment_bans(tenant_id, email) WHERE email IS NOT NULL")
    op.execute("CREATE INDEX idx_comment_bans_ip ON comment_bans(tenant_id, ip_address) WHERE ip_address IS NOT NULL")

    # ─── Trigger updated_at pour comments ────────────────────────────
    op.execute("""
        CREATE TRIGGER set_comments_updated_at
            BEFORE UPDATE ON comments
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)

    # ─── Table newsletter_subscribers ────────────────────────────────
    op.execute("""
        CREATE TABLE newsletter_subscribers (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            email               VARCHAR(255) NOT NULL,
            first_name          VARCHAR(255),
            last_name           VARCHAR(255),
            status              subscriber_status NOT NULL DEFAULT 'pending',
            confirmation_token  VARCHAR(255),
            confirmed_at        TIMESTAMPTZ,
            unsubscribed_at     TIMESTAMPTZ,
            unsubscribe_token   VARCHAR(255) NOT NULL,
            tags                JSONB DEFAULT '[]',
            metadata            JSONB,
            ip_address          VARCHAR(45),
            source              VARCHAR(100),
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (tenant_id, email)
        )
    """)
    op.execute("CREATE INDEX idx_subscribers_tenant ON newsletter_subscribers(tenant_id)")
    op.execute("CREATE INDEX idx_subscribers_status ON newsletter_subscribers(tenant_id, status)")
    op.execute("CREATE INDEX idx_subscribers_token ON newsletter_subscribers(confirmation_token) WHERE confirmation_token IS NOT NULL")
    op.execute("CREATE INDEX idx_subscribers_unsub_token ON newsletter_subscribers(unsubscribe_token)")

    # ─── Table newsletter_campaigns ──────────────────────────────────
    op.execute("""
        CREATE TABLE newsletter_campaigns (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            created_by          UUID NOT NULL REFERENCES users(id),
            name                VARCHAR(500) NOT NULL,
            subject             VARCHAR(500) NOT NULL,
            preview_text        VARCHAR(500),
            content_html        TEXT,
            content_json        JSONB,
            status              campaign_status NOT NULL DEFAULT 'draft',
            is_paid             BOOLEAN NOT NULL DEFAULT FALSE,
            price               DECIMAL(10,2),
            scheduled_at        TIMESTAMPTZ,
            sent_at             TIMESTAMPTZ,
            recipients_count    INTEGER NOT NULL DEFAULT 0,
            sent_count          INTEGER NOT NULL DEFAULT 0,
            opens_count         INTEGER NOT NULL DEFAULT 0,
            clicks_count        INTEGER NOT NULL DEFAULT 0,
            bounces_count       INTEGER NOT NULL DEFAULT 0,
            unsubscribes_count  INTEGER NOT NULL DEFAULT 0,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_campaigns_tenant ON newsletter_campaigns(tenant_id)")
    op.execute("CREATE INDEX idx_campaigns_status ON newsletter_campaigns(tenant_id, status)")

    # ─── Triggers updated_at ─────────────────────────────────────────
    op.execute("""
        CREATE TRIGGER set_newsletter_subscribers_updated_at
            BEFORE UPDATE ON newsletter_subscribers
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)
    op.execute("""
        CREATE TRIGGER set_newsletter_campaigns_updated_at
            BEFORE UPDATE ON newsletter_campaigns
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)

    # ─── Colonnes supplémentaires sur tenants ─────────────────────────
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS storage_used_bytes BIGINT NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscribers_count INTEGER NOT NULL DEFAULT 0")

    # ─── RLS media ───────────────────────────────────────────────────
    op.execute("ALTER TABLE media ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation_media ON media
            USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
            WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    """)

    # ─── RLS comments ─────────────────────────────────────────────────
    op.execute("ALTER TABLE comments ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation_comments ON comments
            USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
            WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    """)
    op.execute("ALTER TABLE comment_bans ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation_comment_bans ON comment_bans
            USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
            WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    """)

    # ─── RLS newsletter ───────────────────────────────────────────────
    op.execute("ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation_newsletter_subscribers ON newsletter_subscribers
            USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
            WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    """)
    op.execute("ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation_newsletter_campaigns ON newsletter_campaigns
            USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
            WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS newsletter_campaigns CASCADE")
    op.execute("DROP TABLE IF EXISTS newsletter_subscribers CASCADE")
    op.execute("DROP TABLE IF EXISTS comment_bans CASCADE")
    op.execute("DROP TABLE IF EXISTS comments CASCADE")
    op.execute("DROP TABLE IF EXISTS media CASCADE")
    op.execute("DROP TYPE IF EXISTS campaign_status")
    op.execute("DROP TYPE IF EXISTS subscriber_status")
    op.execute("DROP TYPE IF EXISTS comment_status")
    op.execute("DROP TYPE IF EXISTS media_type")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS storage_used_bytes")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS subscribers_count")
