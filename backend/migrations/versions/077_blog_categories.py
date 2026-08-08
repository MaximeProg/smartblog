"""077 — Vraies catégories de blog (gérées par le super admin)

Jusqu'ici, tenants.category était un champ texte libre jamais présenté à
l'utilisateur à la création, et la page publique /explore filtrait sur une
liste de 15 catégories codées en dur côté frontend (BLOG_CATEGORIES),
totalement déconnectée des vraies valeurs enregistrées. Cette migration crée
une vraie table, gérée par le super admin, avec le même mécanisme que
blog_template_categories (062_...) — mais un sujet complètement différent :
ceci catégorise le SUJET du blog (Technology, Business...), pas son template
de design.

Seed : les 15 valeurs actuellement en dur, pour ne rien casser visuellement
au déploiement — le super admin peut ensuite les éditer/désactiver/ajouter.

Revision ID: 077
Revises: 076
Create Date: 2026-08-08
"""
import sqlalchemy as sa
from alembic import op

revision = "077"
down_revision = "076"
branch_labels = None
depends_on = None

_SEED = [
    "Technology", "Business", "Lifestyle", "Health", "Education",
    "Entertainment", "Sports", "Finance", "Travel", "Food",
    "Fashion", "Science", "Politics", "Culture", "Gaming",
]


def upgrade() -> None:
    op.execute("""
        CREATE TABLE blog_categories (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(100) NOT NULL,
            slug VARCHAR(100) NOT NULL UNIQUE,
            description TEXT NOT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)
    op.execute("CREATE INDEX idx_blog_categories_active ON blog_categories(is_active)")

    conn = op.get_bind()
    insert = sa.text(
        "INSERT INTO blog_categories (name, slug, sort_order) VALUES (:name, :slug, :sort_order)"
    )
    for i, name in enumerate(_SEED):
        conn.execute(insert, {"name": name, "slug": name.lower(), "sort_order": i})


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS blog_categories")
