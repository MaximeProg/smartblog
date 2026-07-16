"""031 — Ajoute 'google_business' à l'enum social_platform (connexion Google Business Profile)

Revision ID: 031
Revises: 030
Create Date: 2026-07-16
"""
from alembic import op

revision = "031"
down_revision = "030"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            ALTER TYPE social_platform ADD VALUE IF NOT EXISTS 'google_business';
        EXCEPTION WHEN others THEN NULL;
        END $$;
    """)


def downgrade() -> None:
    # Postgres ne permet pas de retirer une valeur d'un enum directement.
    # Rien à faire — les comptes google_business existants resteraient orphelins
    # si ce downgrade était exécuté ; à traiter manuellement si besoin.
    pass
