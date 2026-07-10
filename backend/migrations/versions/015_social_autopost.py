"""Add auto_post_enabled to social_accounts

Revision ID: 015
Revises: 014
Create Date: 2026-07-09
"""
from alembic import op
import sqlalchemy as sa

revision = "015"
down_revision = "014_accounting"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE social_accounts ADD COLUMN auto_post_enabled BOOLEAN NOT NULL DEFAULT TRUE;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE social_accounts DROP COLUMN IF EXISTS auto_post_enabled")
