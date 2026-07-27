"""061 — Cashout multi-devises pour les membres (affiliation/ads)

Jusqu'ici, `users.usdt_wallet_address` supposait implicitement USDT sur BSC
(BEP20) — seule devise/réseau proposée pour le versement des commissions. Le
PDG demande maintenant de laisser le membre choisir son réseau/devise de
cashout parmi ce que NowPayments accepte réellement en payout, avec une
adresse validée selon le bon format pour CE réseau (pas un seul regex BSC
fixe) — pour ne jamais diverger de ce que NowPayments supporte vraiment.

`payout_currency` : code devise NowPayments en minuscule (ex: "usdtbsc",
"usdttrc20", "btc"...), toujours renseigné (défaut 'usdtbsc' pour préserver
le comportement des comptes existants qui ont déjà un wallet BSC enregistré).

`payout_extra_id` : memo/tag additionnel requis par certains réseaux
(ex: XRP, EOS) — NULL pour les réseaux qui n'en ont pas besoin (dont BSC).
Ne JAMAIS envoyer ce champ à NowPayments pour un réseau qui n'en a pas
besoin (bug réel déjà rencontré et corrigé le 2026-07-24 sur BSC/BEP20).

`payout_currency_snapshot` sur affiliate_cashout_requests : même logique que
`usdt_wallet_snapshot` déjà présent — capture la devise utilisée au moment
du virement, pour l'historique/audit (indépendant d'un changement ultérieur
du choix de l'utilisateur).

Revision ID: 061
Revises: 060
Create Date: 2026-07-27
"""
from alembic import op

revision = "061"
down_revision = "060"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN payout_currency VARCHAR(20) NOT NULL DEFAULT 'usdtbsc'")
    op.execute("ALTER TABLE users ADD COLUMN payout_extra_id VARCHAR(100)")
    op.execute("ALTER TABLE affiliate_cashout_requests ADD COLUMN payout_currency_snapshot VARCHAR(20)")


def downgrade() -> None:
    op.execute("ALTER TABLE affiliate_cashout_requests DROP COLUMN IF EXISTS payout_currency_snapshot")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS payout_extra_id")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS payout_currency")
