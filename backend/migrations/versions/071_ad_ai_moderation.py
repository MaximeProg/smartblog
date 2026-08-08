"""071 — Modération IA automatique des pubs (2026-08-07)

Décision PDG : la revue manuelle obligatoire par un super admin avant
publication d'une pub est remplacée par une vérification automatique —
une IA (GPT-4o) analyse le contenu de la pub (titre, description, image,
lien) juste après confirmation du paiement. Si le lien est SAFE et que
l'IA approuve le contenu, la pub est publiée automatiquement et les
commissions partagées exactement comme avant (60% propriétaire de blog /
10% affiliation / 30% plateforme, voir accounting.py::book_ad_slot_payment
— logique inchangée, seul le déclencheur change).

Toute pub que l'IA ne peut pas approuver avec confiance (FLAGGED, ou erreur
IA) retombe sur la revue manuelle existante (POST /{ad_id}/review) — jamais
de publication automatique en cas de doute.

Revision ID: 071
Revises: 070
Create Date: 2026-08-07
"""
from alembic import op

revision = "071"
down_revision = "070"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "CREATE TYPE ad_content_review_status AS ENUM ('unchecked', 'approved', 'flagged')"
    )
    op.execute("ALTER TABLE ads ADD COLUMN ai_review_status ad_content_review_status NOT NULL DEFAULT 'unchecked'")
    op.execute("ALTER TABLE ads ADD COLUMN ai_reviewed_at TIMESTAMPTZ")
    op.execute("ALTER TABLE ads ADD COLUMN ai_review_details JSONB")


def downgrade() -> None:
    op.execute("ALTER TABLE ads DROP COLUMN IF EXISTS ai_review_details")
    op.execute("ALTER TABLE ads DROP COLUMN IF EXISTS ai_reviewed_at")
    op.execute("ALTER TABLE ads DROP COLUMN IF EXISTS ai_review_status")
    op.execute("DROP TYPE IF EXISTS ad_content_review_status")
