"""054 — Annulation du mécanisme de réserve NowPayments (décision PDG)

Le PDG a tranché : un utilisateur qui n'a pas enregistré son wallet USDT BSC
ne participe pas au programme d'affiliation (et ne reçoit pas sa part de
revenu publicitaire) — on ne calcule ni ne met plus jamais de côté un montant
pour lui (voir migration 053, revenue sur cette décision). Cette migration
nettoie les données créées pendant la courte fenêtre où ce mécanisme était
actif : aucune de ces commissions n'a été réellement facturée à un tiers, donc
les annuler (au lieu de les payer) ne crée aucune perte pour personne.

Revision ID: 054
Revises: 053
Create Date: 2026-07-21
"""
from alembic import op

revision = "054"
down_revision = "053"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Retire des soldes affiliés le montant des commissions PENDING/RESERVED
    # avant de les annuler, pour ne pas laisser un solde fantôme.
    op.execute("""
        UPDATE users u
        SET affiliate_balance = GREATEST(0, u.affiliate_balance - sub.total)
        FROM (
            SELECT affiliate_user_id, SUM(commission_amount) AS total
            FROM affiliate_commissions
            WHERE status IN ('pending', 'reserved')
            GROUP BY affiliate_user_id
        ) sub
        WHERE u.id = sub.affiliate_user_id
    """)

    op.execute("""
        UPDATE affiliate_commissions
        SET status = 'cancelled'
        WHERE status IN ('pending', 'reserved')
    """)

    # ad_revenue_shares n'a jamais été alimentée en production (fonctionnalité
    # non déployée) — simple nettoyage des éventuelles lignes de test.
    op.execute("""
        DELETE FROM ad_revenue_shares
        WHERE status IN ('pending', 'reserved')
    """)


def downgrade() -> None:
    # Migration de données uniquement — aucune structure à restaurer, et les
    # montants annulés ne peuvent pas être retrouvés automatiquement.
    pass
