import uuid
import secrets
from datetime import datetime
from fastapi import APIRouter
from sqlalchemy import select
from pydantic import BaseModel, HttpUrl

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException
from app.models.webhook import WebhookEndpoint, WebhookDelivery
from app.models.enums import UserRole
from app.services.webhook_service import SUPPORTED_EVENTS
from app.api.v1.tenants import _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/webhooks", tags=["webhooks"])


class CreateWebhookRequest(BaseModel):
    url: str
    events: list[str]
    description: str | None = None


class UpdateWebhookRequest(BaseModel):
    url: str | None = None
    events: list[str] | None = None
    description: str | None = None
    is_active: bool | None = None


class WebhookResponse(BaseModel):
    id: str
    url: str
    events: list[str]
    is_active: bool
    description: str | None
    created_at: datetime


class DeliveryResponse(BaseModel):
    id: str
    event: str
    status_code: int | None
    success: bool
    duration_ms: int | None
    attempt: int
    created_at: datetime


@router.get("/events")
async def list_supported_events(payload: TokenPayload, db: DBSession, tenant_id: uuid.UUID):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    return {"events": SUPPORTED_EVENTS}


@router.get("", response_model=list[WebhookResponse])
async def list_webhooks(tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    result = await db.execute(
        select(WebhookEndpoint)
        .where(WebhookEndpoint.tenant_id == tenant_id)
        .order_by(WebhookEndpoint.created_at.desc())
    )
    return [_ep_response(ep) for ep in result.scalars().all()]


@router.post("", response_model=WebhookResponse, status_code=201)
async def create_webhook(
    tenant_id: uuid.UUID,
    body: CreateWebhookRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)

    invalid = [e for e in body.events if e not in SUPPORTED_EVENTS]
    if invalid:
        raise ValidationException(f"Événements non supportés : {invalid}")

    ep = WebhookEndpoint(
        tenant_id=tenant_id,
        created_by=uuid.UUID(payload["sub"]),
        url=body.url,
        secret=secrets.token_hex(32),
        events=body.events,
        description=body.description,
    )
    db.add(ep)
    await db.commit()
    await db.refresh(ep)
    return _ep_response(ep)


@router.patch("/{webhook_id}", response_model=WebhookResponse)
async def update_webhook(
    tenant_id: uuid.UUID, webhook_id: uuid.UUID,
    body: UpdateWebhookRequest, payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    ep = await _get_or_404(db, tenant_id, webhook_id)

    if body.url is not None:
        ep.url = body.url
    if body.events is not None:
        invalid = [e for e in body.events if e not in SUPPORTED_EVENTS]
        if invalid:
            raise ValidationException(f"Événements non supportés : {invalid}")
        ep.events = body.events
    if body.description is not None:
        ep.description = body.description
    if body.is_active is not None:
        ep.is_active = body.is_active

    await db.commit()
    await db.refresh(ep)
    return _ep_response(ep)


@router.delete("/{webhook_id}", status_code=204)
async def delete_webhook(
    tenant_id: uuid.UUID, webhook_id: uuid.UUID,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    ep = await _get_or_404(db, tenant_id, webhook_id)
    await db.delete(ep)
    await db.commit()


@router.post("/{webhook_id}/rotate-secret", response_model=dict)
async def rotate_secret(
    tenant_id: uuid.UUID, webhook_id: uuid.UUID,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    ep = await _get_or_404(db, tenant_id, webhook_id)
    ep.secret = secrets.token_hex(32)
    await db.commit()
    return {"secret": ep.secret, "message": "Mettez à jour votre endpoint avec ce nouveau secret."}


@router.get("/{webhook_id}/deliveries", response_model=list[DeliveryResponse])
async def list_deliveries(
    tenant_id: uuid.UUID, webhook_id: uuid.UUID,
    payload: TokenPayload, db: DBSession,
    limit: int = 50,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    await _get_or_404(db, tenant_id, webhook_id)
    result = await db.execute(
        select(WebhookDelivery)
        .where(WebhookDelivery.endpoint_id == webhook_id)
        .order_by(WebhookDelivery.created_at.desc())
        .limit(limit)
    )
    return [DeliveryResponse(
        id=str(d.id), event=d.event, status_code=d.status_code,
        success=d.success, duration_ms=d.duration_ms,
        attempt=d.attempt, created_at=d.created_at,
    ) for d in result.scalars().all()]


async def _get_or_404(db, tenant_id: uuid.UUID, webhook_id: uuid.UUID) -> WebhookEndpoint:
    result = await db.execute(
        select(WebhookEndpoint).where(
            WebhookEndpoint.id == webhook_id,
            WebhookEndpoint.tenant_id == tenant_id,
        )
    )
    ep = result.scalar_one_or_none()
    if not ep:
        raise NotFoundException("Webhook")
    return ep


def _ep_response(ep: WebhookEndpoint) -> WebhookResponse:
    return WebhookResponse(
        id=str(ep.id), url=ep.url, events=ep.events,
        is_active=ep.is_active, description=ep.description,
        created_at=ep.created_at,
    )
