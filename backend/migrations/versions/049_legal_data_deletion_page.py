"""049 — CMS page plateforme : legal-data-deletion

Nouvelle page légale publique (/legal/data-deletion), même mécanisme que les
autres pages `legal-*` (migration 035) : contenu source EN dans
platform_pages, éditable depuis le Super Admin, traductions DeepL en cache
invalidées par hash.

Revision ID: 049
Revises: 048
Create Date: 2026-07-19
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "049"
down_revision = "048"
branch_labels = None
depends_on = None


DATA_DELETION_CONTENT = {
    "hero": {
        "title": "Data Deletion Instructions",
        "subtitle": "How to request the deletion of your account and personal data from SmarterBloggers.",
    },
    "sections": [
        {
            "icon": "trash2",
            "title": "Data Deletion Request",
            "body": (
                "At SmarterBloggers, we respect your privacy and your right to request the "
                "deletion of your personal data. If you would like us to delete your account "
                "or any personal information associated with your use of SmarterBloggers, "
                "please follow one of the methods below."
            ),
            "items": [],
        },
        {
            "icon": "user",
            "title": "Option 1 – Delete Your Account (Recommended)",
            "body": (
                "If you have access to your SmarterBloggers account, you can delete it "
                "directly from your settings. Your account and associated personal data "
                "will be permanently deleted according to our data retention policy."
            ),
            "items": [
                "Log in to your account",
                "Navigate to Settings → Account",
                "Click Delete Account",
                "Confirm your request",
            ],
        },
        {
            "icon": "mail",
            "title": "Option 2 – Submit a Data Deletion Request",
            "body": (
                "If you cannot access your account, please contact us at "
                "support@myhigh5.com. Please include the following information in your request:"
            ),
            "items": [
                "Your full name",
                "Email address associated with your account",
                "The social platform connected (Facebook, Instagram, Threads, X, LinkedIn, etc.)",
                "A brief request to delete your data",
            ],
        },
        {
            "icon": "xcircle",
            "title": "What Data Will Be Deleted",
            "body": (
                "When your request is processed, we will permanently delete or anonymize, "
                "where applicable:"
            ),
            "items": [
                "Your SmarterBloggers account",
                "Connected social media account information",
                "OAuth access and refresh tokens",
                "Scheduled posts",
                "Draft posts",
                "Uploaded media (where applicable)",
                "Analytics associated with your account",
                "Profile information stored by SmarterBloggers",
            ],
        },
        {
            "icon": "shield",
            "title": "Data We May Retain",
            "body": (
                "Certain information may be retained if required by law, fraud prevention, "
                "security investigations, tax regulations, or other legal obligations."
            ),
            "items": [],
        },
        {
            "icon": "zap",
            "title": "Processing Time",
            "body": "Most deletion requests are processed within 30 days after successful identity verification.",
            "items": [],
        },
        {
            "icon": "mail",
            "title": "Contact",
            "body": "SmarterBloggers — Email: support@myhigh5.com",
            "items": [
                "Privacy Policy: https://www.smarterbloggers.com/en/legal/privacy",
                "Terms of Service: https://www.smarterbloggers.com/en/legal/terms",
                "Last updated: July 18, 2026",
            ],
        },
    ],
}


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def upgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text(
            "INSERT INTO platform_pages (slug, content, content_hash) "
            "VALUES (:slug, CAST(:content AS JSONB), :hash)"
        ),
        {
            "slug": "legal-data-deletion",
            "content": json.dumps(DATA_DELETION_CONTENT),
            "hash": _hash(DATA_DELETION_CONTENT),
        },
    )


def downgrade() -> None:
    op.execute("DELETE FROM platform_pages WHERE slug = 'legal-data-deletion'")
