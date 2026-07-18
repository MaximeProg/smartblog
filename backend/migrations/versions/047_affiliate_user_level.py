"""047 — Programme d'affiliation : du blog vers l'utilisateur

Le code de parrainage, le solde, l'arbre de commissions et les retraits
étaient rattachés aux TENANTS (blogs), alors qu'un même utilisateur peut
posséder plusieurs blogs. Cette migration déplace toute l'identité
d'affiliation vers les UTILISATEURS : un seul code, un seul solde, un seul
arbre par personne, quel que soit le nombre de blogs.

Les anciens codes de parrainage (un par blog) sont préservés dans
`affiliate_code_aliases` pour que les liens déjà partagés continuent de
fonctionner, en pointant vers l'identité utilisateur canonique.

Note sur downgrade() : la ré-expansion des relations de parrainage
dédoublonnées (deux blogs d'un même propriétaire fusionnés en une seule
relation utilisateur) vers leur granularité tenant d'origine est best-effort
— l'information de "quel blog précis a servi de lien" pour les paires
dédoublonnées n'est pas récupérable. C'est le compromis normal d'une
migration qui consolide des données dupliquées.

Revision ID: 047
Revises: 046
Create Date: 2026-07-18
"""
from alembic import op

revision = "047"
down_revision = "046"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── 1. Nouvelles colonnes affiliation sur users ───────────────
    op.execute("""
        ALTER TABLE users
            ADD COLUMN affiliate_code VARCHAR(8),
            ADD COLUMN affiliate_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
            ADD COLUMN affiliate_cashout_threshold NUMERIC(10, 2) NOT NULL DEFAULT 0,
            ADD COLUMN referred_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL
    """)

    op.execute("""
        CREATE TABLE affiliate_code_aliases (
            code    VARCHAR(8) PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
        )
    """)

    # ── 2. Table temporaire tenant -> propriétaire (1 admin par blog) ─
    # DISTINCT ON garantit un seul propriétaire même si un tenant avait
    # accidentellement plusieurs lignes TENANT_ADMIN.
    op.execute("""
        CREATE TEMP TABLE tmp_tenant_owner AS
        SELECT DISTINCT ON (tu.tenant_id) tu.tenant_id, tu.user_id
        FROM tenant_users tu
        WHERE tu.role = 'TENANT_ADMIN'
        ORDER BY tu.tenant_id, tu.created_at ASC
    """)

    # ── 3. Backfill users.affiliate_code (code du tenant le plus ancien
    #      par propriétaire) + table d'alias (TOUS les anciens codes) ──
    op.execute("""
        WITH owner_codes AS (
            SELECT DISTINCT ON (o.user_id) o.user_id, t.affiliate_code
            FROM tenants t
            JOIN tmp_tenant_owner o ON o.tenant_id = t.id
            WHERE t.affiliate_code IS NOT NULL
            ORDER BY o.user_id, t.created_at ASC
        )
        UPDATE users u SET affiliate_code = oc.affiliate_code
        FROM owner_codes oc WHERE oc.user_id = u.id
    """)

    op.execute("""
        INSERT INTO affiliate_code_aliases (code, user_id)
        SELECT DISTINCT t.affiliate_code, o.user_id
        FROM tenants t
        JOIN tmp_tenant_owner o ON o.tenant_id = t.id
        WHERE t.affiliate_code IS NOT NULL
        ON CONFLICT (code) DO NOTHING
    """)

    # ── 4. Backfill users.affiliate_balance = somme des blogs possédés ─
    op.execute("""
        WITH owner_balances AS (
            SELECT o.user_id, SUM(t.affiliate_balance) AS total_balance
            FROM tenants t
            JOIN tmp_tenant_owner o ON o.tenant_id = t.id
            GROUP BY o.user_id
        )
        UPDATE users u SET affiliate_balance = ob.total_balance
        FROM owner_balances ob WHERE ob.user_id = u.id
    """)

    # ── 5. Colonnes user-keyed sur les 3 tables (nullable le temps du backfill) ─
    op.execute("""
        ALTER TABLE affiliate_relationships
            ADD COLUMN ancestor_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            ADD COLUMN descendant_user_id UUID REFERENCES users(id) ON DELETE CASCADE
    """)
    op.execute("""
        ALTER TABLE affiliate_commissions
            ADD COLUMN affiliate_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            ADD COLUMN source_user_id UUID REFERENCES users(id) ON DELETE CASCADE
    """)
    op.execute("""
        ALTER TABLE affiliate_cashout_requests
            ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE
    """)

    # ── 6. Backfill commissions / cashouts (mapping direct, chaque ligne
    #      reste distincte — ce sont des événements financiers historiques) ─
    op.execute("""
        UPDATE affiliate_commissions ac
        SET affiliate_user_id = oa.user_id, source_user_id = os.user_id
        FROM tmp_tenant_owner oa, tmp_tenant_owner os
        WHERE oa.tenant_id = ac.affiliate_tenant_id
          AND os.tenant_id = ac.source_tenant_id
    """)
    op.execute("""
        UPDATE affiliate_cashout_requests acr
        SET user_id = o.user_id
        FROM tmp_tenant_owner o
        WHERE o.tenant_id = acr.tenant_id
    """)

    # Les anciennes policies RLS (scoping tenant) référencent les colonnes
    # tenant-keyed qu'on s'apprête à supprimer (étape 7) — il faut les
    # supprimer AVANT, sinon Postgres refuse le DROP COLUMN. Les nouvelles
    # policies (scoping utilisateur) sont créées plus bas, une fois les
    # nouvelles colonnes en place (étape 9).
    op.execute("DROP POLICY IF EXISTS affiliate_cashout_requests_isolation ON affiliate_cashout_requests")
    op.execute("DROP POLICY IF EXISTS affiliate_relationships_isolation ON affiliate_relationships")
    op.execute("DROP POLICY IF EXISTS affiliate_commissions_isolation ON affiliate_commissions")

    # ── 7. Backfill + dédoublonnage des relations de parrainage ───────
    # Deux blogs du même propriétaire ayant chacun leur propre code de
    # parrainage produisaient deux arbres séparés ; une fois ramenés à des
    # user_id, ils convergent souvent vers la même paire (ancêtre,
    # descendant) — on garde le niveau le plus proche (MIN(level)) et la
    # date la plus ancienne (MIN(created_at)).
    op.execute("""
        CREATE TEMP TABLE tmp_relationships_deduped AS
        SELECT
            os.user_id AS descendant_user_id,
            oa.user_id AS ancestor_user_id,
            MIN(ar.level) AS level,
            MIN(ar.created_at) AS created_at
        FROM affiliate_relationships ar
        JOIN tmp_tenant_owner os ON os.tenant_id = ar.descendant_id
        JOIN tmp_tenant_owner oa ON oa.tenant_id = ar.ancestor_id
        WHERE os.user_id != oa.user_id
        GROUP BY os.user_id, oa.user_id
    """)

    # Les anciennes colonnes tenant-keyed (NOT NULL, FK vers tenants) doivent
    # disparaître AVANT le vidage/réinsertion, sinon l'INSERT échouerait en
    # tentant d'y placer des user_id (FK invalide vers tenants).
    op.execute("ALTER TABLE affiliate_relationships DROP COLUMN descendant_id, DROP COLUMN ancestor_id")

    op.execute("DELETE FROM affiliate_relationships")
    op.execute("""
        INSERT INTO affiliate_relationships (id, descendant_user_id, ancestor_user_id, level, created_at)
        SELECT gen_random_uuid(), descendant_user_id, ancestor_user_id, level, created_at
        FROM tmp_relationships_deduped
    """)

    # ── 8. NOT NULL + contrainte unique sur les nouvelles colonnes ────
    op.execute("ALTER TABLE affiliate_relationships ALTER COLUMN ancestor_user_id SET NOT NULL")
    op.execute("ALTER TABLE affiliate_relationships ALTER COLUMN descendant_user_id SET NOT NULL")
    op.execute("ALTER TABLE affiliate_commissions ALTER COLUMN affiliate_user_id SET NOT NULL")
    op.execute("ALTER TABLE affiliate_commissions ALTER COLUMN source_user_id SET NOT NULL")
    op.execute("ALTER TABLE affiliate_cashout_requests ALTER COLUMN user_id SET NOT NULL")
    op.execute("""
        ALTER TABLE affiliate_relationships
            ADD CONSTRAINT uq_affiliate_relationship_users UNIQUE (descendant_user_id, ancestor_user_id)
    """)

    # ── 9. RLS : nouvelles policies scoping utilisateur ────────────────
    # (current_app_user_id() existe déjà — migration 001 — et est déjà
    # positionnée à chaque requête, voir database.py::get_db()). Les
    # anciennes policies ont déjà été supprimées avant l'étape 7.
    op.execute("""
        CREATE POLICY affiliate_cashout_requests_isolation ON affiliate_cashout_requests
        USING (is_super_admin() OR user_id = current_app_user_id())
    """)
    op.execute("""
        CREATE POLICY affiliate_relationships_isolation ON affiliate_relationships
        USING (is_super_admin() OR descendant_user_id = current_app_user_id() OR ancestor_user_id = current_app_user_id())
    """)
    op.execute("""
        CREATE POLICY affiliate_commissions_isolation ON affiliate_commissions
        USING (is_super_admin() OR affiliate_user_id = current_app_user_id() OR source_user_id = current_app_user_id())
    """)

    # ── 10. Suppression des colonnes tenant-keyed devenues obsolètes ──
    # (affiliate_relationships déjà nettoyée à l'étape 7)
    op.execute("ALTER TABLE affiliate_commissions DROP COLUMN affiliate_tenant_id, DROP COLUMN source_tenant_id")
    op.execute("ALTER TABLE affiliate_cashout_requests DROP COLUMN tenant_id")
    op.execute("""
        ALTER TABLE tenants
            DROP CONSTRAINT IF EXISTS uq_tenants_affiliate_code,
            DROP COLUMN IF EXISTS affiliate_code,
            DROP COLUMN IF EXISTS affiliate_balance,
            DROP COLUMN IF EXISTS affiliate_cashout_threshold,
            DROP COLUMN IF EXISTS referred_by_tenant_id
    """)

    op.execute("ALTER TABLE users ADD CONSTRAINT uq_users_affiliate_code UNIQUE (affiliate_code)")

    op.execute("DROP TABLE IF EXISTS tmp_tenant_owner")
    op.execute("DROP TABLE IF EXISTS tmp_relationships_deduped")


def downgrade() -> None:
    op.execute("""
        ALTER TABLE tenants
            ADD COLUMN affiliate_code VARCHAR(8),
            ADD COLUMN affiliate_balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
            ADD COLUMN affiliate_cashout_threshold NUMERIC(10, 2) NOT NULL DEFAULT 50,
            ADD COLUMN referred_by_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL
    """)
    op.execute("ALTER TABLE tenants ADD CONSTRAINT uq_tenants_affiliate_code UNIQUE (affiliate_code)")

    op.execute("ALTER TABLE affiliate_relationships ADD COLUMN descendant_id UUID REFERENCES tenants(id) ON DELETE CASCADE")
    op.execute("ALTER TABLE affiliate_relationships ADD COLUMN ancestor_id UUID REFERENCES tenants(id) ON DELETE CASCADE")
    op.execute("ALTER TABLE affiliate_commissions ADD COLUMN affiliate_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE")
    op.execute("ALTER TABLE affiliate_commissions ADD COLUMN source_tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE")
    op.execute("ALTER TABLE affiliate_cashout_requests ADD COLUMN tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE")

    # Best-effort : réattribue chaque ligne au premier blog (TENANT_ADMIN) du
    # propriétaire correspondant. Les relations dédoublonnées lors de
    # l'upgrade ne peuvent pas retrouver leur granularité par-blog d'origine.
    op.execute("""
        CREATE TEMP TABLE tmp_owner_tenant AS
        SELECT DISTINCT ON (tu.user_id) tu.user_id, tu.tenant_id
        FROM tenant_users tu
        WHERE tu.role = 'TENANT_ADMIN'
        ORDER BY tu.user_id, tu.created_at ASC
    """)

    op.execute("""
        UPDATE affiliate_relationships ar SET
            descendant_id = od.tenant_id,
            ancestor_id = oa.tenant_id
        FROM tmp_owner_tenant od, tmp_owner_tenant oa
        WHERE od.user_id = ar.descendant_user_id AND oa.user_id = ar.ancestor_user_id
    """)
    op.execute("""
        UPDATE affiliate_commissions ac SET
            affiliate_tenant_id = oa.tenant_id,
            source_tenant_id = os.tenant_id
        FROM tmp_owner_tenant oa, tmp_owner_tenant os
        WHERE oa.user_id = ac.affiliate_user_id AND os.user_id = ac.source_user_id
    """)
    op.execute("""
        UPDATE affiliate_cashout_requests acr SET tenant_id = o.tenant_id
        FROM tmp_owner_tenant o WHERE o.user_id = acr.user_id
    """)

    op.execute("""
        WITH owner_codes AS (
            SELECT o.tenant_id, u.affiliate_code
            FROM users u JOIN tmp_owner_tenant o ON o.user_id = u.id
            WHERE u.affiliate_code IS NOT NULL
        )
        UPDATE tenants t SET affiliate_code = oc.affiliate_code
        FROM owner_codes oc WHERE oc.tenant_id = t.id
    """)
    op.execute("""
        WITH owner_balances AS (
            SELECT o.tenant_id, u.affiliate_balance
            FROM users u JOIN tmp_owner_tenant o ON o.user_id = u.id
        )
        UPDATE tenants t SET affiliate_balance = ob.affiliate_balance
        FROM owner_balances ob WHERE ob.tenant_id = t.id
    """)

    op.execute("ALTER TABLE affiliate_relationships ALTER COLUMN descendant_id SET NOT NULL")
    op.execute("ALTER TABLE affiliate_relationships ALTER COLUMN ancestor_id SET NOT NULL")
    op.execute("ALTER TABLE affiliate_commissions ALTER COLUMN affiliate_tenant_id SET NOT NULL")
    op.execute("ALTER TABLE affiliate_commissions ALTER COLUMN source_tenant_id SET NOT NULL")
    op.execute("ALTER TABLE affiliate_cashout_requests ALTER COLUMN tenant_id SET NOT NULL")
    op.execute("""
        ALTER TABLE affiliate_relationships
            ADD CONSTRAINT uq_affiliate_relationship UNIQUE (descendant_id, ancestor_id)
    """)

    op.execute("DROP POLICY IF EXISTS affiliate_cashout_requests_isolation ON affiliate_cashout_requests")
    op.execute("DROP POLICY IF EXISTS affiliate_relationships_isolation ON affiliate_relationships")
    op.execute("DROP POLICY IF EXISTS affiliate_commissions_isolation ON affiliate_commissions")
    op.execute("""
        CREATE POLICY affiliate_cashout_requests_isolation ON affiliate_cashout_requests
        USING (is_super_admin() OR tenant_id = current_tenant_id())
    """)
    op.execute("""
        CREATE POLICY affiliate_relationships_isolation ON affiliate_relationships
        USING (is_super_admin() OR descendant_id = current_tenant_id() OR ancestor_id = current_tenant_id())
    """)
    op.execute("""
        CREATE POLICY affiliate_commissions_isolation ON affiliate_commissions
        USING (is_super_admin() OR affiliate_tenant_id = current_tenant_id() OR source_tenant_id = current_tenant_id())
    """)

    op.execute("ALTER TABLE affiliate_relationships DROP CONSTRAINT IF EXISTS uq_affiliate_relationship_users")
    op.execute("ALTER TABLE affiliate_relationships DROP COLUMN ancestor_user_id, DROP COLUMN descendant_user_id")
    op.execute("ALTER TABLE affiliate_commissions DROP COLUMN affiliate_user_id, DROP COLUMN source_user_id")
    op.execute("ALTER TABLE affiliate_cashout_requests DROP COLUMN user_id")

    op.execute("DROP TABLE IF EXISTS affiliate_code_aliases")
    op.execute("""
        ALTER TABLE users
            DROP CONSTRAINT IF EXISTS uq_users_affiliate_code,
            DROP COLUMN IF EXISTS affiliate_code,
            DROP COLUMN IF EXISTS affiliate_balance,
            DROP COLUMN IF EXISTS affiliate_cashout_threshold,
            DROP COLUMN IF EXISTS referred_by_user_id
    """)

    op.execute("DROP TABLE IF EXISTS tmp_owner_tenant")
