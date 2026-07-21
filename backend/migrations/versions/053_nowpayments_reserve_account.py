"""053 — Compte NowPayments de réserve (fonds non réclamés)

Commissions d'affiliation et part propriétaire de blog (80% des ventes d'espace
publicitaire) : lorsqu'aucun wallet USDT BSC n'est encore enregistré, les fonds
sont désormais réellement mis de côté (statut RESERVED) sur un second compte
NowPayments dédié, au lieu de rester une simple ligne PENDING non garantie
mélangée à la trésorerie principale.

Revision ID: 053
Revises: 052
Create Date: 2026-07-21
"""
from alembic import op

revision = "053"
down_revision = "052"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE affiliate_commission_status ADD VALUE IF NOT EXISTS 'reserved'")

    op.execute("""
        CREATE TYPE ad_revenue_share_status AS ENUM ('pending', 'reserved', 'paid')
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS ad_revenue_shares (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            gross_amount NUMERIC(10,2) NOT NULL,
            owner_share_amount NUMERIC(10,2) NOT NULL,
            status ad_revenue_share_status NOT NULL DEFAULT 'pending',
            payout_reference VARCHAR(255),
            reserve_payout_reference VARCHAR(255),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            paid_at TIMESTAMPTZ
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_ad_revenue_shares_owner
            ON ad_revenue_shares(owner_user_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_ad_revenue_shares_status
            ON ad_revenue_shares(status)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_ad_revenue_shares_ad
            ON ad_revenue_shares(ad_id)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS ad_revenue_shares")
    op.execute("DROP TYPE IF EXISTS ad_revenue_share_status")
    # NB : PostgreSQL ne permet pas de retirer une valeur d'un type ENUM
    # existant — 'reserved' reste dans affiliate_commission_status même après
    # ce downgrade (comportement standard déjà suivi par les migrations
    # précédentes de ce projet, ex. 018/021/031/050).
