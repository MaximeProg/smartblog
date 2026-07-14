"""026 — Support tickets & messages"""
from alembic import op

revision = "026"
down_revision = "025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create enum types — idempotent (handles partial migration state)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS support_tickets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            opened_by UUID REFERENCES users(id) ON DELETE SET NULL,
            subject VARCHAR(255) NOT NULL,
            status ticket_status NOT NULL DEFAULT 'open',
            priority ticket_priority NOT NULL DEFAULT 'normal',
            tenant_language VARCHAR(10) NOT NULL DEFAULT 'en',
            resolved_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_support_tickets_tenant ON support_tickets (tenant_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_support_tickets_status ON support_tickets (status)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS support_messages (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
            sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
            is_from_admin BOOLEAN NOT NULL DEFAULT false,
            body_original TEXT NOT NULL,
            body_translated TEXT NOT NULL DEFAULT '',
            push_sent BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_support_messages_ticket ON support_messages (ticket_id)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_support_messages_ticket")
    op.execute("DROP TABLE IF EXISTS support_messages")
    op.execute("DROP INDEX IF EXISTS ix_support_tickets_status")
    op.execute("DROP INDEX IF EXISTS ix_support_tickets_tenant")
    op.execute("DROP TABLE IF EXISTS support_tickets")
    op.execute("DROP TYPE IF EXISTS ticket_priority")
    op.execute("DROP TYPE IF EXISTS ticket_status")
