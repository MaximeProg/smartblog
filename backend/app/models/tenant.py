import uuid
from datetime import datetime
from sqlalchemy import String, Boolean, Integer, BigInteger, Text, DateTime, Enum as SAEnum, JSON, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base
from app.models.enums import PlanTier, TenantStatus, CommentsMode, ENUM_VALUES


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Identité
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text)

    # Apparence
    logo_url: Mapped[str | None] = mapped_column(Text)
    cover_image_url: Mapped[str | None] = mapped_column(Text)
    favicon_url: Mapped[str | None] = mapped_column(Text)
    theme: Mapped[str] = mapped_column(String(50), nullable=False, default="minimal")
    primary_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#3B82F6")
    secondary_color: Mapped[str] = mapped_column(String(7), nullable=False, default="#1E40AF")
    font_family: Mapped[str] = mapped_column(String(100), nullable=False, default="Inter", server_default="Inter")
    category: Mapped[str | None] = mapped_column(String(100))

    # Paramètres
    language: Mapped[str] = mapped_column(String(10), nullable=False, default="en")
    timezone: Mapped[str] = mapped_column(String(100), nullable=False, default="UTC")
    comments_mode: Mapped[CommentsMode] = mapped_column(
        SAEnum(CommentsMode, name="comments_mode", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=CommentsMode.MODERATED,
    )
    comments_close_after_days: Mapped[int | None] = mapped_column(Integer)

    # SEO global
    seo_title_template: Mapped[str | None] = mapped_column(String(200), default="{title} — {blog_name}")
    seo_meta_description: Mapped[str | None] = mapped_column(Text)
    robots_txt: Mapped[str | None] = mapped_column(Text)

    # Intégrations analytics
    ga4_measurement_id: Mapped[str | None] = mapped_column(String(50))
    matomo_url: Mapped[str | None] = mapped_column(Text)
    matomo_site_id: Mapped[str | None] = mapped_column(String(50))
    facebook_pixel_id: Mapped[str | None] = mapped_column(String(50))

    # Plan & statut
    plan: Mapped[PlanTier] = mapped_column(
        SAEnum(PlanTier, name="plan_tier", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=PlanTier.STARTER,
    )
    status: Mapped[TenantStatus] = mapped_column(
        SAEnum(TenantStatus, name="tenant_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=TenantStatus.ACTIVE,
    )
    trial_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    plan_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    grace_period_ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Paiement
    stripe_account_id: Mapped[str | None] = mapped_column(String(255))
    paypal_merchant_id: Mapped[str | None] = mapped_column(String(255))

    # IA
    ai_api_key_enc: Mapped[str | None] = mapped_column(Text)
    ai_tokens_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_tts_chars_used: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_images_generated: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_quota_reset_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Compteurs (mis à jour par triggers)
    articles_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    authors_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    storage_used_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)
    subscribers_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    domains_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Footer & réseaux sociaux
    footer_text: Mapped[str | None] = mapped_column(Text)
    social_links: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    sidebar_config: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    # PWA
    pwa_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        CheckConstraint(r"slug ~ '^[a-z0-9][a-z0-9\-]{2,48}[a-z0-9]$'", name="slug_format"),
    )

    def __repr__(self) -> str:
        return f"<Tenant {self.slug} ({self.plan})>"
