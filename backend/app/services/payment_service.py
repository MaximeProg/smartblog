"""
Service paiements — Stripe Connect + PayPal.
"""
import stripe
import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.payment import Transaction, ArticleAccess, TenantSubscription
from app.models.enums import PaymentGateway, TransactionType, TransactionStatus
from app.core.exceptions import ValidationException, NotFoundException


def _init_stripe():
    stripe.api_key = settings.STRIPE_SECRET_KEY


# ─── Stripe — article payant ───────────────────────────────────────

async def create_article_payment_intent(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
    article_id: uuid.UUID,
    amount_cents: int,
    currency: str = "usd",
    stripe_customer_id: str | None = None,
) -> dict:
    _init_stripe()
    platform_fee_cents = int(amount_cents * settings.STRIPE_PLATFORM_FEE_PERCENT / 100)

    intent = stripe.PaymentIntent.create(
        amount=amount_cents,
        currency=currency,
        customer=stripe_customer_id,
        metadata={
            "tenant_id": str(tenant_id),
            "user_id": str(user_id),
            "article_id": str(article_id),
            "type": TransactionType.PAID_ARTICLE.value,
        },
        application_fee_amount=platform_fee_cents,
    )

    tx = Transaction(
        tenant_id=tenant_id,
        user_id=user_id,
        transaction_type=TransactionType.PAID_ARTICLE,
        payment_gateway=PaymentGateway.STRIPE,
        amount=amount_cents / 100,
        currency=currency.upper(),
        platform_fee=platform_fee_cents / 100,
        net_amount=(amount_cents - platform_fee_cents) / 100,
        stripe_payment_intent_id=intent["id"],
        article_id=article_id,
    )
    db.add(tx)
    await db.commit()

    return {
        "client_secret": intent["client_secret"],
        "payment_intent_id": intent["id"],
        "transaction_id": str(tx.id),
    }


async def handle_stripe_webhook(db: AsyncSession, payload: bytes, sig_header: str) -> None:
    _init_stripe()
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except stripe.error.SignatureVerificationError:
        raise ValidationException("Signature Stripe invalide.")

    if event["type"] == "payment_intent.succeeded":
        await _on_payment_succeeded(db, event["data"]["object"])
    elif event["type"] == "payment_intent.payment_failed":
        await _on_payment_failed(db, event["data"]["object"])
    elif event["type"] == "customer.subscription.updated":
        await _on_subscription_updated(db, event["data"]["object"])
    elif event["type"] == "customer.subscription.deleted":
        await _on_subscription_canceled(db, event["data"]["object"])
    elif event["type"] == "charge.refunded":
        await _on_refund(db, event["data"]["object"])


async def _on_payment_succeeded(db: AsyncSession, intent: dict) -> None:
    result = await db.execute(
        select(Transaction).where(Transaction.stripe_payment_intent_id == intent["id"])
    )
    tx = result.scalar_one_or_none()
    if not tx:
        return

    tx.status = TransactionStatus.COMPLETED
    tx.stripe_charge_id = intent.get("latest_charge")

    # Accès à l'article
    if tx.article_id and tx.transaction_type == TransactionType.PAID_ARTICLE:
        db.add(ArticleAccess(
            tenant_id=tx.tenant_id,
            user_id=tx.user_id,
            article_id=tx.article_id,
            transaction_id=tx.id,
        ))

    await db.commit()


async def _on_payment_failed(db: AsyncSession, intent: dict) -> None:
    result = await db.execute(
        select(Transaction).where(Transaction.stripe_payment_intent_id == intent["id"])
    )
    tx = result.scalar_one_or_none()
    if tx:
        tx.status = TransactionStatus.FAILED
        await db.commit()


async def _on_subscription_updated(db: AsyncSession, sub: dict) -> None:
    result = await db.execute(
        select(TenantSubscription).where(
            TenantSubscription.stripe_subscription_id == sub["id"]
        )
    )
    ts = result.scalar_one_or_none()
    if not ts:
        return
    from app.models.enums import SubscriptionStatus
    ts.status = SubscriptionStatus(sub["status"])
    ts.current_period_start = datetime.fromtimestamp(sub["current_period_start"], tz=timezone.utc)
    ts.current_period_end = datetime.fromtimestamp(sub["current_period_end"], tz=timezone.utc)
    ts.cancel_at_period_end = sub.get("cancel_at_period_end", False)
    await db.commit()


async def _on_subscription_canceled(db: AsyncSession, sub: dict) -> None:
    result = await db.execute(
        select(TenantSubscription).where(
            TenantSubscription.stripe_subscription_id == sub["id"]
        )
    )
    ts = result.scalar_one_or_none()
    if ts:
        from app.models.enums import SubscriptionStatus
        ts.status = SubscriptionStatus.CANCELED
        await db.commit()


async def _on_refund(db: AsyncSession, charge: dict) -> None:
    result = await db.execute(
        select(Transaction).where(Transaction.stripe_charge_id == charge["id"])
    )
    tx = result.scalar_one_or_none()
    if tx:
        tx.status = TransactionStatus.REFUNDED
        tx.refunded_at = datetime.now(timezone.utc)
        await db.commit()


# ─── PayPal — article payant ───────────────────────────────────────

async def create_paypal_order(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    user_id: uuid.UUID,
    article_id: uuid.UUID,
    amount: float,
    currency: str = "USD",
) -> dict:
    import httpx
    token = await _paypal_access_token()

    base = "https://api-m.sandbox.paypal.com" if settings.PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"
    platform_fee = round(amount * settings.STRIPE_PLATFORM_FEE_PERCENT / 100, 2)

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base}/v2/checkout/orders",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "intent": "CAPTURE",
                "purchase_units": [{
                    "amount": {"currency_code": currency, "value": str(amount)},
                    "custom_id": f"{tenant_id}|{user_id}|{article_id}",
                }],
            },
        )
        order = resp.json()

    tx = Transaction(
        tenant_id=tenant_id,
        user_id=user_id,
        transaction_type=TransactionType.PAID_ARTICLE,
        payment_gateway=PaymentGateway.PAYPAL,
        amount=amount,
        currency=currency,
        platform_fee=platform_fee,
        net_amount=round(amount - platform_fee, 2),
        paypal_order_id=order["id"],
        article_id=article_id,
    )
    db.add(tx)
    await db.commit()

    approve_url = next(
        (l["href"] for l in order.get("links", []) if l["rel"] == "approve"),
        None,
    )
    return {"order_id": order["id"], "approve_url": approve_url, "transaction_id": str(tx.id)}


async def capture_paypal_order(db: AsyncSession, paypal_order_id: str) -> dict:
    import httpx
    token = await _paypal_access_token()
    base = "https://api-m.sandbox.paypal.com" if settings.PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base}/v2/checkout/orders/{paypal_order_id}/capture",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
        capture = resp.json()

    result = await db.execute(
        select(Transaction).where(Transaction.paypal_order_id == paypal_order_id)
    )
    tx = result.scalar_one_or_none()
    if tx and capture.get("status") == "COMPLETED":
        units = capture.get("purchase_units", [{}])
        captures_list = units[0].get("payments", {}).get("captures", [{}])
        tx.paypal_capture_id = captures_list[0].get("id") if captures_list else None
        tx.status = TransactionStatus.COMPLETED

        if tx.article_id:
            db.add(ArticleAccess(
                tenant_id=tx.tenant_id,
                user_id=tx.user_id,
                article_id=tx.article_id,
                transaction_id=tx.id,
            ))
        await db.commit()

    return capture


async def _paypal_access_token() -> str:
    import httpx, base64
    base = "https://api-m.sandbox.paypal.com" if settings.PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"
    creds = base64.b64encode(f"{settings.PAYPAL_CLIENT_ID}:{settings.PAYPAL_CLIENT_SECRET}".encode()).decode()
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{base}/v1/oauth2/token",
            headers={"Authorization": f"Basic {creds}"},
            data={"grant_type": "client_credentials"},
        )
    return resp.json()["access_token"]
