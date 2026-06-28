"""007 ai webhooks

Ajoute les tables webhooks + colonnes AI sur tenants.

Revision ID: 007_ai_webhooks
Revises: 006_analytics_payments_push
Create Date: 2026-06-26
"""
from alembic import op

revision = "007_ai_webhooks"
down_revision = "006_analytics_payments_push"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("DROP TABLE IF EXISTS webhook_deliveries CASCADE")
    op.execute("DROP TABLE IF EXISTS webhook_endpoints CASCADE")

    op.execute("""
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$
    """)

    # ─── Table webhook_endpoints ──────────────────────────────────────
    op.execute("""
        CREATE TABLE webhook_endpoints (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            created_by  UUID NOT NULL REFERENCES users(id),
            url         TEXT NOT NULL,
            secret      VARCHAR(255) NOT NULL,
            events      JSONB NOT NULL DEFAULT '[]',
            is_active   BOOLEAN NOT NULL DEFAULT TRUE,
            description VARCHAR(500),
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_webhooks_tenant ON webhook_endpoints(tenant_id, is_active)")

    # ─── Table webhook_deliveries ─────────────────────────────────────
    op.execute("""
        CREATE TABLE webhook_deliveries (
            id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            endpoint_id     UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
            event           VARCHAR(100) NOT NULL,
            payload         JSONB NOT NULL,
            status_code     INTEGER,
            response_body   TEXT,
            duration_ms     INTEGER,
            success         BOOLEAN NOT NULL DEFAULT FALSE,
            attempt         INTEGER NOT NULL DEFAULT 1,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX idx_webhook_deliveries_endpoint ON webhook_deliveries(endpoint_id, created_at DESC)")
    op.execute("CREATE INDEX idx_webhook_deliveries_success ON webhook_deliveries(endpoint_id, success)")

    # ─── Trigger updated_at ───────────────────────────────────────────
    op.execute("""
        CREATE TRIGGER set_webhook_endpoints_updated_at
            BEFORE UPDATE ON webhook_endpoints
            FOR EACH ROW EXECUTE FUNCTION set_updated_at()
    """)

    # ─── RLS webhooks ─────────────────────────────────────────────────
    op.execute("ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY")
    op.execute("""
        CREATE POLICY tenant_isolation_webhook_endpoints ON webhook_endpoints
            USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
            WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    """)

    # ─── Colonnes IA sur tenants ──────────────────────────────────────
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ai_tokens_used INTEGER NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ai_tts_chars_used INTEGER NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ai_images_generated INTEGER NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS ai_quota_reset_at TIMESTAMPTZ")

    # Colonnes manquantes sur Tenant (logo, cover, description)
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS description TEXT")
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT")
    op.execute("ALTER TABLE tenants ADD COLUMN IF NOT EXISTS cover_image_url TEXT")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS webhook_deliveries CASCADE")
    op.execute("DROP TABLE IF EXISTS webhook_endpoints CASCADE")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS ai_tokens_used")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS ai_tts_chars_used")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS ai_images_generated")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS ai_quota_reset_at")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS description")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS logo_url")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS cover_image_url")
