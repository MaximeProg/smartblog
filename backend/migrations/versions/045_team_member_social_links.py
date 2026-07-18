"""045 — Liens réseaux sociaux pour les membres de l'équipe (page About)

Ajoute facebook_url/instagram_url/linkedin_url/website_url (vides) à chaque
membre existant de about.team.members, pour que ces champs apparaissent
dans l'éditeur CMS et soient repris comme gabarit lors de l'ajout d'un
nouveau membre.

Revision ID: 045
Revises: 044
Create Date: 2026-07-18
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "045"
down_revision = "044"
branch_labels = None
depends_on = None

_NEW_KEYS = ("facebook_url", "instagram_url", "linkedin_url", "website_url")


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def upgrade() -> None:
    conn = op.get_bind()
    row = conn.execute(
        sa.text("SELECT content FROM platform_pages WHERE slug = 'about'")
    ).fetchone()
    if row is None:
        return

    content = row.content
    members = content.get("team", {}).get("members", [])
    for member in members:
        for key in _NEW_KEYS:
            member.setdefault(key, "")

    conn.execute(
        sa.text(
            "UPDATE platform_pages SET content = CAST(:content AS JSONB), "
            "content_hash = :hash WHERE slug = 'about'"
        ),
        {"content": json.dumps(content), "hash": _hash(content)},
    )


def downgrade() -> None:
    conn = op.get_bind()
    row = conn.execute(
        sa.text("SELECT content FROM platform_pages WHERE slug = 'about'")
    ).fetchone()
    if row is None:
        return

    content = row.content
    members = content.get("team", {}).get("members", [])
    for member in members:
        for key in _NEW_KEYS:
            member.pop(key, None)

    conn.execute(
        sa.text(
            "UPDATE platform_pages SET content = CAST(:content AS JSONB), "
            "content_hash = :hash WHERE slug = 'about'"
        ),
        {"content": json.dumps(content), "hash": _hash(content)},
    )
