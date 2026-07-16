"""034 — Messages du formulaire de contact public

Persiste les messages envoyés depuis la page /contact (avant notification
email+push aux super admins) — évite de perdre un message si l'envoi email
échoue, et garde un historique. Table platform-wide, sans RLS (pas de tenant).

Revision ID: 034
Revises: 033
Create Date: 2026-07-16
"""
from alembic import op

revision = "034"
down_revision = "033"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE contact_messages (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            channel    VARCHAR(20) NOT NULL,
            name       VARCHAR(255) NOT NULL,
            email      VARCHAR(255) NOT NULL,
            subject    VARCHAR(500) NOT NULL,
            message    TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX ix_contact_messages_created_at ON contact_messages(created_at DESC)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS contact_messages")
