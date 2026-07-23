"""057 — Disclosure de la source des revenus dans la section affiliation

Le PDG a demandé d'expliquer publiquement d'où vient l'argent des commissions
d'affiliation (voir discussion publique remettant en cause la légitimité du
programme — "pyramid scheme"). La section "affiliate" (migration 043) donnait
déjà le taux du niveau 1 (10%) et l'existence de 10 niveaux, mais jamais la
source des revenus ni le détail des niveaux 2-10.

Chiffres repris fidèlement de app/api/v1/affiliate.py::compute_and_accrue_commissions
— aucun chiffre inventé :
  - Abonnements : pool de 20% du paiement, L1 = 50% du pool (10% du paiement),
    L2-L10 se partagent l'autre 50% à parts égales (~1.11% du paiement chacun).
  - Publicité : pool de 10% du paiement, L1 = 50% du pool (5% du paiement),
    L2-L10 se partagent l'autre 50% à parts égales (~0.56% du paiement chacun).

Revision ID: 057
Revises: 056
Create Date: 2026-07-23
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "057"
down_revision = "056"
branch_labels = None
depends_on = None


REVENUE_NOTE = (
    "Commissions are funded directly from platform revenue — never from "
    "other members' payments or funds. There are two verified revenue sources:"
)

REVENUE_BREAKDOWN = [
    {
        "source": "Subscription payments",
        "pool": "20% of every payment is allocated to the affiliate program",
        "l1": "10% goes to your direct referral (Level 1)",
        "rest": "the remaining 10% is split equally across Levels 2–10 (~1.11% each)",
    },
    {
        "source": "Advertising revenue",
        "pool": "10% of every ad payment is allocated to the affiliate program",
        "l1": "5% goes to your direct referral (Level 1)",
        "rest": "the remaining 5% is split equally across Levels 2–10 (~0.56% each)",
    },
]


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def upgrade() -> None:
    conn = op.get_bind()
    for slug in ("home", "about"):
        row = conn.execute(
            sa.text("SELECT content FROM platform_pages WHERE slug = :slug"), {"slug": slug}
        ).fetchone()
        if row is None or "affiliate" not in row.content:
            continue
        merged = {
            **row.content,
            "affiliate": {
                **row.content["affiliate"],
                "revenue_note": REVENUE_NOTE,
                "revenue_breakdown": REVENUE_BREAKDOWN,
            },
        }
        conn.execute(
            sa.text(
                "UPDATE platform_pages SET content = CAST(:content AS JSONB), "
                "content_hash = :hash WHERE slug = :slug"
            ),
            {"content": json.dumps(merged), "hash": _hash(merged), "slug": slug},
        )


def downgrade() -> None:
    conn = op.get_bind()
    for slug in ("home", "about"):
        row = conn.execute(
            sa.text("SELECT content FROM platform_pages WHERE slug = :slug"), {"slug": slug}
        ).fetchone()
        if row is None or "affiliate" not in row.content:
            continue
        affiliate = {k: v for k, v in row.content["affiliate"].items() if k not in ("revenue_note", "revenue_breakdown")}
        merged = {**row.content, "affiliate": affiliate}
        conn.execute(
            sa.text(
                "UPDATE platform_pages SET content = CAST(:content AS JSONB), "
                "content_hash = :hash WHERE slug = :slug"
            ),
            {"content": json.dumps(merged), "hash": _hash(merged), "slug": slug},
        )
