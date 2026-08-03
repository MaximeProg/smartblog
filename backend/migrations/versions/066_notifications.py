"""066 — Centre de notifications persistant (plateforme entière)

Une seule table sert à la fois les utilisateurs et les super admins (un
super admin est un `users` comme un autre — fan-out à l'écriture, une
ligne par destinataire). Ne remplace pas `platform_notifications`
(migration 027, historique des diffusions sortantes du Super Admin) —
rôles différents, les deux coexistent.

Revision ID: 066
Revises: 065
Create Date: 2026-08-03
"""
from alembic import op

revision = "066"
down_revision = "065"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(20) NOT NULL DEFAULT 'info',
            category VARCHAR(30) NOT NULL,
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            action_url VARCHAR(255),
            is_read BOOLEAN NOT NULL DEFAULT false,
            read_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute("CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id, created_at DESC)")
    op.execute("CREATE INDEX idx_notifications_unread ON notifications(recipient_user_id, is_read) WHERE is_read = false")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS notifications")
