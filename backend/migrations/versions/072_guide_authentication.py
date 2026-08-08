"""072 — Documentation utilisateur, premier guide : Authentification

Première page du nouveau centre de documentation publique demandé par le
PDG (2026-08-08) — contenu ancré dans le comportement réel du produit,
vérifié en conditions réelles (compte de test, captures d'écran) plutôt que
deviné. Suit le même mécanisme CMS que les autres pages plateforme
(platform_pages + traduction DeepL automatique dans les 29 langues, voir
platform.py::get_platform_page) — aucune nouvelle infrastructure nécessaire.

Revision ID: 072
Revises: 071
Create Date: 2026-08-08
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "072"
down_revision = "071"
branch_labels = None
depends_on = None


GUIDE_AUTHENTICATION_CONTENT = {
    "hero": {
        "title": "Creating your account & signing in",
        "subtitle": "Everything you need to know before you start publishing on SmarterBloggers.",
    },
    "sections": [
        {
            "title": "Two ways to sign up",
            "body": "You can create your SmarterBloggers account in two ways: click \"Sign up with Google\" for instant, one-click access using your existing Google account, or fill in the form with your full name, email address, and a password of at least 8 characters. There's no cost to sign up — every account starts on the Free plan.",
            "image": "/guides/authentication/register.png",
            "tips": [],
        },
        {
            "title": "Were you invited by someone?",
            "body": "If you followed a referral link (a URL ending in ?ref=SOMECODE), you'll see a green \"Referral code active\" badge on the sign-up form before you even fill it in. This links your new account to the person who referred you — it's how SmarterBloggers' affiliate program tracks who introduced whom. You don't need to do anything else; the code is applied automatically when you create your account.",
            "image": None,
            "tips": [],
        },
        {
            "title": "Verify your email",
            "body": "If you signed up with email and password, SmarterBloggers sends you a verification email right away — you cannot sign in until you click the link inside it. While you wait, keep the confirmation screen open: it automatically detects when you've clicked the link and redirects you to the sign-in page, so you don't need to come back and refresh manually. If you signed up with Google, this step is skipped entirely, since Google has already verified your email address.",
            "image": None,
            "tips": [
                "Can't find the email? Check your spam folder, or use the \"Resend verification email\" link on the sign-in page.",
            ],
        },
        {
            "title": "Signing in",
            "body": "Once your account is set up, sign in with the same method you used to register — Google, or your email and password. If you registered with email and password but skipped verification, the sign-in page will offer to resend the verification email.",
            "image": "/guides/authentication/login.png",
            "tips": [],
        },
        {
            "title": "Forgot your password?",
            "body": "Click \"Forgot password?\" on the sign-in page and enter your email address. You'll receive a link to set a new password. This works regardless of how you originally signed up, as long as your account has a password set.",
            "image": "/guides/authentication/forgot-password.png",
            "tips": [],
        },
    ],
    "next": {
        "title": "What's next?",
        "description": "Once you're signed in, the next step is usually verifying your identity (KYC) if you plan to earn affiliate commissions, or heading straight to \"My blogs\" to create your first blog.",
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
        {
            "slug": "guide-authentication",
            "content": json.dumps(GUIDE_AUTHENTICATION_CONTENT),
            "hash": _hash(GUIDE_AUTHENTICATION_CONTENT),
        },
    )


def downgrade() -> None:
    op.execute("DELETE FROM platform_pages WHERE slug = 'guide-authentication'")
