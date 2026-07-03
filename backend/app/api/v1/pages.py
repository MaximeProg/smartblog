import uuid

from fastapi import APIRouter, Query

from app.api.v1.tenants import _assert_member, _assert_role
from app.core.dependencies import DBSession, TokenPayload
from app.models.enums import UserRole
from app.models.page import PageStatus
from app.schemas.page import (
    CreatePageRequest,
    MenuResponse,
    PageListItem,
    PageResponse,
    SetStatusRequest,
    UpdateMenuRequest,
    UpdatePageRequest,
)
from app.services.page_service import (
    create_page,
    delete_page,
    get_page,
    list_menus,
    list_pages,
    set_homepage,
    set_status,
    update_page,
    upsert_menu,
)

pages_router = APIRouter(prefix="/tenants/{tenant_id}/pages", tags=["pages"])
menus_router = APIRouter(prefix="/tenants/{tenant_id}/menus", tags=["menus"])


# ── Pages ─────────────────────────────────────────────────────────────────────

@pages_router.get("", response_model=list[PageListItem])
async def list_(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    status: PageStatus | None = Query(default=None),
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    return await list_pages(db, tenant_id, status)


@pages_router.post("", response_model=PageResponse, status_code=201)
async def create(
    tenant_id: uuid.UUID,
    body: CreatePageRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    return await create_page(db, tenant_id, uuid.UUID(payload["sub"]), body)


@pages_router.get("/{page_id}", response_model=PageResponse)
async def get_one(
    tenant_id: uuid.UUID,
    page_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    return await get_page(db, tenant_id, page_id)


@pages_router.patch("/{page_id}", response_model=PageResponse)
async def update(
    tenant_id: uuid.UUID,
    page_id: uuid.UUID,
    body: UpdatePageRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    return await update_page(db, tenant_id, page_id, body)


@pages_router.post("/{page_id}/status", response_model=PageResponse)
async def change_status(
    tenant_id: uuid.UUID,
    page_id: uuid.UUID,
    body: SetStatusRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    return await set_status(db, tenant_id, page_id, body.status)


@pages_router.post("/{page_id}/homepage", response_model=PageResponse)
async def make_homepage(
    tenant_id: uuid.UUID,
    page_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    return await set_homepage(db, tenant_id, page_id)


@pages_router.delete("/{page_id}", status_code=204)
async def delete(
    tenant_id: uuid.UUID,
    page_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    await delete_page(db, tenant_id, page_id)


# ── Menus ─────────────────────────────────────────────────────────────────────

@menus_router.get("", response_model=list[MenuResponse])
async def list_menus_(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    return await list_menus(db, tenant_id)


@menus_router.put("/{location}", response_model=MenuResponse)
async def update_menu(
    tenant_id: uuid.UUID,
    location: str,
    body: UpdateMenuRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    name_map = {"primary": "Principal", "footer": "Pied de page", "mobile": "Mobile"}
    name = name_map.get(location, location.capitalize())
    return await upsert_menu(
        db, tenant_id, location, name,
        [item.model_dump() for item in body.items],
    )
