"""Add color column to categories table

Revision ID: 012_categories_color
Revises: 011_article_workflow
Create Date: 2026-07-07
"""
from alembic import op
import sqlalchemy as sa

revision = "012_categories_color"
down_revision = "011_article_workflow"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("categories", sa.Column("color", sa.String(20), nullable=True))


def downgrade() -> None:
    op.drop_column("categories", "color")
