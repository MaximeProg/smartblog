"""028 — Activity logs table"""
from alembic import op

revision = "028"
down_revision = "027"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS activity_logs (
            id         BIGSERIAL PRIMARY KEY,
            ts         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            level      VARCHAR(20)  NOT NULL DEFAULT 'info',
            action     VARCHAR(100) NOT NULL,
            actor_id   UUID REFERENCES users(id) ON DELETE SET NULL,
            actor_email VARCHAR(255),
            target_type VARCHAR(50),
            target_id  VARCHAR(100),
            details    TEXT,
            ip         VARCHAR(45)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_activity_logs_ts     ON activity_logs (ts DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_activity_logs_level  ON activity_logs (level)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_activity_logs_action ON activity_logs (action)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_activity_logs_action")
    op.execute("DROP INDEX IF EXISTS ix_activity_logs_level")
    op.execute("DROP INDEX IF EXISTS ix_activity_logs_ts")
    op.execute("DROP TABLE IF EXISTS activity_logs")
