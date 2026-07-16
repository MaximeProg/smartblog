"""039 — article_translations.content devient nullable

Permet une traduction "légère" (titre+extrait seulement, pour les listes
d'articles) avant qu'un lecteur n'ouvre l'article en entier — à ce moment-là
le HTML complet est traduit et vient remplir `content`.

Revision ID: 039
Revises: 038
Create Date: 2026-07-16
"""
from alembic import op

revision = "039"
down_revision = "038"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE article_translations ALTER COLUMN content DROP NOT NULL")


def downgrade() -> None:
    op.execute("UPDATE article_translations SET content = '' WHERE content IS NULL")
    op.execute("ALTER TABLE article_translations ALTER COLUMN content SET NOT NULL")
