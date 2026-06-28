import uuid
from datetime import datetime, date
from sqlalchemy import String, Text, Integer, Date, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import Base


class PageView(Base):
    __tablename__ = "page_views"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    article_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="SET NULL"))
    user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))

    # Session anonyme (hash IP + UA — pas de données perso stockées)
    session_id: Mapped[str | None] = mapped_column(String(64))
    ip_hash: Mapped[str | None] = mapped_column(String(64))

    referrer: Mapped[str | None] = mapped_column(Text)
    referrer_domain: Mapped[str | None] = mapped_column(String(255))
    country_code: Mapped[str | None] = mapped_column(String(2))
    device_type: Mapped[str | None] = mapped_column(String(20))   # desktop | mobile | tablet
    browser: Mapped[str | None] = mapped_column(String(50))
    os: Mapped[str | None] = mapped_column(String(50))
    utm_source: Mapped[str | None] = mapped_column(String(255))
    utm_medium: Mapped[str | None] = mapped_column(String(255))
    utm_campaign: Mapped[str | None] = mapped_column(String(255))
    duration_seconds: Mapped[int | None] = mapped_column(Integer)
    scroll_depth_pct: Mapped[int | None] = mapped_column(Integer)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)


class DailyAnalytics(Base):
    """Agrégat journalier pré-calculé pour les dashboards rapides."""
    __tablename__ = "daily_analytics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    article_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="SET NULL"))
    date: Mapped[date] = mapped_column(Date, nullable=False)

    page_views: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    unique_sessions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    new_subscribers: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    avg_scroll_depth_pct: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    top_referrers: Mapped[dict | None] = mapped_column(JSONB)
    devices: Mapped[dict | None] = mapped_column(JSONB)
    countries: Mapped[dict | None] = mapped_column(JSONB)
