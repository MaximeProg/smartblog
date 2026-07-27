"""060 — Ciblage géographique des pubs plateforme

Le PDG a demandé (2026-07-27) une vraie fonctionnalité de ciblage
géographique pour les pubs sur smarterbloggers.com lui-même (annoncée sur
la page /advertise-with-us), plutôt qu'une simple case à cocher marketing
sans fonctionnalité réelle derrière.

`target_countries` : liste JSON de codes pays ISO 3166-1 alpha-2 (ex:
["US","FR"]). NULL/vide = pas de ciblage, la pub s'affiche à tout le monde
(comportement inchangé pour les pubs existantes). Le pays du visiteur est
détecté au moment de servir la pub via les mêmes en-têtes CDN déjà utilisés
par analytics.py (CF-IPCountry / X-Vercel-IP-Country /
CloudFront-Viewer-Country) — aucune nouvelle dépendance de géolocalisation.

Revision ID: 060
Revises: 059
Create Date: 2026-07-27
"""
from alembic import op

revision = "060"
down_revision = "059"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE ads ADD COLUMN target_countries JSONB")


def downgrade() -> None:
    op.execute("ALTER TABLE ads DROP COLUMN IF EXISTS target_countries")
