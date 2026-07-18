"""
M20 — Paiements via NowPayments (crypto USDT TRC20)
Stripe et PayPal retirés suite à décision PDG 2026-07-12.

Paiement intégré (sans redirection) : le checkout retourne directement
l'adresse de dépôt + un QR code, affichés sur notre propre plateforme. La
confirmation peut arriver par deux voies complémentaires qui coexistent :
le webhook IPN NowPayments (poussé), et l'endpoint de statut ci-dessous que
le frontend interroge en polling et qui, si besoin, relit le statut en
direct depuis NowPayments (GET /v1/payment/{id}). Les deux convergent vers
la même fonction idempotente `_finalize_transaction`.
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Request, Header, HTTPException
from sqlalchemy import select
from pydantic import BaseModel

from app.core.config import settings
from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException
from app.models.payment import Transaction, ArticleAccess, TenantSubscription
from app.models.article import Article
from app.models.tenant import Tenant
from app.models.enums import PaymentGateway, TransactionType, TransactionStatus, SubscriptionStatus
from app.services.nowpayments_service import (
    create_payment, get_payment_status, generate_qr_data_uri,
    verify_ipn_signature, get_plan_price,
)
from app.api.v1.tenants import _assert_member, _assert_role
from app.models.enums import UserRole

router = APIRouter(prefix="/tenants/{tenant_id}/payments", tags=["payments"])

_PLAN_TIERS = {"starter", "pro", "business", "enterprise"}
_TERMINAL_PROVIDER_STATUSES = {"failed", "expired"}


# ── Schemas ───────────────────────────────────────────────────────

class SubscriptionCheckoutRequest(BaseModel):
    plan: str           # starter | pro | business | enterprise
    billing: str = "monthly"   # monthly | annual


class ArticleCheckoutRequest(BaseModel):
    article_id: str


class CryptoPaymentResponse(BaseModel):
    transaction_id: str
    order_id: str
    pay_address: str
    pay_amount: float
    pay_currency: str
    qr_code_data_uri: str
    expires_at: datetime | None
    amount_usd: float


class PaymentStatusResponse(BaseModel):
    status: str
    provider_status: str | None
    pay_address: str | None
    pay_amount: float | None
    expires_at: datetime | None


class TransactionResponse(BaseModel):
    id: str
    transaction_type: str
    status: TransactionStatus
    payment_gateway: PaymentGateway
    amount: float
    currency: str
    platform_fee: float
    net_amount: float
    article_id: str | None
    created_at: datetime


# ── Helpers partagés (paiement intégré) ───────────────────────────

def _ipn_callback_url(tenant_id: uuid.UUID) -> str:
    base = settings.PLATFORM_API_DOMAIN or settings.FRONTEND_URL
    if not base.startswith("http"):
        base = f"https://{base}"
    return f"{base.rstrip('/')}/api/v1/tenants/{tenant_id}/payments/webhook/nowpayments"


def _parse_expiration(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


async def _create_crypto_transaction(
    db,
    *,
    tenant_id: uuid.UUID,
    user_id: uuid.UUID | None,
    transaction_type: TransactionType,
    amount_usd: float,
    order_id: str,
    order_description: str,
    article_id: uuid.UUID | None = None,
    campaign_id: uuid.UUID | None = None,
    platform_fee: float = 0,
) -> tuple[Transaction, dict]:
    """Crée un paiement NowPayments direct et persiste immédiatement une
    Transaction PENDING avec l'adresse/montant — c'est la ligne que le
    webhook ET l'endpoint de statut viendront finaliser."""
    if not settings.NOWPAYMENTS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="NowPayments non configuré. Ajoutez NOWPAYMENTS_API_KEY dans .env.",
        )

    payment = await create_payment(
        price_amount=amount_usd,
        price_currency="usd",
        order_id=order_id,
        order_description=order_description,
        ipn_callback_url=_ipn_callback_url(tenant_id),
    )

    net_amount = round(amount_usd - platform_fee, 2)
    tx = Transaction(
        tenant_id=tenant_id,
        user_id=user_id,
        transaction_type=transaction_type,
        payment_gateway=PaymentGateway.NOWPAYMENTS,
        amount=amount_usd,
        currency="USDT",
        platform_fee=platform_fee,
        net_amount=net_amount,
        nowpayments_order_id=order_id,
        nowpayments_payment_id=str(payment.get("payment_id", "")),
        pay_address=payment.get("pay_address"),
        pay_amount=payment.get("pay_amount"),
        pay_currency=payment.get("pay_currency"),
        payment_expires_at=_parse_expiration(payment.get("expiration_estimate_date")),
        provider_status=payment.get("payment_status"),
        article_id=article_id,
        campaign_id=campaign_id,
    )
    db.add(tx)
    await db.commit()
    await db.refresh(tx)
    return tx, payment


def _crypto_response(tx: Transaction, amount_usd: float) -> CryptoPaymentResponse:
    address = tx.pay_address or ""
    return CryptoPaymentResponse(
        transaction_id=str(tx.id),
        order_id=tx.nowpayments_order_id or "",
        pay_address=address,
        pay_amount=float(tx.pay_amount or 0),
        pay_currency=tx.pay_currency or "usdttrc20",
        qr_code_data_uri=generate_qr_data_uri(address) if address else "",
        expires_at=tx.payment_expires_at,
        amount_usd=amount_usd,
    )


async def _finalize_transaction(db, tx: Transaction, actually_paid: float) -> None:
    """Idempotent : appelée depuis le webhook ET depuis le polling — ne doit
    jamais s'exécuter deux fois pour la même transaction (double commission
    affilié, double octroi d'accès, etc.)."""
    if tx.status == TransactionStatus.COMPLETED:
        return
    tx.status = TransactionStatus.COMPLETED

    if tx.transaction_type == TransactionType.SUBSCRIPTION:
        parts = (tx.nowpayments_order_id or "").split("_")
        plan = parts[2] if len(parts) >= 5 else "starter"
        billing = parts[3] if len(parts) >= 5 else "monthly"
        await _activate_subscription(db, tx.tenant_id, plan, billing)

        from app.api.v1.affiliate import compute_and_accrue_commissions
        await compute_and_accrue_commissions(
            db=db,
            source_tenant_id=tx.tenant_id,
            source_type="subscription",
            source_transaction_id=str(tx.id),
            gross_amount=actually_paid,
        )
        await db.commit()

        from app.services.log_service import log_event
        tenant_obj = await db.get(Tenant, tx.tenant_id)
        tenant_name = tenant_obj.name if tenant_obj else str(tx.tenant_id)
        await log_event(db, "payment.completed", level="success",
                        target_type="tenant", target_id=str(tx.tenant_id),
                        details=f"Subscription {plan}/{billing} ${actually_paid:.2f} USDT — {tenant_name}")
        try:
            from app.services.email_service import send_superadmin_event
            from app.services.auth_service import _get_super_admin_emails
            sa_emails = await _get_super_admin_emails(db)
            await send_superadmin_event(
                to=sa_emails,
                event_type="payment.completed",
                title=f"New subscription — {plan.title()} {billing}",
                details=f"Tenant: {tenant_name} · Amount: ${actually_paid:.2f} USDT",
            )
        except Exception:
            pass

    elif tx.transaction_type == TransactionType.PAID_ARTICLE:
        existing = await db.execute(
            select(ArticleAccess).where(
                ArticleAccess.user_id == tx.user_id,
                ArticleAccess.article_id == tx.article_id,
            )
        )
        if not existing.scalar_one_or_none():
            db.add(ArticleAccess(
                tenant_id=tx.tenant_id, user_id=tx.user_id,
                article_id=tx.article_id, transaction_id=tx.id,
            ))
        await db.commit()

    elif tx.transaction_type == TransactionType.AD_CAMPAIGN:
        from app.models.ad import Ad as AdModel
        from app.models.enums import AdSubmissionStatus as ADS
        ad_obj = await db.get(AdModel, tx.campaign_id) if tx.campaign_id else None
        if ad_obj and ad_obj.submission_status == ADS.PAYMENT_PENDING:
            ad_obj.submission_status = ADS.PENDING
            ad_obj.amount_paid = actually_paid
        await db.commit()

    elif tx.transaction_type == TransactionType.PAID_NEWSLETTER:
        from app.models.newsletter import NewsletterAccess
        access_q = await db.execute(
            select(NewsletterAccess).where(NewsletterAccess.nowpayments_order_id == tx.nowpayments_order_id)
        )
        access = access_q.scalar_one_or_none()
        if access and access.granted_at is None:
            access.granted_at = datetime.utcnow()
            access.amount_paid = actually_paid
        await db.commit()


async def _activate_subscription(db, tenant_id: uuid.UUID, plan: str, billing: str) -> None:
    from datetime import timedelta
    from app.models.enums import PlanTier
    from app.models.user import User as UserModel
    from app.models.tenant_user import TenantUser as TenantMember

    plan_map = {
        "starter": PlanTier.STARTER,
        "pro": PlanTier.PRO,
        "business": PlanTier.BUSINESS,
        "enterprise": PlanTier.ENTERPRISE,
    }
    plan_tier = plan_map.get(plan, PlanTier.STARTER)

    tenant = await db.get(Tenant, tenant_id)
    if tenant:
        admin_q = await db.execute(
            select(TenantMember).where(
                TenantMember.tenant_id == tenant_id,
                TenantMember.role == UserRole.TENANT_ADMIN,
            )
        )
        admin_member = admin_q.scalar_one_or_none()
        if admin_member:
            user = await db.get(UserModel, admin_member.user_id)
            if user:
                user.plan = plan_tier

    sub_q = await db.execute(
        select(TenantSubscription).where(TenantSubscription.tenant_id == tenant_id)
    )
    sub = sub_q.scalar_one_or_none()
    now = datetime.utcnow()
    period_end = now + timedelta(days=365 if billing == "annual" else 30)

    if sub:
        sub.status = SubscriptionStatus.ACTIVE
        sub.current_period_end = period_end
    else:
        db.add(TenantSubscription(
            tenant_id=tenant_id,
            status=SubscriptionStatus.ACTIVE,
            current_period_end=period_end,
        ))


# ── Checkout abonnement SaaS ──────────────────────────────────────

@router.post("/checkout-subscription", response_model=CryptoPaymentResponse, status_code=201)
async def checkout_subscription(
    tenant_id: uuid.UUID,
    body: SubscriptionCheckoutRequest,
    payload: TokenPayload,
    db: DBSession,
):
    """Crée un paiement NowPayments intégré pour mettre à niveau le plan SaaS."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)

    plan = body.plan.lower()
    billing = body.billing.lower()
    if plan not in _PLAN_TIERS:
        raise ValidationException(f"Plan invalide : {plan}")

    try:
        amount_usd = get_plan_price(plan, billing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    order_id = f"sub_{tenant_id}_{plan}_{billing}_{uuid.uuid4().hex[:8]}"
    tx, _ = await _create_crypto_transaction(
        db,
        tenant_id=tenant_id,
        user_id=uuid.UUID(payload["sub"]),
        transaction_type=TransactionType.SUBSCRIPTION,
        amount_usd=amount_usd,
        order_id=order_id,
        order_description=f"SmarterBloggers {plan.title()} — {billing}",
    )
    return _crypto_response(tx, amount_usd)


# ── Checkout article payant ───────────────────────────────────────

@router.post("/checkout", response_model=CryptoPaymentResponse, status_code=201)
async def checkout_article(
    tenant_id: uuid.UUID,
    body: ArticleCheckoutRequest,
    payload: TokenPayload,
    db: DBSession,
):
    """Crée un paiement NowPayments intégré pour acheter un article payant."""
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)

    article_result = await db.execute(
        select(Article).where(
            Article.id == uuid.UUID(body.article_id),
            Article.tenant_id == tenant_id,
            Article.deleted_at.is_(None),
        )
    )
    article = article_result.scalar_one_or_none()
    if not article:
        raise NotFoundException("Article")
    if not article.price or article.price <= 0:
        raise ValidationException("Cet article n'est pas payant.")

    user_id = uuid.UUID(payload["sub"])
    access = await db.execute(
        select(ArticleAccess).where(
            ArticleAccess.user_id == user_id,
            ArticleAccess.article_id == article.id,
        )
    )
    if access.scalar_one_or_none():
        raise ValidationException("Vous avez déjà accès à cet article.")

    platform_fee = round(article.price * settings.NOWPAYMENTS_PLATFORM_FEE_PERCENT / 100, 2)
    order_id = f"art_{tenant_id}_{article.id}_{uuid.uuid4().hex[:8]}"

    tx, _ = await _create_crypto_transaction(
        db,
        tenant_id=tenant_id,
        user_id=user_id,
        transaction_type=TransactionType.PAID_ARTICLE,
        amount_usd=article.price,
        order_id=order_id,
        order_description=article.title[:100],
        article_id=article.id,
        platform_fee=platform_fee,
    )
    return _crypto_response(tx, article.price)


# ── Statut de paiement (polling) ──────────────────────────────────

@router.get("/status/{order_id}", response_model=PaymentStatusResponse)
async def get_payment_status_endpoint(
    tenant_id: uuid.UUID,
    order_id: str,
    db: DBSession,
):
    """
    Public — interrogé par le panneau de paiement pendant l'attente.
    `order_id` agit comme jeton opaque (même modèle de confiance que le
    webhook, déjà public) ; les données renvoyées (statut/adresse/montant)
    sont de toute façon déjà visibles du payeur.

    Relit le statut en direct depuis NowPayments tant que la transaction
    n'est pas dans un état terminal — c'est la vérification "à la source"
    demandée, en complément du webhook qui reste la voie la plus rapide.
    """
    tx_q = await db.execute(
        select(Transaction).where(
            Transaction.tenant_id == tenant_id,
            Transaction.nowpayments_order_id == order_id,
        )
    )
    tx = tx_q.scalar_one_or_none()
    if not tx:
        raise NotFoundException("Paiement")

    if tx.status == TransactionStatus.PENDING and tx.nowpayments_payment_id:
        try:
            live = await get_payment_status(tx.nowpayments_payment_id)
            live_status = live.get("payment_status") or tx.provider_status
            tx.provider_status = live_status
            if live_status == "finished":
                await _finalize_transaction(db, tx, float(live.get("actually_paid", 0) or 0))
            elif live_status in _TERMINAL_PROVIDER_STATUSES:
                tx.status = TransactionStatus.FAILED
            await db.commit()
        except Exception:
            # L'appel direct a échoué (NowPayments down, réseau, ...) — le
            # webhook reste la voie de secours, on renvoie l'état local.
            pass

    return PaymentStatusResponse(
        status=tx.status.value,
        provider_status=tx.provider_status,
        pay_address=tx.pay_address,
        pay_amount=float(tx.pay_amount) if tx.pay_amount is not None else None,
        expires_at=tx.payment_expires_at,
    )


# ── Webhook IPN NowPayments ───────────────────────────────────────

@router.post("/webhook/nowpayments", status_code=200)
async def nowpayments_webhook(
    tenant_id: uuid.UUID,
    request: Request,
    db: DBSession,
    x_nowpayments_sig: str = Header(default="", alias="x-nowpayments-sig"),
):
    """Webhook IPN NowPayments — voie la plus rapide (push). La transaction a
    toujours déjà été créée au moment du checkout, pour les 4 flux de paiement."""
    raw = await request.body()

    if not settings.NOWPAYMENTS_SANDBOX:
        if not verify_ipn_signature(raw, x_nowpayments_sig):
            raise HTTPException(status_code=400, detail="Signature IPN invalide.")

    import json as _json
    data = _json.loads(raw)

    payment_status = data.get("payment_status", "")
    order_id: str = data.get("order_id", "")
    actually_paid = float(data.get("actually_paid", 0) or 0)

    tx_q = await db.execute(
        select(Transaction).where(
            Transaction.tenant_id == tenant_id,
            Transaction.nowpayments_order_id == order_id,
        )
    )
    tx = tx_q.scalar_one_or_none()
    if not tx:
        return {"received": True, "action": "ignored", "reason": "unknown_order_id"}

    tx.provider_status = payment_status
    if payment_status == "finished":
        await _finalize_transaction(db, tx, actually_paid)
    elif payment_status in _TERMINAL_PROVIDER_STATUSES:
        tx.status = TransactionStatus.FAILED
    await db.commit()

    return {"received": True, "action": "processed", "status": payment_status}


# ── Transactions ──────────────────────────────────────────────────

@router.get("/transactions", response_model=list[TransactionResponse])
async def list_transactions(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    limit: int = 20,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(Transaction)
        .where(Transaction.tenant_id == tenant_id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    return [_tx_response(t) for t in result.scalars().all()]


@router.get("/access/{article_id}")
async def check_access(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(
        select(ArticleAccess).where(
            ArticleAccess.user_id == user_id,
            ArticleAccess.article_id == article_id,
            ArticleAccess.tenant_id == tenant_id,
        )
    )
    return {"has_access": result.scalar_one_or_none() is not None}


@router.get("/subscription")
async def get_subscription(
    tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    result = await db.execute(
        select(TenantSubscription).where(TenantSubscription.tenant_id == tenant_id)
    )
    sub = result.scalar_one_or_none()
    if not sub:
        return {"status": "none", "plan": "starter"}
    return {
        "status": sub.status.value,
        "current_period_end": sub.current_period_end,
        "cancel_at_period_end": sub.cancel_at_period_end,
        "trial_ends_at": sub.trial_ends_at,
    }


def _tx_response(t: Transaction) -> TransactionResponse:
    return TransactionResponse(
        id=str(t.id),
        transaction_type=t.transaction_type.value,
        status=t.status,
        payment_gateway=t.payment_gateway,
        amount=float(t.amount),
        currency=t.currency,
        platform_fee=float(t.platform_fee),
        net_amount=float(t.net_amount),
        article_id=str(t.article_id) if t.article_id else None,
        created_at=t.created_at,
    )
