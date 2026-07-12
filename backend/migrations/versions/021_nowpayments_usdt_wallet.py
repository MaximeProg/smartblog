"""021 — NowPayments + USDT wallet address

Migration :
  - Ajoute usdt_wallet_address sur users
  - Ajoute usdt_wallet_snapshot sur affiliate_cashout_requests
  - Met à jour la colonne payout_method (varchar 30)
  - Met à jour les enums payment_gateway et journal_entry_source
"""
from alembic import op
import sqlalchemy as sa

revision = "021"
down_revision = "020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── users.usdt_wallet_address ─────────────────────────────────
    op.add_column("users", sa.Column("usdt_wallet_address", sa.String(100), nullable=True))

    # ── affiliate_cashout_requests ────────────────────────────────
    op.add_column(
        "affiliate_cashout_requests",
        sa.Column("usdt_wallet_snapshot", sa.String(100), nullable=True),
    )
    op.alter_column(
        "affiliate_cashout_requests",
        "payout_method",
        type_=sa.String(30),
        existing_type=sa.String(20),
        existing_nullable=True,
    )

    # ── transactions : remplacer colonnes Stripe/PayPal par NowPayments ──
    op.drop_column("transactions", "stripe_payment_intent_id")
    op.drop_column("transactions", "stripe_charge_id")
    op.drop_column("transactions", "paypal_order_id")
    op.drop_column("transactions", "paypal_capture_id")
    op.add_column("transactions", sa.Column("nowpayments_invoice_id", sa.String(255), nullable=True))
    op.add_column("transactions", sa.Column("nowpayments_order_id", sa.String(255), nullable=True))
    op.alter_column("transactions", "currency", type_=sa.String(10), existing_type=sa.String(3), existing_nullable=False)

    # ── tenant_subscriptions : remplacer colonnes Stripe ─────────
    op.drop_column("tenant_subscriptions", "stripe_customer_id")
    op.drop_column("tenant_subscriptions", "stripe_subscription_id")
    op.add_column("tenant_subscriptions", sa.Column("nowpayments_payment_id", sa.String(255), nullable=True))

    # ── Enums PostgreSQL ──────────────────────────────────────────
    op.execute("ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'nowpayments'")
    op.execute("ALTER TYPE payment_gateway ADD VALUE IF NOT EXISTS 'crypto'")
    op.execute("ALTER TYPE journal_entry_source ADD VALUE IF NOT EXISTS 'nowpayments_webhook'")


def downgrade() -> None:
    op.drop_column("users", "usdt_wallet_address")
    op.drop_column("affiliate_cashout_requests", "usdt_wallet_snapshot")
    op.alter_column(
        "affiliate_cashout_requests",
        "payout_method",
        type_=sa.String(20),
        existing_type=sa.String(30),
        existing_nullable=True,
    )
