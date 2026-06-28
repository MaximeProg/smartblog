"""004 user provider fields

Ajoute sign_in_provider et email_verified sur la table users.

Revision ID: 004_user_provider_fields
Revises: 003_media_comments_newsletter
Create Date: 2026-06-26
"""
from alembic import op

revision = "004_user_provider_fields"
down_revision = "003_media_comments_newsletter"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS sign_in_provider VARCHAR(50)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS sign_in_provider")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS email_verified")
