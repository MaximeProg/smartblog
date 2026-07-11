"""Add payment_link_url and payment_session_id to ads; ensure ad_submission_status values exist

Revision ID: 016
Revises: 015
Create Date: 2026-07-10
"""
from alembic import op

revision = "016"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Ajouter les nouvelles valeurs à l'enum (idempotent)
    for val in ("payment_pending", "paid", "expired"):
        op.execute(f"""
            DO $$ BEGIN
                ALTER TYPE ad_submission_status ADD VALUE IF NOT EXISTS '{val}';
            EXCEPTION WHEN others THEN NULL;
            END $$;
        """)

    # Ajouter les colonnes paiement à la table ads
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
