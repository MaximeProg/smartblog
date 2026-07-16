"""035 — CMS pages plateforme (extension : careers, press, changelog, status, legal x4)

Suite du pilote (migration 032, home/about/contact) — même mécanisme, contenu
source EN extrait tel quel des pages actuelles. Le Centre d'aide/Documentation/
docs-api/Guides sont volontairement laissés en dur (hors scope de cette passe).

Revision ID: 035
Revises: 034
Create Date: 2026-07-16
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "035"
down_revision = "034"
branch_labels = None
depends_on = None


CAREERS_CONTENT = {
    "hero": {
        "title": "Let's build the future of blogging together",
        "subtitle": "Join a passionate team helping thousands of creators share their ideas with the world.",
        "cta_label": "View open positions",
        "image_url": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1920&q=80",
    },
    "perks": {
        "items": [
            {"icon": "globe2", "title": "100% Remote", "description": "Work from anywhere in the world."},
            {"icon": "heart", "title": "Health Benefits", "description": "Full medical, dental, and vision coverage."},
            {"icon": "zap", "title": "Equity", "description": "Competitive equity package for all employees."},
            {"icon": "coffee", "title": "Learning Budget", "description": "$2,000/year for conferences and courses."},
        ],
    },
    "jobs": {
        "title": "Open Positions",
        "items": [
            {"title": "Senior Full-Stack Engineer", "department": "Engineering", "location": "Remote (Europe/Americas)", "type": "Full-time", "description": "Join our core platform team to build the next generation of SmarterBloggers's multi-tenant infrastructure."},
            {"title": "Product Designer (UX/UI)", "department": "Design", "location": "Remote (Worldwide)", "type": "Full-time", "description": "Help shape the user experience for thousands of content creators using SmarterBloggers's editor and dashboard."},
            {"title": "Growth Marketing Manager", "department": "Marketing", "location": "Paris, France (Hybrid)", "type": "Full-time", "description": "Drive user acquisition and retention through data-driven marketing campaigns and partnerships."},
            {"title": "Customer Success Specialist", "department": "Support", "location": "Remote (Europe)", "type": "Full-time", "description": "Help our users succeed with SmarterBloggers by providing world-class onboarding and support."},
        ],
    },
    "open_application": {
        "title": "Don't see the right role?",
        "description": "Send us an open application — we love meeting passionate people.",
        "cta_label": "Send Open Application",
    },
}

PRESS_CONTENT = {
    "hero": {
        "title": "Press",
        "subtitle": "Resources and information for journalists and media.",
    },
    "press_contact": {
        "title": "Press Contact",
        "description": "For press inquiries, interviews, or additional information:",
    },
    "key_facts": {
        "title": "Key Facts",
        "items": [
            {"value": "2024", "label": "Founded"},
            {"value": "10K+", "label": "Active blogs"},
            {"value": "25", "label": "Employees"},
            {"value": "$5M", "label": "Raised"},
        ],
    },
    "coverage": {
        "title": "Press Coverage",
        "items": [
            {"outlet": "TechCrunch", "logo": "https://images.unsplash.com/photo-1607799279861-4dd421887fb3?auto=format&fit=crop&w=200&q=80", "title": "SmarterBloggers raises $5M to bring enterprise blogging to the masses", "date": "March 2025", "href": "#"},
            {"outlet": "Product Hunt", "logo": "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?auto=format&fit=crop&w=200&q=80", "title": "#1 Product of the Day — SmarterBloggers 2.0", "date": "May 2025", "href": "#"},
            {"outlet": "The Verge", "logo": "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=200&q=80", "title": "The best new blogging platform for serious creators", "date": "April 2025", "href": "#"},
        ],
    },
    "brand_assets": {
        "title": "Brand Assets",
        "items": [
            {"icon": "package", "label": "SmarterBloggers Logo (SVG, PNG)", "size": "2.4 MB"},
            {"icon": "newspaper", "label": "Full Press Kit", "size": "12 MB"},
            {"icon": "camera", "label": "Product Screenshots", "size": "8.1 MB"},
            {"icon": "users", "label": "Team Photos", "size": "5.3 MB"},
        ],
    },
}

CHANGELOG_CONTENT = {
    "hero": {
        "title": "Changelog",
        "subtitle": "All new features, improvements, and fixes to SmarterBloggers.",
    },
    "releases": [
        {"version": "2.1.0", "date": "June 20, 2025", "type": "feature", "icon": "bot", "title": "AI Writing Assistant", "changes": ["AI-powered content generation for articles", "Smart SEO title and meta description suggestions", "Grammar and style improvements", "Content outline generator"]},
        {"version": "2.0.0", "date": "May 15, 2025", "type": "major", "icon": "zap", "title": "SmarterBloggers 2.0 — Multi-tenant Platform", "changes": ["Complete platform rebuild with Next.js 15 and FastAPI", "Multi-tenant architecture supporting unlimited blogs", "Role-based access control (Owner, Admin, Editor, Author, Viewer)", "New rich text editor with TipTap", "Real-time analytics dashboard"]},
        {"version": "1.8.2", "date": "April 3, 2025", "type": "fix", "icon": "wrench", "title": "Security & Performance Fixes", "changes": ["Fixed JWT token refresh edge case", "Improved image optimization pipeline", "Rate limiting improvements", "Database query optimization (40% faster)"]},
        {"version": "1.8.0", "date": "March 12, 2025", "type": "feature", "icon": "barchart2", "title": "Advanced Analytics", "changes": ["Real-time visitor tracking", "Traffic source breakdown", "Top articles report", "Newsletter subscription analytics", "Export to CSV"]},
        {"version": "1.7.0", "date": "February 8, 2025", "type": "feature", "icon": "globe2", "title": "Multilingual Support", "changes": ["Platform interface in English and French", "RTL language support (Arabic, Hebrew)", "Automatic locale detection", "Per-article language setting"]},
        {"version": "1.6.0", "date": "January 15, 2025", "type": "feature", "icon": "shield", "title": "Enterprise Security Features", "changes": ["Two-factor authentication (2FA)", "Comprehensive audit logs", "IP allowlist for team access", "Session management dashboard"]},
    ],
}

STATUS_CONTENT = {
    "hero": {
        "title": "System Status",
        "subtitle": "Real-time availability and performance of SmarterBloggers.",
    },
    "services": [
        {"name": "API", "status": "operational"},
        {"name": "Web App", "status": "operational"},
        {"name": "CDN", "status": "operational"},
        {"name": "Database", "status": "operational"},
        {"name": "Media Storage", "status": "operational"},
        {"name": "Search (Elasticsearch)", "status": "operational"},
        {"name": "Email Delivery", "status": "operational"},
        {"name": "Authentication", "status": "operational"},
    ],
    # Intentionnellement vide — plus d'incidents fictifs. Le super admin ajoute
    # un incident réel ici quand (et seulement quand) il se produit.
    "incidents": [],
}

_LEGAL_ICON_COLORS = {
    "eye": "blue", "shield": "violet", "users": "emerald", "lock": "amber",
    "globe2": "cyan", "mail": "pink", "filetext": "blue", "user": "emerald",
    "edit3": "amber", "creditcard": "cyan", "server": "amber", "xcircle": "red",
    "alerttriangle": "orange", "cookie": "pink", "settings": "blue",
    "barchart2": "emerald", "star": "violet", "key": "cyan", "zap": "orange",
}

PRIVACY_CONTENT = {
    "hero": {"title": "Privacy Policy", "subtitle": "How we collect, use, and protect your personal information."},
    "sections": [
        {"icon": "eye", "title": "Information We Collect", "body": "We collect information you provide directly to us when creating an account, publishing content, or contacting support: name, email address, billing information, and the content you create.", "items": ["Name and email address when you create an account", "Article content and media you publish on your blogs", "Billing information for paid subscriptions", "Communications with our customer support team", "Technical data: IP address, browser type, pages visited"]},
        {"icon": "shield", "title": "How We Use Your Information", "body": "We use the information we collect to provide, maintain, and improve our services, process transactions, send notifications, and analyze usage to enhance your experience.", "items": ["Provide, maintain, and improve our services", "Process transactions and send related confirmations", "Send technical notifications and security alerts", "Respond to your comments, questions, and support requests", "Monitor and analyze trends to improve user experience", "Detect and prevent fraudulent or abusive activity"]},
        {"icon": "users", "title": "Information Sharing", "body": "We do not sell or rent your personal information to third parties. We may share your information only in the following limited circumstances:", "items": ["With service providers who help us operate our platform (hosting, payments, analytics)", "When required by law or in response to valid legal process", "To protect the rights, property, or safety of SmarterBloggers and our users", "In connection with a merger, acquisition, or sale of assets (you will be notified)"]},
        {"icon": "lock", "title": "Data Security", "body": "We implement appropriate technical and organizational security measures to protect your information. This includes encryption of data in transit (TLS 1.3) and at rest (AES-256), access controls, and regular security audits.", "items": ["All data encrypted in transit using TLS 1.3", "Data at rest encrypted using AES-256", "Role-based access controls for our team", "Regular third-party security audits and penetration testing", "Automated threat detection and monitoring"]},
        {"icon": "globe2", "title": "Your Rights (GDPR)", "body": "If you are based in the EEA, you have the following rights regarding your personal data. To exercise any of these rights, contact us at privacy@smarterbloggers.com.", "items": ["Right to access your personal data", "Right to rectification of inaccurate data", "Right to erasure (right to be forgotten)", "Right to restriction of processing", "Right to data portability", "Right to object to processing"]},
        {"icon": "mail", "title": "Contact & Updates", "body": "For questions about this Privacy Policy, contact our Data Protection Officer at privacy@smarterbloggers.com. We will update this policy as needed and notify you of significant changes via email or an in-app notice.", "items": ["DPO email: privacy@smarterbloggers.com", "Last updated: January 1, 2025", "Effective date: January 1, 2025"]},
    ],
}

TERMS_CONTENT = {
    "hero": {"title": "Terms of Service", "subtitle": "The rules governing your use of SmarterBloggers."},
    "sections": [
        {"icon": "filetext", "title": "Acceptance of Terms", "body": "By accessing or using SmarterBloggers, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use our service.", "items": []},
        {"icon": "server", "title": "Description of Service", "body": "SmarterBloggers is a multi-tenant SaaS platform that enables content creators and businesses to create, manage, and publish professional blogs with editing, analytics, and monetization tools.", "items": []},
        {"icon": "user", "title": "User Accounts", "body": "To use certain features, you must create an account. You are responsible for the confidentiality of your credentials and all activities under your account.", "items": ["You must be at least 16 years old to create an account", "You must provide accurate and complete information", "You are responsible for the security of your password", "You must notify us immediately of any unauthorized access"]},
        {"icon": "edit3", "title": "User Content", "body": "You retain ownership of all content you publish. By publishing content, you grant us a non-exclusive license to use it in connection with our services.", "items": ["Illegal, defamatory, hateful, or obscene content — prohibited", "Infringing third-party intellectual property rights — prohibited", "Malware, spam, or phishing — prohibited", "Impersonating another person or entity — prohibited"]},
        {"icon": "creditcard", "title": "Plans and Billing", "body": "SmarterBloggers offers free and paid plans billed monthly or annually. You may cancel at any time; cancellation takes effect at the end of the current billing period.", "items": []},
        {"icon": "xcircle", "title": "Termination", "body": "We reserve the right to suspend or terminate your access for violations of these terms. You may also terminate your account at any time from your account settings.", "items": []},
        {"icon": "alerttriangle", "title": "Limitation of Liability", "body": "To the maximum extent permitted by applicable law, SmarterBloggers shall not be liable for indirect, incidental, special, or consequential damages arising from use or inability to use our service.", "items": []},
        {"icon": "mail", "title": "Contact", "body": "For questions about these Terms of Service, contact us at legal@smarterbloggers.com.", "items": ["legal@smarterbloggers.com"]},
    ],
}

COOKIES_CONTENT = {
    "hero": {"title": "Cookie Policy", "subtitle": "How and why we use cookies on SmarterBloggers."},
    "sections": [
        {"icon": "settings", "title": "Essential Cookies", "body": "These cookies are necessary for the site to function and cannot be disabled. They are set in response to your actions such as logging in, filling out forms, or setting your privacy preferences.", "items": ["smarterbloggers-auth — Session authentication token (7 days)", "smarterbloggers-theme — Your dark/light theme preference (persistent)", "CSRF token — Security protection for form submissions"]},
        {"icon": "barchart2", "title": "Analytics Cookies", "body": "These cookies allow us to count visits and traffic sources to measure and improve site performance. All information collected is aggregated and anonymous — we cannot identify you individually.", "items": ["_ga — Google Analytics visitor ID (2 years)", "_gid — Google Analytics session ID (24 hours)", "_gat — Request throttle (1 minute)"]},
        {"icon": "star", "title": "Preference Cookies", "body": "These cookies allow the site to remember your choices, such as your language preference, so we can provide a more personalized experience.", "items": ["locale — Your chosen language (persistent)", "sidebar-collapsed — Dashboard sidebar state (session)"]},
        {"icon": "globe2", "title": "Third-Party Cookies", "body": "Some of our third-party services may set their own cookies. These include Firebase for authentication and Google Analytics for usage statistics. Please review their privacy policies for more information.", "items": ["Firebase (Google) — Authentication and security", "Google Analytics — Usage statistics"]},
        {"icon": "cookie", "title": "Managing Cookies", "body": "You can control and/or delete cookies as you wish via your browser settings. You can delete all cookies currently on your computer and you can set most browsers to prevent them from being placed. Note that disabling certain cookies may affect site functionality.", "items": []},
        {"icon": "mail", "title": "Questions?", "body": "For questions about our use of cookies, please contact us at privacy@smarterbloggers.com. Last updated: January 1, 2025.", "items": []},
    ],
}

SECURITY_CONTENT = {
    "hero": {"title": "Enterprise-Grade Security", "subtitle": "Your content and data are protected by industry-leading security practices."},
    "sections": [
        {"icon": "lock", "title": "Data Encryption", "body": "All data exchanged with SmarterBloggers is encrypted in transit via TLS 1.3. Stored data is encrypted at rest using AES-256. Passwords are never stored in plaintext.", "items": ["TLS 1.3 for all client-server communications", "AES-256 for data at rest", "Password hashing with bcrypt", "Automatic encryption key rotation"]},
        {"icon": "shield", "title": "Access Control", "body": "Our role-based access control (RBAC) architecture ensures each user can only access what they need. Five role levels are available: Owner, Admin, Editor, Author, Viewer.", "items": ["RBAC with 5 role levels", "Complete data isolation between tenants", "Multi-factor authentication available", "Session management with forced invalidation"]},
        {"icon": "eye", "title": "Audit Logs", "body": "SmarterBloggers maintains comprehensive audit logs for all security-relevant events and data access. Logs are retained for 90 days on Pro plans and 1 year on Business.", "items": ["All login and logout events recorded", "Content modification tracking", "Suspicious activity alerts", "Log export available"]},
        {"icon": "server", "title": "Infrastructure Security", "body": "SmarterBloggers is hosted on SOC 2 Type II certified cloud infrastructure with automated backups, geographic redundancy, and 99.9% uptime.", "items": ["SOC 2 Type II certified cloud infrastructure", "Automated encrypted backups every hour", "Multi-region geographic redundancy", "Built-in DDoS protection"]},
        {"icon": "key", "title": "Testing & Audits", "body": "We conduct continuous security testing to identify and fix vulnerabilities before they can be exploited.", "items": ["Quarterly third-party penetration testing", "Static code analysis (SAST) in our CI/CD", "Automated dependency scanning (SCA)", "Responsible vulnerability disclosure program"]},
        {"icon": "zap", "title": "Rate Limiting & Protection", "body": "All our APIs are protected by rate limiting to prevent abuse, brute-force attacks, and DDoS attacks.", "items": ["Rate limiting on all APIs and endpoints", "Brute-force protection on login", "Automatic suspicious IP blocking", "24/7 anomaly monitoring"]},
    ],
    "report_vulnerability": {
        "title": "Report a Vulnerability",
        "description": "If you discover a security vulnerability, please report it to us responsibly. We commit to responding within 24 hours and acknowledging your contribution.",
    },
}


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def upgrade() -> None:
    conn = op.get_bind()
    insert = sa.text(
        "INSERT INTO platform_pages (slug, content, content_hash) "
        "VALUES (:slug, CAST(:content AS JSONB), :hash)"
    )
    pages = (
        ("careers", CAREERS_CONTENT),
        ("press", PRESS_CONTENT),
        ("changelog", CHANGELOG_CONTENT),
        ("status", STATUS_CONTENT),
        ("legal-privacy", PRIVACY_CONTENT),
        ("legal-terms", TERMS_CONTENT),
        ("legal-cookies", COOKIES_CONTENT),
        ("legal-security", SECURITY_CONTENT),
    )
    for slug, content in pages:
        conn.execute(insert, {"slug": slug, "content": json.dumps(content), "hash": _hash(content)})


def downgrade() -> None:
    op.execute("""
        DELETE FROM platform_pages WHERE slug IN
        ('careers','press','changelog','status','legal-privacy','legal-terms','legal-cookies','legal-security')
    """)
