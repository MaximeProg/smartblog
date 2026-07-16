"""032 — CMS pages plateforme (pilote : home, about, contact)

Contenu marketing jusqu'ici codé en dur (ternaires isFr/JSX) devient éditable
depuis le Super Admin. Deux tables platform-wide, sans RLS (même logique que
subscription_plans, migration 030) : platform_pages (contenu source EN) et
platform_page_translations (traductions DeepL mises en cache, invalidées par
comparaison de hash — pas de TTL temporel).

`pricing` n'a pas de page dédiée (c'est une section de la home) — son contenu
éditorial (disclaimer) est inclus dans le contenu de la page `home`.

Revision ID: 032
Revises: 031
Create Date: 2026-07-16
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "032"
down_revision = "031"
branch_labels = None
depends_on = None


HOME_CONTENT = {
    "stats": {
        "labels": {
            "active_blogs": "Active blogs",
            "articles_published": "Articles published",
            "monthly_readers": "Monthly readers",
            "uptime": "Uptime SLA",
        },
    },
    "editor_showcase": {
        "title": "Write with built-in AI assistance",
        "description": (
            "A powerful WYSIWYG editor with support for images, videos, code blocks, "
            "tables, and AI writing assistance to help you write faster and better."
        ),
        "items": [
            "AI content generation",
            "Automatic SEO optimization",
            "Code blocks with syntax highlighting",
            "Rich media embeds",
        ],
    },
    "analytics_showcase": {
        "title": "Advanced real-time analytics",
        "description": (
            "Track every metric that matters with real-time analytics, visitor "
            "insights, and comprehensive engagement reports."
        ),
        "items": [
            "Real-time page views",
            "Detailed traffic sources",
            "Top performing articles",
            "Newsletter conversion rates",
        ],
    },
    "pricing": {
        "disclaimer": "All plans include a 14-day free trial. No credit card required to start.",
    },
    "cta": {
        "trust_badges": ["2-min setup", "Enterprise security", "4.9/5 rating"],
    },
}

ABOUT_CONTENT = {
    "hero": {
        "title": "A next-generation blogging platform built for creators who demand excellence",
        "subtitle": "Powered by cutting-edge AI, enterprise-grade security, and modern design.",
        "image_url": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80",
    },
    "mission": {
        "title": "Great ideas deserve a great platform",
        "body_1": (
            "We believe that great ideas deserve a great platform. SmarterBloggers was "
            "built to empower writers, journalists, and content creators with the tools "
            "they need to reach their audience effectively."
        ),
        "body_2": (
            "From AI-powered writing assistance to advanced analytics and multi-language "
            "support, every feature is designed with one goal in mind: helping you create "
            "impactful content."
        ),
        "highlights": ["Founded in 2024", "10,000+ active blogs", "50+ countries", "25-person team"],
        "image_url": "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80",
    },
    "features": {
        "title": "Everything you need to create great content",
        "items": [
            {"icon": "bot", "title": "AI-Powered", "description": "From writing assistance to SEO optimization and content moderation, our AI engine helps you create better content faster."},
            {"icon": "globe2", "title": "Multilingual", "description": "Reach a global audience with support for 15+ languages including RTL languages like Arabic and Hebrew."},
            {"icon": "shield", "title": "Enterprise Security", "description": "Built with security-first architecture featuring RBAC, AI moderation, rate limiting, and comprehensive audit trails."},
            {"icon": "zap", "title": "High Performance", "description": "Optimized for speed with CDN-ready architecture, image optimization, lazy loading, and server-side rendering."},
            {"icon": "barchart2", "title": "Advanced Analytics", "description": "Track every metric that matters with real-time analytics, visitor insights, and engagement reporting."},
            {"icon": "filetext", "title": "Rich Editor", "description": "A powerful WYSIWYG editor with support for images, videos, code blocks, tables, and AI writing assistance."},
        ],
    },
    "tech_stack": {
        "title": "Built with Modern Technology",
        "items": ["React", "TypeScript", "Tailwind CSS", "Next.js", "TipTap Editor", "FastAPI", "PostgreSQL", "Redis", "Elasticsearch", "Firebase", "Cloudinary"],
    },
    "team": {
        "title": "The people behind SmarterBloggers",
        "members": [
            {"name": "Alexandra Chen", "role": "CEO & Co-Founder", "photo_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80", "bio": "Former Google engineer with 12 years of experience in scalable SaaS platforms."},
            {"name": "Marcus Thompson", "role": "CTO & Co-Founder", "photo_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80", "bio": "Full-stack architect who previously built systems serving 100M+ users at Meta."},
            {"name": "Priya Sharma", "role": "Head of Product", "photo_url": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80", "bio": "Product leader passionate about creating tools that empower content creators worldwide."},
            {"name": "James Okafor", "role": "Head of Design", "photo_url": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80", "bio": "Award-winning designer with a focus on developer experience and accessibility."},
        ],
    },
}

CONTACT_CONTENT = {
    "hero": {
        "title": "Contact Us",
        "subtitle": "Our team is available Monday–Friday, 9am–6pm CET.",
        "image_url": "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&w=1920&q=85",
    },
    "channels_intro": {"title": "Find the right channel"},
    "channels": [
        {"key": "sales", "icon": "messagesquare", "title": "Sales", "description": "Questions about plans, pricing, or custom enterprise contracts."},
        {"key": "support", "icon": "headphones", "title": "Support", "description": "Technical help or questions about your account."},
        {"key": "general", "icon": "mail", "title": "General", "description": "Press, partnerships, or anything else."},
    ],
    "response_times": {
        "title": "Average response time",
        "items": [
            {"label": "Pro Support", "value": "< 4h"},
            {"label": "Business Support", "value": "< 1h"},
            {"label": "Starter Support", "value": "< 24h"},
            {"label": "Sales", "value": "< 2h"},
        ],
    },
    "form": {
        "title": "Send a message",
        "name_label": "Name", "name_placeholder": "Your name",
        "email_label": "Email", "email_placeholder": "you@email.com",
        "subject_label": "Subject", "subject_placeholder": "How can we help?",
        "message_label": "Message", "message_placeholder": "Describe your request...",
        "submit_label": "Send Message",
        "success_title": "Message sent!",
        "success_message": "We'll get back to you as soon as possible.",
    },
}


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def upgrade() -> None:
    op.execute("""
        CREATE TABLE platform_pages (
            id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug         VARCHAR(50) UNIQUE NOT NULL,
            content      JSONB NOT NULL,
            content_hash VARCHAR(64) NOT NULL,
            updated_by   UUID REFERENCES users(id) ON DELETE SET NULL,
            updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
            created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
        )
    """)

    op.execute("""
        CREATE TABLE platform_page_translations (
            id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            page_id       UUID NOT NULL REFERENCES platform_pages(id) ON DELETE CASCADE,
            lang          VARCHAR(5) NOT NULL,
            content       JSONB NOT NULL,
            source_hash   VARCHAR(64) NOT NULL,
            translated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            UNIQUE (page_id, lang)
        )
    """)
    op.execute("CREATE INDEX ix_platform_page_translations_page_lang ON platform_page_translations(page_id, lang)")

    conn = op.get_bind()
    insert = sa.text(
        "INSERT INTO platform_pages (slug, content, content_hash) "
        "VALUES (:slug, CAST(:content AS JSONB), :hash)"
    )
    for slug, content in (("home", HOME_CONTENT), ("about", ABOUT_CONTENT), ("contact", CONTACT_CONTENT)):
        conn.execute(insert, {"slug": slug, "content": json.dumps(content), "hash": _hash(content)})


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS platform_page_translations")
    op.execute("DROP TABLE IF EXISTS platform_pages")
