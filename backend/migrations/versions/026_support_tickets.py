"""026 — Support tickets & messages"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "026"
down_revision = "025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed')")
    op.execute("CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent')")

    op.create_table(
        "support_tickets",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("opened_by", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("subject", sa.String(255), nullable=False),
        sa.Column("status", sa.Enum("open", "in_progress", "resolved", "closed", name="ticket_status", create_type=False), nullable=False, server_default="open"),
        sa.Column("priority", sa.Enum("low", "normal", "high", "urgent", name="ticket_priority", create_type=False), nullable=False, server_default="normal"),
        sa.Column("tenant_language", sa.String(10), nullable=False, server_default="en"),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_support_tickets_tenant", "support_tickets", ["tenant_id"])
    op.create_index("ix_support_tickets_status", "support_tickets", ["status"])

    op.create_table(
        "support_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("ticket_id", UUID(as_uuid=True), sa.ForeignKey("support_tickets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("sender_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("is_from_admin", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("body_original", sa.Text, nullable=False),
        sa.Column("body_translated", sa.Text, nullable=False, server_default=""),
        sa.Column("push_sent", sa.Boolean, nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_support_messages_ticket", "support_messages", ["ticket_id"])


def downgrade() -> None:
    op.drop_index("ix_support_messages_ticket", table_name="support_messages")
    op.drop_table("support_messages")
    op.drop_index("ix_support_tickets_status", table_name="support_tickets")
    op.drop_index("ix_support_tickets_tenant", table_name="support_tickets")
    op.drop_table("support_tickets")
    op.execute("DROP TYPE IF EXISTS ticket_status")
    op.execute("DROP TYPE IF EXISTS ticket_priority")
