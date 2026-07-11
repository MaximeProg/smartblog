import asyncio
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
from app.models.enums import PaymentGateway, TransactionStatus, UserRole
from app.services.payment_service import (
    create_article_payment_intent, handle_stripe_webhook,
    create_paypal_order, capture_paypal_order,
)
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/payments", tags=["payments"])


class ArticleCheckoutRequest(BaseModel):
    article_id: str
    gateway: PaymentGateway = PaymentGateway.STRIPE
    currency: str = "USD"
    success_url: str | None = None
    cancel_url: str | None = None


class CheckoutResponse(BaseModel):
    gateway: PaymentGateway
    transaction_id: str
    # Stripe
    client_secret: str | None = None
    # PayPal
    order_id: str | None = None
    approve_url: str | None = None


class SubscriptionCheckoutRequest(BaseModel):
    plan: str           # starter | pro | business
    billing: str = "monthly"   # monthly | annual
    success_url: str | None = None
    cancel_url: str | None = None


class SubscriptionCheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


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


# ── Checkout article payant ────────────────────────────────────────

@router.post("/checkout", response_model=CheckoutResponse, status_code=201)
async def checkout(
    tenant_id: uuid.UUID,
    body: ArticleCheckoutRequest,
    payload: TokenPayload,
    db: DBSession,
):
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

    # Vérifier si l'accès existe déjà
    access = await db.execute(
        select(ArticleAccess).where(
            ArticleAccess.user_id == user_id,
            ArticleAccess.article_id == article.id,
        )
    )
    if access.scalar_one_or_none():
        raise ValidationException("Vous avez déjà accès à cet article.")

    amount_cents = int(article.price * 100)

    if body.gateway == PaymentGateway.STRIPE:
        result = await create_article_payment_intent(
            db, tenant_id, user_id, article.id, amount_cents, body.currency.lower()
        )
        return CheckoutResponse(
            gateway=PaymentGateway.STRIPE,
            transaction_id=result["transaction_id"],
            client_secret=result["client_secret"],
        )
    else:
        result = await create_paypal_order(
            db, tenant_id, user_id, article.id, article.price, body.currency.upper()
        )
        return CheckoutResponse(
            gateway=PaymentGateway.PAYPAL,
            transaction_id=result["transaction_id"],
            order_id=result["order_id"],
            approve_url=result["approve_url"],
        )


# ── Checkout abonnement SaaS ─────────────────────────────────────

@router.post("/checkout-subscription", response_model=SubscriptionCheckoutResponse, status_code=201)
async def checkout_subscription(
    tenant_id: uuid.UUID,
    body: SubscriptionCheckoutRequest,
    payload: TokenPayload,
    db: DBSession,
):
    """Crée une Stripe Checkout Session pour mettre à niveau le plan SaaS."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)

    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="Stripe non configuré. Ajoutez STRIPE_SECRET_KEY dans .env puis relancez le serveur.",
        )

    plan_key = f"{body.plan.lower()}_{body.billing.lower()}"
    price_id = settings.stripe_price_map.get(plan_key, "")
    if not price_id:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Price ID Stripe manquant pour {body.plan}/{body.billing}. "
                f"Ajoutez STRIPE_PRICE_{body.plan.upper()}_{body.billing.upper()} dans .env"
            ),
        )

    try:
        import stripe as _stripe
    except ImportError:
        raise HTTPException(status_code=503, detail="Package stripe non installé (pip install stripe).")

    _stripe.api_key = settings.STRIPE_SECRET_KEY

    user_result = await db.execute(select(User).where(User.id == uuid.UUID(payload["sub"])))
    user = user_result.scalar_one_or_none()

    frontend_url = settings.FRONTEND_URL
    success_url = body.success_url or f"{frontend_url}/subscription?success=1&plan={body.plan}&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = body.cancel_url or f"{frontend_url}/subscription"

    session = await asyncio.to_thread(
        _stripe.checkout.Session.create,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=user.email if user else None,
        allow_promotion_codes=True,
        metadata={"tenant_id": str(tenant_id), "plan": body.plan, "billing": body.billing},
        subscription_data={"metadata": {"tenant_id": str(tenant_id), "plan": body.plan}},
    )

    return SubscriptionCheckoutResponse(checkout_url=session.url, session_id=session.id)


# ── PayPal capture (retour après approbation) ─────────────────────

@router.post("/paypal/capture")
async def paypal_capture(
    tenant_id: uuid.UUID,
    order_id: str,
    payload: TokenPayload,
    db: DBSession,
):
    capture = await capture_paypal_order(db, order_id)
    return {"status": capture.get("status"), "order_id": order_id}


# ── Stripe webhook ─────────────────────────────────────────────────

@router.post("/webhook/stripe", status_code=200)
async def stripe_webhook(
    tenant_id: uuid.UUID,
    request: Request,
    db: DBSession,
    stripe_signature: str = Header(default=None, alias="stripe-signature"),
):
    payload = await request.body()
    await handle_stripe_webhook(db, payload, stripe_signature)
    return {"received": True}


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


# ── Vérifier accès article ────────────────────────────────────────

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
    access = result.scalar_one_or_none()
    return {"has_access": access is not None}


# ── Abonnement SaaS du tenant ─────────────────────────────────────

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


# ── Helper ────────────────────────────────────────────────────────

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
