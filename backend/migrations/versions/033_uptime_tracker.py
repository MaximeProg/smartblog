"""033 — Tracker de disponibilité interne (health_check_log)

Table séparée du CMS (032) — sujet fonctionnellement indépendant, rollback
ciblé possible. Alimentée par le job ARQ health_check_ping (toutes les 5 min),
sert à calculer un vrai % de disponibilité sur 30 jours pour /platform/stats.
Ne sera statistiquement significative qu'après plusieurs semaines de collecte
— l'API expose explicitement `uptime_pct: null` tant que l'échantillon est vide.

Revision ID: 033
Revises: 032
Create Date: 2026-07-16
"""
from alembic import op

revision = "033"
down_revision = "032"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE health_check_log (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            checked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
            success     BOOLEAN NOT NULL,
            latency_ms  INTEGER,
            db_ok       BOOLEAN NOT NULL,
            redis_ok    BOOLEAN NOT NULL
        )
    """)
    op.execute("CREATE INDEX ix_health_check_log_checked_at ON health_check_log(checked_at)")


def downgrade() -> None:
    op.execute("DROP INDEX IF EXISTS ix_health_check_log_checked_at")
    op.execute("DROP TABLE IF EXISTS health_check_log")
