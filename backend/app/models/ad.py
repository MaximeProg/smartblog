import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey, Enum as SAEnum, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base
from app.models.enums import AdCampaignStatus, AdSubmissionStatus, LinkSafetyStatus, ENUM_VALUES


class Ad(Base):
    """Une publicité soumise par un annonceur externe (ou le SUPER_ADMIN)."""
    __tablename__ = "ads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    # Annonceur (peut être un utilisateur enregistré ou un externe)
    advertiser_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    advertiser_name: Mapped[str] = mapped_column(String(255), nullable=False)
    advertiser_email: Mapped[str] = mapped_column(String(255), nullable=False)
    advertiser_company: Mapped[str | None] = mapped_column(String(255))

    # Contenu
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    image_url: Mapped[str | None] = mapped_column(Text)
    click_url: Mapped[str] = mapped_column(Text, nullable=False)

    # Sécurité lien
    link_safety_status: Mapped[LinkSafetyStatus] = mapped_column(
        SAEnum(LinkSafetyStatus, name="link_safety_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=LinkSafetyStatus.UNCHECKED,
    )
    link_last_scanned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    link_scan_details: Mapped[dict | None] = mapped_column(JSONB)

    # Statut modération
    submission_status: Mapped[AdSubmissionStatus] = mapped_column(
        SAEnum(AdSubmissionStatus, name="ad_submission_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=AdSubmissionStatus.PENDING,
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Campagne
    campaign_status: Mapped[AdCampaignStatus] = mapped_column(
        SAEnum(AdCampaignStatus, name="ad_campaign_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=AdCampaignStatus.PAUSED,
    )
    starts_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Tarification
    price_per_day: Mapped[float | None] = mapped_column(Numeric(10, 2))
    total_budget: Mapped[float | None] = mapped_column(Numeric(10, 2))
    amount_paid: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False, default=0)

    # Stats
    impressions_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    clicks_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Placement
    placement: Mapped[str | None] = mapped_column(String(50))  # sidebar | header | footer | in_article

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Ad {self.title} ({self.submission_status})>"


class AdLinkScan(Base):
    """Historique des scans de sécurité pour les liens publicitaires."""
    __tablename__ = "ad_link_scans"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ad_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("ads.id", ondelete="CASCADE"), nullable=False)
    url: Mapped[str] = mapped_column(Text, nullable=False)
    safety_status: Mapped[LinkSafetyStatus] = mapped_column(
        SAEnum(LinkSafetyStatus, name="link_safety_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False,
    )
    google_safe_browsing: Mapped[dict | None] = mapped_column(JSONB)
    virustotal: Mapped[dict | None] = mapped_column(JSONB)
    urlhaus: Mapped[dict | None] = mapped_column(JSONB)
    phishtank: Mapped[dict | None] = mapped_column(JSONB)
    scanned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
