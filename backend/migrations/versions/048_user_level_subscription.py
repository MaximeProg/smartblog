"""048 — Abonnement SaaS : du blog vers l'utilisateur

Le plan payant (Starter/Pro/Business) et son statut d'abonnement étaient
rattachés au TENANT (blog) alors qu'un même utilisateur peut posséder
plusieurs blogs — c'est la personne qui souscrit, pas le blog. `user.plan`
existait déjà comme intention (mis à jour au paiement) mais `tenant.plan`,
qui contrôle réellement tous les quotas (articles, IA, équipe, newsletter),
n'était jamais resynchronisé après la création du blog. Un cas réel de
dérive était déjà présent en production (blog "magsport" resté sur le plan
free alors que son propriétaire avait payé le plan pro).

`tenant_subscriptions` est vide en production (0 ligne) : aucune donnée de
paiement à migrer, seulement un renommage de schéma vers `user_subscriptions`
(clé sur `user_id` au lieu de `tenant_id`) et un backfill correctif de
`tenant.plan` pour aligner chaque blog sur le plan de son propriétaire.

Revision ID: 048
Revises: 047
Create Date: 2026-07-18
"""
from alembic import op

revision = "048"
down_revision = "047"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. RLS : la policy sur l'ancienne colonne tenant_id doit tomber
    #    avant qu'on puisse la renommer/re-typer ────────────────────────
    op.execute("DROP POLICY IF EXISTS tenant_isolation_tenant_subscriptions ON tenant_subscriptions")

    # ── 2. Renommage table + colonne + contraintes ──────────────────────
    op.execute("ALTER TABLE tenant_subscriptions RENAME TO user_subscriptions")
    op.execute("""
        ALTER TABLE user_subscriptions
            DROP CONSTRAINT IF EXISTS tenant_subscriptions_tenant_id_fkey,
            DROP CONSTRAINT IF EXISTS tenant_subscriptions_tenant_id_key
    """)
    op.execute("ALTER TABLE user_subscriptions RENAME COLUMN tenant_id TO user_id")
    op.execute("""
        ALTER TABLE user_subscriptions
            ADD CONSTRAINT user_subscriptions_user_id_fkey
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id)
    """)

    # ── 3. RLS sur la nouvelle colonne user_id ──────────────────────────
    op.execute("""
        CREATE POLICY user_subscriptions_isolation ON user_subscriptions
        USING (is_super_admin() OR user_id = current_app_user_id())
        WITH CHECK (is_super_admin() OR user_id = current_app_user_id())
    """)

    # ── 4. users.plan — jamais capturée par une migration (ajoutée
    #    manuellement en direct sur la prod à un moment non tracé, comme la
    #    valeur d'enum 'free' de plan_tier — trouvé le 2026-07-31 en rejouant
    #    tout l'historique sur une base neuve). IF NOT EXISTS la rend
    #    inoffensive pour l'ancienne base qui l'a déjà. ────────────────────
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS plan plan_tier NOT NULL DEFAULT 'free'")

    # ── 5. Backfill correctif : aligne tenant.plan sur le plan réel de
    #    son propriétaire (corrige la dérive déjà constatée en prod) ────
    op.execute("""
        UPDATE tenants t
        SET plan = u.plan
        FROM tenant_users tu
        JOIN users u ON u.id = tu.user_id
        WHERE tu.tenant_id = t.id
          AND tu.role = 'TENANT_ADMIN'
          AND t.plan != u.plan
    """)


def downgrade() -> None:
    op.execute("DROP POLICY IF EXISTS user_subscriptions_isolation ON user_subscriptions")

    op.execute("""
        ALTER TABLE user_subscriptions
            DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_fkey,
            DROP CONSTRAINT IF EXISTS user_subscriptions_user_id_key
    """)
    op.execute("ALTER TABLE user_subscriptions RENAME COLUMN user_id TO tenant_id")
    op.execute("""
        ALTER TABLE user_subscriptions
            ADD CONSTRAINT tenant_subscriptions_tenant_id_fkey
                FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            ADD CONSTRAINT tenant_subscriptions_tenant_id_key UNIQUE (tenant_id)
    """)
    op.execute("ALTER TABLE user_subscriptions RENAME TO tenant_subscriptions")

    op.execute("""
        CREATE POLICY tenant_isolation_tenant_subscriptions ON tenant_subscriptions
            USING (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
            WITH CHECK (tenant_id::TEXT = current_setting('app.current_tenant_id', TRUE))
    """)
    # Note : le backfill de tenant.plan (étape 4 d'upgrade) n'est pas réversible
    # au sens strict — il corrige une dérive, il n'y a pas d'ancien état à restaurer.
