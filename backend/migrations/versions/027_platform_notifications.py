"""027 — Platform notifications history"""
from alembic import op

revision = "027"
down_revision = "026"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS platform_notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            audience VARCHAR(20) NOT NULL DEFAULT 'all',
            sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
            sent_count INTEGER NOT NULL DEFAULT 0,
            sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_platform_notifications_sent_at "
        "ON platform_notifications (sent_at DESC)"
    )


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_platform_notifications_sent_at")
    op.execute("DROP TABLE IF EXISTS platform_notifications")
