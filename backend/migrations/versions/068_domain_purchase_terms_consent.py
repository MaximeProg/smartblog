"""068 — Domain purchase Terms & Conditions + per-order consent trail (2026-08-06)

Contexte : décision PDG — l'utilisateur doit accepter des CGV d'achat de nom
de domaine avant que la requête d'enregistrement ne parte vers OpenProvider,
pour se prémunir de litiges. Le contenu des CGV suit exactement le pattern
CMS déjà utilisé pour les pages légales existantes (privacy/terms/cookies/
security/data-deletion) — `platform_pages` (contenu source EN) +
`platform_page_translations` (cache DeepL par langue, invalidé par hash) —
donc traduit dans les 29 langues automatiquement, sans travail manuel.

`domain_orders` gagne 3 colonnes pour tracer le consentement PAR achat :
- terms_content_hash : le content_hash de platform_pages au moment de
  l'acceptation. Sert de "version acceptée" — pas de champ version manuel à
  incrémenter, un simple hash du contenu réel, qui change automatiquement
  dès qu'un super admin édite les CGV via le CMS existant (PUT
  /superadmin/platform-pages/{slug}).
- terms_accepted_at : horodatage de l'acceptation (coché la case).
- terms_accepted_ip : IP du client au moment de l'achat (X-Forwarded-For
  derrière le reverse-proxy Apache, avec repli sur request.client.host).

Revision ID: 068
Revises: 067
Create Date: 2026-08-06
"""
import hashlib
import json

import sqlalchemy as sa
from alembic import op

revision = "068"
down_revision = "067"
branch_labels = None
depends_on = None


DOMAIN_TERMS_CONTENT = {
    "hero": {
        "title": "Domain Registration and Purchase Terms & Conditions",
        "subtitle": "Version 1.0 — governs all domain name purchases, registrations, renewals, and transfers made through SmarterBloggers.",
    },
    "sections": [
        {"icon": "filetext", "title": "1. Purpose", "body": "These Domain Registration and Purchase Terms & Conditions (“Terms”) govern the purchase, registration, renewal, management, transfer, and use of domain names offered through SmarterBloggers. By placing a domain name order through SmarterBloggers, the Customer confirms that they have read, understood, and agreed to these Terms.", "items": []},
        {"icon": "edit3", "title": "2. Acceptance of the Terms", "body": "Before completing a domain purchase, the Customer must accept these Terms and any applicable policies relating to the selected domain name and extension. The Customer confirms that:", "items": [
            "The information provided is accurate and up to date",
            "They have the right to use the information provided for domain registration",
            "They agree to the rules applicable to the selected domain name",
            "They understand the renewal and expiration policies",
            "They understand that registration is subject to domain availability and the rules of the relevant registry",
            "SmarterBloggers may retain evidence of the Customer's acceptance, including the account identity, domain name, date and time of acceptance, accepted Terms version, and relevant transaction information",
        ]},
        {"icon": "server", "title": "3. Role of SmarterBloggers and the Registrar", "body": "SmarterBloggers operates as a domain name reseller. Domain registration is performed through a partner registrar, including Openprovider, and the registry responsible for the selected domain extension. SmarterBloggers does not represent itself as an ICANN-accredited registrar. The Customer acknowledges that domain registration and management may be subject to the terms, policies, and procedures of the registrar, ICANN where applicable, and the registry responsible for the relevant domain extension.", "items": []},
        {"icon": "globe2", "title": "4. Domain Availability", "body": "A domain name shown as available through SmarterBloggers is not a guarantee that the domain will ultimately be registered. A domain may become unavailable between the time it is searched and the time the registration request is processed. Registration is considered successful only when SmarterBloggers or its domain service provider confirms that the domain has been successfully registered.", "items": []},
        {"icon": "user", "title": "5. Registrant Information", "body": "The Customer must provide accurate, complete, and up-to-date information for domain registration. Depending on the selected extension, the information requested may include:", "items": [
            "Full legal name",
            "Organization name, where applicable",
            "Address",
            "Country",
            "Email address",
            "Telephone number",
            "Any additional information required by the relevant registry",
            "The Customer is responsible for the accuracy of this information and must update it whenever it changes",
            "Providing false, incomplete, or intentionally misleading information may result in the suspension, cancellation, or loss of the domain name in accordance with applicable rules",
        ]},
        {"icon": "key", "title": "6. Domain Ownership and Registrant Status", "body": "Where technically and legally permitted, the Customer purchasing the domain will be registered as the official registrant of the domain name. SmarterBloggers does not claim ownership of the domain merely because it provides the registration service. The Customer remains responsible for the use of the domain and for any content, services, or activities associated with it.", "items": []},
        {"icon": "creditcard", "title": "7. Payment", "body": "The price displayed at the time of purchase represents the applicable registration price for the period specified. The price may vary depending on:", "items": [
            "The selected domain extension",
            "The registration period",
            "Registrar or registry pricing",
            "Applicable taxes",
            "Additional services",
            "The registration request will generally be processed after payment has been successfully confirmed",
            "Payment does not guarantee registration if the domain becomes unavailable or if the registration request is rejected by the registrar or registry",
        ]},
        {"icon": "zap", "title": "8. Registration Period", "body": "The registration period depends on the duration selected during purchase and the rules applicable to the chosen extension. At the end of the registration period, the domain must be renewed in accordance with the applicable terms to remain active.", "items": []},
        {"icon": "settings", "title": "9. Automatic Renewal", "body": "Where automatic renewal is available, the Customer may enable or disable automatic renewal through their SmarterBloggers account. The Customer is responsible for ensuring that:", "items": [
            "Automatic renewal is properly configured",
            "The payment method remains valid",
            "Sufficient funds are available when required",
            "Enabling automatic renewal does not guarantee renewal if payment fails or if the domain is subject to specific restrictions",
        ]},
        {"icon": "alerttriangle", "title": "10. Domain Expiration", "body": "The Customer is responsible for monitoring the expiration dates of their domain names. SmarterBloggers may send expiration notifications before and/or after expiration where such notification services are available. After expiration, the domain may enter different periods or procedures depending on the relevant extension, including a grace period, restoration period, or deletion process. Additional fees may apply to restore an expired domain. The Customer acknowledges that an expired domain may ultimately be deleted and become available for registration by another party.", "items": []},
        {"icon": "globe2", "title": "11. Domain Transfers", "body": "Subject to applicable rules, the Customer may request the transfer of their domain to another registrar. SmarterBloggers will not improperly prevent the Customer from transferring their domain when all applicable transfer requirements have been met. Where applicable, the Customer may request the domain authorization code (Auth Code/EPP Code) and the information required to complete the transfer.", "items": [
            "Certain domains may be temporarily ineligible for transfer due to regulatory restrictions, transfer lock periods, security procedures, or other applicable rules",
        ]},
        {"icon": "server", "title": "12. DNS Management", "body": "Where the functionality is available, the Customer may manage their domain's DNS settings through SmarterBloggers or tools provided by the relevant service provider. The Customer is responsible for any DNS changes made to their domain. Incorrect DNS configuration may cause websites, email services, or other services associated with the domain to become unavailable.", "items": []},
        {"icon": "xcircle", "title": "13. Prohibited Uses", "body": "The Customer must not use their domain name for:", "items": [
            "Fraudulent activities", "Phishing", "Malware distribution", "Cyberattacks", "Illegal activities",
            "Scams", "Abusive spam campaigns", "Activities that infringe intellectual property rights",
            "Identity theft or impersonation", "Any activity prohibited by applicable law or the policies of the relevant registry",
            "SmarterBloggers may take appropriate action when abusive or unlawful activity is reported or confirmed",
        ]},
        {"icon": "shield", "title": "14. Abuse, Complaints, and Disputes", "body": "SmarterBloggers may receive or forward reports concerning:", "items": [
            "Phishing", "Malware", "Spam", "Fraud", "Trademark infringement", "Copyright infringement",
            "Impersonation", "Court orders", "Domain name dispute decisions or proceedings",
            "The Customer agrees to reasonably cooperate with applicable verification, abuse, and dispute procedures",
            "Depending on the circumstances and applicable rules, actions may include requesting additional information, temporary suspension, domain locking, transfer, cancellation, deletion, or any other action required by the registrar or relevant registry",
        ]},
        {"icon": "lock", "title": "15. Restricted Domain Extensions", "body": "Certain domain extensions may impose specific eligibility requirements concerning the registrant. These requirements may include:", "items": [
            "Local residency or presence", "A company registered in a specific country", "Identity documents",
            "Company documentation", "Trademark evidence", "Professional licenses", "Additional agreements",
            "The Customer agrees to provide the required documentation when it is necessary for the selected extension",
            "SmarterBloggers may reject or cancel a registration request if the eligibility requirements are not satisfied",
        ]},
        {"icon": "lock", "title": "16. Data Protection and Processing", "body": "In order to register and manage a domain name, certain Customer information may need to be transferred to the registrar, the relevant registry, and, where necessary, other service providers involved in providing the service. Such information may include:", "items": [
            "Name", "Address", "Email address", "Telephone number", "Organization information", "Technical and transactional information",
            "Personal data will be processed in accordance with the SmarterBloggers Privacy Policy and applicable laws",
            "The Customer agrees that the information necessary for domain registration and management may be transferred to the relevant parties when required to provide the service or comply with applicable obligations",
        ]},
        {"icon": "eye", "title": "17. Verification of Information", "body": "The registrar or registry may request that the Customer verify certain information. The Customer must respond to verification requests within the applicable timeframe. Failure to complete a required verification may result in restrictions, suspension, or cancellation of the domain in accordance with applicable rules.", "items": []},
        {"icon": "creditcard", "title": "18. Refunds and Cancellations", "body": "Refund conditions may vary depending on the domain extension, registrar, registry, and status of the registration. A domain that has already been registered may be subject to specific conditions and may not be refundable. Before confirming an order, the Customer must review the refund conditions displayed for the relevant domain product. Where a refund is permitted, it will be processed according to SmarterBloggers' and/or the relevant provider's applicable procedures.", "items": []},
        {"icon": "xcircle", "title": "19. Suspension or Cancellation", "body": "A domain may be suspended, locked, cancelled, or deleted where necessary due to:", "items": [
            "A Customer request", "A request from the registrar or registry", "A court or administrative decision",
            "A violation of these Terms", "A violation of applicable policies", "Fraudulent or abusive activity",
            "Inaccurate or unverified information", "Non-payment", "A legal or regulatory requirement",
        ]},
        {"icon": "users", "title": "20. Customer Responsibilities", "body": "The Customer is responsible for:", "items": [
            "The use of their domain", "Content accessible through the domain", "The accuracy of their information",
            "Renewing their domain on time", "Securing their account", "Protecting their login credentials",
            "Services and applications associated with the domain", "Complying with applicable laws and regulations",
        ]},
        {"icon": "shield", "title": "21. SmarterBloggers' Responsibility", "body": "SmarterBloggers will use reasonable efforts to provide domain registration and management services. However, SmarterBloggers does not guarantee that a domain name will remain available, registered, or continuously operational throughout its registration period. SmarterBloggers shall not be responsible for domain unavailability or loss resulting from circumstances including:", "items": [
            "Customer error", "Inaccurate information", "Failure to renew", "Payment failure",
            "A decision by the registry or registrar", "A court or administrative decision",
            "Circumstances beyond SmarterBloggers' reasonable control", "Violation of applicable rules by the Customer",
        ]},
        {"icon": "edit3", "title": "22. Changes to These Terms", "body": "SmarterBloggers may update these Terms to reflect:", "items": [
            "Changes to its services", "Changes to registrar requirements", "Changes to registry policies",
            "Changes to applicable ICANN policies", "Changes in applicable laws or regulations",
            "The version applicable to an order is the version accepted by the Customer at the time of the transaction, subject to changes that must legally apply to ongoing services",
        ]},
        {"icon": "mail", "title": "23. Third-Party Terms", "body": "The Customer acknowledges that certain domain services are provided by third-party providers, including the registrar and the registry responsible for the relevant domain extension. The rules, policies, and procedures of these third parties may also apply to the Customer's use of domain registration and management services, in addition to these Terms.", "items": []},
    ],
}


def _hash(content: dict) -> str:
    return hashlib.sha256(json.dumps(content, sort_keys=True).encode()).hexdigest()


def upgrade() -> None:
    op.add_column("domain_orders", sa.Column("terms_content_hash", sa.String(64), nullable=True))
    op.add_column("domain_orders", sa.Column("terms_accepted_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("domain_orders", sa.Column("terms_accepted_ip", sa.String(45), nullable=True))

    conn = op.get_bind()
    content_hash = _hash(DOMAIN_TERMS_CONTENT)
    conn.execute(
        sa.text(
            "INSERT INTO platform_pages (slug, content, content_hash) "
            "VALUES (:slug, CAST(:content AS JSONB), :hash) "
            "ON CONFLICT (slug) DO NOTHING"
        ),
        {"slug": "legal-domain-purchase-terms", "content": json.dumps(DOMAIN_TERMS_CONTENT), "hash": content_hash},
    )


def downgrade() -> None:
    op.execute("DELETE FROM platform_pages WHERE slug = 'legal-domain-purchase-terms'")
    op.drop_column("domain_orders", "terms_accepted_ip")
    op.drop_column("domain_orders", "terms_accepted_at")
    op.drop_column("domain_orders", "terms_content_hash")
