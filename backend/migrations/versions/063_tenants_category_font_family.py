"""063 — tenants.category / tenants.font_family jamais capturées par une migration

Colonnes déclarées dans le modèle SQLAlchemy (`app/models/tenant.py`,
`font_family` NOT NULL défaut 'Inter', `category` nullable) et activement
utilisées par l'application, mais jamais créées par aucune migration —
appliquées manuellement en direct sur la prod à un moment non tracé, comme
`plan_tier`/'free' (001) et `users.plan` (048). Trouvée le 2026-07-31 en
comparant colonne par colonne l'ancienne base et une nouvelle base Neon
migrée de zéro.

Revision ID: 063
Revises: 062
Create Date: 2026-07-31
"""
from alembic import op

revision = "063"
down_revision = "062"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE tenants
            ADD COLUMN IF NOT EXISTS font_family VARCHAR(100) NOT NULL DEFAULT 'Inter'
    """)
    op.execute("""
        ALTER TABLE tenants
            ADD COLUMN IF NOT EXISTS category VARCHAR(100)
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS category")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS font_family")
