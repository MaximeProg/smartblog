"""Add accounting tables (Singapore SFRS) and seed Chart of Accounts

Revision ID: 014_accounting
Revises: 013_affiliate_program
Create Date: 2026-07-09
"""
from alembic import op
import sqlalchemy as sa

revision = "014_accounting"
down_revision = "013_affiliate_program"
branch_labels = None
depends_on = None


# ── Chart of Accounts seed data ──────────────────────────────────────
# Format: (code, name, account_class, account_type, parent_code, is_system)
COA_SEED = [
    # Class 1 — Assets
    ("1000", "Cash and Cash Equivalents", 1, "asset", None, True),
    ("1010", "Bank — SGD Operating Account", 1, "asset", "1000", True),
    ("1011", "Bank — USD Operating Account", 1, "asset", "1000", True),
    ("1020", "Stripe Settlement Account", 1, "asset", "1000", True),
    ("1021", "PayPal Settlement Account", 1, "asset", "1000", True),
    ("1100", "Accounts Receivable", 1, "asset", None, True),
    ("1101", "Subscriptions Receivable", 1, "asset", "1100", True),
    ("1102", "Advertising Receivable", 1, "asset", "1100", True),
    ("1110", "Allowance for Doubtful Accounts", 1, "asset", "1100", True),
    ("1200", "Prepaid Expenses", 1, "asset", None, False),
    ("1201", "Prepaid Software Subscriptions", 1, "asset", "1200", False),
    ("1400", "Input GST Receivable (9%)", 1, "asset", None, True),
    ("1500", "Computer Equipment", 1, "asset", None, False),
    ("1511", "Accumulated Depreciation — Equipment", 1, "asset", "1500", False),
    ("1520", "Software and Licenses", 1, "asset", None, False),
    ("1521", "Accumulated Amortisation — Software", 1, "asset", "1520", False),
    ("1530", "Intangible Assets", 1, "asset", None, False),
    # Class 2 — Liabilities
    ("2000", "Accounts Payable", 2, "liability", None, True),
    ("2001", "Technology Vendors Payable", 2, "liability", "2000", False),
    ("2100", "Deferred Revenue", 2, "liability", None, True),
    ("2101", "Monthly Subscriptions Deferred", 2, "liability", "2100", True),
    ("2102", "Annual Subscriptions Deferred", 2, "liability", "2100", True),
    ("2103", "Advertising Campaigns Deferred", 2, "liability", "2100", True),
    ("2200", "Output GST Payable (9%)", 2, "liability", None, True),
    ("2300", "Accrued Liabilities", 2, "liability", None, False),
    ("2301", "Salaries Payable", 2, "liability", "2300", False),
    ("2302", "CPF Employer Contribution Payable (17%)", 2, "liability", "2300", False),
    ("2304", "Corporate Tax Payable (17%)", 2, "liability", "2300", True),
    ("2400", "Customer Refunds Payable", 2, "liability", None, False),
    ("2500", "Bank Loans", 2, "liability", None, False),
    ("2800", "Affiliate Program Liabilities", 2, "liability", None, True),
    ("2810", "Affiliate Commissions Payable", 2, "liability", "2800", True),
    ("2811", "Affiliate Commissions — In Transit", 2, "liability", "2800", True),
    ("2812", "Affiliate Cashout Fees Collected", 2, "liability", "2800", True),
    # Class 3 — Equity
    ("3000", "Share Capital", 3, "equity", None, True),
    ("3001", "Ordinary Share Capital", 3, "equity", "3000", True),
    ("3101", "Statutory Reserves", 3, "equity", None, False),
    ("3201", "Retained Earnings", 3, "equity", None, True),
    ("3202", "Profit / (Loss) for the Year", 3, "equity", "3201", True),
    ("3301", "Dividends Declared", 3, "equity", None, False),
    # Class 4 — Revenue
    ("4000", "Subscription Revenue", 4, "revenue", None, True),
    ("4001", "Starter Plan — Monthly", 4, "revenue", "4000", True),
    ("4002", "Starter Plan — Annual", 4, "revenue", "4000", True),
    ("4010", "Pro Plan — Monthly", 4, "revenue", "4000", True),
    ("4011", "Pro Plan — Annual", 4, "revenue", "4000", True),
    ("4020", "Business Plan — Monthly", 4, "revenue", "4000", True),
    ("4021", "Business Plan — Annual", 4, "revenue", "4000", True),
    ("4030", "Enterprise Plan — Monthly", 4, "revenue", "4000", True),
    ("4031", "Enterprise Plan — Annual", 4, "revenue", "4000", True),
    ("4100", "Advertising Revenue", 4, "revenue", None, True),
    ("4101", "Platform Commission on Ad Slots (10%)", 4, "revenue", "4100", True),
    ("4102", "Net Advertising Revenue to Blog Owners", 4, "revenue", "4100", True),
    ("4200", "Fee Income", 4, "revenue", None, True),
    ("4201", "Affiliate Cashout Fees ($20)", 4, "revenue", "4200", True),
    ("4202", "Paid Article Commission (5%)", 4, "revenue", "4200", True),
    ("4203", "Paid Newsletter Commission (5%)", 4, "revenue", "4200", True),
    ("4204", "Custom Domain Fees", 4, "revenue", "4200", False),
    ("4300", "Other Income", 4, "revenue", None, False),
    ("4301", "Foreign Exchange Gains", 4, "revenue", "4300", False),
    ("4302", "Interest Income", 4, "revenue", "4300", False),
    ("4400", "Recognised Annual Subscription Revenue", 4, "revenue", None, True),
    ("4401", "Annual Subscriptions — Monthly Recognised", 4, "revenue", "4400", True),
    # Class 5 — Expenses
    ("5000", "Cloud Infrastructure", 5, "expense", None, True),
    ("5001", "Hosting — Vercel / AWS", 5, "expense", "5000", False),
    ("5002", "Neon PostgreSQL", 5, "expense", "5000", False),
    ("5003", "Cloudinary Storage & Bandwidth", 5, "expense", "5000", False),
    ("5100", "Software & API Fees", 5, "expense", None, False),
    ("5101", "OpenAI / Anthropic API", 5, "expense", "5100", False),
    ("5102", "Stripe Processing Fees (~2.9%+$0.30)", 5, "expense", "5100", True),
    ("5103", "PayPal Processing Fees", 5, "expense", "5100", True),
    ("5104", "Firebase / FCM", 5, "expense", "5100", False),
    ("5105", "Resend Email Service", 5, "expense", "5100", False),
    ("5108", "Elasticsearch / Search Service", 5, "expense", "5100", False),
    ("5200", "Personnel Costs", 5, "expense", None, False),
    ("5201", "Salaries and Wages", 5, "expense", "5200", False),
    ("5202", "CPF Employer Contribution (17%)", 5, "expense", "5200", False),
    ("5300", "Marketing & Advertising", 5, "expense", None, False),
    ("5301", "Google / Meta Ads", 5, "expense", "5300", False),
    ("5400", "General & Administrative", 5, "expense", None, False),
    ("5401", "Office Rent", 5, "expense", "5400", False),
    ("5404", "Legal Fees", 5, "expense", "5400", False),
    ("5405", "Audit / Accounting Fees", 5, "expense", "5400", False),
    ("5406", "ACRA / Government Fees", 5, "expense", "5400", False),
    ("5500", "Depreciation & Amortisation", 5, "expense", None, False),
    ("5501", "Depreciation — Equipment", 5, "expense", "5500", False),
    ("5502", "Amortisation — Software", 5, "expense", "5500", False),
    ("5600", "Finance Costs", 5, "expense", None, False),
    ("5601", "Loan Interest Expense", 5, "expense", "5600", False),
    ("5602", "Foreign Exchange Losses", 5, "expense", "5600", False),
    ("5700", "Affiliate Commission Expense", 5, "expense", None, True),
    ("5701", "Affiliate Commissions — Subscriptions", 5, "expense", "5700", True),
    ("5702", "Affiliate Commissions — Ad Slots", 5, "expense", "5700", True),
    ("5800", "Provisions", 5, "expense", None, False),
    ("5801", "Provision for Doubtful Accounts", 5, "expense", "5800", False),
    ("5900", "Correction Entries", 5, "expense", None, False),
    ("5901", "Accounting Error Corrections", 5, "expense", "5900", False),
]


def upgrade() -> None:
    # ── Enums — idempotents ───────────────────────────────────────────
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE account_type AS ENUM ('asset', 'liability', 'equity', 'revenue', 'expense');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE journal_type AS ENUM ('sales', 'purchases', 'bank', 'od');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE journal_entry_status AS ENUM ('pending', 'approved', 'reversed');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)
    op.execute("""
        DO $$ BEGIN
            CREATE TYPE journal_entry_source AS ENUM ('stripe_webhook', 'paypal_webhook', 'affiliate', 'manual');
        EXCEPTION WHEN duplicate_object THEN NULL;
        END $$;
    """)

    # ── Sequence — idempotente ────────────────────────────────────────
    op.execute("CREATE SEQUENCE IF NOT EXISTS journal_entry_number_seq START 1000 INCREMENT 1")

    # ── Chart of Accounts ─────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS chart_of_accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            code VARCHAR(10) UNIQUE NOT NULL,
            name VARCHAR(200) NOT NULL,
            account_class INTEGER NOT NULL CHECK (account_class BETWEEN 1 AND 5),
            account_type account_type NOT NULL,
            parent_code VARCHAR(10) REFERENCES chart_of_accounts(code) ON DELETE RESTRICT,
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            is_system BOOLEAN NOT NULL DEFAULT FALSE,
            description TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            created_by UUID REFERENCES users(id) ON DELETE SET NULL
        )
    """)

    # ── Journal Entries ───────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS journal_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entry_number BIGINT UNIQUE NOT NULL DEFAULT nextval('journal_entry_number_seq'),
            journal_type journal_type NOT NULL,
            reference VARCHAR(255),
            description TEXT NOT NULL,
            entry_date DATE NOT NULL,
            status journal_entry_status NOT NULL DEFAULT 'pending',
            source_type journal_entry_source,
            source_id VARCHAR(255),
            original_entry_id UUID REFERENCES journal_entries(id) ON DELETE RESTRICT,
            created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
            approved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            approved_at TIMESTAMPTZ
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_journal_entries_status ON journal_entries(status)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_journal_entries_entry_date ON journal_entries(entry_date)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_journal_entries_source ON journal_entries(source_type, source_id)")

    # ── Journal Entry Lines ───────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS journal_entry_lines (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE RESTRICT,
            line_number INTEGER NOT NULL,
            account_code VARCHAR(10) NOT NULL REFERENCES chart_of_accounts(code) ON DELETE RESTRICT,
            debit NUMERIC(15,4) NOT NULL DEFAULT 0,
            credit NUMERIC(15,4) NOT NULL DEFAULT 0,
            description TEXT,
            CONSTRAINT chk_debit_xor_credit CHECK (
                (debit > 0 AND credit = 0) OR (debit = 0 AND credit > 0)
            )
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS ix_journal_lines_entry_id ON journal_entry_lines(entry_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_journal_lines_account_code ON journal_entry_lines(account_code)")

    # ── Seed Chart of Accounts — idempotent via ON CONFLICT DO NOTHING ─
    parents = [(c, n, cl, t, p, s) for (c, n, cl, t, p, s) in COA_SEED if p is None]
    children = [(c, n, cl, t, p, s) for (c, n, cl, t, p, s) in COA_SEED if p is not None]

    for rows in [parents, children]:
        for (code, name, account_class, account_type, parent_code, is_system) in rows:
            parent_val = f"'{parent_code}'" if parent_code else "NULL"
            safe_name = name.replace("'", "''")
            op.execute(f"""
                INSERT INTO chart_of_accounts (code, name, account_class, account_type, parent_code, is_system)
                VALUES ('{code}', '{safe_name}', {account_class}, '{account_type}', {parent_val}, {str(is_system).lower()})
                ON CONFLICT (code) DO NOTHING
            """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS journal_entry_lines")
    op.execute("DROP TABLE IF EXISTS journal_entries")
    op.execute("DROP TABLE IF EXISTS chart_of_accounts")
    op.execute("DROP SEQUENCE IF EXISTS journal_entry_number_seq")
    op.execute("DROP TYPE IF EXISTS journal_entry_source")
    op.execute("DROP TYPE IF EXISTS journal_entry_status")
    op.execute("DROP TYPE IF EXISTS journal_type")
    op.execute("DROP TYPE IF EXISTS account_type")
