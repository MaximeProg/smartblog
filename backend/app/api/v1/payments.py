"""
M20 — Paiements via NowPayments (crypto USDT BSC / BEP20)
Stripe et PayPal retirés suite à décision PDG 2026-07-12.

Paiement intégré (sans redirection) : le checkout retourne directement
l'adresse de dépôt + un QR code, affichés sur notre propre plateforme. La
confirmation peut arriver par deux voies complémentaires qui coexistent :
le webhook IPN NowPayments (poussé), et l'endpoint de statut ci-dessous que
le frontend interroge en polling et qui, si besoin, relit le statut en
direct depuis NowPayments (GET /v1/payment/{id}). Les deux convergent vers
la même fonction idempotente `_finalize_transaction`.
"""
import logging
import uuid
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, Header, HTTPException
from sqlalchemy import select, text
from pydantic import BaseModel, Field

from app.core.config import settings
from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException
from app.models.payment import Transaction, ArticleAccess, UserSubscription
from app.models.article import Article
from app.models.tenant import Tenant
from app.models.domain import DomainOrder, CustomDomain
from app.models.enums import (
    PaymentGateway, TransactionType, TransactionStatus, SubscriptionStatus,
    DomainOrderStatus, DomainSource,
)
from app.services.nowpayments_service import (
    create_payment, get_payment_status, generate_qr_data_uri,
    verify_ipn_signature, get_payment_currencies, get_min_amount,
)
from app.api.v1.tenants import _assert_member, _assert_role
from app.models.enums import UserRole

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/tenants/{tenant_id}/payments", tags=["payments"])

_PLAN_TIERS = {"starter", "pro", "business", "enterprise"}
_TERMINAL_PROVIDER_STATUSES = {"failed", "expired"}


# ── Schemas ───────────────────────────────────────────────────────

class SubscriptionCheckoutRequest(BaseModel):
    plan: str           # starter | pro | business | enterprise
    billing: str = "monthly"   # monthly | annual
    pay_currency: str = "usdtbsc"


class ArticleCheckoutRequest(BaseModel):
    article_id: str
    pay_currency: str = "usdtbsc"


class RegistrantInfo(BaseModel):
    name: str
    email: str
    # Un champ vide passait la validation Pydantic (str vide = str valide) et
    # produisait un indicatif téléphonique vide envoyé tel quel à OpenProvider
    # -> "Invalid telephone country code!" (code 131), incompréhensible pour
    # le client. Bug réel constaté le 2026-08-05 (le formulaire frontend ne
    # bloquait pas non plus sur un téléphone vide, corrigé au même moment).
    phone: str = Field(min_length=5)
    address: str
    city: str
    country: str  # code ISO 2 lettres, ex: "FR"
    zipcode: str


class DomainCheckoutRequest(BaseModel):
    domain_name: str  # nom complet avec extension, ex: "monblog.com"
    years: int = 1
    auto_renew: bool = False
    registrant: RegistrantInfo
    pay_currency: str = "usdtbsc"
    # Case à cocher obligatoire (CGV d'achat de domaine, décision PDG
    # 2026-08-06) — voir checkout_domain, qui rejette toute requête où ce
    # champ n'est pas explicitement True avant même de contacter le registrar.
    consent: bool = False


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
    amount_received: float = 0
    amount_due: float = 0


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

async def _get_plan_price(db, plan: str, billing: str) -> float:
    """Prix réel du plan — lu depuis subscription_plans, la même source que
    la page de tarifs publique. Ne JAMAIS utiliser un prix codé en dur ici :
    le montant facturé doit toujours correspondre au prix affiché."""
    row = (await db.execute(
        text("SELECT price_monthly, price_yearly FROM subscription_plans WHERE id = :id AND is_active = TRUE"),
        {"id": plan},
    )).fetchone()
    if not row:
        raise ValueError(f"Plan inconnu ou inactif : {plan}")
    price = row.price_yearly if billing == "annual" else row.price_monthly
    if price is None or float(price) <= 0:
        raise ValueError(f"Ce plan n'a pas de prix configuré : {plan}")
    return float(price)


def _ipn_callback_url(tenant_id: uuid.UUID) -> str:
    base = settings.PLATFORM_API_DOMAIN or settings.FRONTEND_URL
    if not base.startswith("http"):
        base = f"https://{base}"
    return f"{base.rstrip('/')}/api/v1/tenants/{tenant_id}/payments/webhook/nowpayments"


def _payment_window_expiry() -> datetime:
    """`expiration_estimate_date` renvoyé par NowPayments n'est que le délai de
    rafraîchissement du cours (quelques minutes) — sans pertinence pour un
    paiement en USDT (stablecoin) où l'adresse de dépôt reste utilisable
    plusieurs jours côté NowPayments. On affiche donc notre propre fenêtre,
    réglable via NOWPAYMENTS_PAYMENT_WINDOW_HOURS."""
    return datetime.now(timezone.utc) + timedelta(hours=settings.NOWPAYMENTS_PAYMENT_WINDOW_HOURS)


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
    pay_currency: str = "usdtbsc",
    extra: dict | None = None,
) -> tuple[Transaction, dict]:
    """Crée un paiement NowPayments direct et persiste immédiatement une
    Transaction PENDING avec l'adresse/montant — c'est la ligne que le
    webhook ET l'endpoint de statut viendront finaliser."""
    if not settings.NOWPAYMENTS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="NowPayments is not configured. Add NOWPAYMENTS_API_KEY in .env.",
        )

    payment = await create_payment(
        price_amount=amount_usd,
        order_id=order_id,
        order_description=order_description,
        ipn_callback_url=_ipn_callback_url(tenant_id),
        pay_currency=pay_currency,
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
        payment_expires_at=_payment_window_expiry(),
        provider_status=payment.get("payment_status"),
        article_id=article_id,
        campaign_id=campaign_id,
        extra=extra,
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
        pay_currency=tx.pay_currency or "usdtbsc",
        qr_code_data_uri=generate_qr_data_uri(address) if address else "",
        expires_at=tx.payment_expires_at,
        amount_usd=amount_usd,
    )


async def _get_payment_tolerance_usd() -> float:
    """Marge de tolérance sur les paiements "partially_paid", configurable
    par le Super Admin (platform:settings en Redis) — même mécanisme que
    domain_markup_percent (voir app.services.registrars.pricing)."""
    from app.core.redis_client import redis
    import json
    try:
        raw = await redis.get("platform:settings")
        overrides = json.loads(raw) if raw else {}
        value = overrides.get("nowpayments_tolerance_usd")
        return float(value) if value is not None else settings.NOWPAYMENTS_TOLERANCE_USD
    except Exception:
        return settings.NOWPAYMENTS_TOLERANCE_USD


async def _apply_provider_update(db, tx: Transaction, payment_status: str, actually_paid: float) -> None:
    """
    Logique partagée webhook + polling : décide si la transaction doit être
    finalisée, marquée PARTIALLY_PAID, ou FAILED — avec une marge de
    tolérance sur les écarts crypto (frais réseau/variation de cours) pour
    ne jamais bloquer un paiement à quelques centimes près.
    """
    tx.provider_status = payment_status
    if actually_paid > 0:
        tx.amount_received = actually_paid  # cumul absolu pour cette adresse, pas un delta (même
                                             # adresse tout du long — NowPayments détecte lui-même
                                             # les "Re-deposit" sur la même adresse)

    shortfall = float(tx.amount) - float(tx.amount_received or 0)
    tolerance = await _get_payment_tolerance_usd()

    if payment_status == "finished" or (payment_status == "partially_paid" and shortfall <= tolerance):
        await _finalize_transaction(db, tx, float(tx.amount_received or 0))
    elif payment_status == "partially_paid":
        tx.status = TransactionStatus.PARTIALLY_PAID
    elif payment_status in _TERMINAL_PROVIDER_STATUSES:
        # Ne pas perdre un paiement partiel déjà reçu : récupérable via
        # reprise plutôt que marqué FAILED s'il y a déjà de l'argent dessus.
        tx.status = TransactionStatus.PARTIALLY_PAID if float(tx.amount_received or 0) > 0 else TransactionStatus.FAILED


async def _maybe_generate_invoice(db, tx: Transaction, payment_type: str) -> None:
    """Génère et envoie une facture pour ce paiement, si un utilisateur
    identifié y est associé (certains flux — pub soumise sans compte,
    newsletter payante achetée par email seul — n'ont pas de `user_id`, et
    n'ont donc pas de facture). Ne bloque jamais la finalisation du paiement
    en cas d'échec (PDF/DeepL/email) — l'appelant n'a pas besoin de
    re-envelopper cet appel dans son propre try/except."""
    if not tx.user_id:
        return
    try:
        from app.models.user import User
        from app.services.invoice_service import generate_and_send_invoice
        user = await db.get(User, tx.user_id)
        if not user:
            return
        invoice_language = (tx.extra or {}).get("invoice_language", "en")
        payment_reference = tx.nowpayments_payment_id or tx.nowpayments_order_id or str(tx.id)
        await generate_and_send_invoice(
            db, user=user,
            amount=float(tx.amount), currency=tx.currency,
            payment_reference=payment_reference, transaction_id=tx.id,
            payment_type=payment_type, language=invoice_language,
        )
        await db.commit()
    except Exception:
        logger.exception("Invoice generation failed for transaction %s (%s)", tx.id, payment_type)


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

        # Comptabilité — book_subscription_payment existait déjà mais n'était
        # jamais appelée : aucune facture de revenu n'était jamais posée au
        # grand livre pour les abonnements avant ce correctif (2026-08-04).
        try:
            from app.api.v1.accounting import book_subscription_payment
            await book_subscription_payment(
                db=db,
                amount=actually_paid,
                plan_code=plan,
                transaction_id=str(tx.id),
                is_annual=(billing == "annual"),
                created_by_system_user_id=tx.user_id,
            )
            await db.commit()
        except Exception:
            logger.exception("Échec de la comptabilisation de l'abonnement pour la transaction %s", tx.id)

        from app.api.v1.affiliate import compute_and_accrue_commissions
        from app.services.tenant_service import get_tenant_owner_user_id
        source_user_id = await get_tenant_owner_user_id(db, tx.tenant_id)
        if source_user_id:
            await compute_and_accrue_commissions(
                db=db,
                source_user_id=source_user_id,
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
            from app.services.notification_service import notify_super_admins, notify_user
            sa_emails = await _get_super_admin_emails(db)
            await send_superadmin_event(
                to=sa_emails,
                event_type="payment.completed",
                title=f"New subscription — {plan.title()} {billing}",
                details=f"Tenant: {tenant_name} · Amount: ${actually_paid:.2f} USDT",
            )
            await notify_super_admins(
                db, type="success", category="payment",
                title=f"New subscription — {plan.title()} {billing}",
                body=f"Tenant: {tenant_name} · ${actually_paid:.2f} USDT",
                action_url="/superadmin/payments",
            )
            if source_user_id:
                await notify_user(
                    db, source_user_id, type="success", category="payment",
                    title="Subscription payment confirmed",
                    body=f"{plan.title()} — {billing} · ${actually_paid:.2f} USDT",
                    action_url="/payments",
                )
            await db.commit()
        except Exception:
            pass

        await _maybe_generate_invoice(db, tx, TransactionType.SUBSCRIPTION.value)

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

        try:
            from app.api.v1.accounting import book_paid_article_payment
            await book_paid_article_payment(
                db=db,
                amount=actually_paid,
                platform_fee=float(tx.platform_fee or 0),
                article_id=str(tx.article_id),
                transaction_id=str(tx.id),
                created_by_system_user_id=tx.user_id,
            )
            await db.commit()
        except Exception:
            logger.exception("Échec de la comptabilisation de l'article payant pour la transaction %s", tx.id)

        await _maybe_generate_invoice(db, tx, TransactionType.PAID_ARTICLE.value)

    elif tx.transaction_type == TransactionType.AD_CAMPAIGN:
        from app.models.ad import Ad as AdModel
        from app.models.enums import AdSubmissionStatus as ADS
        ad_obj = await db.get(AdModel, tx.campaign_id) if tx.campaign_id else None
        if ad_obj and ad_obj.submission_status == ADS.PAYMENT_PENDING:
            ad_obj.submission_status = ADS.PENDING
            ad_obj.amount_paid = actually_paid
            await db.commit()

            # Le scan de sécurité du lien et la notification aux super admins
            # n'ont lieu qu'ici, une fois le paiement confirmé — pas à la
            # soumission brute (endpoint public sans auth, sinon n'importe
            # qui pouvait déclencher un scan + un email sans jamais payer).
            from app.api.v1.ads import _scan_ad_link
            await _scan_ad_link(str(ad_obj.id), ad_obj.click_url)

            try:
                from app.services.email_service import send_superadmin_event
                from app.services.auth_service import _get_super_admin_emails
                from app.services.notification_service import notify_super_admins
                tenant_obj = await db.get(Tenant, tx.tenant_id)
                sa_emails = await _get_super_admin_emails(db)
                await send_superadmin_event(
                    to=sa_emails,
                    event_type="ad.submitted",
                    title=f"New ad submission — {ad_obj.title}",
                    details=f"Budget: {actually_paid:.2f} USDT · Blog: {tenant_obj.slug if tenant_obj else tx.tenant_id}",
                    actor_email=ad_obj.advertiser_email,
                )
                await notify_super_admins(
                    db, type="warning", category="ad",
                    title=f"New ad submission — {ad_obj.title}",
                    body=f"Budget: ${actually_paid:.2f} USDT · Blog: {tenant_obj.slug if tenant_obj else tx.tenant_id}",
                    action_url=f"/blogs/{tx.tenant_id}/ads",
                )
                await db.commit()
            except Exception:
                pass
        else:
            await db.commit()

        # `user_id` peut être None (soumission anonyme via public_ads_router)
        # — `_maybe_generate_invoice` et notify_user ignorent ce cas.
        if tx.user_id:
            try:
                from app.services.notification_service import notify_user
                await notify_user(
                    db, tx.user_id, type="success", category="ad",
                    title="Ad payment confirmed",
                    body=f"${actually_paid:.2f} USDT — your ad is now under review.",
                    action_url="/advertiser",
                )
                await db.commit()
            except Exception:
                pass
        await _maybe_generate_invoice(db, tx, TransactionType.AD_CAMPAIGN.value)

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

        # `user_id` peut être None (achat identifié par email seul, sans
        # compte) — même limitation que KYC/AD_CAMPAIGN ci-dessus : pas de
        # created_by possible sans utilisateur, donc pas d'écriture pour ce cas.
        if tx.user_id:
            try:
                from app.api.v1.accounting import book_paid_newsletter_payment
                await book_paid_newsletter_payment(
                    db=db,
                    amount=actually_paid,
                    platform_fee=float(tx.platform_fee or 0),
                    newsletter_access_id=str(access.id) if access else str(tx.id),
                    transaction_id=str(tx.id),
                    created_by_system_user_id=tx.user_id,
                )
                await db.commit()
            except Exception:
                logger.exception("Échec de la comptabilisation de la newsletter payante pour la transaction %s", tx.id)

        # `user_id` peut être None (achat newsletter identifié par email seul,
        # sans compte) — `_maybe_generate_invoice` ignore ce cas silencieusement.
        await _maybe_generate_invoice(db, tx, TransactionType.PAID_NEWSLETTER.value)

    elif tx.transaction_type == TransactionType.DOMAIN_PURCHASE:
        order = await db.get(DomainOrder, tx.campaign_id) if tx.campaign_id else None
        if order and order.status == DomainOrderStatus.PENDING_PAYMENT:
            order.status = DomainOrderStatus.PAID
            await db.commit()

            from app.services.log_service import log_event
            await log_event(db, "domain.payment_completed", level="success",
                            target_type="domain_order", target_id=str(order.id),
                            details=f"{order.domain_name} — ${actually_paid:.2f} USDT")

            from app.core.arq_pool import get_arq_pool
            pool = await get_arq_pool()
            await pool.enqueue_job("register_purchased_domain", order_id=str(order.id))

            if tx.user_id:
                try:
                    from app.api.v1.accounting import book_domain_purchase_payment
                    await book_domain_purchase_payment(
                        db=db,
                        amount=actually_paid,
                        domain_name=order.domain_name,
                        transaction_id=str(tx.id),
                        created_by_system_user_id=tx.user_id,
                    )
                    await db.commit()
                except Exception:
                    logger.exception("Échec de la comptabilisation de l'achat de domaine pour la transaction %s", tx.id)

            await _maybe_generate_invoice(db, tx, TransactionType.DOMAIN_PURCHASE.value)

    elif tx.transaction_type == TransactionType.KYC_VERIFICATION:
        from app.models.kyc import KycVerification
        from app.models.enums import KycStatus, AffiliateCommissionSource
        from app.models.user import User

        kyc = await db.get(KycVerification, tx.campaign_id) if tx.campaign_id else None
        if kyc:
            kyc.amount_paid = actually_paid
            kyc.status = KycStatus.PENDING

            user = await db.get(User, tx.user_id) if tx.user_id else None
            if user:
                user.kyc_years_remaining = (user.kyc_years_remaining or 0) + kyc.years_purchased
                user.kyc_status = KycStatus.PENDING
            await db.commit()

            # Commission d'affiliation (10% niveau 1 + 1% niveaux 2-10 = 19%,
            # même barème que MAIN_SITE_AD) sur le montant réellement payé —
            # ne bloque jamais la finalisation du paiement en cas d'échec.
            try:
                from app.api.v1.affiliate import compute_and_accrue_fixed_level_commissions
                if tx.user_id:
                    await compute_and_accrue_fixed_level_commissions(
                        db=db,
                        source_user_id=tx.user_id,
                        source_type=AffiliateCommissionSource.KYC_VERIFICATION,
                        source_transaction_id=str(tx.id),
                        gross_amount=actually_paid,
                        level_percentages={1: 0.10, **{lvl: 0.01 for lvl in range(2, 11)}},
                    )
                await db.commit()
            except Exception:
                logger.exception("KYC: échec du calcul des commissions d'affiliation pour la transaction %s", tx.id)

            # Comptabilité — même répartition 81/19 que MAIN_SITE_AD.
            try:
                from app.api.v1.accounting import book_kyc_verification_payment
                if tx.user_id:
                    await book_kyc_verification_payment(
                        db=db,
                        amount=actually_paid,
                        kyc_verification_id=str(kyc.id),
                        transaction_id=str(tx.id),
                        created_by_system_user_id=tx.user_id,
                    )
                    await db.commit()
            except Exception:
                logger.exception("KYC: échec de la comptabilisation du paiement pour la transaction %s", tx.id)

            # Session Kaluta créée SEULEMENT après confirmation du paiement
            # (jamais avant) — le webhook Kaluta fait ensuite foi pour passer
            # kyc.status/user.kyc_status à VERIFIED (voir kyc.py::kaluta_webhook).
            try:
                from app.services.kaluta_service import create_kaluta_session
                session = await create_kaluta_session(
                    external_id=str(tx.user_id or kyc.id),
                    country=user.country if user else None,
                )
                kyc.kaluta_session_id = session.get("session_id")
                kyc.kaluta_verification_url = session.get("verification_url")
                if user:
                    user.kyc_provider_session_id = session.get("session_id")
                await db.commit()
            except Exception:
                logger.exception("KYC: échec de la création de la session Kaluta pour la transaction %s", tx.id)

            await _maybe_generate_invoice(db, tx, TransactionType.KYC_VERIFICATION.value)

            # Alerte super admins — même pattern que SUBSCRIPTION/AD_CAMPAIGN
            # ci-dessus, jusqu'ici absente pour le paiement KYC.
            try:
                from app.services.email_service import send_superadmin_event
                from app.services.auth_service import _get_super_admin_emails
                from app.services.notification_service import notify_super_admins, notify_user
                sa_emails = await _get_super_admin_emails(db)
                await send_superadmin_event(
                    to=sa_emails,
                    event_type="payment.completed",
                    title=f"New KYC verification payment — {kyc.years_purchased} year(s)",
                    details=f"Amount: ${actually_paid:.2f} USDT · User: {user.email if user else tx.user_id}",
                    actor_email=user.email if user else None,
                )
                await notify_super_admins(
                    db, type="success", category="payment",
                    title=f"New KYC verification payment — {kyc.years_purchased} year(s)",
                    body=f"${actually_paid:.2f} USDT · User: {user.email if user else tx.user_id}",
                    action_url="/superadmin/users",
                )
                if user:
                    await notify_user(
                        db, user.id, type="success", category="payment",
                        title="KYC payment confirmed",
                        body=f"{kyc.years_purchased} year(s) — ${actually_paid:.2f} USDT. Verification is starting.",
                        action_url="/kyc",
                    )
                await db.commit()
            except Exception:
                logger.exception("KYC: échec de l'alerte super admins pour la transaction %s", tx.id)


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

    admin_q = await db.execute(
        select(TenantMember).where(
            TenantMember.tenant_id == tenant_id,
            TenantMember.role == UserRole.TENANT_ADMIN,
        )
    )
    admin_member = admin_q.scalar_one_or_none()
    if not admin_member:
        return

    user = await db.get(UserModel, admin_member.user_id)
    if not user:
        return

    from app.services.tenant_service import sync_tenant_plans_for_user
    user.plan = plan_tier
    await sync_tenant_plans_for_user(db, user.id, plan_tier)

    sub_q = await db.execute(
        select(UserSubscription).where(UserSubscription.user_id == user.id)
    )
    sub = sub_q.scalar_one_or_none()
    now = datetime.utcnow()
    period_end = now + timedelta(days=365 if billing == "annual" else 30)

    if sub:
        sub.status = SubscriptionStatus.ACTIVE
        sub.current_period_end = period_end
    else:
        db.add(UserSubscription(
            user_id=user.id,
            status=SubscriptionStatus.ACTIVE,
            current_period_end=period_end,
        ))


# ── Devises de paiement + plancher minimum par devise ──────────────
# Publics (sans auth) : réutilisés aussi par la soumission de pub anonyme
# (`submit_ad`, sans TokenPayload) — aucune donnée sensible exposée ici,
# juste ce que NowPayments accepte réellement en paiement.

@router.get("/currencies")
async def list_payment_currencies(tenant_id: uuid.UUID):
    return await get_payment_currencies()


@router.get("/min-amount")
async def get_payment_min_amount(tenant_id: uuid.UUID, currency: str):
    """Montant minimum réel (équivalent usdtbsc/USD) pour payer dans `currency`
    — le plancher varie fortement selon la devise choisie (confirmé le
    2026-07-27 : ~0.05$ en usdtbsc, ~4$ en BTC), donc à vérifier à chaque
    changement de devise dans le sélecteur, jamais supposé fixe."""
    try:
        min_amount = await get_min_amount(currency.lower())
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"currency": currency.lower(), "min_amount_usd": min_amount}


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
        raise ValidationException(f"Invalid plan: {plan}")

    try:
        amount_usd = await _get_plan_price(db, plan, billing)
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
        pay_currency=body.pay_currency,
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
        raise ValidationException("This article is not a paid article.")

    user_id = uuid.UUID(payload["sub"])
    access = await db.execute(
        select(ArticleAccess).where(
            ArticleAccess.user_id == user_id,
            ArticleAccess.article_id == article.id,
        )
    )
    if access.scalar_one_or_none():
        raise ValidationException("You already have access to this article.")

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
        pay_currency=body.pay_currency,
    )
    return _crypto_response(tx, article.price)


# ── Checkout achat de domaine ─────────────────────────────────────

def _get_client_ip(request: Request) -> str:
    """IP réelle du client derrière le reverse-proxy Apache (X-Forwarded-For
    posé automatiquement par mod_proxy) — repli sur la connexion directe pour
    les environnements sans proxy (tests, dev local)."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.post("/checkout-domain", response_model=CryptoPaymentResponse, status_code=201)
async def checkout_domain(
    tenant_id: uuid.UUID,
    body: DomainCheckoutRequest,
    payload: TokenPayload,
    db: DBSession,
    request: Request,
):
    """Crée un paiement NowPayments intégré pour acheter un nom de domaine.
    L'enregistrement registrar lui-même se fait après confirmation du
    paiement (voir _finalize_transaction + job ARQ register_purchased_domain) —
    jamais avant, pour ne jamais facturer un domaine qui échoue à s'enregistrer
    sans paiement confirmé au préalable."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)

    # CGV d'achat de domaine (décision PDG 2026-08-06) : le consentement est
    # exigé et vérifié AVANT tout appel au registrar, jamais après — voir
    # legal-domain-purchase-terms (platform_pages) pour le contenu accepté.
    if not body.consent:
        raise ValidationException("You must accept the Domain Registration and Purchase Terms & Conditions before continuing.")

    terms_row = (await db.execute(
        text("SELECT content_hash FROM platform_pages WHERE slug = 'legal-domain-purchase-terms'"),
    )).fetchone()
    if not terms_row:
        raise ValidationException("Domain purchase terms are not currently available. Please try again shortly.")

    domain_name = body.domain_name.strip().lower()
    if "." not in domain_name:
        raise ValidationException("Invalid domain name.")
    _, tld = domain_name.split(".", 1)

    existing = await db.execute(select(CustomDomain).where(CustomDomain.domain == domain_name))
    if existing.scalar_one_or_none():
        raise ValidationException("This domain is already registered on the platform.")

    from app.services.registrars.registry import get_registrar
    from app.services.registrars.pricing import apply_markup
    from app.services.registrars.base import RegistrarError

    registrar = get_registrar()
    try:
        results = await registrar.check_availability([domain_name])
    except RegistrarError as e:
        raise HTTPException(status_code=502, detail=f"Registrar unavailable: {e}")

    match = next((r for r in results if r.domain == domain_name), None)
    if not match or not match.available or match.price is None or match.price <= 0:
        raise ValidationException("This domain is not available for purchase.")

    price = await apply_markup(match.price)
    # Le prix de renouvellement n'est pas inclus dans check_availability (voir
    # openprovider.py) — appel dédié, une seule fois ici (checkout, pas la
    # recherche live) pour pouvoir proposer un renouvellement plus tard.
    try:
        raw_renewal_price, _ = await registrar.get_renewal_price(domain=domain_name, years=body.years)
        renewal_price = await apply_markup(raw_renewal_price)
    except RegistrarError:
        renewal_price = None

    user_id = uuid.UUID(payload["sub"])
    order = DomainOrder(
        tenant_id=tenant_id,
        user_id=user_id,
        domain_name=domain_name,
        tld=tld,
        years=max(1, body.years),
        registrar=registrar.name,
        registrant_info=body.registrant.model_dump(),
        status=DomainOrderStatus.PENDING_PAYMENT,
        purchase_price=price,
        renewal_price=renewal_price,
        currency=match.currency,
        terms_content_hash=terms_row.content_hash,
        terms_accepted_at=datetime.now(timezone.utc),
        terms_accepted_ip=_get_client_ip(request),
    )
    db.add(order)
    await db.flush()

    order_id = f"dom_{tenant_id}_{order.id}_{uuid.uuid4().hex[:8]}"
    tx, _ = await _create_crypto_transaction(
        db,
        tenant_id=tenant_id,
        user_id=user_id,
        transaction_type=TransactionType.DOMAIN_PURCHASE,
        amount_usd=price,
        order_id=order_id,
        order_description=f"Domain {domain_name} ({body.years} an(s))",
        campaign_id=order.id,
        pay_currency=body.pay_currency,
    )
    order.transaction_id = tx.id
    order.auto_renew = body.auto_renew
    await db.commit()

    return _crypto_response(tx, price)


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
        raise NotFoundException("Payment")

    if tx.status in (TransactionStatus.PENDING, TransactionStatus.PARTIALLY_PAID) and tx.nowpayments_payment_id:
        try:
            live = await get_payment_status(tx.nowpayments_payment_id)
            live_status = live.get("payment_status") or tx.provider_status
            await _apply_provider_update(db, tx, live_status, float(live.get("actually_paid", 0) or 0))
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
        amount_received=float(tx.amount_received or 0),
        amount_due=float(tx.amount),
    )


# ── Reprise d'un paiement partiel ──────────────────────────────────
#
# NowPayments surveille lui-même l'adresse de dépôt après un paiement
# partiel — un dépôt complémentaire sur la MÊME adresse est reconnu comme
# "Re-deposit" côté NowPayments (voir leur documentation "Payment statuses"),
# donc pas besoin de créer un nouveau paiement/nouvelle adresse ici : on se
# contente de renvoyer l'adresse et le montant d'origine, avec le solde
# restant recalculé, pour que le panneau de paiement puisse se ré-afficher
# et continuer à poller la même transaction.
#
# Important : à configurer côté dashboard NowPayments — le réglage
# "Payment covering" / seuil de tolérance sur les re-dépôts détermine si le
# paiement finalise automatiquement une fois le cumul atteint. À vérifier/
# tester en sandbox avant de considérer ce flux garanti à 100%.

class ResumePaymentRequest(BaseModel):
    order_id: str  # doit correspondre à tx.nowpayments_order_id actuel


@router.post("/{transaction_id}/resume", response_model=CryptoPaymentResponse)
async def resume_payment(
    tenant_id: uuid.UUID,
    transaction_id: uuid.UUID,
    body: ResumePaymentRequest,
    db: DBSession,
):
    """
    Public — même modèle de confiance que /status/{order_id} (order_id agit
    comme jeton opaque déjà visible du payeur). Ne crée rien côté
    NowPayments : renvoie simplement l'adresse/montant d'origine (inchangés)
    pour permettre au frontend de réafficher le panneau de paiement et
    continuer à poller la même transaction pendant que l'utilisateur envoie
    le complément sur cette même adresse.
    """
    tx = await db.get(Transaction, transaction_id)
    if not tx or tx.tenant_id != tenant_id or tx.nowpayments_order_id != body.order_id:
        raise NotFoundException("Payment")

    if tx.status != TransactionStatus.PARTIALLY_PAID:
        raise ValidationException("This payment is not awaiting an additional amount.")

    remaining = round(float(tx.amount) - float(tx.amount_received or 0), 2)
    if remaining <= 0:
        raise ValidationException("No remaining amount to pay.")

    tx.payment_expires_at = _payment_window_expiry()
    await db.commit()
    await db.refresh(tx)

    return _crypto_response(tx, remaining)


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
            raise HTTPException(status_code=400, detail="Invalid IPN signature.")

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

    await _apply_provider_update(db, tx, payment_status, actually_paid)
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


# ── Centre de paiements (vue utilisateur, tous blogs confondus) ────

me_payments_router = APIRouter(prefix="/users/me/payments", tags=["payments"])


class UserPaymentItem(BaseModel):
    id: str
    order_id: str
    tenant_id: str
    tenant_name: str
    transaction_type: str
    status: str
    amount: float
    amount_received: float
    currency: str
    created_at: datetime
    # "in" = paiement reçu par la plateforme (Transaction), "out" = argent
    # versé À l'utilisateur (commission d'affiliation, part de revenu pub) —
    # ces deux derniers ne sont pas des lignes `Transaction` du tout, d'où
    # ce champ pour les distinguer dans une liste unifiée.
    direction: str = "in"


@me_payments_router.get("", response_model=list[UserPaymentItem])
async def list_my_payments(
    payload: TokenPayload,
    db: DBSession,
    limit: int = 50,
):
    """Tous les mouvements d'argent de l'utilisateur, tous blogs confondus —
    paiements entrants (Transaction) ET versements sortants (commissions
    d'affiliation, part de revenu pub) qui vivent dans des tables séparées
    et n'apparaissaient nulle part ici avant ce correctif (2026-08-04).
    Contrairement à /tenants/{tenant_id}/payments/transactions (scopé à un
    blog, rôle EDITOR+), cette vue sert le \"centre de paiements\" du
    dashboard principal."""
    from app.models.affiliate import AffiliateCashoutRequest
    from app.models.ad import AdRevenueShare

    user_id = uuid.UUID(payload["sub"])
    items: list[UserPaymentItem] = []

    tx_result = await db.execute(
        select(Transaction, Tenant.name)
        .join(Tenant, Tenant.id == Transaction.tenant_id)
        .where(
            Transaction.user_id == user_id,
            Transaction.status != TransactionStatus.FAILED,
        )
        .order_by(Transaction.created_at.desc())
        .limit(limit)
    )
    for tx, tenant_name in tx_result.all():
        items.append(UserPaymentItem(
            id=str(tx.id),
            order_id=tx.nowpayments_order_id or "",
            tenant_id=str(tx.tenant_id),
            tenant_name=tenant_name,
            transaction_type=tx.transaction_type.value,
            status=tx.status.value,
            amount=float(tx.amount),
            amount_received=float(tx.amount_received or 0),
            currency=tx.currency,
            created_at=tx.created_at,
            direction="in",
        ))

    cashout_result = await db.execute(
        select(AffiliateCashoutRequest)
        .where(AffiliateCashoutRequest.user_id == user_id)
        .order_by(AffiliateCashoutRequest.requested_at.desc())
        .limit(limit)
    )
    for c in cashout_result.scalars().all():
        items.append(UserPaymentItem(
            id=str(c.id),
            order_id=c.payout_reference or "",
            tenant_id="",
            tenant_name="",
            transaction_type="affiliate_commission_payout",
            status=c.status.value,
            amount=float(c.net_amount),
            amount_received=float(c.net_amount) if c.status.value == "paid" else 0,
            currency="USDT",
            created_at=c.requested_at,
            direction="out",
        ))

    ad_share_result = await db.execute(
        select(AdRevenueShare, Tenant.name)
        .join(Tenant, Tenant.id == AdRevenueShare.tenant_id)
        .where(AdRevenueShare.owner_user_id == user_id)
        .order_by(AdRevenueShare.created_at.desc())
        .limit(limit)
    )
    for share, tenant_name in ad_share_result.all():
        items.append(UserPaymentItem(
            id=str(share.id),
            order_id=share.payout_reference or "",
            tenant_id=str(share.tenant_id),
            tenant_name=tenant_name,
            transaction_type="ad_revenue_payout",
            status=share.status.value,
            amount=float(share.owner_share_amount),
            amount_received=float(share.owner_share_amount) if share.status.value == "paid" else 0,
            currency="USDT",
            created_at=share.created_at,
            direction="out",
        ))

    items.sort(key=lambda i: i.created_at, reverse=True)
    return items[:limit]


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
    from app.services.tenant_service import get_tenant_owner_user_id
    owner_user_id = await get_tenant_owner_user_id(db, tenant_id)
    result = await db.execute(
        select(UserSubscription).where(UserSubscription.user_id == owner_user_id)
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
