"""075 — Documentation utilisateur : guides du Studio (batch 2/2, 24 guides)

Couvre chaque section réelle du Studio (gestion d'un blog), organisées
comme le menu réel : Site, Pages, Content, Growth, Settings. Contenu
ancré dans le comportement observé (compte de test réel, captures
d'écran, code source) — pas de fonctionnalités inventées.

Revision ID: 075
Revises: 074
Create Date: 2026-08-08
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "075"
down_revision = "074"
branch_labels = None
depends_on = None


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def _simple(title, subtitle, body, image=None, tips=None):
    return {
        "hero": {"title": title, "subtitle": subtitle},
        "sections": [{"title": title, "body": body, "image": image, "tips": tips or []}],
        "next": {"title": "What's next?", "description": ""},
    }


GUIDES = {
    "guide-studio-overview": {
        "hero": {"title": "Finding your way around the Studio", "subtitle": "The Studio is where you manage everything about one specific blog."},
        "sections": [
            {
                "title": "The Studio menu",
                "body": "Every blog you own has its own Studio, opened from \"My blogs.\" The left menu is organized in five groups: Site (blog identity, design, social networks, header, footer), Pages (Home, About, Contact, Article page layout), Content (Articles, Categories, Tags, Media library, Newsletter, Comments, Advertisements), Growth (Analytics, SEO, Social media, Languages, Financials), and Settings (General settings, Collaborators, Custom domains, API Keys). A live preview of your blog sits in the main panel as you edit, with desktop/tablet/mobile toggles at the top.",
                "image": "/guides/studio-overview/overview.png",
                "tips": ["A blue banner at the top reminds you when your blog isn't live yet — add a custom domain to change that."],
            },
        ],
        "next": {"title": "What's next?", "description": "Start with Blog identity and Design to set up the basics, then move to Articles to publish your first post."},
    },
    "guide-studio-general": {
        "hero": {"title": "Blog identity & general settings", "subtitle": "Your blog's name, description, category, and core details."},
        "sections": [
            {"title": "Blog identity", "body": "\"Blog identity\" (under Site) is where you set your blog's name, tagline/description, category, logo, and favicon — the core identity that shows up in the browser tab, search results, and social shares. \"General settings\" (under Settings) covers account-level configuration for this specific blog.", "image": None, "tips": []},
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-studio-home": {
        "hero": {"title": "Customizing your home page", "subtitle": "Build your homepage section by section."},
        "sections": [
            {"title": "Home page sections", "body": "The Home page is broken into independent sections you can each toggle and configure: Hero section (the big banner at the top), Categories strip, Latest articles, Newsletter band, and Sidebar. Changes preview live in the main panel before you save.", "image": None, "tips": []},
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-studio-header": _simple(
        "Header", "Your blog's navigation bar.",
        "Configure the navigation links, logo placement, and layout of the header that appears at the top of every page on your blog.",
    ),
    "guide-studio-footer": _simple(
        "Footer", "Your blog's footer.",
        "Configure the links, text, and layout of the footer that appears at the bottom of every page on your blog.",
    ),
    "guide-studio-seo": {
        "hero": {"title": "SEO settings", "subtitle": "Optimize your blog for search engines."},
        "sections": [
            {
                "title": "Meta tags and indexing",
                "body": "See a live Google search preview as you edit. Set an SEO title template (e.g. {title} | {blog_name}, applied to every article automatically) and a default meta description (recommended 160 characters). Further down, configure Social sharing (Open Graph tags for how links look when shared on social media), Indexing (control whether search engines can index your blog), and a custom robots.txt.",
                "image": "/guides/studio-seo/seo.png",
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-studio-social": _simple(
        "Social networks & social media", "Link your blog's social profiles, and configure social sharing.",
        "\"Social networks\" (under Site) is where you add links to your blog's social media profiles (Twitter/X, Instagram, Facebook, LinkedIn…), shown in the header/footer. \"Social media\" (under Growth) covers how your content appears when shared — image, title, and description shown by social platforms.",
    ),
    "guide-studio-languages": _simple(
        "Languages", "Publish your blog in multiple languages.",
        "Enable additional languages for your blog. Once enabled, articles and the blog interface can be automatically translated, and visitors can switch language from a selector on the public blog.",
    ),
    "guide-studio-articles": {
        "hero": {"title": "Managing your articles", "subtitle": "Every post on your blog, in one list."},
        "sections": [
            {
                "title": "Your article list",
                "body": "Search and filter your articles by status (draft, published, scheduled…). Click \"+ Create\" to start a new article, or click any existing one to edit it. This is also where you'll see AI-assisted writing tools when drafting content, and where paid/free access is configured per article.",
                "image": "/guides/studio-articles/articles.png",
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-studio-article": _simple(
        "Article page layout", "Control how a single article page is laid out.",
        "Configure the layout template used when a reader opens any individual article — where the author info, related articles, comments, and sidebar appear relative to the content.",
    ),
    "guide-studio-categories": _simple(
        "Categories", "Organize your articles into topics.",
        "Create and manage the categories your articles belong to. Categories appear in your blog's navigation and the \"Categories strip\" home page section, helping readers browse by topic.",
    ),
    "guide-studio-tags": _simple(
        "Tags", "Fine-grained labels for your articles.",
        "Tags work alongside categories as a more granular way to label articles — useful for cross-topic filtering and related-content suggestions.",
    ),
    "guide-studio-comments": {
        "hero": {"title": "Moderating comments", "subtitle": "Review and manage reader comments."},
        "sections": [
            {
                "title": "Moderation queue",
                "body": "See totals for comments (Total, Pending, Approved, Rejected) at a glance, then filter the list by All, Pending, Approved, Rejected, Spam, or Shadow. Open \"Comment settings\" to control whether comments require approval before appearing, and other moderation rules.",
                "image": "/guides/studio-comments/comments.png",
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-studio-media": _simple(
        "Media library", "Every image and file uploaded to your blog.",
        "Browse, search, and reuse every image and media file you've uploaded across your articles and pages — no need to re-upload the same asset twice.",
    ),
    "guide-studio-collaborators": {
        "hero": {"title": "Inviting your team", "subtitle": "Manage who has access to this blog, and what they can do."},
        "sections": [
            {
                "title": "Roles and invitations",
                "body": "See counts of Members, Editors, and Authors, plus the list of Administrators (with the TENANT_ADMIN badge), Active members, and Pending invitations. Click \"Invite member\" to add someone by email and assign their role — each role controls what they're allowed to do on this specific blog.",
                "image": "/guides/studio-collaborators/collaborators.png",
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-studio-support": {
        "hero": {"title": "Getting help", "subtitle": "Contact the SmarterBloggers team about this blog."},
        "sections": [
            {
                "title": "Support tickets",
                "body": "Open a new ticket with \"+ New ticket\" and track its status through Open, In progress, Resolved, or Closed. Use this instead of email for anything related to this specific blog — it keeps a full history in one place.",
                "image": "/guides/studio-support/support.png",
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-studio-analytics": {
        "hero": {"title": "Reading your blog's analytics", "subtitle": "Track how your blog is performing."},
        "sections": [
            {
                "title": "Key metrics",
                "body": "Total views, unique sessions, average visit duration, and a trend indicator, over a 7/30/90-day window you can switch between. If you're just getting started, this will show \"No data for this period\" — publish articles and share your blog to start seeing real numbers.",
                "image": "/guides/studio-analytics/analytics.png",
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-studio-accounting": {
        "hero": {"title": "Financial overview", "subtitle": "Revenue and costs for this specific blog."},
        "sections": [
            {
                "title": "Revenue, costs, and transaction history",
                "body": "See your ad revenue, subscription cost, and net balance for this blog, plus a full transaction history. This overview shows payments processed through SmarterBloggers for this blog — it isn't a complete financial/tax statement.",
                "image": "/guides/studio-accounting/accounting.png",
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": "See the Advertising guide to understand exactly how ad revenue is split between you and SmarterBloggers."},
    },
    "guide-studio-ads": {
        "hero": {"title": "Advertising on your blog", "subtitle": "Sell ad space on your own blog to real advertisers."},
        "sections": [
            {
                "title": "Your advertiser link",
                "body": "Share your unique \"Advertiser link\" (shown at the top of this page) with anyone who wants to run an ad on your blog — it takes them straight to a submission form for your blog specifically. Track Total ads, Pending review, Active, Impressions, Clicks, and CTR from this page, and filter your ad list by All, Pending, Awaiting payment, Active, or Rejected.",
                "image": "/guides/studio-ads/ads.png",
                "tips": [
                    "You keep 60% of the ad payment as the blog owner (10% goes to affiliate commissions, 30% to SmarterBloggers) — paid automatically once your wallet is set up and your identity is verified (KYC).",
                ],
            },
        ],
        "next": {"title": "What's next?", "description": "Set up a USDT wallet in Profile and verify your identity (KYC) so your share of ad revenue can actually be paid out."},
    },
    "guide-studio-ai-builder": {
        "hero": {"title": "AI Blog Builder", "subtitle": "Let AI configure your entire blog from a few answers."},
        "sections": [
            {
                "title": "How it works",
                "body": "Fill in your blog/brand name, topic or niche, target audience, writing tone (Professional, Friendly & Casual, Inspiring, Educational, or Bold & Direct), language, and a primary color, then click \"Generate my blog.\" The AI configures your home page, about page, contact page, SEO, header, and footer in one pass — typically 15 to 30 seconds. This uses AI credits from your plan.",
                "image": "/guides/studio-ai-builder/ai-builder.png",
                "tips": ["Everything the AI generates can still be edited manually afterward — it's a starting point, not a final, locked result."],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-studio-api-keys": {
        "hero": {"title": "API keys", "subtitle": "Access your blog's data programmatically."},
        "sections": [
            {
                "title": "Creating and managing keys",
                "body": "Click \"New key\" to generate an API key for this blog. API keys grant full access to your blog's data — keep them secret, never share them publicly, and revoke any key you're no longer using.",
                "image": "/guides/studio-api-keys/api-keys.png",
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-studio-domains": {
        "hero": {"title": "Connecting a custom domain", "subtitle": "Make your blog reachable at your own domain name."},
        "sections": [
            {
                "title": "Connecting an existing domain",
                "body": "Already own a domain? Use the \"Connect existing\" tab. It's a 3-step process: (1) click \"Add domain\" and enter it (e.g. blog.mysite.com); (2) at your DNS provider (Cloudflare, GoDaddy, Namecheap…), add 2 CNAME records — one for the root domain (@) and one for the www subdomain, both pointing to cname.vercel-dns.com — plus a TXT verification record whose value is unique per domain and shown on the domain card; (3) once your DNS records have propagated (usually minutes on Cloudflare, up to 48h elsewhere), click Verify.",
                "image": "/guides/studio-domains/domains.png",
                "tips": [
                    "Using Cloudflare? Enable the orange cloud proxy on your CNAME record — SSL is then handled automatically, no extra configuration needed.",
                ],
            },
            {
                "title": "Don't have a domain yet?",
                "body": "Switch to the \"Buy a domain\" tab to purchase one directly from SmarterBloggers and have it connected automatically — no manual DNS setup required.",
                "image": None,
                "tips": [],
            },
        ],
        "next": {"title": "What's next?", "description": ""},
    },
    "guide-studio-newsletter": _simple(
        "Newsletter", "Manage your blog's email subscribers.",
        "See and manage everyone who has subscribed to your blog's newsletter through the \"Newsletter band\" home page section or elsewhere on your blog.",
    ),
    "guide-studio-about": _simple(
        "About page", "Tell your readers who you are.",
        "Build your blog's About page — hero section, stats, mission statement, values, and an optional team section — using the same section-by-section editor as the home page.",
    ),
    "guide-studio-contact": _simple(
        "Contact page", "Let readers reach you.",
        "Configure your blog's Contact page — a contact form for readers to message you, plus your published contact information.",
    ),
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
