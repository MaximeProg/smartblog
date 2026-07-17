"""044 platform_media table

Stocke les images/fichiers uploadés par les super admins pour le CMS des
pages publiques (home/about/...). Totalement indépendant des tenants
clients — pas de tenant_id, pas de FK vers tenants — pour ne jamais mélanger
les assets de la plateforme avec les blogs des utilisateurs.

Revision ID: 044
Revises: 043
Create Date: 2026-07-17
"""
from alembic import op

revision = "044"
down_revision = "043"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE platform_media (
            id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            uploaded_by             UUID REFERENCES users(id) ON DELETE SET NULL,
            cloudinary_public_id    VARCHAR(500) NOT NULL UNIQUE,
            cloudinary_url          TEXT NOT NULL,
            cloudinary_secure_url   TEXT NOT NULL,
            cloudinary_resource_type VARCHAR(20) NOT NULL DEFAULT 'image',
            media_type              media_type NOT NULL,
            original_filename       VARCHAR(500),
            alt_text                VARCHAR(500),
            caption                 TEXT,
            file_size_bytes         BIGINT,
            width                   INTEGER,
            height                  INTEGER,
            duration_seconds        INTEGER,
            format                  VARCHAR(20),
            created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX idx_platform_media_created_at ON platform_media (created_at DESC)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS platform_media CASCADE")
