"""023 — Push tokens : champ category_ids pour segmentation par catégorie"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision = "023"
down_revision = "022"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("push_tokens", sa.Column("category_ids", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("push_tokens", "category_ids")
