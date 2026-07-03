import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.models.base import Base


class ArticleLike(Base):
    __tablename__ = "article_likes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    # Empreinte anonyme (hash sha256 de IP+UA — aucune donnée personnelle brute)
    fingerprint: Mapped[str] = mapped_column(String(64), nullable=False)
    ip_hash: Mapped[str | None] = mapped_column(String(64))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("article_id", "fingerprint", name="uq_article_likes_article_fingerprint"),
        Index("ix_article_likes_article_id", "article_id"),
        Index("ix_article_likes_tenant_id", "tenant_id"),
    )


class ArticleShare(Base):
    __tablename__ = "article_shares"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)

    platform: Mapped[str] = mapped_column(String(32), nullable=False)  # facebook|twitter|linkedin|whatsapp|telegram|pinterest|copy
    fingerprint: Mapped[str | None] = mapped_column(String(64))
    ip_hash: Mapped[str | None] = mapped_column(String(64))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_article_shares_article_id", "article_id"),
        Index("ix_article_shares_tenant_id", "tenant_id"),
        Index("ix_article_shares_platform", "article_id", "platform"),
    )
