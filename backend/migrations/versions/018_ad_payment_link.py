"""Add payment_link_url and payment_session_id to ads; extend ad_submission_status enum

Revision ID: 018
Revises: 017
Create Date: 2026-07-11
"""
from alembic import op

revision = "018"
down_revision = "017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Étendre l'enum ad_submission_status avec les nouvelles valeurs (idempotent)
    for val in ("payment_pending", "paid", "expired"):
        op.execute(f"""
            DO $$ BEGIN
                ALTER TYPE ad_submission_status ADD VALUE IF NOT EXISTS '{val}';
            EXCEPTION WHEN others THEN NULL;
            END $$;
        """)

    # Ajouter les colonnes paiement à la table ads (idempotent)
    op.execute("""
        ALTER TABLE ads
            ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
            ADD COLUMN IF NOT EXISTS payment_session_id VARCHAR(255);
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE ads
            DROP COLUMN IF EXISTS payment_link_url,
            DROP COLUMN IF EXISTS payment_session_id;
    """)
