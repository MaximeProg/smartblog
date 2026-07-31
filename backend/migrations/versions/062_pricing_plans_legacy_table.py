"""062 — Table pricing_plans jamais capturée par une migration

Table jamais créée par aucune migration mais présente sur la base de
production (3 lignes : Starter/Pro/Business, créées le 2026-06-27), et non
référencée par le code applicatif (aucun modèle SQLAlchemy, aucune requête) —
vraisemblablement un ancien seed manuel antérieur à la table
`subscription_plans` (migration 019), jamais nettoyé. Trouvée le 2026-07-31
en comparant le nombre de tables entre l'ancienne base et une nouvelle base
Neon migrée de zéro (63 vs 64 tables).

Recréée ici à l'identique (IF NOT EXISTS, inoffensif sur l'ancienne base qui
l'a déjà) pour que le schéma soit intégralement repris par les migrations,
même si elle n'est plus utilisée activement.

Revision ID: 062
Revises: 061
Create Date: 2026-07-31
"""
from alembic import op

revision = "062"
down_revision = "061"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS pricing_plans (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR NOT NULL,
            name_fr VARCHAR NOT NULL,
            slug VARCHAR NOT NULL,
            price_monthly NUMERIC,
            price_yearly NUMERIC,
            currency VARCHAR NOT NULL DEFAULT 'USD',
            description TEXT,
            description_fr TEXT,
            features JSONB NOT NULL DEFAULT '[]',
            features_fr JSONB NOT NULL DEFAULT '[]',
            is_highlighted BOOLEAN NOT NULL DEFAULT false,
            badge VARCHAR,
            badge_fr VARCHAR,
            is_active BOOLEAN NOT NULL DEFAULT true,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS pricing_plans")
