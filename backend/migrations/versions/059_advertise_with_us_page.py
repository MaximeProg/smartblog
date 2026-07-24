"""059 — Page marketing "Advertise with us"

Le PDG a demandé un menu public expliquant la fonctionnalité "Advertise sur
smarterbloggers.com" (voir migration 058), avec des boutons d'inscription et
de connexion — pour que les visiteurs découvrent l'offre avant de se
connecter au dashboard /advertiser. Suit exactement le pattern des autres
pages marketing pilotées par le CMS (careers, press — migration 035) :
contenu source en anglais ici, traduit à la demande via DeepL par l'endpoint
existant GET /platform/pages/{slug}?lang= (translation_service.py), éditable
sans redéploiement via le formulaire JSON générique du superadmin
(PlatformPageJsonEditor — aucun schéma dédié à écrire côté superadmin).

Revision ID: 059
Revises: 058
Create Date: 2026-07-23
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "059"
down_revision = "058"
branch_labels = None
depends_on = None


ADVERTISE_CONTENT = {
    "hero": {
        "title": "Put your brand in front of thousands of engaged readers",
        "subtitle": "Advertise directly on the SmarterBloggers homepage — reviewed and published by our team, paid securely in crypto.",
        "cta_label": "See how it works",
        "image_url": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1920&q=80",
    },
    "benefits": {
        "title": "Why advertise with SmarterBloggers",
        "items": [
            {"icon": "users", "title": "Real, engaged audience", "description": "Your ad reaches bloggers and readers actively using the platform every day."},
            {"icon": "shield-check", "title": "Human-reviewed", "description": "Every ad is checked for safety and quality by our team before it goes live — no bots, no scams."},
            {"icon": "bar-chart-3", "title": "Real-time statistics", "description": "Track impressions, clicks, and click-through rate live from your own advertiser dashboard."},
            {"icon": "shield", "title": "Secure crypto payment", "description": "Pay safely in USDT — no card details shared, no hidden fees."},
        ],
    },
    "how_it_works": {
        "title": "How it works",
        "steps": [
            {"title": "Create your account", "description": "Sign up or log in — the same account you'd use anywhere else on SmarterBloggers."},
            {"title": "Submit your ad", "description": "Add your title, image, destination link and budget from your Advertiser dashboard."},
            {"title": "Pay securely", "description": "Complete payment in USDT — your submission is reviewed once payment is confirmed."},
            {"title": "Go live", "description": "Once approved, your ad appears on the SmarterBloggers homepage and you can track its performance live."},
        ],
    },
    "cta": {
        "title": "Ready to get started?",
        "subtitle": "Create an account or log in to submit your first ad in minutes.",
        "signup_label": "Sign up",
        "login_label": "Log in",
    },
}


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "INSERT INTO platform_pages (slug, content, content_hash) "
            "VALUES (:slug, CAST(:content AS JSONB), :hash) "
            "ON CONFLICT (slug) DO NOTHING"
        ),
        {"slug": "advertise-with-us", "content": json.dumps(ADVERTISE_CONTENT), "hash": _hash(ADVERTISE_CONTENT)},
    )


def downgrade() -> None:
    op.execute("DELETE FROM platform_pages WHERE slug = 'advertise-with-us'")
