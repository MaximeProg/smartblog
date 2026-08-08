import enum


# Use this with every SAEnum to ensure the .value (not .name) is stored in PostgreSQL
ENUM_VALUES = lambda obj: [e.value for e in obj]


class UserRole(str, enum.Enum):
    TENANT_ADMIN = "TENANT_ADMIN"
    EDITOR = "EDITOR"
    AUTHOR = "AUTHOR"
    VIEWER = "VIEWER"


class PlanTier(str, enum.Enum):
    FREE = "free"
    STARTER = "starter"
    PRO = "pro"
    BUSINESS = "business"
    ENTERPRISE = "enterprise"


class TenantStatus(str, enum.Enum):
    ACTIVE = "active"
    SUSPENDED = "suspended"
    GRACE_PERIOD = "grace_period"
    DELETED = "deleted"


class ArticleType(str, enum.Enum):
    ARTICLE = "article"
    PHOTO = "photo"
    VIDEO = "video"
    AUDIO = "audio"
    PODCAST = "podcast"
    MIXED = "mixed"


class ArticleStatus(str, enum.Enum):
    DRAFT = "draft"
    IN_REVIEW = "in_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    UNPUBLISHED = "unpublished"
    ARCHIVED = "archived"


class ContentVisibility(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"
    PAID = "paid"


class CommentStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    SPAM = "spam"
    SHADOW_BANNED = "shadow_banned"


class CommentsMode(str, enum.Enum):
    OPEN = "open"
    MODERATED = "moderated"
    CLOSED = "closed"


class SubscriberStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    UNSUBSCRIBED = "unsubscribed"
    BOUNCED = "bounced"


class CampaignStatus(str, enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    CANCELED = "canceled"


class SocialPlatform(str, enum.Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    LINKEDIN = "linkedin"
    TWITTER = "twitter"
    TIKTOK = "tiktok"
    THREADS = "threads"
    PINTEREST = "pinterest"
    TELEGRAM = "telegram"
    WHATSAPP = "whatsapp"
    YOUTUBE_COMMUNITY = "youtube_community"
    DISCORD = "discord"
    REDDIT = "reddit"
    UPSCROLLED = "upscrolled"
    GOOGLE_BUSINESS = "google_business"


class SocialPostStatus(str, enum.Enum):
    PENDING = "pending"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    FAILED = "failed"
    CANCELED = "canceled"


class LinkSafetyStatus(str, enum.Enum):
    UNCHECKED = "unchecked"
    SAFE = "safe"
    SUSPECT = "suspect"
    DANGEROUS = "dangerous"


class AdContentReviewStatus(str, enum.Enum):
    UNCHECKED = "unchecked"
    APPROVED = "approved"
    FLAGGED = "flagged"


class AdCampaignStatus(str, enum.Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    SUSPENDED = "suspended"
    EXPIRED = "expired"
    CANCELED = "canceled"


class AdSubmissionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAYMENT_PENDING = "payment_pending"
    PAID = "paid"
    EXPIRED = "expired"


class PaymentGateway(str, enum.Enum):
    NOWPAYMENTS = "nowpayments"
    CRYPTO = "crypto"


class TransactionType(str, enum.Enum):
    SUBSCRIPTION = "subscription"
    PAID_ARTICLE = "paid_article"
    PAID_NEWSLETTER = "paid_newsletter"
    AD_CAMPAIGN = "ad_campaign"
    DOMAIN_PURCHASE = "domain_purchase"
    KYC_VERIFICATION = "kyc_verification"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIALLY_PAID = "partially_paid"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    DISPUTED = "disputed"


class SubscriptionStatus(str, enum.Enum):
    TRIALING = "trialing"
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    UNPAID = "unpaid"
    PAUSED = "paused"


class MediaType(str, enum.Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    DOCUMENT = "document"


class DomainVerificationStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    FAILED = "failed"


class DomainSource(str, enum.Enum):
    EXTERNAL = "external"
    PURCHASED = "purchased"


class DomainOrderStatus(str, enum.Enum):
    PENDING_PAYMENT = "pending_payment"
    PAID = "paid"
    REGISTERING = "registering"
    REGISTERED = "registered"
    REGISTRATION_FAILED = "registration_failed"
    REFUND_PENDING = "refund_pending"
    REFUNDED = "refunded"


# ── M23 — Affiliate Program ───────────────────────────────────────

class AffiliateCommissionSource(str, enum.Enum):
    SUBSCRIPTION = "subscription"
    AD_SLOT = "ad_slot"
    MAIN_SITE_AD = "main_site_ad"
    KYC_VERIFICATION = "kyc_verification"


# ── KYC (Kaluta KYC — 2026-08-01, condition d'accès au programme d'affiliation) ──

class KycStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    PENDING = "pending"
    VERIFIED = "verified"
    EXPIRED = "expired"
    REJECTED = "rejected"


class AffiliateCommissionStatus(str, enum.Enum):
    PENDING = "pending"
    READY = "ready"
    RESERVED = "reserved"  # Obsolète (décision PDG : pas de wallet = pas de commission) — conservé
                           # car retirer une valeur d'un ENUM Postgres exige de recréer le type ;
                           # plus jamais produit par le code, gardé pour compat des lignes existantes.
    PAID = "paid"
    CANCELLED = "cancelled"


class CashoutStatus(str, enum.Enum):
    REQUESTED = "requested"
    PROCESSING = "processing"
    PAID = "paid"
    FAILED = "failed"
    REJECTED = "rejected"


class AdRevenueShareStatus(str, enum.Enum):
    PENDING = "pending"    # Obsolète — voir AffiliateCommissionStatus.RESERVED ci-dessus
    RESERVED = "reserved"  # Obsolète — idem
    PAID = "paid"


# ── M24 — Accounting (Singapore SFRS) ────────────────────────────

class AccountType(str, enum.Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class JournalType(str, enum.Enum):
    SALES = "sales"
    PURCHASES = "purchases"
    BANK = "bank"
    OD = "od"


class JournalEntryStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REVERSED = "reversed"


class JournalEntrySource(str, enum.Enum):
    NOWPAYMENTS_WEBHOOK = "nowpayments_webhook"
    AFFILIATE = "affiliate"
    MANUAL = "manual"
