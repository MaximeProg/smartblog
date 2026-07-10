"""017 user profile fields

Revision ID: 017
Revises: 016
Create Date: 2026-07-10
"""
from alembic import op
import sqlalchemy as sa

revision = "017"
down_revision = "016_push_subscriptions"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("phone",     sa.String(30),  nullable=True))
    op.add_column("users", sa.Column("country",   sa.String(2),   nullable=True))
    op.add_column("users", sa.Column("continent", sa.String(2),   nullable=True))
    op.add_column("users", sa.Column("gender",    sa.String(20),  nullable=True))


def downgrade() -> None:
    op.drop_column("users", "gender")
    op.drop_column("users", "continent")
    op.drop_column("users", "country")
    op.drop_column("users", "phone")
