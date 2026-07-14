"""
M20 — Paiements via NowPayments (crypto USDT TRC20)
Stripe et PayPal retirés suite à décision PDG 2026-07-12.
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
from app.models.user import User
from app.models.tenant import Tenant
from app.models.enums import PaymentGateway, TransactionType, TransactionStatus, SubscriptionStatus
from app.services.nowpayments_service import (
    create_invoice, verify_ipn_signature, get_plan_price,
)
from app.api.v1.tenants import _assert_member, _assert_role
from app.models.enums import UserRole

router = APIRouter(prefix="/tenants/{tenant_id}/payments", tags=["payments"])

_PLAN_TIERS = {"starter", "pro", "business", "enterprise"}


# ── Schemas ───────────────────────────────────────────────────────

class SubscriptionCheckoutRequest(BaseModel):
    plan: str           # starter | pro | business | enterprise
    billing: str = "monthly"   # monthly | annual
    success_url: str | None = None
    cancel_url: str | None = None


class SubscriptionCheckoutResponse(BaseModel):
    invoice_url: str
    invoice_id: str
    order_id: str
    amount_usd: float


class ArticleCheckoutRequest(BaseModel):
    article_id: str
    success_url: str | None = None
    cancel_url: str | None = None


class ArticleCheckoutResponse(BaseModel):
    invoice_url: str
    invoice_id: str
    transaction_id: str
    amount_usd: float


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


# ── Checkout abonnement SaaS ──────────────────────────────────────

@router.post("/checkout-subscription", response_model=SubscriptionCheckoutResponse, status_code=201)
async def checkout_subscription(
    tenant_id: uuid.UUID,
    body: SubscriptionCheckoutRequest,
    payload: TokenPayload,
    db: DBSession,
):
    """Crée une invoice NowPayments pour mettre à niveau le plan SaaS."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)

    if not settings.NOWPAYMENTS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="NowPayments non configuré. Ajoutez NOWPAYMENTS_API_KEY dans .env.",
        )

    plan = body.plan.lower()
    billing = body.billing.lower()
    if plan not in _PLAN_TIERS:
        raise ValidationException(f"Plan invalide : {plan}")

    try:
        amount_usd = get_plan_price(plan, billing)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    order_id = f"sub_{tenant_id}_{plan}_{billing}_{uuid.uuid4().hex[:8]}"
    frontend_url = settings.FRONTEND_URL

    invoice = await create_invoice(
        price_amount=amount_usd,
        price_currency="usd",
        order_id=order_id,
        order_description=f"SmarterBloggers {plan.title()} — {billing}",
        success_url=body.success_url or f"{frontend_url}/subscription?success=1&plan={plan}",
        cancel_url=body.cancel_url or f"{frontend_url}/subscription",
        ipn_callback_url=f"{settings.PLATFORM_API_DOMAIN or frontend_url}/api/v1/tenants/{tenant_id}/payments/webhook/nowpayments",
    )

    return SubscriptionCheckoutResponse(
        invoice_url=invoice["invoice_url"],
        invoice_id=str(invoice["id"]),
        order_id=order_id,
        amount_usd=amount_usd,
    )


# ── Checkout article payant ───────────────────────────────────────

@router.post("/checkout", response_model=ArticleCheckoutResponse, status_code=201)
async def checkout_article(
    tenant_id: uuid.UUID,
    body: ArticleCheckoutRequest,
    payload: TokenPayload,
    db: DBSession,
):
    """Crée une invoice NowPayments pour acheter un article payant."""
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
    net_amount = round(article.price - platform_fee, 2)
    order_id = f"art_{tenant_id}_{article.id}_{uuid.uuid4().hex[:8]}"
    frontend_url = settings.FRONTEND_URL

    invoice = await create_invoice(
        price_amount=article.price,
        price_currency="usd",
        order_id=order_id,
        order_description=article.title[:100],
        success_url=body.success_url or f"{frontend_url}/{tenant_id}/articles/{article.slug}?unlocked=1",
        cancel_url=body.cancel_url or f"{frontend_url}/{tenant_id}/articles/{article.slug}",
        ipn_callback_url=f"{settings.PLATFORM_API_DOMAIN or frontend_url}/api/v1/tenants/{tenant_id}/payments/webhook/nowpayments",
    )

    tx = Transaction(
        tenant_id=tenant_id,
        user_id=user_id,
        transaction_type=TransactionType.PAID_ARTICLE,
        payment_gateway=PaymentGateway.NOWPAYMENTS,
        amount=article.price,
        currency="USDT",
        platform_fee=platform_fee,
        net_amount=net_amount,
        nowpayments_invoice_id=str(invoice["id"]),
        nowpayments_order_id=order_id,
        article_id=article.id,
    )
    db.add(tx)
    await db.commit()

    return ArticleCheckoutResponse(
        invoice_url=invoice["invoice_url"],
        invoice_id=str(invoice["id"]),
        transaction_id=str(tx.id),
        amount_usd=article.price,
    )


# ── Webhook IPN NowPayments ───────────────────────────────────────

@router.post("/webhook/nowpayments", status_code=200)
async def nowpayments_webhook(
    tenant_id: uuid.UUID,
    request: Request,
    db: DBSession,
    x_nowpayments_sig: str = Header(default="", alias="x-nowpayments-sig"),
):
    """
    Webhook IPN NowPayments. Déclenché quand un paiement est confirmé.
    payment_status == "finished" → activer abonnement ou débloquer article.
    """
    raw = await request.body()

    # En sandbox, on skip la vérification si le secret n'est pas configuré
    if not settings.NOWPAYMENTS_SANDBOX:
        if not verify_ipn_signature(raw, x_nowpayments_sig):
            raise HTTPException(status_code=400, detail="Signature IPN invalide.")

    import json as _json
    data = _json.loads(raw)

    payment_status = data.get("payment_status", "")
    order_id: str = data.get("order_id", "")
    nowpayments_payment_id = str(data.get("payment_id", ""))
    actually_paid = float(data.get("actually_paid", 0))

    if payment_status != "finished":
        return {"received": True, "action": "ignored", "status": payment_status}

    # ── Abonnement SaaS ───────────────────────────────────────────
    if order_id.startswith("sub_"):
        parts = order_id.split("_")
        # order_id = sub_{tenant_id}_{plan}_{billing}_{nonce}
        if len(parts) >= 5:
            sub_tenant_id = uuid.UUID(parts[1])
            plan = parts[2]
            billing = parts[3]
            await _activate_subscription(db, sub_tenant_id, plan, billing, nowpayments_payment_id, actually_paid)
            # Déclencher commissions affiliés
            from app.api.v1.affiliate import compute_and_accrue_commissions
            await compute_and_accrue_commissions(
                db=db,
                source_tenant_id=sub_tenant_id,
                source_type="subscription",
                source_transaction_id=nowpayments_payment_id,
                gross_amount=actually_paid,
            )
            await db.commit()
            # Notify super admins
            try:
                from app.services.email_service import send_superadmin_event
                from app.services.auth_service import _get_super_admin_emails
                sa_emails = await _get_super_admin_emails(db)
                tenant_obj = await db.get(Tenant, sub_tenant_id)
                tenant_name = tenant_obj.name if tenant_obj else str(sub_tenant_id)
                await send_superadmin_event(
                    to=sa_emails,
                    event_type="payment.completed",
                    title=f"New subscription — {plan.title()} {billing}",
                    details=f"Tenant: {tenant_name} · Amount: ${actually_paid:.2f} USDT",
                )
            except Exception:
                pass

    # ── Article payant ────────────────────────────────────────────
    elif order_id.startswith("art_"):
        await _activate_article_access(db, order_id, nowpayments_payment_id)
        await db.commit()

    # ── Slot publicitaire ─────────────────────────────────────────
    elif order_id.startswith("ad_"):
        # order_id = ad_{tenant_id}_{ad_id}_{nonce}
        parts = order_id.split("_")
        if len(parts) >= 4:
            try:
                ad_id = uuid.UUID(parts[2])
                from app.models.ad import Ad as AdModel
                from app.models.enums import AdSubmissionStatus as ADS
                ad_q = await db.execute(select(AdModel).where(AdModel.id == ad_id))
                ad_obj = ad_q.scalar_one_or_none()
                if ad_obj and ad_obj.submission_status == ADS.PAYMENT_PENDING:
                    ad_obj.submission_status = ADS.PENDING
                    ad_obj.amount_paid = actually_paid
                    await db.commit()
            except (ValueError, Exception):
                pass

    return {"received": True, "action": "processed"}


async def _activate_subscription(
    db, tenant_id: uuid.UUID, plan: str, billing: str,
    payment_id: str, amount: float,
) -> None:
    from datetime import timedelta
    from app.models.enums import PlanTier

    plan_map = {
        "starter": PlanTier.STARTER,
        "pro": PlanTier.PRO,
        "business": PlanTier.BUSINESS,
        "enterprise": PlanTier.ENTERPRISE,
    }
    plan_tier = plan_map.get(plan, PlanTier.STARTER)

    tenant = await db.get(Tenant, tenant_id)
    if tenant:
        # Update plan on the tenant's admin user
        from sqlalchemy import update
        from app.models.user import User as UserModel
        from app.models.tenant import TenantMember
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

    # Upsert TenantSubscription
    sub_q = await db.execute(
        select(TenantSubscription).where(TenantSubscription.tenant_id == tenant_id)
    )
    sub = sub_q.scalar_one_or_none()
    now = datetime.utcnow()
    from datetime import timedelta
    period_end = now + timedelta(days=365 if billing == "annual" else 30)

    if sub:
        sub.status = SubscriptionStatus.ACTIVE
        sub.current_period_end = period_end
    else:
        sub = TenantSubscription(
            tenant_id=tenant_id,
            status=SubscriptionStatus.ACTIVE,
            current_period_end=period_end,
        )
        db.add(sub)

    # Record transaction
    tx = Transaction(
        tenant_id=tenant_id,
        transaction_type=TransactionType.SUBSCRIPTION,
        payment_gateway=PaymentGateway.NOWPAYMENTS,
        amount=amount,
        currency="USDT",
        platform_fee=0,
        net_amount=amount,
        nowpayments_invoice_id=payment_id,
        nowpayments_order_id=payment_id,
        status=TransactionStatus.COMPLETED,
    )
    db.add(tx)


async def _activate_article_access(db, order_id: str, payment_id: str) -> None:
    # Find transaction by order_id
    tx_q = await db.execute(
        select(Transaction).where(Transaction.nowpayments_order_id == order_id)
    )
    tx = tx_q.scalar_one_or_none()
    if not tx:
        return

    tx.status = TransactionStatus.COMPLETED
    tx.nowpayments_invoice_id = payment_id

    # Grant article access
    existing = await db.execute(
        select(ArticleAccess).where(
            ArticleAccess.user_id == tx.user_id,
            ArticleAccess.article_id == tx.article_id,
        )
    )
    if not existing.scalar_one_or_none():
        access = ArticleAccess(
            tenant_id=tx.tenant_id,
            user_id=tx.user_id,
            article_id=tx.article_id,
            transaction_id=tx.id,
        )
        db.add(access)


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
