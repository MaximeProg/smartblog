"""036 — CMS pages plateforme (extension : docs, docs/api, guides)

Suite du rollout CMS (032/035). Les liens vers des articles non écrits
(Getting Started, Webhooks, Authentication, Team & Roles, Content API, tous
les guides individuels) sont volontairement vides (`href: ""`) — le frontend
les redirige vers /contact avec le sujet pré-rempli plutôt que de fabriquer
du faux contenu technique (décision actée avec l'utilisateur).

Corrige au passage un bug déjà présent dans le contenu source : l'ancienne
page docs/api affichait `https://api.nexusBlog.com` (mauvais domaine/casse)
au lieu du domaine de marque `api.smarterbloggers.com`.

Revision ID: 036
Revises: 035
Create Date: 2026-07-16
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "036"
down_revision = "035"
branch_labels = None
depends_on = None


DOCS_CONTENT = {
    "hero": {
        "title": "Documentation",
        "subtitle": "Guides, API references, and resources for building with SmarterBloggers.",
    },
    "quickstart": {
        "comment": "Check API status",
        "command": "curl https://api.smarterbloggers.com/v1/health",
        "response": '→ { "status": "ok", "version": "2.1.0" }',
    },
    "sections": [
        {"icon": "bookopen", "title": "Getting Started", "description": "Everything you need to set up your first blog and start publishing.", "href": ""},
        {"icon": "code2", "title": "API Reference", "description": "Full REST API documentation with examples and SDKs.", "href": "docs/api"},
        {"icon": "webhook", "title": "Webhooks", "description": "Integrate SmarterBloggers events into your own systems and workflows.", "href": ""},
        {"icon": "key", "title": "Authentication", "description": "Learn how to authenticate with the SmarterBloggers API using JWT.", "href": ""},
        {"icon": "users", "title": "Team & Roles", "description": "Manage access control and permissions for your team members.", "href": ""},
        {"icon": "filetext", "title": "Content API", "description": "Read published content with our public Content Delivery API.", "href": ""},
    ],
}

DOCS_API_CONTENT = {
    "hero": {
        "title": "API Reference",
        "subtitle": "Base URL: https://api.smarterbloggers.com — REST · JSON · JWT Auth",
    },
    "auth": {
        "title": "Authentication",
        "description": "All API requests must include a valid JWT token in the Authorization header. Get your token via POST /v1/auth/token after Firebase authentication.",
        "code_comment": "// Request header",
        "code": "Authorization: Bearer <your-jwt-token>",
    },
    "endpoints": {
        "title": "Available Endpoints",
        "items": [
            {"method": "GET", "path": "/v1/tenants", "description": "List all tenants for the authenticated user"},
            {"method": "POST", "path": "/v1/tenants", "description": "Create a new tenant (blog)"},
            {"method": "GET", "path": "/v1/tenants/{id}/articles", "description": "List articles for a tenant"},
            {"method": "POST", "path": "/v1/tenants/{id}/articles", "description": "Create a new article"},
            {"method": "PATCH", "path": "/v1/tenants/{id}/articles/{aid}", "description": "Update an article"},
            {"method": "DELETE", "path": "/v1/tenants/{id}/articles/{aid}", "description": "Delete an article"},
            {"method": "GET", "path": "/v1/tenants/{id}/categories", "description": "List categories for a tenant"},
            {"method": "POST", "path": "/v1/tenants/{id}/categories", "description": "Create a new category"},
            {"method": "GET", "path": "/v1/tenants/{id}/team", "description": "List team members"},
            {"method": "POST", "path": "/v1/tenants/{id}/team/invite", "description": "Invite a team member"},
        ],
    },
    "example": {
        "title": "Example Request",
        "comment": "# List articles for a tenant",
        "lines": [
            "curl \\",
            "-H \"Authorization: Bearer $TOKEN\" \\",
            "https://api.smarterbloggers.com/v1/tenants/{id}/articles",
        ],
    },
    "response_codes": {
        "title": "Response Codes",
        "items": [
            {"code": "200", "label": "Success"},
            {"code": "201", "label": "Created"},
            {"code": "400", "label": "Bad Request"},
            {"code": "401", "label": "Unauthorized"},
            {"code": "403", "label": "Forbidden"},
            {"code": "404", "label": "Not Found"},
            {"code": "429", "label": "Rate Limited"},
            {"code": "500", "label": "Server Error"},
        ],
    },
    "rate_limiting": {
        "title": "Rate Limiting",
        "description": "The API is rate limited to 1,000 req/hour for Starter, 5,000 for Pro, and unlimited for Business. X-RateLimit-Limit and X-RateLimit-Remaining headers indicate current consumption.",
    },
}

GUIDES_CONTENT = {
    "hero": {
        "title": "Guides",
        "subtitle": "Everything you need to get the most out of SmarterBloggers.",
    },
    "categories": [
        {"icon": "rocket", "title": "Getting Started", "guides": [
            {"title": "Create your first blog in 5 minutes", "time": "5 min"},
            {"title": "Setting up your custom domain", "time": "8 min"},
            {"title": "Invite your first team member", "time": "3 min"},
            {"title": "Publish your first article", "time": "10 min"},
        ]},
        {"icon": "bookopen", "title": "Writing & Publishing", "guides": [
            {"title": "Using the rich text editor", "time": "12 min"},
            {"title": "AI writing assistant guide", "time": "8 min"},
            {"title": "Optimizing articles for SEO", "time": "15 min"},
            {"title": "Managing categories and tags", "time": "6 min"},
        ]},
        {"icon": "users", "title": "Team Management", "guides": [
            {"title": "Understanding user roles", "time": "7 min"},
            {"title": "Setting up editorial workflows", "time": "10 min"},
            {"title": "Managing permissions", "time": "5 min"},
        ]},
        {"icon": "barchart2", "title": "Analytics", "guides": [
            {"title": "Reading your analytics dashboard", "time": "8 min"},
            {"title": "Understanding traffic sources", "time": "6 min"},
            {"title": "Growing your newsletter", "time": "12 min"},
        ]},
        {"icon": "palette", "title": "Design & Branding", "guides": [
            {"title": "Customizing your blog theme", "time": "10 min"},
            {"title": "Working with images and media", "time": "8 min"},
        ]},
        {"icon": "globe2", "title": "Multilingual Blogging", "guides": [
            {"title": "Creating multilingual content", "time": "12 min"},
            {"title": "Translating your blog interface", "time": "6 min"},
        ]},
    ],
}


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def upgrade() -> None:
    conn = op.get_bind()
    insert = sa.text(
        "INSERT INTO platform_pages (slug, content, content_hash) "
        "VALUES (:slug, CAST(:content AS JSONB), :hash)"
    )
    for slug, content in (("docs", DOCS_CONTENT), ("docs-api", DOCS_API_CONTENT), ("guides", GUIDES_CONTENT)):
        conn.execute(insert, {"slug": slug, "content": json.dumps(content), "hash": _hash(content)})


def downgrade() -> None:
    op.execute("DELETE FROM platform_pages WHERE slug IN ('docs','docs-api','guides')")
