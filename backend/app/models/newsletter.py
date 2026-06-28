import uuid
from datetime import datetime
from sqlalchemy import String, Text, Integer, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base
from app.models.enums import SubscriberStatus, CampaignStatus, ENUM_VALUES


class NewsletterSubscriber(Base):
    __tablename__ = "newsletter_subscribers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    first_name: Mapped[str | None] = mapped_column(String(255))
    last_name: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[SubscriberStatus] = mapped_column(
        SAEnum(SubscriberStatus, name="subscriber_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=SubscriberStatus.PENDING,
    )
    confirmation_token: Mapped[str | None] = mapped_column(String(255))
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    unsubscribed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    unsubscribe_token: Mapped[str] = mapped_column(String(255), nullable=False)
    tags: Mapped[list | None] = mapped_column(JSONB, default=list)
    metadata_: Mapped[dict | None] = mapped_column(JSONB, name="metadata")
    ip_address: Mapped[str | None] = mapped_column(String(45))
    source: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Subscriber {self.email} ({self.status})>"


class NewsletterCampaign(Base):
    __tablename__ = "newsletter_campaigns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    name: Mapped[str] = mapped_column(String(500), nullable=False)
    subject: Mapped[str] = mapped_column(String(500), nullable=False)
    preview_text: Mapped[str | None] = mapped_column(String(500))
    content_html: Mapped[str | None] = mapped_column(Text)
    content_json: Mapped[dict | None] = mapped_column(JSONB)

    status: Mapped[CampaignStatus] = mapped_column(
        SAEnum(CampaignStatus, name="campaign_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=CampaignStatus.DRAFT,
    )
    is_paid: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    price: Mapped[float | None] = mapped_column()

    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Stats (mis à jour par webhooks Resend)
    recipients_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sent_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    opens_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    clicks_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    bounces_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unsubscribes_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
