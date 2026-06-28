"""005 social ads

Revision ID: 005_social_ads
Revises: 004_user_provider_fields
Create Date: 2026-06-26
"""
from alembic import op

revision = "005_social_ads"
down_revision = "004_user_provider_fields"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Cleanup idempotent ──────────────────────────────────────────
    op.execute("DROP TABLE IF EXISTS ad_link_scans CASCADE")
    op.execute("DROP TABLE IF EXISTS ads CASCADE")
    op.execute("DROP TABLE IF EXISTS social_posts CASCADE")
    op.execute("DROP TABLE IF EXISTS social_accounts CASCADE")
    op.execute("DROP TYPE IF EXISTS social_platform CASCADE")
    op.execute("DROP TYPE IF EXISTS social_post_status CASCADE")
    op.execute("DROP TYPE IF EXISTS link_safety_status CASCADE")
    op.execute("DROP TYPE IF EXISTS ad_submission_status CASCADE")
    op.execute("DROP TYPE IF EXISTS ad_campaign_status CASCADE")

    # ─── Fonction trigger idempotent ─────────────────────────────────
    op.execute("""
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$
    """)

    # ─── ENUMs ───────────────────────────────────────────────────────
    op.execute("""
        CREATE TYPE social_platform AS ENUM (
            'facebook', 'instagram', 'linkedin', 'twitter', 'tiktok',
            'threads', 'pinterest', 'telegram', 'whatsapp',
            'youtube_community', 'discord', 'reddit', 'upscrolled'
        )
    """)
    op.execute("""
        CREATE TYPE social_post_status AS ENUM (
            'pending', 'scheduled', 'published', 'failed', 'canceled'
        )
    """)
    op.execute("""
        CREATE TYPE link_safety_status AS ENUM (
            'unchecked', 'safe', 'suspect', 'dangerous'
        )
    """)
    op.execute("""
        CREATE TYPE ad_submission_status AS ENUM (
            'pending', 'approved', 'rejected', 'payment_pending', 'paid', 'expired'
        )
    """)
    op.execute("""
        CREATE TYPE ad_campaign_status AS ENUM (
            'active', 'paused', 'suspended', 'expired', 'canceled'
        )
    """)

    # ─── Table social_accounts ────────────────────────────────────────
    op.execute("""
        CREATE TABLE social_accounts (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            connected_by            UUID NOT NULL REFERENCES users(id),
            platform                social_platform NOT NULL,
            platform_user_id        VARCHAR(500) NOT NULL,
            platform_username       VARCHAR(255),
            platform_display_name   VARCHAR(255),
            platform_avatar_url     TEXT,
            platform_profile_url    TEXT,
            access_token_enc        TEXT,
            refresh_token_enc       TEXT,
            token_expires_at        TIMESTAMPTZ,
            is_active               BOOLEAN NOT NULL DEFAULT TRUE,
            scopes                  JSONB,
            extra                   JSONB,
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (tenant_id, platform, platform_user_id)
        )
    """)
    op.execute("CREATE INDEX idx_social_accounts_tenant ON social_accounts(tenant_id)")
    op.execute("CREATE INDEX idx_social_accounts_platform ON social_accounts(tenant_id, platform)")

    # ─── Table social_posts ───────────────────────────────────────────
    op.execute("""
        CREATE TABLE social_posts (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            social_account_id   UUID NOT NULL REFERENCES social_accounts(id) ON DELETE CASCADE,
            article_id          UUID REFERENCES articles(id) ON DELETE SET NULL,
            created_by          UUID NOT NULL REFERENCES users(id),
            platform            social_platform NOT NULL,
            content             TEXT NOT NULL,
            media_urls          JSONB,
            status              social_post_status NOT NULL DEFAULT 'pending',
            scheduled_at        TIMESTAMPTZ,
            published_at        TIMESTAMPTZ,
            platform_post_id    VARCHAR(500),
            platform_post_url   TEXT,
            error_message       TEXT,
            retry_count         INTEGER NOT NULL DEFAULT 0,
            extra               JSONB,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_social_posts_tenant ON social_posts(tenant_id)")
    op.execute("CREATE INDEX idx_social_posts_status ON social_posts(tenant_id, status)")
    op.execute("CREATE INDEX idx_social_posts_scheduled ON social_posts(scheduled_at) WHERE scheduled_at IS NOT NULL")
    op.execute("CREATE INDEX idx_social_posts_article ON social_posts(article_id) WHERE article_id IS NOT NULL")

    # ─── Table ads ────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE ads (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id               UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            advertiser_user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
            advertiser_name         VARCHAR(255) NOT NULL,
            advertiser_email        VARCHAR(255) NOT NULL,
            advertiser_company      VARCHAR(255),
            title                   VARCHAR(500) NOT NULL,
            description             TEXT,
            image_url               TEXT,
            click_url               TEXT NOT NULL,
            link_safety_status      link_safety_status NOT NULL DEFAULT 'unchecked',
            link_last_scanned_at    TIMESTAMPTZ,
            link_scan_details       JSONB,
            submission_status       ad_submission_status NOT NULL DEFAULT 'pending',
            rejection_reason        TEXT,
            reviewed_by             UUID REFERENCES users(id),
            campaign_status         ad_campaign_status NOT NULL DEFAULT 'paused',
            starts_at               TIMESTAMPTZ,
            ends_at                 TIMESTAMPTZ,
            price_per_day           DECIMAL(10,2),
            total_budget            DECIMAL(10,2),
            amount_paid             DECIMAL(10,2) NOT NULL DEFAULT 0,
            impressions_count       INTEGER NOT NULL DEFAULT 0,
            clicks_count            INTEGER NOT NULL DEFAULT 0,
            placement               VARCHAR(50),
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_ads_tenant ON ads(tenant_id)")
    op.execute("CREATE INDEX idx_ads_submission ON ads(tenant_id, submission_status)")
    op.execute("CREATE INDEX idx_ads_campaign ON ads(tenant_id, campaign_status)")
    op.execute("CREATE INDEX idx_ads_safety ON ads(tenant_id, link_safety_status)")
    op.execute("CREATE INDEX idx_ads_active ON ads(tenant_id, campaign_status, ends_at) WHERE campaign_status = 'active'")

    # ─── Table ad_link_scans ──────────────────────────────────────────
    op.execute("""
        CREATE TABLE ad_link_scans (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ad_id               UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
            url                 TEXT NOT NULL,
            safety_status       link_safety_status NOT NULL,
            google_safe_browsing JSONB,
            virustotal          JSONB,
            urlhaus             JSONB,
            phishtank           JSONB,
            scanned_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_ad_link_scans_ad ON ad_link_scans(ad_id)")

    # ─── Triggers updated_at ─────────────────────────────────────────
    op.execute("""
        CREATE TRIGGER set_social_accounts_updated_at
            BEFORE UPDATE ON social_accounts
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)
    op.execute("""
        CREATE TRIGGER set_social_posts_updated_at
            BEFORE UPDATE ON social_posts
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)
    op.execute("""
        CREATE TRIGGER set_ads_updated_at
            BEFORE UPDATE ON ads
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)

    # ─── RLS ──────────────────────────────────────────────────────────
    for table in ("social_accounts", "social_posts", "ads"):
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"""
            CREATE POLICY tenant_isolation_{table} ON {table}
                USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
                WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
        """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS ad_link_scans CASCADE")
    op.execute("DROP TABLE IF EXISTS ads CASCADE")
    op.execute("DROP TABLE IF EXISTS social_posts CASCADE")
    op.execute("DROP TABLE IF EXISTS social_accounts CASCADE")
    op.execute("DROP TYPE IF EXISTS ad_campaign_status")
    op.execute("DROP TYPE IF EXISTS ad_submission_status")
    op.execute("DROP TYPE IF EXISTS link_safety_status")
    op.execute("DROP TYPE IF EXISTS social_post_status")
    op.execute("DROP TYPE IF EXISTS social_platform")
