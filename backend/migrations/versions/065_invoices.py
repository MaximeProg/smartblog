"""065 — Système de facturation (générique, pas spécifique au KYC)

Première brique d'un système de facturation qui n'existait pas encore dans
le projet (vérifié : aucune table/PDF/email de facture nulle part). Utilisé
d'abord pour les paiements de vérification KYC, mais `payment_type` est une
simple chaîne (pas un enum) pour accueillir d'autres types de paiement plus
tard sans nouvelle migration.

Le contenu de la facture (montants, dates, IDs) est figé dans `snapshot`
(JSONB) au moment de l'émission — jamais recalculé, jamais retraduit après
coup. Le PDF/HTML est rendu à la demande depuis ce snapshot (voir
invoice_service.py), pas stocké en base.

Revision ID: 065
Revises: 064
Create Date: 2026-08-01
"""
from alembic import op

revision = "065"
down_revision = "064"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1")

    op.execute(
        """
        CREATE TABLE invoices (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            invoice_number VARCHAR(50) UNIQUE NOT NULL,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            transaction_id UUID REFERENCES transactions(id),
            payment_type VARCHAR(50) NOT NULL,
            amount NUMERIC(10,2) NOT NULL,
            currency VARCHAR(10) NOT NULL DEFAULT 'USDT',
            payment_reference VARCHAR(255),
            status VARCHAR(20) NOT NULL DEFAULT 'issued',
            language VARCHAR(10) NOT NULL DEFAULT 'en',
            snapshot JSONB NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX idx_invoices_user ON invoices(user_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS invoices")
    op.execute("DROP SEQUENCE IF EXISTS invoice_number_seq")
