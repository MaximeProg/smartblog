"""Ajoute template_config sur tenants

Revision ID: 010_template_config
Revises: 009_likes_shares
Create Date: 2026-07-02
"""
from alembic import op
import sqlalchemy as sa


revision = "010_template_config"
down_revision = "009_likes_shares"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "tenants",
        sa.Column("template_config", sa.JSON(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("tenants", "template_config")
