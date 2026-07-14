import uuid
import secrets
import hashlib
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select

from app.core.dependencies import TokenPayload, DBSession, check_plan_active
from app.core.exceptions import NotFoundException
from app.models.api_key import TenantApiKey
from app.models.enums import UserRole
from app.api.v1.tenants import _assert_role

router = APIRouter(
    prefix="/tenants/{tenant_id}/api-keys",
    tags=["api-keys"],
    dependencies=[Depends(check_plan_active)],
)


class CreateApiKeyRequest(BaseModel):
    name: str
    expires_at: datetime | None = None


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    is_active: bool
    last_used_at: datetime | None
    expires_at: datetime | None
    created_at: datetime


class ApiKeyCreatedResponse(ApiKeyResponse):
    key: str  # full key — shown only once at creation


def _hash_key(key: str) -> str:
    return hashlib.sha256(key.encode()).hexdigest()


def _fmt(k: TenantApiKey) -> ApiKeyResponse:
    return ApiKeyResponse(
        id=str(k.id),
        name=k.name,
        key_prefix=k.key_prefix,
        is_active=k.is_active,
        last_used_at=k.last_used_at,
        expires_at=k.expires_at,
        created_at=k.created_at,
    )


@router.get("", response_model=list[ApiKeyResponse])
async def list_api_keys(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.ADMIN)
    result = await db.execute(
        select(TenantApiKey)
        .where(TenantApiKey.tenant_id == tenant_id, TenantApiKey.is_active == True)
        .order_by(TenantApiKey.created_at.desc())
    )
    return [_fmt(k) for k in result.scalars().all()]


@router.post("", response_model=ApiKeyCreatedResponse, status_code=201)
async def create_api_key(
    tenant_id: uuid.UUID,
    body: CreateApiKeyRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.ADMIN)

    raw_key = f"sb_live_{secrets.token_urlsafe(32)}"
    prefix = raw_key[:12]  # "sb_live_XXXX"

    key = TenantApiKey(
        tenant_id=tenant_id,
        created_by=uuid.UUID(payload["sub"]),
        name=body.name.strip(),
        key_prefix=prefix,
        key_hash=_hash_key(raw_key),
        expires_at=body.expires_at,
    )
    db.add(key)
    await db.commit()
    await db.refresh(key)

    return ApiKeyCreatedResponse(
        **_fmt(key).model_dump(),
        key=raw_key,
    )


@router.delete("/{key_id}", status_code=204)
async def revoke_api_key(
    tenant_id: uuid.UUID,
    key_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.ADMIN)
    result = await db.execute(
        select(TenantApiKey).where(
            TenantApiKey.id == key_id,
            TenantApiKey.tenant_id == tenant_id,
        )
    )
    key = result.scalar_one_or_none()
    if not key:
        raise NotFoundException("API key")
    key.is_active = False
    await db.commit()
