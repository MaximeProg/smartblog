"""022 — Slug redirects (SEO 301) + Bookmarks (persistance DB)"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "022"
down_revision = "021"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── slug_redirects ────────────────────────────────────────────
    op.create_table(
        "slug_redirects",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("article_id", UUID(as_uuid=True), sa.ForeignKey("articles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("old_slug", sa.String(500), nullable=False),
        sa.Column("new_slug", sa.String(500), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_slug_redirects_tenant_old", "slug_redirects", ["tenant_id", "old_slug"])

    # ── bookmarks ─────────────────────────────────────────────────
    op.create_table(
        "bookmarks",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("tenant_id", UUID(as_uuid=True), sa.ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("article_id", UUID(as_uuid=True), sa.ForeignKey("articles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("ix_bookmarks_user_article", "bookmarks", ["user_id", "article_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_bookmarks_user_article", table_name="bookmarks")
    op.drop_table("bookmarks")
    op.drop_index("ix_slug_redirects_tenant_old", table_name="slug_redirects")
    op.drop_table("slug_redirects")
