"""052 — Authentification email/mot de passe native (sans Firebase)

Firebase reste utilisé pour la connexion Google uniquement. L'inscription/
connexion par formulaire (email + mot de passe) est désormais gérée
entièrement par notre backend : `firebase_uid` devient optionnel, et un
hash de mot de passe est stocké directement sur `users`.

Revision ID: 052
Revises: 051
Create Date: 2026-07-20
"""
from alembic import op

revision = "052"
down_revision = "051"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ALTER COLUMN firebase_uid DROP NOT NULL")
    op.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")
    op.execute("""
        ALTER TABLE users ADD CONSTRAINT ck_users_has_auth_method
        CHECK (firebase_uid IS NOT NULL OR password_hash IS NOT NULL)
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP CONSTRAINT IF EXISTS ck_users_has_auth_method")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS password_hash")
    op.execute("ALTER TABLE users ALTER COLUMN firebase_uid SET NOT NULL")
