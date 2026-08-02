"""KYC obligatoire pour l'affiliation (décision PDG 2026-08-01) — vérification
d'identité via Kaluta KYC (https://kalutakyc.com/docs), payée en crypto via
le pipeline NowPayments déjà en place (voir payments.py::_create_crypto_transaction).

Aucun tenant_id dans l'URL : achat rattaché au tenant sentinelle
(settings.PLATFORM_TENANT_ID), même pattern que platform_ads_router — voir
ads.py."""
import logging
import uuid

from fastapi import APIRouter, Request, Header, HTTPException
from sqlalchemy import select

from app.core.config import settings
from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException
from app.models.enums import TransactionType, KycStatus
from app.models.kyc import KycVerification
from app.models.user import User
from app.services.kaluta_service import verify_kaluta_signature
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/platform/kyc", tags=["kyc"])

_ALLOWED_YEARS = (1, 2, 3, 5)


class KycSubmitRequest(BaseModel):
    years: int
    pay_currency: str = "usdtbsc"
    invoice_language: str = "en"


class KycStatusResponse(BaseModel):
    kyc_status: str
    kyc_years_remaining: int
    price_per_year: float
    kaluta_verification_url: str | None


async def _get_kyc_price_per_year() -> float:
    """Prix configurable par le Super Admin (platform:settings en Redis) —
    même mécanisme que nowpayments_tolerance_usd/domain_markup_percent
    (voir superadmin.py::update_platform_settings)."""
    from app.core.redis_client import redis
    import json
    try:
        raw = await redis.get("platform:settings")
        overrides = json.loads(raw) if raw else {}
        value = overrides.get("kyc_price_per_year")
        return float(value) if value is not None else settings.KYC_DEFAULT_PRICE_PER_YEAR
    except Exception:
        return settings.KYC_DEFAULT_PRICE_PER_YEAR


@router.get("/status", response_model=KycStatusResponse)
async def get_kyc_status(payload: TokenPayload, db: DBSession):
    user = await db.get(User, uuid.UUID(payload["sub"]))
    if not user:
        raise NotFoundException("User")

    price_per_year = await _get_kyc_price_per_year()

    latest_url = None
    if user.kyc_status == KycStatus.PENDING and user.kyc_provider_session_id:
        result = await db.execute(
            select(KycVerification)
            .where(KycVerification.user_id == user.id)
            .order_by(KycVerification.created_at.desc())
            .limit(1)
        )
        row = result.scalar_one_or_none()
        if row:
            latest_url = row.kaluta_verification_url

    return KycStatusResponse(
        kyc_status=user.kyc_status.value,
        kyc_years_remaining=user.kyc_years_remaining,
        price_per_year=price_per_year,
        kaluta_verification_url=latest_url,
    )


@router.post("/submit", status_code=201)
async def submit_kyc_verification(body: KycSubmitRequest, payload: TokenPayload, db: DBSession):
    """Choix de la durée (1/2/3/5 ans) → paiement crypto. La session Kaluta
    n'est créée qu'après confirmation du paiement (voir
    payments.py::_finalize_transaction), jamais ici."""
    from app.api.v1.payments import _create_crypto_transaction, _crypto_response

    if body.years not in _ALLOWED_YEARS:
        raise ValidationException(f"Years must be one of {_ALLOWED_YEARS}.")

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if not user:
        raise NotFoundException("User")

    price_per_year = await _get_kyc_price_per_year()
    total_amount = round(price_per_year * body.years, 2)

    tenant_id = uuid.UUID(settings.PLATFORM_TENANT_ID)
    kyc = KycVerification(
        user_id=user.id,
        tenant_id=tenant_id,
        years_purchased=body.years,
        amount_paid=0,
        status=KycStatus.NOT_STARTED,
    )
    db.add(kyc)
    await db.commit()
    await db.refresh(kyc)

    order_id = f"kyc_{tenant_id}_{kyc.id}_{uuid.uuid4().hex[:8]}"
    tx, _ = await _create_crypto_transaction(
        db,
        tenant_id=tenant_id,
        user_id=user.id,
        transaction_type=TransactionType.KYC_VERIFICATION,
        amount_usd=total_amount,
        order_id=order_id,
        order_description=f"KYC verification — {body.years} year(s)",
        campaign_id=kyc.id,
        pay_currency=body.pay_currency,
        extra={"invoice_language": body.invoice_language},
    )
    kyc.transaction_id = tx.id
    await db.commit()

    payment = _crypto_response(tx, total_amount)
    return {"kyc_verification_id": str(kyc.id), **payment.model_dump()}


@router.post("/retry-session", status_code=201)
async def retry_kyc_session(payload: TokenPayload, db: DBSession):
    """Nouvelle session Kaluta sans nouveau paiement — pour une
    re-vérification après changement important de profil (années déjà
    prépayées, voir auth.py::update_profile) ou après un rejet Kaluta."""
    from app.services.kaluta_service import create_kaluta_session

    user = await db.get(User, uuid.UUID(payload["sub"]))
    if not user:
        raise NotFoundException("User")

    if user.kyc_years_remaining <= 0:
        raise ValidationException("No prepaid KYC years remaining — purchase a new verification.")
    if user.kyc_status == KycStatus.VERIFIED:
        raise ValidationException("KYC is already verified.")

    session = await create_kaluta_session(external_id=str(user.id))

    kyc = KycVerification(
        user_id=user.id,
        tenant_id=uuid.UUID(settings.PLATFORM_TENANT_ID),
        years_purchased=0,
        amount_paid=0,
        status=KycStatus.PENDING,
        kaluta_session_id=session.get("session_id"),
        kaluta_verification_url=session.get("verification_url"),
        is_material_change_reverification=True,
    )
    db.add(kyc)
    user.kyc_status = KycStatus.PENDING
    user.kyc_provider_session_id = session.get("session_id")
    await db.commit()

    return {"verification_url": session.get("verification_url"), "session_id": session.get("session_id")}


@router.post("/webhook/kaluta")
async def kaluta_webhook(
    request: Request,
    db: DBSession,
    x_kaluta_signature: str = Header(default="", alias="X-Kaluta-Signature"),
):
    """Webhook Kaluta — source de vérité pour le résultat final (signature
    vérifiée, jamais de JWT ici). N'affecte QUE users.kyc_status/
    kyc_verifications.status — aucune comptabilité déclenchée par ce
    webhook (le paiement, lui, est déjà finalisé via NowPayments — voir
    payments.py::_finalize_transaction)."""
    raw = await request.body()

    if not verify_kaluta_signature(raw, x_kaluta_signature):
        raise HTTPException(status_code=400, detail="Invalid Kaluta webhook signature.")

    import json as _json
    data = _json.loads(raw)

    event = data.get("event", "")
    session_id = data.get("session_id", "")
    if not session_id:
        return {"received": True, "action": "ignored", "reason": "missing_session_id"}

    result = await db.execute(
        select(KycVerification).where(KycVerification.kaluta_session_id == session_id)
    )
    kyc = result.scalar_one_or_none()
    if not kyc:
        return {"received": True, "action": "ignored", "reason": "unknown_session_id"}

    user = await db.get(User, kyc.user_id)

    # Idempotence : un événement terminal déjà traité ne doit jamais être
    # rejoué (même contrat que `tx.status == COMPLETED` dans
    # payments.py::_finalize_transaction).
    if kyc.status in (KycStatus.VERIFIED, KycStatus.REJECTED) and event in ("session.approved", "session.rejected"):
        return {"received": True, "action": "ignored", "reason": "already_processed"}

    kyc.raw_webhook_payload = data
    if "document_score" in data:
        kyc.document_score = data.get("document_score")
    if "face_score" in data:
        kyc.face_score = data.get("face_score")
    if "liveness_score" in data:
        kyc.liveness_score = data.get("liveness_score")
    if "overall_score" in data:
        kyc.overall_score = data.get("overall_score")

    from datetime import datetime, timezone

    if event == "session.approved":
        kyc.status = KycStatus.VERIFIED
        kyc.approved_at = datetime.now(timezone.utc)
        if user:
            user.kyc_status = KycStatus.VERIFIED
            user.kyc_verified_at = kyc.approved_at
    elif event == "session.rejected":
        kyc.status = KycStatus.REJECTED
        kyc.rejected_at = datetime.now(timezone.utc)
        if user:
            user.kyc_status = KycStatus.REJECTED
    elif event == "session.expired":
        kyc.status = KycStatus.EXPIRED
        if user and user.kyc_status == KycStatus.PENDING:
            user.kyc_status = KycStatus.EXPIRED

    await db.commit()

    return {"received": True, "action": "processed", "event": event}
