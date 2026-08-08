"""078 — Corrige les descriptions publiques affiliation + annonces

1) advertise-with-us : le texte mentionnait une revue "par notre équipe"
   comme unique mécanisme — obsolète depuis la validation automatique par
   IA (commit ea3176e, 2026-08-08). Corrigé pour refléter la réalité :
   revue automatique en quelques minutes, escalade manuelle seulement si
   flaggé.

2) home (section #affiliate) : vérifié fidèle au calcul réel
   (compute_and_accrue_commissions, affiliate.py) — 20% pool abonnement
   (10% L1 + 10%/9 par niveau 2-10), 10% pool publicité (5% L1 + 5%/9 par
   niveau 2-10). Réécrit explicitement ici pour garantir que la vraie
   ligne en base (si elle existe et diverge du fallback frontend) reste
   synchronisée — même piège que /guides (migration 073) : le fallback
   codé en dur n'a aucun effet si une ligne CMS existe déjà.

Ne touche que les clés concernées dans chaque page — préserve tout le
reste du contenu existant.

Revision ID: 078
Revises: 077
Create Date: 2026-08-08
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "078"
down_revision = "077"
branch_labels = None
depends_on = None


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


_AFFILIATE_SECTION = {
    "eyebrow": "Affiliate Program",
    "title": "Earn money by recommending SmarterBloggers",
    "subtitle": "Turn your network into recurring income — no cap on referrals, automatic crypto payouts.",
    "steps": [
        {"icon": "link2", "title": "Share your unique link", "description": "Every account gets a personal referral code and link you can share anywhere — social media, email, your own blog."},
        {"icon": "userplus", "title": "They subscribe", "description": "When someone you referred signs up for a paid plan, the commission tracking starts automatically — nothing to set up."},
        {"icon": "coins", "title": "Get paid automatically", "description": "Commissions are paid out in cryptocurrency (USDT) as soon as your wallet is configured — no waiting period, no payout fees."},
    ],
    "highlights": [
        {"value": "10%", "label": "Recurring commission on every payment your direct referrals make, for as long as they stay subscribed"},
        {"value": "10 levels", "label": "Extended referral network — earn a share from your referrals' own referrals too"},
        {"value": "Unlimited", "label": "No cap on how many people you can refer"},
    ],
    "revenue_note": "Commissions are funded directly from platform revenue — never from other members' payments or funds. There are two verified revenue sources:",
    "revenue_breakdown": [
        {"source": "Subscription payments", "pool": "20% of every payment is allocated to the affiliate program", "l1": "10% goes to your direct referral (Level 1)", "rest": "the remaining 10% is split equally across Levels 2–10 (~1.11% each)"},
        {"source": "Advertising revenue", "pool": "10% of every ad payment is allocated to the affiliate program", "l1": "5% goes to your direct referral (Level 1)", "rest": "the remaining 5% is split equally across Levels 2–10 (~0.56% each)"},
    ],
    "cta_label": "Start earning today",
}

_ADVERTISE_UPDATES = {
    ("hero", "subtitle"): "Advertise directly on the SmarterBloggers homepage — automatically reviewed and published within minutes, paid securely in crypto.",
}


def upgrade() -> None:
    conn = op.get_bind()

    # 1) home — merge the affiliate section only
    row = conn.execute(sa.text("SELECT id, content FROM platform_pages WHERE slug = 'home'")).fetchone()
    if row:
        content = row.content if isinstance(row.content, dict) else json.loads(row.content)
        content["affiliate"] = _AFFILIATE_SECTION
        conn.execute(
            sa.text("UPDATE platform_pages SET content = CAST(:content AS JSONB), content_hash = :hash WHERE id = :id"),
            {"content": json.dumps(content), "hash": _hash(content), "id": row.id},
        )

    # 2) advertise-with-us — fix the stale "reviewed by our team" copy
    row = conn.execute(sa.text("SELECT id, content FROM platform_pages WHERE slug = 'advertise-with-us'")).fetchone()
    if row:
        content = row.content if isinstance(row.content, dict) else json.loads(row.content)
        if "hero" in content:
            content["hero"]["subtitle"] = _ADVERTISE_UPDATES[("hero", "subtitle")]
        if "benefits" in content and isinstance(content["benefits"].get("items"), list):
            for item in content["benefits"]["items"]:
                if item.get("icon") == "shield-check":
                    item["title"] = "AI-reviewed & scanned"
                    item["description"] = (
                        "Every ad is automatically scanned for malware and phishing (Google Safe Browsing + "
                        "VirusTotal) and reviewed by AI for content quality — most ads go live within minutes. "
                        "Anything flagged is checked by our team before publishing — no bots, no scams."
                    )
        if "how_it_works" in content and isinstance(content["how_it_works"].get("steps"), list):
            steps = content["how_it_works"]["steps"]
            if len(steps) >= 3:
                steps[2]["description"] = (
                    "Complete payment in USDT — your ad is automatically reviewed once payment is confirmed, "
                    "and usually goes live within minutes."
                )
        conn.execute(
            sa.text("UPDATE platform_pages SET content = CAST(:content AS JSONB), content_hash = :hash WHERE id = :id"),
            {"content": json.dumps(content), "hash": _hash(content), "id": row.id},
        )


def downgrade() -> None:
    # Pas de retour en arrière significatif — l'ancien texte était factuellement obsolète.
    pass
