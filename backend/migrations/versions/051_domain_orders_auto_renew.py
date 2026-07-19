"""051 — domain_orders.auto_renew

Oublié dans la migration 050 : la préférence de renouvellement automatique
doit être portée par la commande, pas seulement par le domaine final, pour
que le job d'enregistrement (register_purchased_domain) puisse la reporter
sur custom_domains.auto_renew au moment de la création de la ligne.

Revision ID: 051
Revises: 050
Create Date: 2026-07-19
"""
from alembic import op

revision = "051"
down_revision = "050"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE domain_orders ADD COLUMN auto_renew BOOLEAN NOT NULL DEFAULT false")


def downgrade() -> None:
    op.execute("ALTER TABLE domain_orders DROP COLUMN IF EXISTS auto_renew")
