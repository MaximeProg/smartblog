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
    STRIPE = "stripe"
    PAYPAL = "paypal"


class TransactionType(str, enum.Enum):
    SUBSCRIPTION = "subscription"
    PAID_ARTICLE = "paid_article"
    PAID_NEWSLETTER = "paid_newsletter"
    AD_CAMPAIGN = "ad_campaign"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
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
