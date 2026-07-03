"""Pages et menus

Ajoute les tables `pages` (Site Builder) et `menus` (éditeur de menus DnD).

Revision ID: 008_pages_menus
Revises: 007_ai_webhooks
Create Date: 2026-07-01
"""
from alembic import op

revision = "008_pages_menus"
down_revision = "007_ai_webhooks"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── enums ─────────────────────────────────────────────────────
    op.execute("CREATE TYPE page_status AS ENUM ('draft', 'published', 'private')")
    op.execute("CREATE TYPE page_type AS ENUM ('standard', 'system', 'dynamic')")

    # ── pages ─────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE pages (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
            title       VARCHAR(500) NOT NULL,
            slug        VARCHAR(500) NOT NULL,
            status      page_status NOT NULL DEFAULT 'draft',
            page_type   page_type   NOT NULL DEFAULT 'standard',
            is_homepage BOOLEAN     NOT NULL DEFAULT FALSE,
            blocks      JSONB       NOT NULL DEFAULT '[]',
            meta_title        VARCHAR(500),
            meta_description  TEXT,
            og_image_url      TEXT,
            sort_order  INTEGER NOT NULL DEFAULT 0,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            published_at TIMESTAMPTZ,
            deleted_at   TIMESTAMPTZ,
            UNIQUE (tenant_id, slug)
        )
    """)
    op.execute("CREATE INDEX ix_pages_tenant_id ON pages (tenant_id)")
    op.execute(
        "CREATE INDEX ix_pages_tenant_status ON pages (tenant_id, status) "
        "WHERE deleted_at IS NULL"
    )
    op.execute(
        "CREATE INDEX ix_pages_homepage ON pages (tenant_id, is_homepage) "
        "WHERE deleted_at IS NULL AND is_homepage = TRUE"
    )

    # ── menus ─────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE menus (
            id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            name      VARCHAR(255) NOT NULL,
            location  VARCHAR(50)  NOT NULL DEFAULT 'primary',
            items     JSONB        NOT NULL DEFAULT '[]',
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (tenant_id, location)
        )
    """)
    op.execute("CREATE INDEX ix_menus_tenant_id ON menus (tenant_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS menus")
    op.execute("DROP TABLE IF EXISTS pages")
    op.execute("DROP TYPE IF EXISTS page_type")
    op.execute("DROP TYPE IF EXISTS page_status")
