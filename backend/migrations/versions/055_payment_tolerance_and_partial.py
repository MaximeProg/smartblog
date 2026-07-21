"""055 — Tolérance de paiement crypto + paiements partiels

Ajoute un statut PARTIALLY_PAID (jusqu'ici "partially_paid" de NowPayments
n'était géré nulle part — la transaction restait PENDING pour toujours) et
deux colonnes pour suivre le montant réellement reçu, y compris à travers
plusieurs tentatives de paiement (reprise après paiement partiel).

Revision ID: 055
Revises: 054
Create Date: 2026-07-21
"""
from alembic import op

revision = "055"
down_revision = "054"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE transaction_status ADD VALUE IF NOT EXISTS 'partially_paid'")
    op.execute("ALTER TABLE transactions ADD COLUMN amount_received NUMERIC(10,2) NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE transactions ADD COLUMN amount_received_prior_attempts NUMERIC(10,2) NOT NULL DEFAULT 0")


def downgrade() -> None:
    op.execute("ALTER TABLE transactions DROP COLUMN IF EXISTS amount_received_prior_attempts")
    op.execute("ALTER TABLE transactions DROP COLUMN IF EXISTS amount_received")
    # NB : PostgreSQL ne permet pas de retirer une valeur d'un type ENUM
    # existant — 'partially_paid' reste dans transaction_status même après
    # ce downgrade (même limitation déjà rencontrée sur d'autres migrations
    # de ce projet).
