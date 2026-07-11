"""Create subscription_plans table with default plan configs

Revision ID: 019
Revises: 018
Create Date: 2026-07-11
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "019"
down_revision = "018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS subscription_plans (
            id                  VARCHAR(50) PRIMARY KEY,
            name                VARCHAR(100) NOT NULL,
            description         TEXT,
            price_monthly       DECIMAL(10,2) NOT NULL DEFAULT 0,
            price_yearly        DECIMAL(10,2) NOT NULL DEFAULT 0,
            max_articles        INTEGER NOT NULL DEFAULT 10,
            max_storage_mb      INTEGER NOT NULL DEFAULT 512,
            max_members         INTEGER NOT NULL DEFAULT 1,
            max_ai_requests     INTEGER NOT NULL DEFAULT 10,
            max_custom_domains  INTEGER NOT NULL DEFAULT 0,
            features            JSONB NOT NULL DEFAULT '[]'::jsonb,
            is_active           BOOLEAN NOT NULL DEFAULT true,
            is_default          BOOLEAN NOT NULL DEFAULT false,
            sort_order          INTEGER NOT NULL DEFAULT 0,
            created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
            updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
        )
    """)

    op.execute("""
        INSERT INTO subscription_plans
            (id, name, description, price_monthly, price_yearly, max_articles, max_storage_mb,
             max_members, max_ai_requests, max_custom_domains, features, is_active, is_default, sort_order)
        VALUES
            ('free',       'Free',       'Perfect to get started',         0,   0,    10,    512,   1,  10,   0,
             '["10 articles", "500 MB storage", "1 author", "Subdomain only", "Basic analytics"]'::jsonb,
             true, true, 0),
            ('starter',    'Starter',    'For growing blogs',              5,   50,   100,   2048,  3,  100,  1,
             '["100 articles", "2 GB storage", "3 authors", "1 custom domain", "Standard analytics", "Newsletter"]'::jsonb,
             true, false, 1),
            ('pro',        'Pro',        'For professional publishers',    30,  300,  -1,    10240, 10, 500,  5,
             '["Unlimited articles", "10 GB storage", "10 authors", "5 custom domains", "AI writing assistant", "Advanced analytics", "Ads monetization"]'::jsonb,
             true, false, 2),
            ('business',   'Business',   'For media companies',            90,  900,  -1,    51200, -1, 2000, -1,
             '["Everything in Pro", "50 GB storage", "Unlimited authors", "Unlimited domains", "Priority support", "Affiliate program", "Full accounting"]'::jsonb,
             true, false, 3),
            ('enterprise', 'Enterprise', 'Custom solutions at any scale',  500, 5000, -1,    -1,    -1, -1,   -1,
             '["Everything in Business", "Unlimited storage", "Custom contract", "Dedicated support", "SLA guarantee", "Custom integrations"]'::jsonb,
             true, false, 4)
        ON CONFLICT (id) DO NOTHING
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS subscription_plans")
