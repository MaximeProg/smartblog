import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundException, ForbiddenException
from app.models.page import Page, PageStatus, PageType, Menu
from app.schemas.page import CreatePageRequest, UpdatePageRequest, SetStatusRequest


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _page_to_dict(page: Page) -> dict:
    return {
        "id": str(page.id),
        "tenant_id": str(page.tenant_id),
        "title": page.title,
        "slug": page.slug,
        "status": page.status,
        "page_type": page.page_type,
        "is_homepage": page.is_homepage,
        "blocks": page.blocks,
        "meta_title": page.meta_title,
        "meta_description": page.meta_description,
        "og_image_url": page.og_image_url,
        "sort_order": page.sort_order,
        "created_at": page.created_at,
        "updated_at": page.updated_at,
        "published_at": page.published_at,
    }


# ── Pages ─────────────────────────────────────────────────────────────────────

async def list_pages(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    status: PageStatus | None = None,
) -> list[dict]:
    q = (
        select(Page)
        .where(Page.tenant_id == tenant_id, Page.deleted_at.is_(None))
        .order_by(Page.sort_order, Page.created_at)
    )
    if status:
        q = q.where(Page.status == status)
    result = await db.execute(q)
    pages = result.scalars().all()
    return [_page_to_dict(p) for p in pages]


async def get_page(
    db: AsyncSession, tenant_id: uuid.UUID, page_id: uuid.UUID
) -> dict:
    result = await db.execute(
        select(Page).where(
            Page.id == page_id,
            Page.tenant_id == tenant_id,
            Page.deleted_at.is_(None),
        )
    )
    page = result.scalar_one_or_none()
    if not page:
        raise NotFoundException("Page")
    return _page_to_dict(page)


async def create_page(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    created_by: uuid.UUID,
    data: CreatePageRequest,
) -> dict:
    now = _now()
    page = Page(
        tenant_id=tenant_id,
        created_by=created_by,
        title=data.title,
        slug=data.slug or _slugify(data.title),
        page_type=data.page_type,
        blocks=data.blocks,
        meta_title=data.meta_title,
        meta_description=data.meta_description,
        status=PageStatus.DRAFT,
        created_at=now,
        updated_at=now,
    )
    db.add(page)
    await db.commit()
    await db.refresh(page)
    return _page_to_dict(page)


async def update_page(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    page_id: uuid.UUID,
    data: UpdatePageRequest,
) -> dict:
    result = await db.execute(
        select(Page).where(
            Page.id == page_id,
            Page.tenant_id == tenant_id,
            Page.deleted_at.is_(None),
        )
    )
    page = result.scalar_one_or_none()
    if not page:
        raise NotFoundException("Page")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(page, field, value)
    page.updated_at = _now()

    await db.commit()
    await db.refresh(page)
    return _page_to_dict(page)


async def set_status(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    page_id: uuid.UUID,
    status: PageStatus,
) -> dict:
    result = await db.execute(
        select(Page).where(
            Page.id == page_id,
            Page.tenant_id == tenant_id,
            Page.deleted_at.is_(None),
        )
    )
    page = result.scalar_one_or_none()
    if not page:
        raise NotFoundException("Page")

    now = _now()
    page.status = status
    page.updated_at = now
    if status == PageStatus.PUBLISHED and not page.published_at:
        page.published_at = now

    await db.commit()
    await db.refresh(page)
    return _page_to_dict(page)


async def set_homepage(
    db: AsyncSession, tenant_id: uuid.UUID, page_id: uuid.UUID
) -> dict:
    # Unset any existing homepage
    await db.execute(
        update(Page)
        .where(Page.tenant_id == tenant_id, Page.is_homepage.is_(True))
        .values(is_homepage=False, updated_at=_now())
    )

    result = await db.execute(
        select(Page).where(
            Page.id == page_id,
            Page.tenant_id == tenant_id,
            Page.deleted_at.is_(None),
        )
    )
    page = result.scalar_one_or_none()
    if not page:
        raise NotFoundException("Page")

    page.is_homepage = True
    page.updated_at = _now()
    await db.commit()
    await db.refresh(page)
    return _page_to_dict(page)


async def delete_page(
    db: AsyncSession, tenant_id: uuid.UUID, page_id: uuid.UUID
) -> None:
    result = await db.execute(
        select(Page).where(
            Page.id == page_id,
            Page.tenant_id == tenant_id,
            Page.deleted_at.is_(None),
        )
    )
    page = result.scalar_one_or_none()
    if not page:
        raise NotFoundException("Page")
    if page.page_type == PageType.SYSTEM:
        raise ForbiddenException("Les pages système ne peuvent pas être supprimées")

    page.deleted_at = _now()
    await db.commit()


# ── Menus ─────────────────────────────────────────────────────────────────────

async def get_menu(
    db: AsyncSession, tenant_id: uuid.UUID, location: str
) -> dict | None:
    result = await db.execute(
        select(Menu).where(Menu.tenant_id == tenant_id, Menu.location == location)
    )
    menu = result.scalar_one_or_none()
    if not menu:
        return None
    return {
        "id": str(menu.id),
        "tenant_id": str(menu.tenant_id),
        "name": menu.name,
        "location": menu.location,
        "items": menu.items,
        "updated_at": menu.updated_at,
    }


async def list_menus(db: AsyncSession, tenant_id: uuid.UUID) -> list[dict]:
    result = await db.execute(
        select(Menu).where(Menu.tenant_id == tenant_id).order_by(Menu.location)
    )
    menus = result.scalars().all()
    return [
        {
            "id": str(m.id),
            "tenant_id": str(m.tenant_id),
            "name": m.name,
            "location": m.location,
            "items": m.items,
            "updated_at": m.updated_at,
        }
        for m in menus
    ]


async def upsert_menu(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    location: str,
    name: str,
    items: list[dict],
) -> dict:
    result = await db.execute(
        select(Menu).where(Menu.tenant_id == tenant_id, Menu.location == location)
    )
    menu = result.scalar_one_or_none()
    now = _now()

    if menu:
        menu.items = items
        menu.updated_at = now
    else:
        menu = Menu(
            tenant_id=tenant_id,
            name=name,
            location=location,
            items=items,
            created_at=now,
            updated_at=now,
        )
        db.add(menu)

    await db.commit()
    await db.refresh(menu)
    return {
        "id": str(menu.id),
        "tenant_id": str(menu.tenant_id),
        "name": menu.name,
        "location": menu.location,
        "items": menu.items,
        "updated_at": menu.updated_at,
    }


# ── Internal helpers ──────────────────────────────────────────────────────────

def _slugify(text: str) -> str:
    import re
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return re.sub(r"^-+|-+$", "", text)
