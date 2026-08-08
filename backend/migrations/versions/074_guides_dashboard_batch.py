"""074 — Documentation utilisateur : guides du dashboard principal (batch 1/2)

9 guides couvrant chaque section réelle du dashboard principal (hors
authentification, déjà couverte en 072) — KYC, mes blogs, affiliation,
abonnement, paiements, factures, annonceur, profil, notifications.
Contenu ancré dans le comportement réel observé (compte de test réel,
captures d'écran, lecture du code source).

Revision ID: 074
Revises: 073
Create Date: 2026-08-08
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "074"
down_revision = "073"
branch_labels = None
depends_on = None


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


GUIDES = {
    "guide-kyc": {
        "hero": {
            "title": "Verifying your identity (KYC)",
            "subtitle": "Required once, only if you want to earn affiliate commissions.",
        },
        "sections": [
            {
                "title": "What KYC unlocks — and what it doesn't",
                "body": "Identity verification (KYC) is required once before you can access the affiliate program and receive commissions. It has nothing to do with blogging itself — you can create blogs, publish articles, and use every Studio feature without ever verifying your identity. KYC only gates one thing: getting paid as an affiliate.",
                "image": "/guides/kyc/kyc.png",
                "tips": [],
            },
            {
                "title": "How it works",
                "body": "Go to Affiliate Program in your dashboard sidebar (or the KYC page directly). You'll pay a small verification fee in crypto (USDT) — this is a one-time cost per verification period, not a subscription. Once payment is confirmed, an identity verification session opens (powered by Kaluta KYC) where you upload a document and a live photo. Your status updates automatically once the check completes — no need to refresh or come back later.",
                "image": None,
                "tips": [
                    "If verification is rejected (blurry document, bad lighting…), you don't need to pay again as long as you still have prepaid years remaining — just retry the verification session.",
                ],
            },
        ],
        "next": {
            "title": "What's next?",
            "description": "Once verified, head to the Affiliate Program page to get your referral link and start earning commissions on everyone you refer.",
        },
    },
    "guide-my-blogs": {
        "hero": {
            "title": "Creating and managing your blogs",
            "subtitle": "Your \"My blogs\" page is the entry point to every blog you own.",
        },
        "sections": [
            {
                "title": "Your blogs, at a glance",
                "body": "\"My blogs\" lists every blog on your account with its article count, subscriber count, and author count. Click \"Studio\" on any blog card to open its full management interface, or the external-link icon to preview the live blog. How many blogs you can create depends on your plan — the Free plan includes 1 blog, paid plans allow more.",
                "image": "/guides/my-blogs/my-blogs.png",
                "tips": [],
            },
            {
                "title": "Before your blog is public",
                "body": "A newly created blog isn't visible to readers right away — you'll see a banner inside the Studio reminding you \"Your blog isn't live yet.\" You need to either add a custom domain or otherwise activate the blog before real visitors can reach it. Everything else (writing articles, configuring design, setting up pages) can be done while the blog is still private.",
                "image": None,
                "tips": [],
            },
        ],
        "next": {
            "title": "What's next?",
            "description": "Click \"Studio\" on a blog to configure its identity, design, and start publishing — see the Studio guides.",
        },
    },
    "guide-affiliate": {
        "hero": {
            "title": "The affiliate program",
            "subtitle": "Earn commissions by referring new people to SmarterBloggers.",
        },
        "sections": [
            {
                "title": "Get your referral link",
                "body": "Every account has a personal referral link and code. Share it — anyone who signs up through your link is linked to you as their referrer, and stays linked for as long as they use SmarterBloggers. You can also invite people directly by email from this page.",
                "image": None,
                "tips": [],
            },
            {
                "title": "How commissions work",
                "body": "You earn a direct commission on every subscription payment made by someone you referred, for as long as they keep paying — and a smaller commission from people in your wider referral network, up to 10 levels deep. Commissions also apply to advertising purchases made by people in your network. This page has four tabs: Referrals (who you've brought in), Tree (your full multi-level network), Commissions (every commission earned, with filters), and Cashouts (your payout history).",
                "image": None,
                "tips": [
                    "You need a verified identity (KYC) and a registered USDT wallet before any commission can be paid out.",
                ],
            },
        ],
        "next": {
            "title": "What's next?",
            "description": "Make sure your identity is verified (KYC) and your USDT wallet is set up in Profile, so commissions can actually reach you.",
        },
    },
    "guide-subscription": {
        "hero": {
            "title": "Plans and billing",
            "subtitle": "Every account starts free — upgrade whenever you outgrow it.",
        },
        "sections": [
            {
                "title": "The four plans",
                "body": "Free includes 1 blog, 50 articles, 1 author, and 1 GB of storage — enough to try the platform for real. Starter ($5/month) raises that to 3 blogs, 500 articles, a custom domain, and priority support. Pro ($30/month) unlocks 10 blogs, unlimited articles, full analytics and SEO tools, and API access. Business ($90/month) is unlimited across the board, with multi-domain support, white-labeling, and a dedicated onboarding contact.",
                "image": "/guides/subscription/subscription.png",
                "tips": [
                    "You can switch plans at any time — cancellation takes effect at the end of the current billing period, no partial refunds.",
                ],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-payments": {
        "hero": {
            "title": "Your payment history",
            "subtitle": "Every payment you've made across every blog you own, in one place.",
        },
        "sections": [
            {
                "title": "One list, every blog",
                "body": "The Payments page consolidates every payment you've made on SmarterBloggers — subscriptions, KYC verification, advertising, domains — regardless of which blog it was for. Filter by status: All, Completed, Pending, or Partial. All payments are processed in cryptocurrency (USDT and other supported coins).",
                "image": "/guides/payments/payments.png",
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": "Need a formal receipt for a payment? Check the Invoices page."},
    },
    "guide-invoices": {
        "hero": {
            "title": "Invoices",
            "subtitle": "Download a formal invoice for any payment you've made.",
        },
        "sections": [
            {
                "title": "Automatic invoicing",
                "body": "SmarterBloggers automatically generates an invoice for eligible payments (subscriptions, ads, KYC, domains) once they're confirmed. Invoices are generated in the language of your account at the time of payment. This page lists every invoice you've received, with a download link for each.",
                "image": None,
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-advertiser": {
        "hero": {
            "title": "Advertising on SmarterBloggers.com",
            "subtitle": "Buy ad space directly on the SmarterBloggers homepage — separate from advertising on a member's blog.",
        },
        "sections": [
            {
                "title": "How it works",
                "body": "This is different from buying an ad on someone else's blog (see the \"Advertising\" guide in the Studio section) — this page is for running your own ad directly on SmarterBloggers.com itself. Fill in a headline, description, image, and destination link, pick your budget and dates, and optionally target specific countries. Payment is made securely in crypto (USDT).",
                "image": "/guides/advertiser/advertiser.png",
                "tips": [],
            },
            {
                "title": "Review and approval",
                "body": "After payment, your ad enters review. Straightforward ads that pass an automated content and link-safety check go live within minutes — only ads flagged for manual review (unusual content, an unverified link) wait for a human to check them. Once live, track impressions, clicks, and CTR live from this same page.",
                "image": None,
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-profile": {
        "hero": {
            "title": "Your profile",
            "subtitle": "Personal information, profile photo, and password.",
        },
        "sections": [
            {
                "title": "Personal information & photo",
                "body": "Update your display name, phone number, country, continent, and gender. Your email address is read-only here — it's tied to how you sign in and can't be changed from this form. Click \"Change photo\" to upload a real profile picture: once set, it appears next to your name across the dashboard, and as the author photo on any article you publish on a public blog.",
                "image": "/guides/profile/profile.png",
                "tips": [],
            },
            {
                "title": "Changing your password",
                "body": "Open the \"Change password\" section at the bottom of the page. This only applies if your account has a password set — accounts created via Google sign-in don't have one unless you set it separately.",
                "image": None,
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-notifications": {
        "hero": {
            "title": "Notifications",
            "subtitle": "Every important event on your account, in one place.",
        },
        "sections": [
            {
                "title": "What shows up here",
                "body": "SmarterBloggers notifies you here for real account events: payment confirmations, KYC verification results, ad approvals, affiliate commissions, and more — each with a link straight to the relevant page. Unread notifications are marked with a blue dot; use \"Mark all as read\" to clear them, or \"Enable push\" to also get notified outside the browser tab.",
                "image": "/guides/notifications/notifications.png",
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
}


def upgrade() -> None:
    conn = op.get_bind()
    insert = sa.text(
        "INSERT INTO platform_pages (slug, content, content_hash) "
        "VALUES (:slug, CAST(:content AS JSONB), :hash) ON CONFLICT (slug) DO NOTHING"
    )
    for slug, content in GUIDES.items():
        conn.execute(insert, {"slug": slug, "content": json.dumps(content), "hash": _hash(content)})


def downgrade() -> None:
    conn = op.get_bind()
    conn.execute(
        sa.text("DELETE FROM platform_pages WHERE slug = ANY(:slugs)"),
        {"slugs": list(GUIDES.keys())},
    )
