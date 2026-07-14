import asyncio
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Query, BackgroundTasks
from sqlalchemy import select
from pydantic import BaseModel, HttpUrl

from app.core.config import settings
from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException, ForbiddenException
from app.models.ad import Ad, AdLinkScan
from app.models.enums import AdSubmissionStatus, AdCampaignStatus, LinkSafetyStatus, UserRole
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/ads", tags=["ads"])


# ── Schemas ───────────────────────────────────────────────────────

class SubmitAdRequest(BaseModel):
    advertiser_name: str
    advertiser_email: str
    advertiser_company: str | None = None
    title: str
    description: str | None = None
    image_url: str | None = None
    click_url: str
    placement: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    price_per_day: float | None = None
    total_budget: float
    currency: str = "USD"
    success_url: str | None = None
    cancel_url: str | None = None


class SubmitAdCheckoutResponse(BaseModel):
    ad_id: str
    invoice_url: str
    invoice_id: str
    amount: float
    currency: str


class ReviewAdRequest(BaseModel):
    decision: AdSubmissionStatus  # APPROVED | REJECTED
    rejection_reason: str | None = None


class AdResponse(BaseModel):
    id: str
    advertiser_name: str
    advertiser_company: str | None
    title: str
    description: str | None
    image_url: str | None
    click_url: str
    placement: str | None
    submission_status: AdSubmissionStatus
    campaign_status: AdCampaignStatus
    link_safety_status: LinkSafetyStatus
    link_last_scanned_at: datetime | None
    starts_at: datetime | None
    ends_at: datetime | None
    impressions_count: int
    clicks_count: int
    payment_link_url: str | None
    created_at: datetime


class AdScanResponse(BaseModel):
    ad_id: str
    url: str
    safety_status: LinkSafetyStatus
    google_safe_browsing: dict | None
    virustotal: dict | None
    urlhaus: dict | None
    phishtank: dict | None
    scanned_at: datetime


# ── Soumission publicité (public / annonceur) ─────────────────────

@router.post("/submit", response_model=SubmitAdCheckoutResponse, status_code=201)
async def submit_ad(
    tenant_id: uuid.UUID,
    body: SubmitAdRequest,
    background: BackgroundTasks,
    db: DBSession,
):
    """Soumission d'une publicité + création invoice NowPayments. Sans auth requise."""
    if body.total_budget <= 0:
        raise ValidationException("Le budget doit être supérieur à 0.")

    ad = Ad(
        tenant_id=tenant_id,
        advertiser_name=body.advertiser_name,
        advertiser_email=body.advertiser_email,
        advertiser_company=body.advertiser_company,
        title=body.title,
        description=body.description,
        image_url=body.image_url,
        click_url=body.click_url,
        placement=body.placement,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        price_per_day=body.price_per_day,
        total_budget=body.total_budget,
        submission_status=AdSubmissionStatus.PAYMENT_PENDING,
    )
    db.add(ad)
    await db.commit()
    await db.refresh(ad)

    background.add_task(_scan_ad_link, str(ad.id), ad.click_url)

    from app.services.nowpayments_service import create_invoice

    order_id = f"ad_{tenant_id}_{ad.id}_{uuid.uuid4().hex[:8]}"
    frontend_url = settings.FRONTEND_URL or ""

    invoice = await create_invoice(
        price_amount=body.total_budget,
        price_currency=body.currency.lower(),
        order_id=order_id,
        order_description=f"Ad slot: {body.title[:80]}",
        success_url=body.success_url or f"{frontend_url}/advertise?payment=success&ad_id={ad.id}",
        cancel_url=body.cancel_url or f"{frontend_url}/advertise?payment=cancelled",
        ipn_callback_url=f"{settings.PLATFORM_API_DOMAIN or frontend_url}/api/v1/tenants/{tenant_id}/payments/webhook/nowpayments",
    )

    ad.payment_link_url = invoice["invoice_url"]
    ad.payment_session_id = str(invoice["id"])
    await db.commit()

    # Notify super admins of new ad submission
    try:
        from app.services.email_service import send_superadmin_event
        from app.services.auth_service import _get_super_admin_emails
        from sqlalchemy import select as _select
        from app.models.tenant import Tenant as _Tenant
        sa_emails = await _get_super_admin_emails(db)
        tenant_res = await db.execute(_select(_Tenant).where(_Tenant.id == tenant_id))
        tenant_obj = tenant_res.scalar_one_or_none()
        await send_superadmin_event(
            to=sa_emails,
            event_type="ad.submitted",
            title=f"New ad submission — {body.title}",
            details=f"Budget: {body.total_budget} {body.currency} · Blog: {tenant_obj.slug if tenant_obj else tenant_id}",
            actor_email=body.advertiser_email,
        )
    except Exception:
        pass

    return SubmitAdCheckoutResponse(
        ad_id=str(ad.id),
        invoice_url=invoice["invoice_url"],
        invoice_id=str(invoice["id"]),
        amount=body.total_budget,
        currency=body.currency,
    )


# ── Listing ads (admin) ───────────────────────────────────────────

@router.get("", response_model=list[AdResponse])
async def list_ads(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    status: AdSubmissionStatus | None = Query(default=None),
    safety: LinkSafetyStatus | None = Query(default=None),
    limit: int = Query(default=20, le=100),
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    query = select(Ad).where(Ad.tenant_id == tenant_id)
    if status:
        query = query.where(Ad.submission_status == status)
    if safety:
        query = query.where(Ad.link_safety_status == safety)
    query = query.order_by(Ad.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return [_ad_response(a) for a in result.scalars().all()]


# ── Modération ────────────────────────────────────────────────────

@router.post("/{ad_id}/review", response_model=AdResponse)
async def review_ad(
    tenant_id: uuid.UUID,
    ad_id: uuid.UUID,
    body: ReviewAdRequest,
    payload: TokenPayload,
    db: DBSession,
):
    # Seul le super admin valide les pubs — la plateforme doit être configurée avant activation
    if not (payload.get("is_super_admin") or payload.get("role") == "SUPER_ADMIN"):
        raise ForbiddenException("La validation des publicités est réservée au super admin.")

    if body.decision not in (AdSubmissionStatus.APPROVED, AdSubmissionStatus.REJECTED):
        raise ValidationException("La décision doit être APPROVED ou REJECTED.")

    ad = await _get_or_404(db, tenant_id, ad_id)

    if ad.link_safety_status == LinkSafetyStatus.DANGEROUS and body.decision == AdSubmissionStatus.APPROVED:
        raise ValidationException(
            "Impossible d'approuver une publicité dont le lien est signalé comme dangereux."
        )

    ad.submission_status = body.decision
    ad.reviewed_by = uuid.UUID(payload["sub"])

    if body.decision == AdSubmissionStatus.APPROVED:
        if settings.STRIPE_SECRET_KEY and ad.total_budget and float(ad.total_budget) > 0:
            # Stripe configuré → passe en PAYMENT_PENDING et génère un lien de paiement
            try:
                import stripe as _stripe
                _stripe.api_key = settings.STRIPE_SECRET_KEY
                amount_cents = int(float(ad.total_budget) * 100)
                frontend_url = settings.FRONTEND_URL
                session = await asyncio.to_thread(
                    _stripe.checkout.Session.create,
                    mode="payment",
                    line_items=[{
                        "price_data": {
                            "currency": "usd",
                            "unit_amount": amount_cents,
                            "product_data": {"name": f"Campagne publicitaire : {ad.title}"},
                        },
                        "quantity": 1,
                    }],
                    customer_email=ad.advertiser_email,
                    success_url=f"{frontend_url}/blog/{{CHECKOUT_SESSION_ID}}?ad_paid=1",
                    cancel_url=f"{frontend_url}",
                    metadata={"ad_id": str(ad.id), "tenant_id": str(tenant_id)},
                )
                ad.payment_link_url = session.url
                ad.payment_session_id = session.id
                ad.submission_status = AdSubmissionStatus.PAYMENT_PENDING
                ad.campaign_status = AdCampaignStatus.PAUSED
            except Exception:
                # Si la génération échoue, approuver sans lien (ne bloque pas)
                ad.campaign_status = AdCampaignStatus.ACTIVE
        else:
            # Pas de Stripe ou budget non défini → activation immédiate
            ad.campaign_status = AdCampaignStatus.ACTIVE

    elif body.decision == AdSubmissionStatus.REJECTED:
        ad.rejection_reason = body.rejection_reason
        ad.campaign_status = AdCampaignStatus.CANCELED

    await db.commit()
    await db.refresh(ad)
    return _ad_response(ad)


# ── Pause / Reprise ───────────────────────────────────────────────

@router.post("/{ad_id}/pause", response_model=AdResponse)
async def pause_ad(
    tenant_id: uuid.UUID, ad_id: uuid.UUID,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    ad = await _get_or_404(db, tenant_id, ad_id)
    ad.campaign_status = AdCampaignStatus.PAUSED
    await db.commit()
    await db.refresh(ad)
    return _ad_response(ad)


@router.post("/{ad_id}/resume", response_model=AdResponse)
async def resume_ad(
    tenant_id: uuid.UUID, ad_id: uuid.UUID,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    ad = await _get_or_404(db, tenant_id, ad_id)

    if ad.link_safety_status == LinkSafetyStatus.DANGEROUS:
        raise ValidationException("Impossible de reprendre une pub avec un lien dangereux.")
    if ad.submission_status != AdSubmissionStatus.APPROVED:
        raise ValidationException("La publicité n'est pas encore approuvée.")

    ad.campaign_status = AdCampaignStatus.ACTIVE
    await db.commit()
    await db.refresh(ad)
    return _ad_response(ad)


# ── Scan de sécurité manuel ───────────────────────────────────────

@router.post("/{ad_id}/scan", response_model=AdScanResponse)
async def scan_ad(
    tenant_id: uuid.UUID, ad_id: uuid.UUID,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    ad = await _get_or_404(db, tenant_id, ad_id)
    result = await _run_scan(db, ad)
    return AdScanResponse(
        ad_id=str(ad.id),
        url=ad.click_url,
        safety_status=result["status"],
        google_safe_browsing=result.get("google_safe_browsing"),
        virustotal=result.get("virustotal"),
        urlhaus=result.get("urlhaus"),
        phishtank=result.get("phishtank"),
        scanned_at=datetime.fromisoformat(result["scanned_at"]),
    )


# ── Tracking impression / click (public) ─────────────────────────

@router.post("/{ad_id}/impression", status_code=204)
async def track_impression(
    tenant_id: uuid.UUID, ad_id: uuid.UUID, db: DBSession,
):
    from sqlalchemy import text
    await db.execute(
        text("UPDATE ads SET impressions_count = impressions_count + 1 WHERE id = :id AND tenant_id = :tid"),
        {"id": str(ad_id), "tid": str(tenant_id)},
    )
    await db.commit()


@router.post("/{ad_id}/click", status_code=204)
async def track_click(
    tenant_id: uuid.UUID, ad_id: uuid.UUID, db: DBSession,
):
    ad = await _get_or_404(db, tenant_id, ad_id)

    # Bloquer les clics si le lien est dangereux
    if ad.link_safety_status == LinkSafetyStatus.DANGEROUS:
        raise ForbiddenException("Ce lien a été signalé comme dangereux.")

    from sqlalchemy import text
    await db.execute(
        text("UPDATE ads SET clicks_count = clicks_count + 1 WHERE id = :id AND tenant_id = :tid"),
        {"id": str(ad_id), "tid": str(tenant_id)},
    )
    await db.commit()


# ── Helpers ───────────────────────────────────────────────────────

async def _get_or_404(db, tenant_id: uuid.UUID, ad_id: uuid.UUID) -> Ad:
    result = await db.execute(
        select(Ad).where(Ad.id == ad_id, Ad.tenant_id == tenant_id)
    )
    a = result.scalar_one_or_none()
    if not a:
        raise NotFoundException("Publicité")
    return a


async def _run_scan(db, ad: Ad) -> dict:
    from app.services.link_safety_service import scan_url
    result = await scan_url(ad.click_url)
    status = result["status"]

    ad.link_safety_status = status
    ad.link_last_scanned_at = datetime.now(timezone.utc)
    ad.link_scan_details = result

    # Suspension automatique si lien dangereux
    if status == LinkSafetyStatus.DANGEROUS:
        ad.campaign_status = AdCampaignStatus.SUSPENDED

    scan = AdLinkScan(
        ad_id=ad.id,
        url=ad.click_url,
        safety_status=status,
        google_safe_browsing=result.get("google_safe_browsing"),
        virustotal=result.get("virustotal"),
        urlhaus=result.get("urlhaus"),
        phishtank=result.get("phishtank"),
    )
    db.add(scan)
    await db.commit()
    return result


async def _scan_ad_link(ad_id: str, url: str) -> None:
    """Background task : scan initial au moment de la soumission."""
    from app.core.database import get_db
    from sqlalchemy import select
    async for db in get_db():
        result = await db.execute(select(Ad).where(Ad.id == uuid.UUID(ad_id)))
        ad = result.scalar_one_or_none()
        if ad:
            await _run_scan(db, ad)


def _ad_response(a: Ad) -> AdResponse:
    return AdResponse(
        id=str(a.id),
        advertiser_name=a.advertiser_name,
        advertiser_company=a.advertiser_company,
        title=a.title,
        description=a.description,
        image_url=a.image_url,
        click_url=a.click_url,
        placement=a.placement,
        submission_status=a.submission_status,
        campaign_status=a.campaign_status,
        link_safety_status=a.link_safety_status,
        link_last_scanned_at=a.link_last_scanned_at,
        starts_at=a.starts_at,
        ends_at=a.ends_at,
        impressions_count=a.impressions_count,
        clicks_count=a.clicks_count,
        payment_link_url=a.payment_link_url,
        created_at=a.created_at,
    )
