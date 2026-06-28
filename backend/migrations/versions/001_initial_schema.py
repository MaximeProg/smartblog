"""Initial schema: ENUMs, core tables (tenants/users/tenant_users), RLS policies

Revision ID: 001_initial
Revises:
Create Date: 2026-06-26
"""
from alembic import op

revision = "001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── ENUMs ──────────────────────────────────────────────────────
    op.execute("CREATE TYPE plan_tier AS ENUM ('starter', 'pro', 'business', 'enterprise')")
    op.execute("CREATE TYPE tenant_status AS ENUM ('active', 'suspended', 'grace_period', 'deleted')")
    op.execute("CREATE TYPE user_role AS ENUM ('TENANT_ADMIN', 'EDITOR', 'AUTHOR', 'VIEWER')")
    op.execute("CREATE TYPE comments_mode AS ENUM ('open', 'moderated', 'closed')")
    op.execute("CREATE TYPE article_type AS ENUM ('article', 'photo', 'video', 'audio', 'podcast', 'mixed')")
    op.execute("CREATE TYPE article_status AS ENUM ('draft', 'in_review', 'approved', 'scheduled', 'published', 'unpublished', 'archived')")
    op.execute("CREATE TYPE content_visibility AS ENUM ('public', 'private', 'paid')")
    op.execute("CREATE TYPE comment_status AS ENUM ('pending', 'approved', 'rejected', 'spam', 'shadow_banned')")
    op.execute("CREATE TYPE subscriber_status AS ENUM ('pending', 'active', 'unsubscribed', 'bounced')")
    op.execute("CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'sent', 'canceled')")
    op.execute("CREATE TYPE social_platform AS ENUM ('facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'threads', 'pinterest', 'telegram', 'whatsapp', 'youtube_community', 'discord', 'reddit', 'upscrolled')")
    op.execute("CREATE TYPE social_post_status AS ENUM ('pending', 'scheduled', 'published', 'failed', 'canceled')")
    op.execute("CREATE TYPE link_safety_status AS ENUM ('unchecked', 'safe', 'suspect', 'dangerous')")
    op.execute("CREATE TYPE ad_campaign_status AS ENUM ('active', 'paused', 'suspended', 'expired', 'canceled')")
    op.execute("CREATE TYPE ad_submission_status AS ENUM ('pending', 'approved', 'rejected', 'payment_pending', 'paid', 'expired')")
    op.execute("CREATE TYPE payment_gateway AS ENUM ('stripe', 'paypal')")
    op.execute("CREATE TYPE transaction_type AS ENUM ('subscription', 'paid_article', 'paid_newsletter', 'ad_campaign')")
    op.execute("CREATE TYPE transaction_status AS ENUM ('pending', 'completed', 'failed', 'refunded', 'disputed')")
    op.execute("CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused')")
    op.execute("CREATE TYPE media_type AS ENUM ('image', 'video', 'audio', 'document')")
    op.execute("CREATE TYPE domain_verification_status AS ENUM ('pending', 'verified', 'failed')")

    # ── RLS helper functions ───────────────────────────────────────
    op.execute("""
        CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
            SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
        $$ LANGUAGE SQL STABLE
    """)
    op.execute("""
        CREATE OR REPLACE FUNCTION current_app_user_id() RETURNS UUID AS $$
            SELECT NULLIF(current_setting('app.current_user_id', true), '')::UUID;
        $$ LANGUAGE SQL STABLE
    """)
    op.execute("""
        CREATE OR REPLACE FUNCTION is_super_admin() RETURNS BOOLEAN AS $$
            SELECT current_setting('app.is_super_admin', true) = 'true';
        $$ LANGUAGE SQL STABLE
    """)

    # ── tenants ────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE tenants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(50) NOT NULL UNIQUE,
            description TEXT,
            logo_url TEXT,
            favicon_url TEXT,
            theme VARCHAR(50) NOT NULL DEFAULT 'minimal',
            primary_color VARCHAR(7) NOT NULL DEFAULT '#3B82F6',
            secondary_color VARCHAR(7) NOT NULL DEFAULT '#1E40AF',
            language VARCHAR(10) NOT NULL DEFAULT 'en',
            timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
            comments_mode comments_mode NOT NULL DEFAULT 'moderated',
            comments_close_after_days INTEGER,
            seo_title_template VARCHAR(200) DEFAULT '{title} — {blog_name}',
            seo_meta_description TEXT,
            robots_txt TEXT,
            ga4_measurement_id VARCHAR(50),
            matomo_url TEXT,
            matomo_site_id VARCHAR(50),
            facebook_pixel_id VARCHAR(50),
            plan plan_tier NOT NULL DEFAULT 'starter',
            status tenant_status NOT NULL DEFAULT 'active',
            trial_ends_at TIMESTAMPTZ,
            plan_expires_at TIMESTAMPTZ,
            grace_period_ends_at TIMESTAMPTZ,
            stripe_account_id VARCHAR(255),
            paypal_merchant_id VARCHAR(255),
            ai_api_key_enc TEXT,
            articles_count INTEGER NOT NULL DEFAULT 0,
            authors_count INTEGER NOT NULL DEFAULT 0,
            storage_used_bytes BIGINT NOT NULL DEFAULT 0,
            subscribers_count INTEGER NOT NULL DEFAULT 0,
            domains_count INTEGER NOT NULL DEFAULT 0,
            footer_text TEXT,
            social_links JSONB NOT NULL DEFAULT '{}',
            sidebar_config JSONB NOT NULL DEFAULT '[]',
            pwa_enabled BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at TIMESTAMPTZ,
            CONSTRAINT ck_tenants_slug_format CHECK (slug ~ '^[a-z0-9][a-z0-9\\-]{2,48}[a-z0-9]$')
        )
    """)

    # ── users ──────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            firebase_uid VARCHAR(128) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            display_name VARCHAR(255),
            avatar_url TEXT,
            bio TEXT,
            is_super_admin BOOLEAN NOT NULL DEFAULT false,
            two_fa_enabled BOOLEAN NOT NULL DEFAULT false,
            two_fa_secret_enc TEXT,
            two_fa_backup_codes JSONB,
            last_login_at TIMESTAMPTZ,
            last_login_ip VARCHAR(45),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    # ── tenant_users ───────────────────────────────────────────────
    op.execute("""
        CREATE TABLE tenant_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role user_role NOT NULL,
            invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
            joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (tenant_id, user_id)
        )
    """)

    # ── user_invitations ───────────────────────────────────────────
    op.execute("""
        CREATE TABLE user_invitations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            email VARCHAR(255) NOT NULL,
            role user_role NOT NULL,
            token VARCHAR(255) NOT NULL UNIQUE,
            invited_by UUID NOT NULL REFERENCES users(id),
            expires_at TIMESTAMPTZ NOT NULL,
            accepted_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (tenant_id, email)
        )
    """)

    # ── custom_domains ─────────────────────────────────────────────
    op.execute("""
        CREATE TABLE custom_domains (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            domain VARCHAR(255) NOT NULL UNIQUE,
            verification_status domain_verification_status NOT NULL DEFAULT 'pending',
            ssl_enabled BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            verified_at TIMESTAMPTZ
        )
    """)

    # ── Indexes ────────────────────────────────────────────────────
    op.execute("CREATE INDEX ix_tenants_slug ON tenants (slug)")
    op.execute("CREATE INDEX ix_tenants_status ON tenants (status)")
    op.execute("CREATE INDEX ix_users_firebase_uid ON users (firebase_uid)")
    op.execute("CREATE INDEX ix_users_email ON users (email)")
    op.execute("CREATE INDEX ix_tenant_users_tenant_id ON tenant_users (tenant_id)")
    op.execute("CREATE INDEX ix_tenant_users_user_id ON tenant_users (user_id)")
    op.execute("CREATE INDEX ix_custom_domains_domain ON custom_domains (domain)")

    # ── Trigger updated_at ─────────────────────────────────────────
    op.execute("""
        CREATE OR REPLACE FUNCTION update_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql
    """)
    op.execute("""
        CREATE TRIGGER trg_tenants_updated_at
        BEFORE UPDATE ON tenants
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    """)
    op.execute("""
        CREATE TRIGGER trg_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
    """)

    # ── RLS ────────────────────────────────────────────────────────
    op.execute("ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_users_isolation ON tenant_users
        USING (is_super_admin() OR tenant_id = current_tenant_id())
    """)
    op.execute("ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY custom_domains_isolation ON custom_domains
        USING (is_super_admin() OR tenant_id = current_tenant_id())
    """)
    op.execute("ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY user_invitations_isolation ON user_invitations
        USING (is_super_admin() OR tenant_id = current_tenant_id())
    """)


def downgrade() -> None:
    for tbl in ("custom_domains", "user_invitations", "tenant_users", "users", "tenants"):
        op.execute(f"DROP TABLE IF EXISTS {tbl} CASCADE")
    for fn in ("update_updated_at", "is_super_admin", "current_app_user_id", "current_tenant_id"):
        op.execute(f"DROP FUNCTION IF EXISTS {fn}() CASCADE")
    for enum in (
        "domain_verification_status", "media_type", "subscription_status",
        "transaction_status", "transaction_type", "payment_gateway",
        "ad_submission_status", "ad_campaign_status", "link_safety_status",
        "social_post_status", "social_platform", "campaign_status",
        "subscriber_status", "comment_status", "content_visibility",
        "article_status", "article_type", "comments_mode", "user_role",
        "tenant_status", "plan_tier",
    ):
        op.execute(f"DROP TYPE IF EXISTS {enum} CASCADE")
