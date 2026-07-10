"""Add affiliate program tables and tenant affiliate fields

Revision ID: 013_affiliate_program
Revises: 012_categories_color
Create Date: 2026-07-09
"""
from alembic import op
import sqlalchemy as sa

revision = "013_affiliate_program"
down_revision = "012_categories_color"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Tout le bloc est écrit en SQL brut idempotent (DO $$ ... EXCEPTION ...)
    # pour résister à une ré-exécution partielle.

    op.execute("""
        DO $$ BEGIN
            CREATE TYPE affiliate_commission_source AS ENUM ('subscription', 'ad_slot');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE affiliate_commission_status AS ENUM ('pending', 'ready', 'paid', 'cancelled');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE cashout_status AS ENUM ('requested', 'processing', 'paid', 'failed', 'rejected');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.execute("""
        DO $$ BEGIN
            ALTER TABLE tenants ADD COLUMN affiliate_code VARCHAR(8);
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE tenants ADD COLUMN referred_by_tenant_id UUID
                REFERENCES tenants(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE tenants ADD COLUMN affiliate_balance NUMERIC(10,2) NOT NULL DEFAULT 0;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE tenants ADD COLUMN affiliate_cashout_threshold NUMERIC(10,2) NOT NULL DEFAULT 50;
        EXCEPTION WHEN duplicate_column THEN NULL;
        END $$;
    """)

    op.execute("""
        UPDATE tenants
        SET affiliate_code = UPPER(SUBSTRING(MD5(id::text), 1, 8))
        WHERE affiliate_code IS NULL
    """)

    op.execute("""
        DO $$ BEGIN
            ALTER TABLE tenants ALTER COLUMN affiliate_code SET NOT NULL;
        EXCEPTION WHEN others THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            ALTER TABLE tenants
                ADD CONSTRAINT uq_tenants_affiliate_code UNIQUE (affiliate_code);
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS affiliate_cashout_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            gross_amount NUMERIC(10,2) NOT NULL,
            fee NUMERIC(10,2) NOT NULL DEFAULT 20,
            net_amount NUMERIC(10,2) NOT NULL,
            status cashout_status NOT NULL DEFAULT 'requested',
            payout_method VARCHAR(20),
            payout_reference VARCHAR(255),
            notes TEXT,
            requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            processed_at TIMESTAMPTZ,
            processed_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_cashout_requests_tenant_id
            ON affiliate_cashout_requests(tenant_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_cashout_requests_status
            ON affiliate_cashout_requests(status)
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS affiliate_relationships (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            descendant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            ancestor_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 10),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            CONSTRAINT uq_affiliate_relationship UNIQUE (descendant_id, ancestor_id)
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_affiliate_rel_descendant
            ON affiliate_relationships(descendant_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_affiliate_rel_ancestor
            ON affiliate_relationships(ancestor_id)
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS affiliate_commissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            affiliate_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            source_tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            source_type affiliate_commission_source NOT NULL,
            source_transaction_id VARCHAR(255) NOT NULL,
            level INTEGER NOT NULL,
            gross_amount NUMERIC(10,2) NOT NULL,
            commission_amount NUMERIC(10,2) NOT NULL,
            status affiliate_commission_status NOT NULL DEFAULT 'pending',
            cashout_request_id UUID REFERENCES affiliate_cashout_requests(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            paid_at TIMESTAMPTZ
        )
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_affiliate_commissions_affiliate
            ON affiliate_commissions(affiliate_tenant_id)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_affiliate_commissions_status
            ON affiliate_commissions(status)
    """)
    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_affiliate_commissions_source_tx
            ON affiliate_commissions(source_transaction_id)
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS affiliate_commissions")
    op.execute("DROP TABLE IF EXISTS affiliate_relationships")
    op.execute("DROP TABLE IF EXISTS affiliate_cashout_requests")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS affiliate_cashout_threshold")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS affiliate_balance")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS referred_by_tenant_id")
    op.execute("ALTER TABLE tenants DROP COLUMN IF EXISTS affiliate_code")
    op.execute("DROP TYPE IF EXISTS cashout_status")
    op.execute("DROP TYPE IF EXISTS affiliate_commission_status")
    op.execute("DROP TYPE IF EXISTS affiliate_commission_source")
