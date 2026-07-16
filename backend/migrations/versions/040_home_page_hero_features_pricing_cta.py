"""040 — Étend le contenu CMS de la page d'accueil (hero, features, pricing,
cta) pour qu'il soit traduisible via DeepL comme le reste du site.

Ces champs vivaient jusqu'ici dans le namespace next-intl `landing`
(messages/en.json et fr.json), verrouillé sur seulement 2 langues — ce qui
empêchait la page d'accueil de suivre les 6 langues du CMS (contrairement
aux 15 autres pages marketing). Contenu source repris tel quel depuis
`messages/en.json` pour ne rien changer visuellement en anglais.

Revision ID: 040
Revises: 039
Create Date: 2026-07-16
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "040"
down_revision = "039"
branch_labels = None
depends_on = None


NEW_FIELDS = {
    "hero": {
        "title": "The professional blog platform for teams",
        "subtitle": "Launch and manage multiple blogs, collaborate with your team, and grow your audience — all from one powerful platform.",
        "cta": "Get started free",
        "ctaSecondary": "View demo",
    },
    "features": {
        "title": "Everything you need to run a professional blog",
        "subtitle": "From writing to publishing, from analytics to monetization.",
        "items": [
            {"title": "AI writing assistant", "desc": "Generate, improve, summarize, and translate content with integrated AI capabilities."},
            {"title": "Multi-blog management", "desc": "Manage multiple independent blogs from a single dashboard. Each with its own team, domain, and settings."},
            {"title": "Team collaboration", "desc": "Invite editors, authors, and viewers. Control who can write, review, and publish."},
            {"title": "Built-in analytics", "desc": "Track page views, top articles, and subscriber growth with detailed real-time reports."},
            {"title": "Newsletter built-in", "desc": "Grow and manage your subscriber list without any third-party tools."},
            {"title": "SEO-first editor", "desc": "AI-powered SEO suggestions, automatic sitemaps, and structured data built right in."},
        ],
    },
    "pricing_headers": {
        "title": "Simple, transparent pricing",
        "subtitle": "Start for free. Upgrade as you grow.",
        "ctaFree": "Start for free",
        "cta": "Get started",
    },
    "cta_section": {
        "title": "Ready to launch your blog?",
        "subtitle": "Join thousands of content creators who trust SmarterBloggers.",
        "button": "Start for free — no credit card needed",
    },
}


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def upgrade() -> None:
    conn = op.get_bind()
    row = conn.execute(
        sa.text("SELECT content FROM platform_pages WHERE slug = 'home'")
    ).fetchone()
    if row is None:
        return

    merged = {**row.content, **NEW_FIELDS}
    conn.execute(
        sa.text(
            "UPDATE platform_pages SET content = CAST(:content AS JSONB), "
            "content_hash = :hash WHERE slug = 'home'"
        ),
        {"content": json.dumps(merged), "hash": _hash(merged)},
    )


def downgrade() -> None:
    conn = op.get_bind()
    row = conn.execute(
        sa.text("SELECT content FROM platform_pages WHERE slug = 'home'")
    ).fetchone()
    if row is None:
        return

    remaining = {k: v for k, v in row.content.items() if k not in NEW_FIELDS}
    conn.execute(
        sa.text(
            "UPDATE platform_pages SET content = CAST(:content AS JSONB), "
            "content_hash = :hash WHERE slug = 'home'"
        ),
        {"content": json.dumps(remaining), "hash": _hash(remaining)},
    )
