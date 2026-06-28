import uuid
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Request
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import (
    NotFoundException, ValidationException, PlanLimitReachedException,
)
from app.models.newsletter import NewsletterSubscriber, NewsletterCampaign
from app.models.enums import SubscriberStatus, CampaignStatus, UserRole
from app.services.tenant_service import get_tenant, PLAN_LIMITS
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/newsletter", tags=["newsletter"])


class SubscribeRequest(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    source: str | None = None


class SubscriberResponse(BaseModel):
    id: str
    email: str
    first_name: str | None
    last_name: str | None
    status: SubscriberStatus
    source: str | None
    created_at: datetime


class CreateCampaignRequest(BaseModel):
    name: str
    subject: str
    preview_text: str | None = None
    content_html: str | None = None
    content_json: dict | None = None
    is_paid: bool = False
    price: float | None = None
    scheduled_at: datetime | None = None


class CampaignResponse(BaseModel):
    id: str
    name: str
    subject: str
    status: CampaignStatus
    is_paid: bool
    price: float | None
    scheduled_at: datetime | None
    sent_at: datetime | None
    recipients_count: int
    opens_count: int
    clicks_count: int
    created_at: datetime


# ── Abonnement public ─────────────────────────────────────────────

@router.post("/subscribe", status_code=201)
async def subscribe(
    tenant_id: uuid.UUID,
    body: SubscribeRequest,
    request: Request,
    db: DBSession,
):
    tenant = await get_tenant(db, tenant_id)
    subs_max = PLAN_LIMITS[tenant.plan].get("subscribers_max")
    if subs_max is not None and tenant.subscribers_count >= subs_max:
        raise PlanLimitReachedException("subscribers", subs_max)

    existing = await db.execute(
        select(NewsletterSubscriber).where(
            NewsletterSubscriber.tenant_id == tenant_id,
            NewsletterSubscriber.email == body.email,
        )
    )
    sub = existing.scalar_one_or_none()
    if sub:
        if sub.status == SubscriberStatus.UNSUBSCRIBED:
            sub.status = SubscriberStatus.PENDING
            sub.confirmation_token = secrets.token_urlsafe(32)
            await db.commit()
            return {"message": "Un email de confirmation vous a été envoyé."}
        return {"message": "Vous êtes déjà abonné."}

    ip = request.client.host if request.client else None
    sub = NewsletterSubscriber(
        tenant_id=tenant_id,
        email=body.email,
        first_name=body.first_name,
        last_name=body.last_name,
        source=body.source or "website",
        confirmation_token=secrets.token_urlsafe(32),
        unsubscribe_token=secrets.token_urlsafe(32),
        ip_address=ip,
    )
    db.add(sub)
    await db.commit()
    # Envoi de l'email de confirmation double opt-in
    try:
        from app.core.config import settings as _settings
        confirm_url = f"https://{tenant.slug}.{_settings.PLATFORM_DOMAIN}/newsletter/confirm/{sub.confirmation_token}"
        from app.services.email_service import send_newsletter_confirmation
        await send_newsletter_confirmation(to=body.email, tenant_name=tenant.name, confirm_url=confirm_url)
    except Exception:
        pass
    return {"message": "Inscription enregistrée. Vérifiez votre email pour confirmer."}


# ── Confirmation double opt-in ─────────────────────────────────────

@router.get("/confirm/{token}")
async def confirm_subscription(
    tenant_id: uuid.UUID,
    token: str,
    db: DBSession,
):
    result = await db.execute(
        select(NewsletterSubscriber).where(
            NewsletterSubscriber.tenant_id == tenant_id,
            NewsletterSubscriber.confirmation_token == token,
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise NotFoundException("Token de confirmation")

    sub.status = SubscriberStatus.ACTIVE
    sub.confirmed_at = datetime.now(timezone.utc)
    sub.confirmation_token = None

    from sqlalchemy import text
    await db.execute(
        text("UPDATE tenants SET subscribers_count = subscribers_count + 1 WHERE id = :tid"),
        {"tid": str(tenant_id)},
    )
    await db.commit()
    return {"message": "Abonnement confirmé !"}


# ── Désabonnement ─────────────────────────────────────────────────

@router.get("/unsubscribe/{token}")
async def unsubscribe(
    tenant_id: uuid.UUID,
    token: str,
    db: DBSession,
):
    result = await db.execute(
        select(NewsletterSubscriber).where(
            NewsletterSubscriber.tenant_id == tenant_id,
            NewsletterSubscriber.unsubscribe_token == token,
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise NotFoundException("Token de désabonnement")

    sub.status = SubscriberStatus.UNSUBSCRIBED
    sub.unsubscribed_at = datetime.now(timezone.utc)

    from sqlalchemy import text
    await db.execute(
        text("UPDATE tenants SET subscribers_count = GREATEST(0, subscribers_count - 1) WHERE id = :tid"),
        {"tid": str(tenant_id)},
    )
    await db.commit()
    return {"message": "Désabonnement confirmé."}


# ── Gestion abonnés (admin) ────────────────────────────────────────

@router.get("/subscribers", response_model=list[SubscriberResponse])
async def list_subscribers(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    status: SubscriberStatus | None = None,
    limit: int = 50,
    cursor: str | None = None,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    query = select(NewsletterSubscriber).where(NewsletterSubscriber.tenant_id == tenant_id)
    if status:
        query = query.where(NewsletterSubscriber.status == status)
    if cursor:
        query = query.where(NewsletterSubscriber.created_at < datetime.fromisoformat(cursor))
    query = query.order_by(NewsletterSubscriber.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return [_sub_response(s) for s in result.scalars().all()]


# ── Campagnes ─────────────────────────────────────────────────────

@router.post("/campaigns", response_model=CampaignResponse, status_code=201)
async def create_campaign(
    tenant_id: uuid.UUID,
    body: CreateCampaignRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    campaign = NewsletterCampaign(
        tenant_id=tenant_id,
        created_by=uuid.UUID(payload["sub"]),
        name=body.name,
        subject=body.subject,
        preview_text=body.preview_text,
        content_html=body.content_html,
        content_json=body.content_json,
        is_paid=body.is_paid,
        price=body.price,
        scheduled_at=body.scheduled_at,
        status=CampaignStatus.SCHEDULED if body.scheduled_at else CampaignStatus.DRAFT,
    )
    db.add(campaign)
    await db.commit()
    await db.refresh(campaign)
    return _campaign_response(campaign)


@router.get("/campaigns", response_model=list[CampaignResponse])
async def list_campaigns(
    tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(NewsletterCampaign)
        .where(NewsletterCampaign.tenant_id == tenant_id)
        .order_by(NewsletterCampaign.created_at.desc())
    )
    return [_campaign_response(c) for c in result.scalars().all()]


@router.post("/campaigns/{campaign_id}/send", response_model=CampaignResponse)
async def send_campaign(
    tenant_id: uuid.UUID,
    campaign_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(NewsletterCampaign).where(
            NewsletterCampaign.id == campaign_id,
            NewsletterCampaign.tenant_id == tenant_id,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise NotFoundException("Campagne")
    if campaign.status not in (CampaignStatus.DRAFT, CampaignStatus.SCHEDULED):
        raise ValidationException("Cette campagne a déjà été envoyée ou annulée.")

    # Compter les abonnés actifs
    count_result = await db.execute(
        select(func.count()).where(
            NewsletterSubscriber.tenant_id == tenant_id,
            NewsletterSubscriber.status == SubscriberStatus.ACTIVE,
        )
    )
    campaign.recipients_count = count_result.scalar_one()
    campaign.status = CampaignStatus.SENDING
    campaign.sent_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(campaign)

    # TODO: enqueue tâche ARQ pour envoi email batch (sprint 3)
    return _campaign_response(campaign)


# ── Helpers ───────────────────────────────────────────────────────

def _sub_response(s: NewsletterSubscriber) -> SubscriberResponse:
    return SubscriberResponse(
        id=str(s.id), email=s.email, first_name=s.first_name,
        last_name=s.last_name, status=s.status,
        source=s.source, created_at=s.created_at,
    )


def _campaign_response(c: NewsletterCampaign) -> CampaignResponse:
    return CampaignResponse(
        id=str(c.id), name=c.name, subject=c.subject,
        status=c.status, is_paid=c.is_paid, price=c.price,
        scheduled_at=c.scheduled_at, sent_at=c.sent_at,
        recipients_count=c.recipients_count,
        opens_count=c.opens_count, clicks_count=c.clicks_count,
        created_at=c.created_at,
    )
