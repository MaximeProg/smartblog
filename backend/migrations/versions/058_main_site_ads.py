"""058 — Publicité sur le site principal SmarterBloggers

Le PDG a demandé (2026-07-23) d'ajouter la fonctionnalité "Advertise" sur
smarterbloggers.com lui-même, en plus des blogs des membres. Plutôt que de
rendre `ads.tenant_id` nullable (toucherait toute la chaîne de paiement
crypto, construite autour d'un tenant_id obligatoire), on crée un tenant
"sentinelle" représentant le site principal — voir PLATFORM_TENANT_ID dans
config.py. Chaque pub sur le site principal porte ce tenant_id comme
n'importe quelle autre pub, ce qui réutilise tel quel le paiement, la
modération (superadmin.py::list_all_ads liste déjà tous les tenants) et la
sécurité (aucun TenantUser créé pour ce tenant → réservé aux super admins).

Structure de commission propre à ces pubs (voir affiliate.py::
compute_and_accrue_fixed_level_commissions) : 10% niveau 1 + 1% niveaux
2-10 (19% vers la lignée de parrainage de l'annonceur) + 81% plateforme —
différente du split 60/10/30 des pubs de blog (compte 4103 vs 4101/4102).

Revision ID: 058
Revises: 057
Create Date: 2026-07-23
"""
import sqlalchemy as sa
from alembic import op

revision = "058"
down_revision = "057"
branch_labels = None
depends_on = None

PLATFORM_TENANT_ID = "00000000-0000-0000-0000-000000000001"


def upgrade() -> None:
    op.execute("ALTER TABLE ads ADD COLUMN is_platform_ad BOOLEAN NOT NULL DEFAULT false")
    op.execute("ALTER TYPE affiliate_commission_source ADD VALUE IF NOT EXISTS 'main_site_ad'")

    op.execute(
        """
        CREATE TABLE ad_daily_stats (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            ad_id UUID NOT NULL REFERENCES ads(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            impressions INTEGER NOT NULL DEFAULT 0,
            clicks INTEGER NOT NULL DEFAULT 0,
            CONSTRAINT uq_ad_daily_stats_ad_date UNIQUE (ad_id, date)
        )
        """
    )
    op.execute("CREATE INDEX idx_ad_daily_stats_ad ON ad_daily_stats(ad_id)")

    op.execute(
        """
        INSERT INTO chart_of_accounts (code, name, account_class, account_type, parent_code, is_system)
        VALUES ('4103', 'Main Site Ad Revenue (Platform-Owned)', 4, 'revenue', '4100', true)
        ON CONFLICT (code) DO NOTHING
        """
    )

    op.execute(
        sa.text(
            """
            INSERT INTO tenants (id, name, slug, description)
            VALUES (CAST(:id AS UUID), 'SmarterBloggers', 'smarterbloggers-platform', 'Tenant sentinelle représentant le site principal smarterbloggers.com — jamais affiché publiquement, réservé à la modération super admin des pubs achetées directement sur la plateforme.')
            ON CONFLICT (id) DO NOTHING
            """
        ).bindparams(id=PLATFORM_TENANT_ID)
    )


def downgrade() -> None:
    op.execute(sa.text("DELETE FROM tenants WHERE id = CAST(:id AS UUID)").bindparams(id=PLATFORM_TENANT_ID))
    op.execute("DELETE FROM chart_of_accounts WHERE code = '4103'")
    op.execute("DROP TABLE IF EXISTS ad_daily_stats")
    op.execute("ALTER TABLE ads DROP COLUMN IF EXISTS is_platform_ad")
