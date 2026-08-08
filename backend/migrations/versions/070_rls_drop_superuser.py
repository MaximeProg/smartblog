"""070 — RLS étape 3/3 : retirer SUPERUSER/BYPASSRLS du rôle applicatif (2026-08-06)

Dernière étape, celle qui active réellement RLS. Les deux précédentes
(câblage tenant/user/super-admin vers Postgres, correction des 15 policies
incomplètes + FORCE ROW LEVEL SECURITY) sont sans effet tant que le rôle
applicatif reste superutilisateur ou BYPASSRLS — les deux attributs
outrepassent RLS indépendamment l'un de l'autre, quel que soit FORCE.

Vérifié avant ce commit : `smarterbloggers` (le rôle utilisé par
DATABASE_URL) a `rolsuper=true` ET `rolbypassrls=true`. Retirer ces deux
attributs suffit — le rôle reste PROPRIÉTAIRE de toutes les tables (aucun
changement de owner ici), donc :
- Les migrations continuent de fonctionner à l'identique (DROP/ALTER/CREATE
  sur ses propres tables ne nécessite pas SUPERUSER, seulement l'ownership).
- Aucun GRANT supplémentaire nécessaire sur les tables, séquences
  (journal_entry_number_seq, activity_logs_id_seq) ou futures migrations —
  l'ownership implique déjà tous les privilèges sur ses propres objets.
- Seul changement de comportement réel : RLS filtre enfin pour de vrai,
  sur la base des variables de session déjà correctement posées par
  get_db_session/get_db_no_rls/admin_session (étape 1).

Réversible instantanément si besoin : `ALTER ROLE ... SUPERUSER BYPASSRLS`
annule ce changement sans aucun autre effet de bord.

MAJ 2026-08-07 — échec réel constaté au déploiement : Postgres refuse de
retirer SUPERUSER au rôle bootstrap (`rolname = POSTGRES_USER` de l'image
Docker officielle) — `FeatureNotSupportedError: The bootstrap user must
have the SUPERUSER attribute`. La transaction avait proprement roll-back
(alembic_version restait à 069), mais laissée telle quelle cette migration
bloquerait indéfiniment TOUTE migration suivante, y compris sans rapport
avec RLS. Chantier RLS explicitement mis en pause par le PDG (nécessiterait
un rôle applicatif dédié, distinct du bootstrap — voir 069) ; en attendant,
la tentative reste ici (si un jour le rôle n'est plus le bootstrap user,
elle s'applique normalement) mais un échec ne bloque plus la chaîne.

Revision ID: 070
Revises: 069
Create Date: 2026-08-06
"""
from alembic import op

revision = "070"
down_revision = "069"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            ALTER ROLE smarterbloggers NOSUPERUSER NOBYPASSRLS;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Migration 070 skipped: % (RLS step 3 stays pending — see docstring)', SQLERRM;
        END $$;
    """)


def downgrade() -> None:
    op.execute("ALTER ROLE smarterbloggers SUPERUSER BYPASSRLS")
