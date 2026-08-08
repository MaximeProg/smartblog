"""073 — Ajoute la catégorie "Account & Sign-in" en tête de la page /guides

La ligne réelle platform_pages(slug='guides') existait déjà en base (créée
avant ce chantier de documentation) et prenait le pas sur le FALLBACK codé
en dur dans guides/page.tsx — modifier seulement le FALLBACK était donc
sans effet en production. Cette migration met à jour le contenu réel.

Revision ID: 073
Revises: 072
Create Date: 2026-08-08
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "073"
down_revision = "072"
branch_labels = None
depends_on = None

_NEW_CATEGORY = {
    "icon": "keyround",
    "title": "Account & Sign-in",
    "guides": [
        {"title": "Creating your account & signing in", "time": "4 min", "href": "guides/authentication"},
    ],
}


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def upgrade() -> None:
    conn = op.get_bind()
    row = conn.execute(
        sa.text("SELECT id, content FROM platform_pages WHERE slug = 'guides'")
    ).fetchone()
    if not row:
        return  # rien à faire — le frontend retombera sur son FALLBACK

    content = row.content if isinstance(row.content, dict) else json.loads(row.content)
    categories = content.get("categories", [])
    if not any(c.get("title") == "Account & Sign-in" for c in categories):
        content["categories"] = [_NEW_CATEGORY] + categories

    conn.execute(
        sa.text(
            "UPDATE platform_pages SET content = CAST(:content AS JSONB), content_hash = :hash "
            "WHERE id = :id"
        ),
        {"content": json.dumps(content), "hash": _hash(content), "id": row.id},
    )
    # Traductions existantes obsolètes — comparaison de hash côté API les
    # régénérera automatiquement au prochain fetch non-anglais.


def downgrade() -> None:
    conn = op.get_bind()
    row = conn.execute(
        sa.text("SELECT id, content FROM platform_pages WHERE slug = 'guides'")
    ).fetchone()
    if not row:
        return
    content = row.content if isinstance(row.content, dict) else json.loads(row.content)
    content["categories"] = [c for c in content.get("categories", []) if c.get("title") != "Account & Sign-in"]
    conn.execute(
        sa.text(
            "UPDATE platform_pages SET content = CAST(:content AS JSONB), content_hash = :hash "
            "WHERE id = :id"
        ),
        {"content": json.dumps(content), "hash": _hash(content), "id": row.id},
    )
