"""024 — Newsletter payante : table newsletter_access"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "024"
down_revision = "023"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "newsletter_access",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("campaign_id", UUID(as_uuid=True), sa.ForeignKey("newsletter_campaigns.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("amount_paid", sa.Numeric(10, 2), nullable=True),
        sa.Column("nowpayments_order_id", sa.String(255), nullable=True),
        sa.Column("granted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_newsletter_access_campaign_email", "newsletter_access", ["campaign_id", "email"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_newsletter_access_campaign_email", table_name="newsletter_access")
    op.drop_table("newsletter_access")
