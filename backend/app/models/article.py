import uuid
from datetime import datetime
from sqlalchemy import String, Text, Boolean, Integer, DateTime, ForeignKey, Enum as SAEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.user import User
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from app.models.base import Base
from app.models.enums import ArticleType, ArticleStatus, ContentVisibility, ENUM_VALUES


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    author_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    # Contenu
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), nullable=False)
    excerpt: Mapped[str | None] = mapped_column(Text)
    content: Mapped[str | None] = mapped_column(Text)
    content_json: Mapped[dict | None] = mapped_column(JSONB)

    # Type & statut
    article_type: Mapped[ArticleType] = mapped_column(
        SAEnum(ArticleType, name="article_type", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=ArticleType.ARTICLE,
    )
    status: Mapped[ArticleStatus] = mapped_column(
        SAEnum(ArticleStatus, name="article_status", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=ArticleStatus.DRAFT,
    )
    visibility: Mapped[ContentVisibility] = mapped_column(
        SAEnum(ContentVisibility, name="content_visibility", create_type=False, values_callable=ENUM_VALUES),
        nullable=False, default=ContentVisibility.PUBLIC,
    )

    # Médias
    cover_image_url: Mapped[str | None] = mapped_column(Text)
    cover_image_alt: Mapped[str | None] = mapped_column(String(500))
    audio_url: Mapped[str | None] = mapped_column(Text)
    video_url: Mapped[str | None] = mapped_column(Text)
    audio_duration_seconds: Mapped[int | None] = mapped_column(Integer)

    # SEO
    seo_title: Mapped[str | None] = mapped_column(String(200))
    seo_description: Mapped[str | None] = mapped_column(Text)
    seo_keywords: Mapped[list | None] = mapped_column(ARRAY(String))
    canonical_url: Mapped[str | None] = mapped_column(Text)
    og_image_url: Mapped[str | None] = mapped_column(Text)

    # Organisation
    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"))
    reading_time_minutes: Mapped[int | None] = mapped_column(Integer)
    word_count: Mapped[int | None] = mapped_column(Integer)

    # Paiement
    price: Mapped[float | None] = mapped_column()
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="EUR")

    # Statistiques (mis à jour par workers)
    views_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    likes_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    comments_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    shares_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Flags
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    allow_comments: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    comments_closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Publication
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    unpublished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Versioning
    current_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    # Relations
    category: Mapped['Category | None'] = relationship('Category', foreign_keys='Article.category_id', lazy='select')
    author: Mapped['User | None'] = relationship('User', foreign_keys='Article.author_id', lazy='select')

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    __table_args__ = (
        Index("ix_articles_tenant_id", "tenant_id"),
        Index("ix_articles_slug", "tenant_id", "slug", unique=True),
        Index("ix_articles_status", "tenant_id", "status"),
        Index("ix_articles_published_at", "tenant_id", "published_at"),
        Index("ix_articles_author_id", "author_id"),
    )

    def __repr__(self) -> str:
        return f"<Article {self.slug} ({self.status})>"


class ArticleVersion(Base):
    __tablename__ = "article_versions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="CASCADE"), nullable=False)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[str | None] = mapped_column(Text)
    content_json: Mapped[dict | None] = mapped_column(JSONB)
    change_summary: Mapped[str | None] = mapped_column(String(500))
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_article_versions_article_id", "article_id"),
    )


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    cover_image_url: Mapped[str | None] = mapped_column(Text)
    seo_title: Mapped[str | None] = mapped_column(String(200))
    seo_description: Mapped[str | None] = mapped_column(Text)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    articles_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("ix_categories_tenant_slug", "tenant_id", "slug", unique=True),
    )


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    slug: Mapped[str] = mapped_column(String(100), nullable=False)
    articles_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)

    __table_args__ = (
        Index("ix_tags_tenant_slug", "tenant_id", "slug", unique=True),
    )


class ArticleTag(Base):
    __tablename__ = "article_tags"

    article_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("articles.id", ondelete="CASCADE"), primary_key=True)
    tag_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
