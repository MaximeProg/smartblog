"""076 — Réécrit l'index /guides pour refléter la vraie structure de la plateforme

Les anciennes catégories (Getting Started, Writing & Publishing, Team
Management, Analytics, Design & Branding, Multilingual Blogging) étaient
génériques et leurs liens ne menaient nulle part (tous vers /contact).
Remplacées par une structure calquée sur la navigation réelle observée
(Dashboard + les 5 groupes du menu Studio), avec un lien réel vers chacun
des 34 guides écrits en 072-075.

Revision ID: 076
Revises: 075
Create Date: 2026-08-08
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "076"
down_revision = "075"
branch_labels = None
depends_on = None


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


GUIDES_CONTENT = {
    "hero": {
        "title": "Guides",
        "subtitle": "Everything you need to get the most out of SmarterBloggers.",
    },
    "categories": [
        {"icon": "keyround", "title": "Account & Sign-in", "guides": [
            {"title": "Creating your account & signing in", "time": "4 min", "href": "guides/authentication"},
            {"title": "Verifying your identity (KYC)", "time": "3 min", "href": "guides/kyc"},
            {"title": "Your profile", "time": "2 min", "href": "guides/profile"},
        ]},
        {"icon": "rocket", "title": "Dashboard", "guides": [
            {"title": "Creating and managing your blogs", "time": "3 min", "href": "guides/my-blogs"},
            {"title": "The affiliate program", "time": "5 min", "href": "guides/affiliate"},
            {"title": "Plans and billing", "time": "3 min", "href": "guides/subscription"},
            {"title": "Your payment history", "time": "2 min", "href": "guides/payments"},
            {"title": "Invoices", "time": "1 min", "href": "guides/invoices"},
            {"title": "Advertising on SmarterBloggers.com", "time": "3 min", "href": "guides/advertiser"},
            {"title": "Notifications", "time": "2 min", "href": "guides/notifications"},
        ]},
        {"icon": "palette", "title": "Studio — Site & Design", "guides": [
            {"title": "Finding your way around the Studio", "time": "3 min", "href": "guides/studio-overview"},
            {"title": "Blog identity & general settings", "time": "2 min", "href": "guides/studio-general"},
            {"title": "Customizing your home page", "time": "4 min", "href": "guides/studio-home"},
            {"title": "Header", "time": "2 min", "href": "guides/studio-header"},
            {"title": "Footer", "time": "2 min", "href": "guides/studio-footer"},
            {"title": "About page", "time": "2 min", "href": "guides/studio-about"},
            {"title": "Contact page", "time": "2 min", "href": "guides/studio-contact"},
            {"title": "Social networks & social media", "time": "2 min", "href": "guides/studio-social"},
            {"title": "Languages", "time": "3 min", "href": "guides/studio-languages"},
            {"title": "AI Blog Builder", "time": "3 min", "href": "guides/studio-ai-builder"},
        ]},
        {"icon": "bookopen", "title": "Studio — Content", "guides": [
            {"title": "Managing your articles", "time": "4 min", "href": "guides/studio-articles"},
            {"title": "Article page layout", "time": "2 min", "href": "guides/studio-article"},
            {"title": "Categories", "time": "2 min", "href": "guides/studio-categories"},
            {"title": "Tags", "time": "1 min", "href": "guides/studio-tags"},
            {"title": "Media library", "time": "2 min", "href": "guides/studio-media"},
            {"title": "Moderating comments", "time": "3 min", "href": "guides/studio-comments"},
            {"title": "Newsletter", "time": "2 min", "href": "guides/studio-newsletter"},
        ]},
        {"icon": "barchart2", "title": "Studio — Growth", "guides": [
            {"title": "Reading your blog's analytics", "time": "3 min", "href": "guides/studio-analytics"},
            {"title": "SEO settings", "time": "4 min", "href": "guides/studio-seo"},
            {"title": "Advertising on your blog", "time": "4 min", "href": "guides/studio-ads"},
            {"title": "Financial overview", "time": "2 min", "href": "guides/studio-accounting"},
        ]},
        {"icon": "users", "title": "Studio — Team & Settings", "guides": [
            {"title": "Inviting your team", "time": "3 min", "href": "guides/studio-collaborators"},
            {"title": "Connecting a custom domain", "time": "5 min", "href": "guides/studio-domains"},
            {"title": "API keys", "time": "2 min", "href": "guides/studio-api-keys"},
            {"title": "Getting help", "time": "2 min", "href": "guides/studio-support"},
        ]},
    ],
}


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "UPDATE platform_pages SET content = CAST(:content AS JSONB), content_hash = :hash "
            "WHERE slug = 'guides'"
        ),
        {"content": json.dumps(GUIDES_CONTENT), "hash": _hash(GUIDES_CONTENT)},
    )


def downgrade() -> None:
    # Pas de retour en arrière significatif — le contenu précédent (catégories
    # génériques sans liens réels) n'a aucune valeur à restaurer.
    pass
