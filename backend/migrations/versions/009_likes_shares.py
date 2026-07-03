"""009_likes_shares

Revision ID: 009
Revises: 008
Create Date: 2026-07-02
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = '009_likes_shares'
down_revision = '008_pages_menus'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'article_likes',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('article_id', UUID(as_uuid=True), sa.ForeignKey('articles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tenant_id', UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('fingerprint', sa.String(64), nullable=False),
        sa.Column('ip_hash', sa.String(64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
        sa.UniqueConstraint('article_id', 'fingerprint', name='uq_article_likes_article_fingerprint'),
    )
    op.create_index('ix_article_likes_article_id', 'article_likes', ['article_id'])
    op.create_index('ix_article_likes_tenant_id', 'article_likes', ['tenant_id'])

    op.create_table(
        'article_shares',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('article_id', UUID(as_uuid=True), sa.ForeignKey('articles.id', ondelete='CASCADE'), nullable=False),
        sa.Column('tenant_id', UUID(as_uuid=True), sa.ForeignKey('tenants.id', ondelete='CASCADE'), nullable=False),
        sa.Column('platform', sa.String(32), nullable=False),
        sa.Column('fingerprint', sa.String(64), nullable=True),
        sa.Column('ip_hash', sa.String(64), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('NOW()')),
    )
    op.create_index('ix_article_shares_article_id', 'article_shares', ['article_id'])
    op.create_index('ix_article_shares_tenant_id', 'article_shares', ['tenant_id'])
    op.create_index('ix_article_shares_platform', 'article_shares', ['article_id', 'platform'])

    # Colonne fingerprint sur comments (pour déduplication sans compte)
    op.add_column('comments', sa.Column('fingerprint', sa.String(64), nullable=True))


def downgrade():
    op.drop_column('comments', 'fingerprint')
    op.drop_index('ix_article_shares_platform', table_name='article_shares')
    op.drop_index('ix_article_shares_tenant_id', table_name='article_shares')
    op.drop_index('ix_article_shares_article_id', table_name='article_shares')
    op.drop_table('article_shares')
    op.drop_index('ix_article_likes_tenant_id', table_name='article_likes')
    op.drop_index('ix_article_likes_article_id', table_name='article_likes')
    op.drop_table('article_likes')
