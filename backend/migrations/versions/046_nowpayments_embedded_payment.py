"""046 — Paiement NowPayments intégré (adresse + QR, sans redirection)

Ajoute à `transactions` les colonnes nécessaires pour afficher l'adresse de
paiement/QR directement sur la plateforme et suivre le statut brut NowPayments
(waiting/confirming/finished/failed/expired/...) sans avoir à étendre l'enum
interne `transaction_status`. Supprime les colonnes ad-hoc `payment_link_url`/
`payment_session_id` sur `ads`, remplacées par une vraie ligne `transactions`
(transaction_type=ad_campaign, campaign_id=ad.id) — même mécanisme que les
3 autres flux de paiement.

Revision ID: 046
Revises: 045
Create Date: 2026-07-18
"""
from alembic import op

revision = "046"
down_revision = "045"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE transactions
            ADD COLUMN nowpayments_payment_id VARCHAR(255),
            ADD COLUMN pay_address VARCHAR(255),
            ADD COLUMN pay_amount NUMERIC(20, 8),
            ADD COLUMN pay_currency VARCHAR(20),
            ADD COLUMN payment_expires_at TIMESTAMPTZ,
            ADD COLUMN provider_status VARCHAR(30)
    """)
    op.execute("ALTER TABLE ads DROP COLUMN IF EXISTS payment_link_url")
    op.execute("ALTER TABLE ads DROP COLUMN IF EXISTS payment_session_id")


def downgrade() -> None:
    op.execute("ALTER TABLE ads ADD COLUMN payment_link_url TEXT")
    op.execute("ALTER TABLE ads ADD COLUMN payment_session_id VARCHAR(255)")
    op.execute("""
        ALTER TABLE transactions
            DROP COLUMN IF EXISTS nowpayments_payment_id,
            DROP COLUMN IF EXISTS pay_address,
            DROP COLUMN IF EXISTS pay_amount,
            DROP COLUMN IF EXISTS pay_currency,
            DROP COLUMN IF EXISTS payment_expires_at,
            DROP COLUMN IF EXISTS provider_status
    """)
