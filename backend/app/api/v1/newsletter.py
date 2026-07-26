import uuid
import secrets
import io
import csv
from datetime import datetime, timezone
from fastapi import APIRouter, Request, UploadFile, File
from sqlalchemy import select, func
from pydantic import BaseModel, EmailStr

from fastapi import Depends
from app.core.dependencies import TokenPayload, DBSession, check_plan_active
from app.core.exceptions import (
    NotFoundException, ValidationException, PlanLimitReachedException,
)
from app.models.newsletter import NewsletterSubscriber, NewsletterCampaign
from app.models.enums import SubscriberStatus, CampaignStatus, UserRole
from app.services.tenant_service import get_tenant, PLAN_LIMITS
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(
    prefix="/tenants/{tenant_id}/newsletter",
    tags=["newsletter"],
    dependencies=[Depends(check_plan_active)],
)


class SubscribeRequest(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None
    source: str | None = None


class TestEmailRequest(BaseModel):
    to_email: EmailStr


class SubscriberResponse(BaseModel):
    id: str
    email: str
    first_name: str | None
    last_name: str | None
    status: SubscriberStatus
    source: str | None
    tags: list[str] = []
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
        raise NotFoundException("Confirmation token")

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
        raise NotFoundException("Unsubscribe token")

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

@router.get("/subscribers/export")
async def export_subscribers_csv(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    status: SubscriberStatus | None = None,
):
    """Export subscribers as CSV (UTF-8 BOM so Excel opens correctly)."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    query = select(NewsletterSubscriber).where(NewsletterSubscriber.tenant_id == tenant_id)
    if status:
        query = query.where(NewsletterSubscriber.status == status)
    result = await db.execute(query.order_by(NewsletterSubscriber.created_at.desc()))
    subs = result.scalars().all()

    import io, csv
    from fastapi.responses import StreamingResponse

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["email", "first_name", "last_name", "status", "source", "subscribed_at"])
    for s in subs:
        writer.writerow([
            s.email, s.first_name or "", s.last_name or "",
            s.status.value, s.source or "", s.created_at.isoformat(),
        ])
    csv_bytes = output.getvalue().encode("utf-8-sig")
    return StreamingResponse(
        io.BytesIO(csv_bytes),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=subscribers.csv"},
    )


@router.post("/subscribers/import")
async def import_subscribers_csv(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    file: UploadFile = File(...),
):
    """Importe des abonnés depuis un CSV (colonnes : email, first_name?, last_name?)."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)

    content = await file.read()
    # Support BOM UTF-8
    text_content = content.decode("utf-8-sig", errors="replace")
    reader = csv.DictReader(io.StringIO(text_content))

    imported = 0
    skipped = 0
    errors = 0

    for row in reader:
        email = (row.get("email") or "").strip().lower()
        if not email or "@" not in email:
            errors += 1
            continue

        existing = await db.execute(
            select(NewsletterSubscriber).where(
                NewsletterSubscriber.tenant_id == tenant_id,
                NewsletterSubscriber.email == email,
            )
        )
        if existing.scalar_one_or_none():
            skipped += 1
            continue

        sub = NewsletterSubscriber(
            tenant_id=tenant_id,
            email=email,
            first_name=(row.get("first_name") or "").strip() or None,
            last_name=(row.get("last_name") or "").strip() or None,
            source="import",
            status=SubscriberStatus.ACTIVE,
            confirmed_at=datetime.now(timezone.utc),
            unsubscribe_token=secrets.token_urlsafe(32),
        )
        db.add(sub)
        imported += 1

    if imported > 0:
        from sqlalchemy import text
        await db.execute(
            text("UPDATE tenants SET subscribers_count = subscribers_count + :n WHERE id = :tid"),
            {"n": imported, "tid": str(tenant_id)},
        )
    await db.commit()
    return {"imported": imported, "skipped": skipped, "errors": errors}


@router.get("/subscribers", response_model=list[SubscriberResponse])
async def list_subscribers(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    status: SubscriberStatus | None = None,
    q: str | None = None,
    tag: str | None = None,
    limit: int = 50,
    cursor: str | None = None,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    query = select(NewsletterSubscriber).where(NewsletterSubscriber.tenant_id == tenant_id)
    if status:
        query = query.where(NewsletterSubscriber.status == status)
    if q:
        query = query.where(
            NewsletterSubscriber.email.ilike(f"%{q}%") |
            NewsletterSubscriber.first_name.ilike(f"%{q}%") |
            NewsletterSubscriber.last_name.ilike(f"%{q}%")
        )
    if tag:
        query = query.where(NewsletterSubscriber.tags.contains([tag]))
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
        raise NotFoundException("Campaign")
    if campaign.status not in (CampaignStatus.DRAFT, CampaignStatus.SCHEDULED):
        raise ValidationException("This campaign has already been sent or canceled.")

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

    # Enqueue tâche ARQ — envoi réel en arrière-plan
    try:
        from app.core.arq_pool import get_arq_pool
        pool = await get_arq_pool()
        await pool.enqueue_job("send_newsletter_campaign", campaign_id=str(campaign.id))
    except Exception:
        pass  # Le statut SENDING permettra un réessai manuel si Redis est indisponible

    return _campaign_response(campaign)


@router.post("/campaigns/{campaign_id}/test", status_code=204)
async def test_campaign(
    tenant_id: uuid.UUID,
    campaign_id: uuid.UUID,
    body: TestEmailRequest,
    payload: TokenPayload,
    db: DBSession,
):
    """Send a single test email for a campaign without changing its status."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(NewsletterCampaign).where(
            NewsletterCampaign.id == campaign_id,
            NewsletterCampaign.tenant_id == tenant_id,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise NotFoundException("Campaign")

    from app.services.tenant_service import get_tenant
    from app.services.email_service import send_newsletter_campaign
    tenant = await get_tenant(db, tenant_id)
    unsubscribe_url = f"https://{tenant.slug}.smarterbloggers.com/unsubscribe"
    await send_newsletter_campaign(
        to=[body.to_email],
        from_name=tenant.name,
        subject=f"[TEST] {campaign.subject}",
        html=campaign.content_html or f"<p>{campaign.name}</p>",
        unsubscribe_url=unsubscribe_url,
    )


# ── Helpers ───────────────────────────────────────────────────────

def _sub_response(s: NewsletterSubscriber) -> SubscriberResponse:
    return SubscriberResponse(
        id=str(s.id), email=s.email, first_name=s.first_name,
        last_name=s.last_name, status=s.status,
        source=s.source, tags=s.tags or [], created_at=s.created_at,
    )


# ── POST /newsletter/campaigns/{id}/checkout ─────────────────────

class NewsletterCheckoutRequest(BaseModel):
    email: EmailStr


@router.post("/campaigns/{campaign_id}/checkout", status_code=201)
async def checkout_newsletter(
    tenant_id: uuid.UUID,
    campaign_id: uuid.UUID,
    body: NewsletterCheckoutRequest,
    payload: TokenPayload,
    db: DBSession,
):
    """Crée un paiement NowPayments intégré pour accéder à une newsletter payante."""
    from app.api.v1.payments import _create_crypto_transaction, _crypto_response
    from app.models.enums import TransactionType

    result = await db.execute(
        select(NewsletterCampaign).where(
            NewsletterCampaign.id == campaign_id,
            NewsletterCampaign.tenant_id == tenant_id,
        )
    )
    campaign = result.scalar_one_or_none()
    if not campaign:
        raise NotFoundException("Campaign")
    if not campaign.is_paid or not campaign.price or campaign.price <= 0:
        raise ValidationException("This newsletter is not paid.")

    from app.models.newsletter import NewsletterAccess
    existing = await db.execute(
        select(NewsletterAccess).where(
            NewsletterAccess.campaign_id == campaign_id,
            NewsletterAccess.email == str(body.email),
        )
    )
    if existing.scalar_one_or_none():
        raise ValidationException("You already have access to this newsletter.")

    order_id = f"nl_{tenant_id}_{campaign_id}_{uuid.uuid4().hex[:8]}"

    user_id_val = None
    try:
        user_id_val = uuid.UUID(payload["sub"])
    except Exception:
        pass

    tx, _ = await _create_crypto_transaction(
        db,
        tenant_id=tenant_id,
        user_id=user_id_val,
        transaction_type=TransactionType.PAID_NEWSLETTER,
        amount_usd=campaign.price,
        order_id=order_id,
        order_description=campaign.subject[:100],
        campaign_id=campaign_id,
    )

    # Enregistrer l'accès en attente (granted_at=null jusqu'à la confirmation)
    db.add(NewsletterAccess(
        tenant_id=tenant_id,
        campaign_id=campaign_id,
        user_id=user_id_val,
        email=str(body.email),
        nowpayments_order_id=order_id,
    ))
    await db.commit()

    return _crypto_response(tx, campaign.price)


def _campaign_response(c: NewsletterCampaign) -> CampaignResponse:
    return CampaignResponse(
        id=str(c.id), name=c.name, subject=c.subject,
        status=c.status, is_paid=c.is_paid, price=c.price,
        scheduled_at=c.scheduled_at, sent_at=c.sent_at,
        recipients_count=c.recipients_count,
        opens_count=c.opens_count, clicks_count=c.clicks_count,
        created_at=c.created_at,
    )
