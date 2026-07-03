import re
from datetime import datetime
from pydantic import BaseModel, field_validator

from app.models.page import PageStatus, PageType


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return re.sub(r"^-+|-+$", "", text)


# ── Requests ──────────────────────────────────────────────────────────────────

class CreatePageRequest(BaseModel):
    title: str
    slug: str | None = None
    page_type: PageType = PageType.STANDARD
    blocks: list[dict] = []
    meta_title: str | None = None
    meta_description: str | None = None

    @field_validator("slug", mode="before")
    @classmethod
    def auto_slug(cls, v, info):
        if not v:
            title = info.data.get("title", "")
            return slugify(title) if title else None
        return slugify(v)


class UpdatePageRequest(BaseModel):
    title: str | None = None
    slug: str | None = None
    blocks: list[dict] | None = None
    meta_title: str | None = None
    meta_description: str | None = None
    og_image_url: str | None = None
    sort_order: int | None = None


class SetStatusRequest(BaseModel):
    status: PageStatus


# ── Responses ─────────────────────────────────────────────────────────────────

class PageListItem(BaseModel):
    id: str
    title: str
    slug: str
    status: PageStatus
    page_type: PageType
    is_homepage: bool
    sort_order: int
    updated_at: datetime
    published_at: datetime | None

    model_config = {"from_attributes": True}


class PageResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    slug: str
    status: PageStatus
    page_type: PageType
    is_homepage: bool
    blocks: list[dict]
    meta_title: str | None
    meta_description: str | None
    og_image_url: str | None
    sort_order: int
    created_at: datetime
    updated_at: datetime
    published_at: datetime | None

    model_config = {"from_attributes": True}


# ── Menu schemas ───────────────────────────────────────────────────────────────

class MenuItemRequest(BaseModel):
    id: str | None = None
    label: str
    type: str               # page, article, category, custom, separator
    ref_id: str | None = None
    url: str | None = None
    open_new_tab: bool = False
    children: list["MenuItemRequest"] = []


MenuItemRequest.model_rebuild()


class UpdateMenuRequest(BaseModel):
    items: list[MenuItemRequest]


class MenuResponse(BaseModel):
    id: str
    tenant_id: str
    name: str
    location: str
    items: list[dict]
    updated_at: datetime

    model_config = {"from_attributes": True}
