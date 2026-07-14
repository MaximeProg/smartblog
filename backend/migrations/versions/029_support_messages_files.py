"""029 — File attachments for support messages"""
from alembic import op

revision = "029"
down_revision = "028"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS file_url   TEXT")
    op.execute("ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS file_name  VARCHAR(500)")
    op.execute("ALTER TABLE support_messages ADD COLUMN IF NOT EXISTS file_type  VARCHAR(100)")


def downgrade() -> None:
    op.execute("ALTER TABLE support_messages DROP COLUMN IF EXISTS file_type")
    op.execute("ALTER TABLE support_messages DROP COLUMN IF EXISTS file_name")
    op.execute("ALTER TABLE support_messages DROP COLUMN IF EXISTS file_url")
