"""042 — Langues de traduction activables par tenant (plan payant uniquement)

Ajoute tenants.enabled_languages (liste de codes langue que le tenant a
choisi de proposer à ses visiteurs). Backfill : les tenants déjà sur un plan
payant reçoivent la liste complète des langues CMS supportées (pour ne rien
casser du côté du sélecteur, non restreint jusqu'ici) ; les tenants gratuits
restent à [] — ils n'ont de toute façon pas accès à la page pour la changer.

Revision ID: 042
Revises: 041
Create Date: 2026-07-17
"""
import json

import sqlalchemy as sa
from alembic import op

revision = "042"
down_revision = "041"
branch_labels = None
depends_on = None

ALL_CMS_LANGS = [
    "en", "fr", "es", "de", "pt", "it", "nl", "pl", "ru", "ja", "zh", "ko",
    "tr", "sv", "da", "nb", "fi", "cs", "sk", "ro", "hu", "bg", "el", "uk",
    "id", "lt", "lv", "et", "sl",
]


def upgrade() -> None:
    op.execute("ALTER TABLE tenants ADD COLUMN enabled_languages JSONB NOT NULL DEFAULT '[]'::jsonb")

    conn = op.get_bind()
    conn.execute(
        sa.text("UPDATE tenants SET enabled_languages = CAST(:langs AS JSONB) WHERE plan != 'free'"),
        {"langs": json.dumps(ALL_CMS_LANGS)},
    )


def downgrade() -> None:
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS enabled_languages")
