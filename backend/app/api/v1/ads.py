import logging
import uuid
from datetime import datetime, timezone, date, timedelta
from fastapi import APIRouter, Query, Request
from sqlalchemy import select
from pydantic import BaseModel, HttpUrl

from app.core.config import settings
from fastapi import Depends
from app.core.dependencies import TokenPayload, DBSession, check_plan_active
from app.core.exceptions import NotFoundException, ValidationException, ForbiddenException
from app.models.ad import Ad, AdLinkScan, AdRevenueShare, AdDailyStats
from app.models.enums import AdSubmissionStatus, AdCampaignStatus, LinkSafetyStatus, UserRole, AdRevenueShareStatus, KycStatus
from app.api.v1.tenants import _assert_member, _assert_role

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/tenants/{tenant_id}/ads",
    tags=["ads"],
    dependencies=[Depends(check_plan_active)],
)

# Routes publiques (annonceur anonyme + tracking depuis le blog public) — sur
# un routeur séparé sans check_plan_active, qui exige un JWT et bloquerait
# à tort ces appels non authentifiés (bug réel : /submit renvoyait 401).
public_ads_router = APIRouter(prefix="/tenants/{tenant_id}/ads", tags=["ads"])

# Pubs achetées directement sur smarterbloggers.com (pas sur un blog membre).
# Aucun tenant_id dans l'URL : le tenant sentinelle (settings.PLATFORM_TENANT_ID)
# est fixé côté serveur, jamais choisi par le client. Auth requise pour
# submit/mine (même compte que partout ailleurs sur la plateforme — voir
# plan) ; /active est public pour l'affichage sur la page d'accueil.
platform_ads_router = APIRouter(prefix="/platform/ads", tags=["platform-ads"])


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
    pay_currency: str = "usdtbsc"


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
    created_at: datetime
    target_countries: list[str] | None = None


class PlatformAdSubmitRequest(BaseModel):
    """Pas de placement (un seul emplacement site principal) ni
    advertiser_name/email : renseignés côté serveur depuis le compte connecté.
    target_countries : ciblage géographique optionnel (codes ISO 3166-1
    alpha-2, ex ["US","FR"]) — None/vide = affichée à tous les visiteurs."""
    title: str
    description: str | None = None
    image_url: str | None = None
    click_url: str
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    price_per_day: float | None = None
    total_budget: float
    currency: str = "USD"
    pay_currency: str = "usdtbsc"
    target_countries: list[str] | None = None


class PlatformAdStatsResponse(BaseModel):
    ad_id: str
    total_impressions: int
    total_clicks: int
    ctr_pct: float
    amount_paid: float
    total_budget: float | None
    days_remaining: int | None
    daily: list[dict]  # [{"date": "2026-07-01", "impressions": 12, "clicks": 1}, ...]


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

@public_ads_router.post("/submit", status_code=201)
async def submit_ad(
    tenant_id: uuid.UUID,
    body: SubmitAdRequest,
    db: DBSession,
):
    """Soumission d'une publicité + paiement NowPayments intégré (adresse +
    QR affichés directement). Sans auth requise.

    Le scan de sécurité du lien et la notification aux super admins ne se
    déclenchent qu'une fois le paiement confirmé (_finalize_transaction) —
    pas ici : ce endpoint public sans auth serait sinon un vecteur de spam
    gratuit (déclencher un scan + un email à chaque soumission, payée ou
    non — voir remontée du 2026-07-22)."""
    from app.api.v1.payments import _create_crypto_transaction, _crypto_response
    from app.models.enums import TransactionType

    if body.total_budget <= 0:
        raise ValidationException("Budget must be greater than 0.")

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

    order_id = f"ad_{tenant_id}_{ad.id}_{uuid.uuid4().hex[:8]}"
    tx, _ = await _create_crypto_transaction(
        db,
        tenant_id=tenant_id,
        user_id=None,
        transaction_type=TransactionType.AD_CAMPAIGN,
        amount_usd=body.total_budget,
        order_id=order_id,
        order_description=f"Ad slot: {body.title[:80]}",
        campaign_id=ad.id,
        pay_currency=body.pay_currency,
    )

    payment = _crypto_response(tx, body.total_budget)
    return {"ad_id": str(ad.id), **payment.model_dump()}


# ── Pubs sur le site principal smarterbloggers.com ────────────────
# Aucun nouveau système d'inscription : l'annonceur est un utilisateur déjà
# connecté via /login ou /register, exactement comme pour /affiliate ou
# /payments (voir plan). Le tenant_id (sentinelle) est fixé côté serveur.

class PlatformAdCard(BaseModel):
    id: str
    title: str
    description: str | None
    image_url: str | None
    click_url: str


@platform_ads_router.post("/submit", status_code=201)
async def submit_platform_ad(
    body: PlatformAdSubmitRequest,
    payload: TokenPayload,
    db: DBSession,
):
    from app.api.v1.payments import _create_crypto_transaction, _crypto_response
    from app.models.enums import TransactionType
    from app.models.user import User

    if body.total_budget <= 0:
        raise ValidationException("Budget must be greater than 0.")

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if not user:
        raise NotFoundException("User")

    tenant_id = uuid.UUID(settings.PLATFORM_TENANT_ID)
    ad = Ad(
        tenant_id=tenant_id,
        is_platform_ad=True,
        advertiser_user_id=user.id,
        # Renseignés depuis le compte connecté, jamais saisis par le client
        # (anti-usurpation — voir plan).
        advertiser_name=user.display_name or user.email,
        advertiser_email=user.email,
        title=body.title,
        description=body.description,
        image_url=body.image_url,
        click_url=body.click_url,
        starts_at=body.starts_at,
        ends_at=body.ends_at,
        price_per_day=body.price_per_day,
        total_budget=body.total_budget,
        target_countries=body.target_countries or None,
        submission_status=AdSubmissionStatus.PAYMENT_PENDING,
    )
    db.add(ad)
    await db.commit()
    await db.refresh(ad)

    order_id = f"ad_{tenant_id}_{ad.id}_{uuid.uuid4().hex[:8]}"
    tx, _ = await _create_crypto_transaction(
        db,
        tenant_id=tenant_id,
        user_id=user.id,
        transaction_type=TransactionType.AD_CAMPAIGN,
        amount_usd=body.total_budget,
        order_id=order_id,
        order_description=f"Platform ad slot: {body.title[:80]}",
        campaign_id=ad.id,
        pay_currency=body.pay_currency,
    )

    payment = _crypto_response(tx, body.total_budget)
    return {"ad_id": str(ad.id), **payment.model_dump()}


@platform_ads_router.get("/mine", response_model=list[AdResponse])
async def list_my_platform_ads(
    payload: TokenPayload,
    db: DBSession,
):
    tenant_id = uuid.UUID(settings.PLATFORM_TENANT_ID)
    result = await db.execute(
        select(Ad)
        .where(Ad.tenant_id == tenant_id, Ad.advertiser_user_id == uuid.UUID(payload["sub"]))
        .order_by(Ad.created_at.desc())
    )
    return [_ad_response(a) for a in result.scalars().all()]


@platform_ads_router.get("/active", response_model=PlatformAdCard | None)
async def get_active_platform_ad(request: Request, db: DBSession, exclude: str | None = Query(None)):
    """Pub à afficher sur la page d'accueil publique — même algorithme de
    rotation pondérée par budget que public.py::get_rotator_ad (rotation
    entre blogs), appliqué ici au tenant sentinelle.

    Ciblage géographique : le pays du visiteur est détecté via les mêmes
    en-têtes CDN qu'analytics.py (aucune dépendance de géolocalisation
    supplémentaire). Une pub sans target_countries s'affiche à tout le
    monde ; une pub ciblée ne s'affiche qu'aux visiteurs du/des pays
    choisis — si le pays est indétectable, on ne montre que les pubs non
    ciblées plutôt que de mal cibler."""
    import random

    visitor_country = (
        request.headers.get("CF-IPCountry")
        or request.headers.get("X-Vercel-IP-Country")
        or request.headers.get("CloudFront-Viewer-Country")
    )
    if visitor_country in ("XX", "T1", "--", "A1", "A2"):
        visitor_country = None
    if visitor_country:
        visitor_country = visitor_country[:2].upper()

    tenant_id = uuid.UUID(settings.PLATFORM_TENANT_ID)
    now = datetime.now(timezone.utc)
    conditions = [
        Ad.tenant_id == tenant_id,
        Ad.submission_status == AdSubmissionStatus.APPROVED,
        Ad.campaign_status == AdCampaignStatus.ACTIVE,
        Ad.link_safety_status != LinkSafetyStatus.DANGEROUS,
        (Ad.starts_at.is_(None) | (Ad.starts_at <= now)),
        (Ad.ends_at.is_(None) | (Ad.ends_at >= now)),
    ]
    if exclude:
        try:
            conditions.append(Ad.id != uuid.UUID(exclude))
        except ValueError:
            pass

    result = await db.execute(select(Ad).where(*conditions))
    ads = [
        a for a in result.scalars().all()
        if not a.target_countries or (visitor_country and visitor_country in a.target_countries)
    ]
    if not ads:
        return None

    weights = [float(a.total_budget or 1) for a in ads]
    selected: Ad = random.choices(ads, weights=weights, k=1)[0]
    return PlatformAdCard(
        id=str(selected.id),
        title=selected.title,
        description=selected.description,
        image_url=selected.image_url,
        click_url=selected.click_url,
    )


@platform_ads_router.get("/{ad_id}/stats", response_model=PlatformAdStatsResponse)
async def get_platform_ad_stats(
    ad_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    days: int = Query(default=30, le=90),
):
    tenant_id = uuid.UUID(settings.PLATFORM_TENANT_ID)
    result = await db.execute(
        select(Ad).where(Ad.id == ad_id, Ad.tenant_id == tenant_id, Ad.advertiser_user_id == uuid.UUID(payload["sub"]))
    )
    ad = result.scalar_one_or_none()
    if not ad:
        raise NotFoundException("Ad")

    since = date.today() - timedelta(days=days - 1)
    stats_result = await db.execute(
        select(AdDailyStats)
        .where(AdDailyStats.ad_id == ad_id, AdDailyStats.date >= since)
        .order_by(AdDailyStats.date)
    )
    by_date = {s.date: s for s in stats_result.scalars().all()}
    daily = []
    for i in range(days):
        d = since + timedelta(days=i)
        s = by_date.get(d)
        daily.append({"date": d.isoformat(), "impressions": s.impressions if s else 0, "clicks": s.clicks if s else 0})

    total_impressions = ad.impressions_count
    total_clicks = ad.clicks_count
    ctr_pct = round((total_clicks / total_impressions) * 100, 2) if total_impressions else 0.0

    days_remaining = None
    if ad.ends_at:
        remaining = (ad.ends_at - datetime.now(timezone.utc)).days
        days_remaining = max(0, remaining)

    return PlatformAdStatsResponse(
        ad_id=str(ad.id),
        total_impressions=total_impressions,
        total_clicks=total_clicks,
        ctr_pct=ctr_pct,
        amount_paid=float(ad.amount_paid or 0),
        total_budget=float(ad.total_budget) if ad.total_budget is not None else None,
        days_remaining=days_remaining,
        daily=daily,
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
        raise ForbiddenException("Ad approval is reserved for super admins.")

    if body.decision not in (AdSubmissionStatus.APPROVED, AdSubmissionStatus.REJECTED):
        raise ValidationException("Decision must be APPROVED or REJECTED.")

    ad = await _get_or_404(db, tenant_id, ad_id)

    if ad.submission_status == AdSubmissionStatus.PAYMENT_PENDING:
        raise ValidationException(
            "Payment for this ad has not been confirmed yet — it cannot be approved."
        )

    if ad.link_safety_status == LinkSafetyStatus.DANGEROUS and body.decision == AdSubmissionStatus.APPROVED:
        raise ValidationException(
            "Cannot approve an ad whose link is flagged as dangerous."
        )

    ad.submission_status = body.decision
    ad.reviewed_by = uuid.UUID(payload["sub"])

    if body.decision == AdSubmissionStatus.APPROVED:
        # Le paiement NowPayments est collecté à la soumission (webhook ou
        # polling confirme et passe amount_paid > 0 avant que l'admin approuve).
        # Garde contre une double approbation : ne recalcule les commissions
        # que lors de la transition PAUSED/PENDING → ACTIVE.
        if ad.amount_paid and float(ad.amount_paid) > 0 and ad.campaign_status != AdCampaignStatus.ACTIVE:
            ad.campaign_status = AdCampaignStatus.ACTIVE

            if ad.is_platform_ad:
                # Pub achetée sur smarterbloggers.com lui-même : pas de
                # propriétaire de blog à payer — la commission part vers la
                # lignée de parrainage de l'annonceur (10% L1 + 1%×9 L2-10),
                # le reste (81%) reste à la plateforme (compte 4103).
                try:
                    from app.api.v1.affiliate import compute_and_accrue_fixed_level_commissions
                    from app.api.v1.accounting import book_platform_ad_payment
                    from app.models.enums import AffiliateCommissionSource

                    if ad.advertiser_user_id:
                        level_percentages = {1: 0.10, **{lvl: 0.01 for lvl in range(2, 11)}}
                        await compute_and_accrue_fixed_level_commissions(
                            db=db,
                            source_user_id=ad.advertiser_user_id,
                            source_type=AffiliateCommissionSource.MAIN_SITE_AD,
                            source_transaction_id=str(ad.id),
                            gross_amount=float(ad.amount_paid),
                            level_percentages=level_percentages,
                        )

                    await book_platform_ad_payment(
                        db=db,
                        amount=float(ad.amount_paid),
                        ad_id=str(ad.id),
                        transaction_id=str(ad.id),
                        created_by_system_user_id=uuid.UUID(payload["sub"]),
                    )
                except Exception:
                    logger.exception("Échec du calcul/paiement des commissions (pub site principal) pour l'ad %s", ad.id)
            else:
                try:
                    from app.api.v1.affiliate import compute_and_accrue_commissions
                    from app.services.tenant_service import get_tenant_owner_user_id
                    from app.services.nowpayments_service import send_single_payout
                    from app.api.v1.accounting import book_ad_slot_payment
                    from app.models.user import User

                    source_user_id = await get_tenant_owner_user_id(db, tenant_id)
                    if source_user_id:
                        # 10% commission d'affiliation (inchangé)
                        await compute_and_accrue_commissions(
                            db=db,
                            source_user_id=source_user_id,
                            source_type="ad_slot",
                            source_transaction_id=str(ad.id),
                            gross_amount=float(ad.amount_paid),
                        )

                        # 60% dus au propriétaire du blog (RG-AD-01, révisé 2026-07-23 :
                        # 80/10/10 -> 60/10/30, la part plateforme passe de 10% à 30%,
                        # l'affiliation reste inchangée à 10%) — payé directement s'il a
                        # un wallet enregistré ET un KYC validé (décision PDG 2026-08-03,
                        # étendue à tout versement de fonds sur la plateforme). Sans l'un
                        # des deux, il ne participe pas, rien n'est calculé ni mis de côté.
                        owner = await db.get(User, source_user_id)
                        if (
                            owner and owner.usdt_wallet_address
                            and owner.kyc_status == KycStatus.VERIFIED
                            and settings.NOWPAYMENTS_PAYOUT_API_KEY
                        ):
                            owner_share = round(float(ad.amount_paid) * 0.60, 2)
                            try:
                                result = await send_single_payout(
                                    wallet_address=owner.usdt_wallet_address,
                                    amount_usd=owner_share,
                                )
                                payout_reference = str(result.get("id", ""))
                                share = AdRevenueShare(
                                    ad_id=ad.id,
                                    tenant_id=tenant_id,
                                    owner_user_id=source_user_id,
                                    gross_amount=float(ad.amount_paid),
                                    owner_share_amount=owner_share,
                                    status=AdRevenueShareStatus.PAID,
                                    payout_reference=payout_reference,
                                    paid_at=datetime.now(timezone.utc),
                                )
                                db.add(share)

                                # Écriture comptable 60/10/30 (RG-AD-01 — propriétaire/affiliation/plateforme)
                                await book_ad_slot_payment(
                                    db=db,
                                    amount=float(ad.amount_paid),
                                    ad_id=str(ad.id),
                                    transaction_id=str(ad.id),
                                    created_by_system_user_id=uuid.UUID(payload["sub"]),
                                )

                                # Facture — n'entrave jamais le versement déjà effectué,
                                # ni le commit final de la fonction (ligne ~552).
                                try:
                                    from app.services.invoice_service import generate_and_send_invoice
                                    await generate_and_send_invoice(
                                        db, user=owner,
                                        amount=owner_share, currency="USDT",
                                        payment_reference=payout_reference,
                                        payment_type="ad_revenue_payout",
                                    )
                                except Exception:
                                    logger.exception("Invoice generation failed for ad revenue payout (ad=%s)", ad.id)
                            except Exception:
                                logger.exception(
                                    "Échec du payout NowPayments (part propriétaire) pour l'ad %s (owner=%s, montant=%s) — rien n'est enregistré, pas de retry automatique",
                                    ad.id, source_user_id, owner_share,
                                )
                except Exception:
                    logger.exception("Échec du calcul/paiement des commissions pour l'ad %s", ad.id)
        elif not (ad.amount_paid and float(ad.amount_paid) > 0):
            # Paiement non encore confirmé — campagne activée automatiquement par le webhook
            ad.campaign_status = AdCampaignStatus.PAUSED

    elif body.decision == AdSubmissionStatus.REJECTED:
        ad.rejection_reason = body.rejection_reason
        ad.campaign_status = AdCampaignStatus.CANCELED

    await db.commit()
    await db.refresh(ad)

    # Notification in-app à l'annonceur connecté (impossible pour le flux
    # anonyme des pubs de blog, qui n'a qu'un email de contact) — voir
    # exigence PDG "vraiment penser à tout" côté annonceur.
    if ad.is_platform_ad and ad.advertiser_user_id:
        try:
            from app.services.push_service import send_push_to_user
            if body.decision == AdSubmissionStatus.APPROVED:
                title, msg = "Publicité approuvée", f"Votre publicité « {ad.title} » est maintenant active sur SmarterBloggers."
            else:
                title, msg = "Publicité rejetée", f"Votre publicité « {ad.title} » a été rejetée." + (f" Motif : {body.rejection_reason}" if body.rejection_reason else "")
            await send_push_to_user(db, ad.advertiser_user_id, title, msg, url="/advertiser")
        except Exception:
            pass

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
        raise ValidationException("Cannot resume an ad with a dangerous link.")
    if ad.submission_status != AdSubmissionStatus.APPROVED:
        raise ValidationException("This ad has not been approved yet.")

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

@public_ads_router.post("/{ad_id}/impression", status_code=204)
async def track_impression(
    tenant_id: uuid.UUID, ad_id: uuid.UUID, db: DBSession,
):
    from sqlalchemy import text
    await db.execute(
        text("UPDATE ads SET impressions_count = impressions_count + 1 WHERE id = :id AND tenant_id = :tid"),
        {"id": str(ad_id), "tid": str(tenant_id)},
    )
    await _bump_daily_stat(db, ad_id, "impressions")
    await db.commit()


@public_ads_router.post("/{ad_id}/click", status_code=204)
async def track_click(
    tenant_id: uuid.UUID, ad_id: uuid.UUID, db: DBSession,
):
    ad = await _get_or_404(db, tenant_id, ad_id)

    # Bloquer les clics si le lien est dangereux
    if ad.link_safety_status == LinkSafetyStatus.DANGEROUS:
        raise ForbiddenException("This link has been flagged as dangerous.")

    from sqlalchemy import text
    await db.execute(
        text("UPDATE ads SET clicks_count = clicks_count + 1 WHERE id = :id AND tenant_id = :tid"),
        {"id": str(ad_id), "tid": str(tenant_id)},
    )
    await _bump_daily_stat(db, ad_id, "clicks")
    await db.commit()


async def _bump_daily_stat(db, ad_id: uuid.UUID, column: str) -> None:
    from sqlalchemy import text
    await db.execute(
        text(f"""
            INSERT INTO ad_daily_stats (ad_id, date, {column})
            VALUES (:ad_id, :today, 1)
            ON CONFLICT (ad_id, date) DO UPDATE SET {column} = ad_daily_stats.{column} + 1
        """),
        {"ad_id": str(ad_id), "today": date.today()},
    )


# ── Helpers ───────────────────────────────────────────────────────

async def _get_or_404(db, tenant_id: uuid.UUID, ad_id: uuid.UUID) -> Ad:
    result = await db.execute(
        select(Ad).where(Ad.id == ad_id, Ad.tenant_id == tenant_id)
    )
    a = result.scalar_one_or_none()
    if not a:
        raise NotFoundException("Ad")
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
    """Scan initial du lien — déclenché depuis _finalize_transaction une fois
    le paiement confirmé (pas à la soumission, voir submit_ad)."""
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
        created_at=a.created_at,
        target_countries=a.target_countries,
    )
