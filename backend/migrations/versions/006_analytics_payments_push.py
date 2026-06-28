"""006 analytics payments push

Revision ID: 006_analytics_payments_push
Revises: 005_social_ads
Create Date: 2026-06-26
"""
from alembic import op

revision = "006_analytics_payments_push"
down_revision = "005_social_ads"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Cleanup idempotent ──────────────────────────────────────────
    for tbl in ("push_notifications", "push_tokens", "article_access",
                "tenant_subscriptions", "transactions", "daily_analytics", "page_views"):
        op.execute(f"DROP TABLE IF EXISTS {tbl} CASCADE")
    for typ in ("transaction_type", "transaction_status", "payment_gateway",
                "subscription_status"):
        op.execute(f"DROP TYPE IF EXISTS {typ} CASCADE")

    op.execute("""
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$
    """)

    # ─── ENUMs paiements ─────────────────────────────────────────────
    op.execute("""
        CREATE TYPE transaction_type AS ENUM (
            'subscription', 'paid_article', 'paid_newsletter', 'ad_campaign'
        )
    """)
    op.execute("""
        CREATE TYPE transaction_status AS ENUM (
            'pending', 'completed', 'failed', 'refunded', 'disputed'
        )
    """)
    op.execute("""
        CREATE TYPE payment_gateway AS ENUM ('stripe', 'paypal')
    """)
    op.execute("""
        CREATE TYPE subscription_status AS ENUM (
            'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'paused'
        )
    """)

    # ─── Table page_views ─────────────────────────────────────────────
    op.execute("""
        CREATE TABLE page_views (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            article_id          UUID REFERENCES articles(id) ON DELETE SET NULL,
            user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
            session_id          VARCHAR(64),
            ip_hash             VARCHAR(64),
            referrer            TEXT,
            referrer_domain     VARCHAR(255),
            country_code        CHAR(2),
            device_type         VARCHAR(20),
            browser             VARCHAR(50),
            os                  VARCHAR(50),
            utm_source          VARCHAR(255),
            utm_medium          VARCHAR(255),
            utm_campaign        VARCHAR(255),
            duration_seconds    INTEGER,
            scroll_depth_pct    INTEGER,
            created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_page_views_tenant ON page_views(tenant_id, created_at DESC)")
    op.execute("CREATE INDEX idx_page_views_article ON page_views(article_id, created_at DESC) WHERE article_id IS NOT NULL")
    op.execute("CREATE INDEX idx_page_views_session ON page_views(session_id) WHERE session_id IS NOT NULL")

    # ─── Table daily_analytics ────────────────────────────────────────
    op.execute("""
        CREATE TABLE daily_analytics (
            id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            article_id          UUID REFERENCES articles(id) ON DELETE SET NULL,
            date                DATE NOT NULL,
            page_views          INTEGER NOT NULL DEFAULT 0,
            unique_sessions     INTEGER NOT NULL DEFAULT 0,
            new_subscribers     INTEGER NOT NULL DEFAULT 0,
            avg_duration_seconds INTEGER NOT NULL DEFAULT 0,
            avg_scroll_depth_pct INTEGER NOT NULL DEFAULT 0,
            top_referrers       JSONB,
            devices             JSONB,
            countries           JSONB,
            UNIQUE (tenant_id, date, article_id)
        )
    """)
    op.execute("CREATE INDEX idx_daily_analytics_tenant ON daily_analytics(tenant_id, date DESC)")

    # ─── Table transactions ───────────────────────────────────────────
    op.execute("""
        CREATE TABLE transactions (
            id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id                   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id                     UUID REFERENCES users(id) ON DELETE SET NULL,
            transaction_type            transaction_type NOT NULL,
            status                      transaction_status NOT NULL DEFAULT 'pending',
            payment_gateway             payment_gateway NOT NULL,
            amount                      DECIMAL(10,2) NOT NULL,
            currency                    CHAR(3) NOT NULL DEFAULT 'USD',
            platform_fee                DECIMAL(10,2) NOT NULL DEFAULT 0,
            net_amount                  DECIMAL(10,2) NOT NULL DEFAULT 0,
            stripe_payment_intent_id    VARCHAR(255),
            stripe_charge_id            VARCHAR(255),
            paypal_order_id             VARCHAR(255),
            paypal_capture_id           VARCHAR(255),
            article_id                  UUID REFERENCES articles(id) ON DELETE SET NULL,
            campaign_id                 UUID,
            extra                       JSONB,
            refunded_at                 TIMESTAMPTZ,
            created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_transactions_tenant ON transactions(tenant_id, created_at DESC)")
    op.execute("CREATE INDEX idx_transactions_user ON transactions(user_id) WHERE user_id IS NOT NULL")
    op.execute("CREATE INDEX idx_transactions_stripe ON transactions(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL")
    op.execute("CREATE INDEX idx_transactions_paypal ON transactions(paypal_order_id) WHERE paypal_order_id IS NOT NULL")

    # ─── Table tenant_subscriptions ───────────────────────────────────
    op.execute("""
        CREATE TABLE tenant_subscriptions (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id               UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
            stripe_customer_id      VARCHAR(255),
            stripe_subscription_id  VARCHAR(255),
            status                  subscription_status NOT NULL DEFAULT 'trialing',
            current_period_start    TIMESTAMPTZ,
            current_period_end      TIMESTAMPTZ,
            cancel_at_period_end    BOOLEAN NOT NULL DEFAULT FALSE,
            trial_ends_at           TIMESTAMPTZ,
            extra                   JSONB,
            created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)

    # ─── Table article_access ─────────────────────────────────────────
    op.execute("""
        CREATE TABLE article_access (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            article_id      UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
            transaction_id  UUID REFERENCES transactions(id),
            granted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at      TIMESTAMPTZ,
            UNIQUE (user_id, article_id)
        )
    """)
    op.execute("CREATE INDEX idx_article_access_user ON article_access(user_id, article_id)")

    # ─── Table push_tokens ────────────────────────────────────────────
    op.execute("""
        CREATE TABLE push_tokens (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
            token           TEXT NOT NULL,
            platform        VARCHAR(20) NOT NULL DEFAULT 'web',
            is_active       BOOLEAN NOT NULL DEFAULT TRUE,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_used_at    TIMESTAMPTZ,
            UNIQUE (tenant_id, token)
        )
    """)
    op.execute("CREATE INDEX idx_push_tokens_tenant ON push_tokens(tenant_id, is_active)")

    # ─── Table push_notifications ─────────────────────────────────────
    op.execute("""
        CREATE TABLE push_notifications (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            created_by      UUID NOT NULL REFERENCES users(id),
            title           VARCHAR(255) NOT NULL,
            body            TEXT NOT NULL,
            icon_url        TEXT,
            click_url       TEXT,
            image_url       TEXT,
            data            JSONB,
            article_id      UUID REFERENCES articles(id) ON DELETE SET NULL,
            sent_count      INTEGER NOT NULL DEFAULT 0,
            failed_count    INTEGER NOT NULL DEFAULT 0,
            clicked_count   INTEGER NOT NULL DEFAULT 0,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_push_notifs_tenant ON push_notifications(tenant_id, created_at DESC)")

    # ─── Triggers updated_at ─────────────────────────────────────────
    for tbl in ("transactions", "tenant_subscriptions"):
        op.execute(f"""
            CREATE TRIGGER set_{tbl}_updated_at
                BEFORE UPDATE ON {tbl}
                FOR EACH ROW EXECUTE FUNCTION set_updated_at()
        """)

    # ─── RLS ──────────────────────────────────────────────────────────
    for tbl in ("page_views", "daily_analytics", "transactions",
                "tenant_subscriptions", "article_access",
                "push_tokens", "push_notifications"):
        op.execute(f"ALTER TABLE {tbl} ENABLE ROW LEVEL SECURITY")
        op.execute(f"""
            CREATE POLICY tenant_isolation_{tbl} ON {tbl}
                USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
                WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
        """)


def downgrade() -> None:
    for tbl in ("push_notifications", "push_tokens", "article_access",
                "tenant_subscriptions", "transactions", "daily_analytics", "page_views"):
        op.execute(f"DROP TABLE IF EXISTS {tbl} CASCADE")
    for typ in ("subscription_status", "payment_gateway",
                "transaction_status", "transaction_type"):
        op.execute(f"DROP TYPE IF EXISTS {typ}")
