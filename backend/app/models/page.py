import enum
import uuid as uuid_mod
from datetime import datetime

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PageStatus(str, enum.Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    PRIVATE = "private"


class PageType(str, enum.Enum):
    STANDARD = "standard"
    SYSTEM = "system"      # 404, search, …  — always present, not deletable
    DYNAMIC = "dynamic"    # auto-generated (articles listing)


class Page(Base):
    __tablename__ = "pages"

    id: Mapped[uuid_mod.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_mod.uuid4
    )
    tenant_id: Mapped[uuid_mod.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    created_by: Mapped[uuid_mod.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    slug: Mapped[str] = mapped_column(String(500), nullable=False)
    status: Mapped[PageStatus] = mapped_column(
        SAEnum(PageStatus, name="page_status", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=PageStatus.DRAFT,
    )
    page_type: Mapped[PageType] = mapped_column(
        SAEnum(PageType, name="page_type", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        default=PageType.STANDARD,
    )
    is_homepage: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    blocks: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    meta_title: Mapped[str | None] = mapped_column(String(500), nullable=True)
    meta_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    og_image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(nullable=True)


class Menu(Base):
    __tablename__ = "menus"

    id: Mapped[uuid_mod.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid_mod.uuid4
    )
    tenant_id: Mapped[uuid_mod.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    location: Mapped[str] = mapped_column(String(50), nullable=False, default="primary")
    items: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)
