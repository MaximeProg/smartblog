"""043 — Section "Programme d'affiliation" sur les pages Accueil et À propos

Décrit publiquement le vrai mécanisme du programme d'affiliation (déjà en
place et fonctionnel, voir app/api/v1/affiliate.py) : 10% de commission
récurrente sur chaque paiement des filleuls directs, réseau étendu sur 10
niveaux, versement automatique en cryptomonnaie (USDT), aucune limite de
parrainages. Contenu source repris fidèlement des mécanismes réels du code
— aucun chiffre inventé.

Revision ID: 043
Revises: 042
Create Date: 2026-07-17
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "043"
down_revision = "042"
branch_labels = None
depends_on = None


AFFILIATE_SECTION = {
    "eyebrow": "Affiliate Program",
    "title": "Earn money by recommending SmarterBloggers",
    "subtitle": "Turn your network into recurring income — no cap on referrals, automatic crypto payouts.",
    "steps": [
        {
            "icon": "link2",
            "title": "Share your unique link",
            "description": "Every account gets a personal referral code and link you can share anywhere — social media, email, your own blog.",
        },
        {
            "icon": "userplus",
            "title": "They subscribe",
            "description": "When someone you referred signs up for a paid plan, the commission tracking starts automatically — nothing to set up.",
        },
        {
            "icon": "coins",
            "title": "Get paid automatically",
            "description": "Commissions are paid out in cryptocurrency (USDT) as soon as your wallet is configured — no waiting period, no payout fees.",
        },
    ],
    "highlights": [
        {"value": "10%", "label": "Recurring commission on every payment your direct referrals make, for as long as they stay subscribed"},
        {"value": "10 levels", "label": "Extended referral network — earn a share from your referrals' own referrals too"},
        {"value": "Unlimited", "label": "No cap on how many people you can refer"},
    ],
    "cta_label": "Start earning today",
}


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def upgrade() -> None:
    conn = op.get_bind()
    for slug in ("home", "about"):
        row = conn.execute(
            sa.text("SELECT content FROM platform_pages WHERE slug = :slug"), {"slug": slug}
        ).fetchone()
        if row is None:
            continue
        merged = {**row.content, "affiliate": AFFILIATE_SECTION}
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
        if row is None:
            continue
        remaining = {k: v for k, v in row.content.items() if k != "affiliate"}
        conn.execute(
            sa.text(
                "UPDATE platform_pages SET content = CAST(:content AS JSONB), "
                "content_hash = :hash WHERE slug = :slug"
            ),
            {"content": json.dumps(remaining), "hash": _hash(remaining), "slug": slug},
        )
