"""Add push_subscriptions table

Revision ID: 016_push_subscriptions
Revises: 015
Create Date: 2026-07-10
"""
from alembic import op

revision = "016_push_subscriptions"
down_revision = "015"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            endpoint   TEXT NOT NULL,
            p256dh     TEXT NOT NULL,
            auth       TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_push_endpoint UNIQUE (endpoint)
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_push_subs_user_id
            ON push_subscriptions(user_id)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS push_subscriptions")
