"""056 — Retire amount_received_prior_attempts (devenue inutile)

La reprise d'un paiement partiel réutilise désormais la MÊME adresse de
dépôt NowPayments (qui détecte elle-même les "Re-deposit" sur une adresse
déjà utilisée) au lieu d'en créer une nouvelle à chaque tentative — plus
besoin de distinguer "tentatives précédentes" et "tentative actuelle",
amount_received seul suffit pour le cumul.

Revision ID: 056
Revises: 055
Create Date: 2026-07-21
"""
from alembic import op

revision = "056"
down_revision = "055"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE transactions DROP COLUMN IF EXISTS amount_received_prior_attempts")


def downgrade() -> None:
    op.execute("ALTER TABLE transactions ADD COLUMN amount_received_prior_attempts NUMERIC(10,2) NOT NULL DEFAULT 0")
