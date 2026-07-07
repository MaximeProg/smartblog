"""Ajoute colonnes workflow article : episode_number, season, robots_noindex, rejection_reason, canonical_url + valeur rejected dans article_status

Revision ID: 011_article_workflow
Revises: 010_template_config
Create Date: 2026-07-07
"""
from alembic import op
import sqlalchemy as sa


revision = "011_article_workflow"
down_revision = "010_template_config"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ajoute 'rejected' dans l'enum PostgreSQL article_status
    op.execute("ALTER TYPE article_status ADD VALUE IF NOT EXISTS 'rejected'")

    op.add_column("articles", sa.Column("episode_number", sa.Integer(), nullable=True))
    op.add_column("articles", sa.Column("season", sa.Integer(), nullable=True))
    op.add_column("articles", sa.Column("canonical_url", sa.Text(), nullable=True))
    op.add_column("articles", sa.Column("robots_noindex", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("articles", sa.Column("rejection_reason", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("articles", "rejection_reason")
    op.drop_column("articles", "robots_noindex")
    op.drop_column("articles", "canonical_url")
    op.drop_column("articles", "season")
    op.drop_column("articles", "episode_number")
    # Note: PostgreSQL ne supporte pas DROP VALUE sur un enum — downgrade partiel
