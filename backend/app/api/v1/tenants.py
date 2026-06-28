import uuid
from fastapi import APIRouter, Request
from sqlalchemy import select

from app.core.dependencies import TokenPayload, DBSession, require_role
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.enums import UserRole
from app.models.tenant_user import TenantUser
from app.schemas.tenant import (
    CreateTenantRequest, UpdateTenantRequest,
    TenantResponse, SlugCheckResponse,
)
from app.services.tenant_service import (
    check_slug_available, create_tenant, get_tenant,
    update_tenant, delete_tenant, get_user_tenants,
    build_tenant_response,
)

router = APIRouter(prefix="/tenants", tags=["tenants"])


# ── GET /tenants/check-slug?slug=xxx ──────────────────────────────

@router.get("/check-slug", response_model=SlugCheckResponse)
async def check_slug(slug: str, db: DBSession):
    return await check_slug_available(db, slug)


# ── GET /tenants/me — tenants de l'utilisateur connecté ──────────

@router.get("/me")
async def list_my_tenants(payload: TokenPayload, db: DBSession):
    user_id = uuid.UUID(payload["sub"])
    return await get_user_tenants(db, user_id)


# ── POST /tenants — créer un blog ─────────────────────────────────

@router.post("", response_model=TenantResponse, status_code=201)
async def create(
    body: CreateTenantRequest,
    payload: TokenPayload,
    db: DBSession,
):
    user_id = uuid.UUID(payload["sub"])
    tenant = await create_tenant(db, user_id, body)
    return build_tenant_response(tenant, include_limits=True, include_usage=True)


# ── GET /tenants/{tenant_id} ──────────────────────────────────────

@router.get("/{tenant_id}", response_model=TenantResponse)
async def get_one(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    tenant = await get_tenant(db, tenant_id)
    return build_tenant_response(tenant, include_limits=True, include_usage=True)


# ── PATCH /tenants/{tenant_id} ────────────────────────────────────

@router.patch("/{tenant_id}", response_model=TenantResponse)
async def update(
    tenant_id: uuid.UUID,
    body: UpdateTenantRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    tenant = await update_tenant(db, tenant_id, body)
    return build_tenant_response(tenant, include_limits=True, include_usage=True)


# ── DELETE /tenants/{tenant_id} ───────────────────────────────────

@router.delete("/{tenant_id}", status_code=204)
async def delete(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    await delete_tenant(db, tenant_id)


# ── Helpers RBAC ──────────────────────────────────────────────────

async def _assert_member(db, tenant_id: uuid.UUID, user_id: uuid.UUID, payload: dict) -> TenantUser:
    if payload.get("is_super_admin"):
        return None
    result = await db.execute(
        select(TenantUser).where(
            TenantUser.tenant_id == tenant_id,
            TenantUser.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise ForbiddenException("Vous n'êtes pas membre de ce blog.")
    return member


async def _assert_role(
    db, tenant_id: uuid.UUID, user_id: uuid.UUID,
    payload: dict, required_role: UserRole,
) -> TenantUser:
    if payload.get("is_super_admin"):
        return None
    member = await _assert_member(db, tenant_id, user_id, payload)
    role_order = [UserRole.VIEWER, UserRole.AUTHOR, UserRole.EDITOR, UserRole.TENANT_ADMIN]
    if role_order.index(member.role) < role_order.index(required_role):
        raise ForbiddenException(f"Rôle {required_role.value} requis.")
    return member
