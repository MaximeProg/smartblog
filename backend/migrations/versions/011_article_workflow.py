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
    # canonical_url est déjà dans la création initiale de la table (migration
    # 002) — ce op.add_column était un doublon jamais détecté car l'ancienne
    # base n'a jamais rejoué toutes les migrations depuis zéro d'un coup
    # (trouvé le 2026-07-31 en migrant vers une nouvelle base Neon vide).
    # IF NOT EXISTS le rend inoffensif dans les deux cas (base neuve ou base
    # ayant déjà appliqué cette migration historiquement).
    op.execute("ALTER TABLE articles ADD COLUMN IF NOT EXISTS canonical_url TEXT")
    op.add_column("articles", sa.Column("robots_noindex", sa.Boolean(), nullable=False, server_default="false"))
    op.add_column("articles", sa.Column("rejection_reason", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("articles", "rejection_reason")
    op.drop_column("articles", "robots_noindex")
    op.drop_column("articles", "canonical_url")
    op.drop_column("articles", "season")
    op.drop_column("articles", "episode_number")
    # Note: PostgreSQL ne supporte pas DROP VALUE sur un enum — downgrade partiel
