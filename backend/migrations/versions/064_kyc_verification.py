"""064 — Vérification KYC obligatoire pour l'affiliation (Kaluta KYC)

Le PDG impose (2026-08-01) que la participation au programme d'affiliation
nécessite un KYC validé au préalable. Vérification payante (10$/an par
défaut, configurable, 1/2/3/5 ans au choix), payée via le pipeline crypto
NowPayments déjà en place, via le prestataire Kaluta KYC.

Architecture : `users` porte l'état courant (statut, années restantes,
date de validation) — `kyc_verifications` est l'historique complet façon
`affiliate_commissions` (une ligne par achat ET par cycle de
re-vérification), pour garder une trace comptable/d'audit complète.

Commission d'affiliation sur le paiement KYC : même mécanisme à pourcentage
fixe par niveau que les pubs du site principal (voir
affiliate.py::compute_and_accrue_fixed_level_commissions, migration 058) —
10% niveau 1 + 1% niveaux 2-10 (19%) — d'où le compte 4104 au lieu de 4103
(revenu différent, mais même compte de passif affiliation 2810).

Revision ID: 064
Revises: 063
Create Date: 2026-08-01
"""
import sqlalchemy as sa
from alembic import op

revision = "064"
down_revision = "063"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE transaction_type ADD VALUE IF NOT EXISTS 'kyc_verification'")
    op.execute("ALTER TYPE affiliate_commission_source ADD VALUE IF NOT EXISTS 'kyc_verification'")

    op.execute(
        "CREATE TYPE kyc_status AS ENUM ('not_started', 'pending', 'verified', 'expired', 'rejected')"
    )

    op.execute("ALTER TABLE users ADD COLUMN kyc_status kyc_status NOT NULL DEFAULT 'not_started'")
    op.execute("ALTER TABLE users ADD COLUMN kyc_years_remaining INTEGER NOT NULL DEFAULT 0")
    op.execute("ALTER TABLE users ADD COLUMN kyc_verified_at TIMESTAMPTZ")
    op.execute("ALTER TABLE users ADD COLUMN kyc_provider_session_id VARCHAR(255)")

    op.execute(
        """
        CREATE TABLE kyc_verifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            tenant_id UUID NOT NULL,
            transaction_id UUID REFERENCES transactions(id),
            years_purchased INTEGER NOT NULL DEFAULT 0,
            amount_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
            status kyc_status NOT NULL DEFAULT 'not_started',
            kaluta_session_id VARCHAR(255),
            kaluta_verification_url TEXT,
            kaluta_expires_at TIMESTAMPTZ,
            approved_at TIMESTAMPTZ,
            rejected_at TIMESTAMPTZ,
            raw_webhook_payload JSONB,
            document_score NUMERIC(5,2),
            face_score NUMERIC(5,2),
            liveness_score NUMERIC(5,2),
            overall_score NUMERIC(5,2),
            is_material_change_reverification BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX idx_kyc_verifications_user ON kyc_verifications(user_id)")
    op.execute("CREATE INDEX idx_kyc_verifications_kaluta_session ON kyc_verifications(kaluta_session_id)")

    op.execute(
        """
        INSERT INTO chart_of_accounts (code, name, account_class, account_type, parent_code, is_system)
        VALUES ('4104', 'KYC Verification Revenue', 4, 'revenue', '4100', true)
        ON CONFLICT (code) DO NOTHING
        """
    )


def downgrade() -> None:
    op.execute("DELETE FROM chart_of_accounts WHERE code = '4104'")
    op.execute("DROP TABLE IF EXISTS kyc_verifications")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS kyc_provider_session_id")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS kyc_verified_at")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS kyc_years_remaining")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS kyc_status")
    op.execute("DROP TYPE IF EXISTS kyc_status")
    # Note : PostgreSQL ne permet pas de retirer une valeur d'un ENUM existant —
    # 'kyc_verification' reste dans transaction_type/affiliate_commission_source
    # même après ce downgrade (même précédent que les migrations 011/048/etc.)
