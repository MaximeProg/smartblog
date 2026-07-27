"""M23 — Affiliate Program API

Keyed on USERS, not tenants: a person can own several blogs, but the referral
code, balance, and commission tree belong to the PERSON, not to whichever blog
happened to be used to generate a shared link. See migration 047."""
import asyncio
import csv
import io
import logging
import uuid
import random
import string
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from pydantic import BaseModel

from app.core.config import settings
from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException, ForbiddenException
from app.models.affiliate import AffiliateRelationship, AffiliateCommission, AffiliateCashoutRequest, AffiliateCodeAlias
from app.models.user import User
from app.models.enums import AffiliateCommissionStatus, CashoutStatus

logger = logging.getLogger(__name__)

user_router = APIRouter(prefix="/users/me/affiliate", tags=["affiliate"])
superadmin_router = APIRouter(prefix="/superadmin/affiliate", tags=["affiliate-admin"])

# Pas de frais de retrait (décision PDG 2026-07-12). Un seuil minimum de 1$ a
# dû être réintroduit le 2026-07-24 : NowPayments rejette silencieusement
# (`error: null`) tout virement USDT-BSC/BEP20 dont le montant net ne couvre
# pas ses frais réseau (~0.02$) — confirmé empiriquement (0.01$ rejeté,
# 1$ accepté). MIN_CASHOUT sert à la fois de plancher pour le retrait manuel
# et de seuil de déclenchement du paiement automatique (voir _accrue_commission).
CASHOUT_FEE = 0.00
MIN_CASHOUT = 1.00


# ── Schemas ───────────────────────────────────────────────────────

class AffiliateDashboardResponse(BaseModel):
    affiliate_code: str
    referral_url: str
    balance: float
    cashout_threshold: float
    can_cashout: bool
    has_wallet: bool
    total_earned: float
    total_paid_out: float
    total_referrals: int
    pending_commissions: int


class CommissionResponse(BaseModel):
    id: str
    source_type: str
    source_transaction_id: str
    level: int
    gross_amount: float
    commission_amount: float
    status: str
    created_at: datetime
    paid_at: datetime | None


class CashoutResponse(BaseModel):
    id: str
    gross_amount: float
    fee: float
    net_amount: float
    status: str
    payout_method: str | None
    requested_at: datetime
    processed_at: datetime | None


class CashoutRequestBody(BaseModel):
    payout_method: str = "nowpayments_crypto"


class ReferralItem(BaseModel):
    user_id: str
    name: str
    email: str
    plan: str
    joined_at: str | None
    total_commission: float


class InviteFriendRequest(BaseModel):
    email: str
    language: str = "en"
    message: str


# ── Helpers ───────────────────────────────────────────────────────

def _generate_affiliate_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


async def _get_or_create_affiliate_code(db, user: User) -> str:
    """Lazily assigns a code the first time it's needed (dashboard visit,
    invite-friend, ...), mirroring the account's own creation as an alias so
    it's resolvable from day one."""
    if user.affiliate_code:
        return user.affiliate_code
    code = _generate_affiliate_code()
    user.affiliate_code = code
    db.add(AffiliateCodeAlias(code=code, user_id=user.id))
    await db.commit()
    await db.refresh(user)
    return user.affiliate_code


# ── Dashboard ─────────────────────────────────────────────────────

@user_router.get("/dashboard", response_model=AffiliateDashboardResponse)
async def get_affiliate_dashboard(payload: TokenPayload, db: DBSession):
    user_id = uuid.UUID(payload["sub"])
    user = await db.get(User, user_id)
    if not user:
        raise NotFoundException("User")

    code = await _get_or_create_affiliate_code(db, user)

    total_referrals_q = await db.execute(
        select(func.count()).where(
            AffiliateRelationship.ancestor_user_id == user_id,
            AffiliateRelationship.level == 1,
        )
    )
    total_referrals = total_referrals_q.scalar() or 0

    earned_q = await db.execute(
        select(func.coalesce(func.sum(AffiliateCommission.commission_amount), 0)).where(
            AffiliateCommission.affiliate_user_id == user_id,
            AffiliateCommission.status.in_([
                AffiliateCommissionStatus.PENDING,
                AffiliateCommissionStatus.READY,
                AffiliateCommissionStatus.PAID,
            ])
        )
    )
    total_earned = float(earned_q.scalar() or 0)

    paid_out_q = await db.execute(
        select(func.coalesce(func.sum(AffiliateCommission.commission_amount), 0)).where(
            AffiliateCommission.affiliate_user_id == user_id,
            AffiliateCommission.status == AffiliateCommissionStatus.PAID,
        )
    )
    total_paid_out = float(paid_out_q.scalar() or 0)

    pending_q = await db.execute(
        select(func.count()).where(
            AffiliateCommission.affiliate_user_id == user_id,
            AffiliateCommission.status == AffiliateCommissionStatus.PENDING,
        )
    )
    pending_commissions = pending_q.scalar() or 0

    balance = float(user.affiliate_balance or 0)
    threshold = float(user.affiliate_cashout_threshold or MIN_CASHOUT)

    return AffiliateDashboardResponse(
        affiliate_code=code,
        referral_url=f"{settings.FRONTEND_URL}/register?ref={code}",
        balance=balance,
        cashout_threshold=threshold,
        can_cashout=balance >= threshold,
        has_wallet=bool(user.usdt_wallet_address),
        total_earned=total_earned,
        total_paid_out=total_paid_out,
        total_referrals=total_referrals,
        pending_commissions=pending_commissions,
    )


@user_router.get("/commissions")
async def list_commissions(
    payload: TokenPayload,
    db: DBSession,
    status: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    user_id = uuid.UUID(payload["sub"])

    q = select(AffiliateCommission).where(AffiliateCommission.affiliate_user_id == user_id)
    if status:
        q = q.where(AffiliateCommission.status == status)
    q = q.order_by(AffiliateCommission.created_at.desc()).limit(limit).offset(offset)

    result = await db.execute(q)
    commissions = result.scalars().all()

    return [
        CommissionResponse(
            id=str(c.id),
            source_type=c.source_type.value,
            source_transaction_id=c.source_transaction_id,
            level=c.level,
            gross_amount=float(c.gross_amount),
            commission_amount=float(c.commission_amount),
            status=c.status.value,
            created_at=c.created_at,
            paid_at=c.paid_at,
        )
        for c in commissions
    ]


@user_router.get("/cashouts")
async def list_cashouts(payload: TokenPayload, db: DBSession):
    user_id = uuid.UUID(payload["sub"])

    result = await db.execute(
        select(AffiliateCashoutRequest)
        .where(AffiliateCashoutRequest.user_id == user_id)
        .order_by(AffiliateCashoutRequest.requested_at.desc())
    )
    cashouts = result.scalars().all()

    return [
        CashoutResponse(
            id=str(c.id),
            gross_amount=float(c.gross_amount),
            fee=float(c.fee),
            net_amount=float(c.net_amount),
            status=c.status.value,
            payout_method=c.payout_method,
            requested_at=c.requested_at,
            processed_at=c.processed_at,
        )
        for c in cashouts
    ]


@user_router.post("/cashout", status_code=201)
async def request_cashout(
    body: CashoutRequestBody,
    payload: TokenPayload,
    db: DBSession,
):
    user_id = uuid.UUID(payload["sub"])
    user = await db.get(User, user_id)
    if not user:
        raise NotFoundException("User")

    balance = float(user.affiliate_balance or 0)
    threshold = float(user.affiliate_cashout_threshold or MIN_CASHOUT)

    if balance < threshold:
        raise ValidationException(f"Insufficient balance. Minimum required: ${threshold:.2f}, current balance: ${balance:.2f}")

    pending_q = await db.execute(
        select(func.count()).where(
            AffiliateCashoutRequest.user_id == user_id,
            AffiliateCashoutRequest.status.in_([CashoutStatus.REQUESTED, CashoutStatus.PROCESSING]),
        )
    )
    if (pending_q.scalar() or 0) > 0:
        raise ValidationException("A cashout request is already in progress.")

    net_amount = balance - CASHOUT_FEE
    if net_amount <= 0:
        raise ValidationException(f"The balance (${balance:.2f}) does not cover the cashout fee (${CASHOUT_FEE:.2f}).")

    cashout = AffiliateCashoutRequest(
        user_id=user_id,
        gross_amount=balance,
        fee=CASHOUT_FEE,
        net_amount=net_amount,
        payout_method=body.payout_method,
        status=CashoutStatus.REQUESTED,
    )
    db.add(cashout)

    ready_commissions_q = await db.execute(
        select(AffiliateCommission).where(
            AffiliateCommission.affiliate_user_id == user_id,
            AffiliateCommission.status.in_([AffiliateCommissionStatus.PENDING, AffiliateCommissionStatus.READY]),
        )
    )
    ready_commissions = ready_commissions_q.scalars().all()

    await db.flush()  # get cashout.id

    for commission in ready_commissions:
        commission.cashout_request_id = cashout.id
        commission.status = AffiliateCommissionStatus.PAID
        commission.paid_at = datetime.now(timezone.utc)

    user.affiliate_balance = 0
    await db.commit()

    return CashoutResponse(
        id=str(cashout.id),
        gross_amount=float(cashout.gross_amount),
        fee=float(cashout.fee),
        net_amount=float(cashout.net_amount),
        status=cashout.status.value,
        payout_method=cashout.payout_method,
        requested_at=cashout.requested_at,
        processed_at=None,
    )


@user_router.get("/commissions/export")
async def export_commissions_csv(payload: TokenPayload, db: DBSession):
    user_id = uuid.UUID(payload["sub"])

    result = await db.execute(
        select(AffiliateCommission)
        .where(AffiliateCommission.affiliate_user_id == user_id)
        .order_by(AffiliateCommission.created_at.desc())
    )
    commissions = result.scalars().all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["ID", "Source", "Type", "Commission (USDT)", "Status", "Level", "Date"])
    for c in commissions:
        writer.writerow([
            str(c.id),
            str(c.source_user_id),
            c.source_type.value if hasattr(c.source_type, "value") else c.source_type,
            f"{c.commission_amount:.4f}",
            c.status.value if hasattr(c.status, "value") else c.status,
            c.level,
            c.created_at.isoformat() if c.created_at else "",
        ])

    buf.seek(0)
    return StreamingResponse(
        iter([buf.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=commissions.csv"},
    )


@user_router.get("/referrals")
async def list_referrals(
    payload: TokenPayload,
    db: DBSession,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List direct referrals (level=1) for this affiliate."""
    user_id = uuid.UUID(payload["sub"])

    result = await db.execute(
        select(
            AffiliateRelationship.descendant_user_id,
            AffiliateRelationship.created_at.label("referred_at"),
            User.email, User.display_name, User.plan,
        )
        .join(User, User.id == AffiliateRelationship.descendant_user_id)
        .where(
            AffiliateRelationship.ancestor_user_id == user_id,
            AffiliateRelationship.level == 1,
        )
        .order_by(AffiliateRelationship.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()

    total_q = await db.execute(
        select(func.count()).where(
            AffiliateRelationship.ancestor_user_id == user_id,
            AffiliateRelationship.level == 1,
        )
    )
    total = total_q.scalar_one() or 0

    referrals = []
    for row in rows:
        comm_q = await db.execute(
            select(func.coalesce(func.sum(AffiliateCommission.commission_amount), 0)).where(
                AffiliateCommission.affiliate_user_id == user_id,
                AffiliateCommission.source_user_id == row.descendant_user_id,
            )
        )
        total_commission = float(comm_q.scalar() or 0)
        referrals.append(ReferralItem(
            user_id=str(row.descendant_user_id),
            name=row.display_name or row.email,
            email=row.email,
            plan=row.plan.value if hasattr(row.plan, "value") else str(row.plan),
            joined_at=row.referred_at.isoformat() if row.referred_at else None,
            total_commission=total_commission,
        ))

    return {"referrals": referrals, "total": total}


@user_router.get("/tree")
async def get_referral_tree(
    payload: TokenPayload,
    db: DBSession,
    max_depth: int = Query(3, ge=1, le=5),
):
    """Return the referral tree up to max_depth levels."""
    user_id = uuid.UUID(payload["sub"])

    result = await db.execute(
        select(
            AffiliateRelationship.descendant_user_id,
            AffiliateRelationship.level,
            User.email, User.display_name, User.plan,
        )
        .join(User, User.id == AffiliateRelationship.descendant_user_id)
        .where(
            AffiliateRelationship.ancestor_user_id == user_id,
            AffiliateRelationship.level <= max_depth,
        )
        .order_by(AffiliateRelationship.level, User.display_name)
    )
    rows = result.all()

    nodes = [
        {
            "user_id": str(r.descendant_user_id),
            "name": r.display_name or r.email,
            "plan": r.plan.value if hasattr(r.plan, "value") else str(r.plan),
            "level": r.level,
        }
        for r in rows
    ]
    return {"nodes": nodes}


@user_router.post("/invite-friend", status_code=200)
async def invite_friend(
    body: InviteFriendRequest,
    payload: TokenPayload,
    db: DBSession,
):
    """Send a personalised referral email to a friend in their language."""
    from app.services.ai_service import translate_text
    from app.services.email_service import send_affiliate_friend_invitation

    user_id = uuid.UUID(payload["sub"])
    user = await db.get(User, user_id)
    if not user:
        raise NotFoundException("User")

    code = await _get_or_create_affiliate_code(db, user)
    referral_url = f"{settings.FRONTEND_URL}/register?ref={code}"
    sender_name = user.display_name or user.email

    lang = body.language.lower()[:2]
    target_lang = "FR" if lang == "fr" else "EN"
    try:
        message_translated = await translate_text(body.message, target_lang)
    except Exception:
        message_translated = body.message

    try:
        await send_affiliate_friend_invitation(
            to=body.email,
            sender_name=sender_name,
            message_translated=message_translated,
            referral_url=referral_url,
            language=lang,
        )
    except Exception:
        pass

    return {"ok": True, "sent_to": body.email}


# ── Commission computation helpers (called from payment webhooks) ─

async def compute_and_accrue_commissions(
    db,
    source_user_id: uuid.UUID,
    source_type: str,
    source_transaction_id: str,
    gross_amount: float,
):
    """
    Compute affiliate commissions for a given transaction and accrue them.
    Called from payment webhook handlers, once the tenant that generated the
    revenue has been resolved to its owning user (see
    tenant_service.get_tenant_owner_user_id).

    For subscriptions: 20% pool
      - L1: 50% of pool
      - L2-L10: 50% / 9 each (missing levels go to SmarterBloggers)

    For ad slots: 10% of gross (the other 10% goes to SmarterBloggers account 4101)
      - Same L1/L2-L10 split on this 10%
    """
    from app.models.enums import AffiliateCommissionSource

    if source_type == "subscription":
        affiliate_pool = round(gross_amount * 0.20, 4)
    else:  # ad_slot
        affiliate_pool = round(gross_amount * 0.10, 4)

    # Fetch affiliate tree for the source user
    ancestors_q = await db.execute(
        select(AffiliateRelationship)
        .where(AffiliateRelationship.descendant_user_id == source_user_id)
        .order_by(AffiliateRelationship.level)
    )
    ancestors = ancestors_q.scalars().all()

    if not ancestors:
        return  # No referral tree

    l1 = next((a for a in ancestors if a.level == 1), None)
    l2_to_l10 = [a for a in ancestors if 2 <= a.level <= 10]

    if not l1:
        return

    # L1 gets 50% of pool
    l1_amount = round(affiliate_pool * 0.50, 4)

    # L2-L10 split the remaining 50% equally
    l_rest_pool = round(affiliate_pool * 0.50, 4)
    per_level_amount = round(l_rest_pool / 9, 4) if l2_to_l10 else 0

    commission_source = AffiliateCommissionSource.SUBSCRIPTION if source_type == "subscription" else AffiliateCommissionSource.AD_SLOT

    # Accrue L1
    if l1_amount > 0:
        await _accrue_commission(db, l1.ancestor_user_id, source_user_id, commission_source, source_transaction_id, 1, gross_amount, l1_amount)

    # Accrue L2-L10
    for rel in l2_to_l10:
        if per_level_amount > 0:
            await _accrue_commission(db, rel.ancestor_user_id, source_user_id, commission_source, source_transaction_id, rel.level, gross_amount, per_level_amount)


async def compute_and_accrue_fixed_level_commissions(
    db,
    source_user_id: uuid.UUID,
    source_type,
    source_transaction_id: str,
    gross_amount: float,
    level_percentages: dict[int, float],
):
    """
    Variante de compute_and_accrue_commissions pour les pubs achetées sur le
    site principal smarterbloggers.com (voir ads.py::platform_ads_router).
    Contrairement au modèle "pool" ci-dessus (20%/10% du montant, splitté
    50/50 entre L1 et L2-10), ici chaque niveau reçoit un pourcentage fixe et
    indépendant du gross_amount (ex: {1: 0.10, 2: 0.01, ..., 10: 0.01}) — pas
    de pool à répartir. Un niveau sans ancêtre (annonceur avec moins de 10
    parrains dans sa lignée) ne redistribue rien : sa part reste simplement
    à la plateforme, exactement comme pour la fonction existante ci-dessus.

    Ne modifie ni compute_and_accrue_commissions ni ses appelants existants.
    """
    ancestors_q = await db.execute(
        select(AffiliateRelationship)
        .where(AffiliateRelationship.descendant_user_id == source_user_id)
        .order_by(AffiliateRelationship.level)
    )
    ancestors = {a.level: a for a in ancestors_q.scalars().all()}

    for level, pct in level_percentages.items():
        rel = ancestors.get(level)
        if not rel or pct <= 0:
            continue
        amount = round(gross_amount * pct, 4)
        if amount > 0:
            await _accrue_commission(db, rel.ancestor_user_id, source_user_id, source_type, source_transaction_id, level, gross_amount, amount)


async def _accrue_commission(db, affiliate_user_id, source_user_id, source_type, source_transaction_id, level, gross_amount, commission_amount):
    user = await db.get(User, affiliate_user_id)
    if not user:
        return

    # Décision PDG : un affilié qui n'a pas encore enregistré son wallet USDT
    # BSC ne participe pas au programme d'affiliation — aucune commission
    # n'est calculée ni suivie pour lui (pas de mise en réserve, rien dû).
    if not user.usdt_wallet_address:
        return

    commission = AffiliateCommission(
        affiliate_user_id=affiliate_user_id,
        source_user_id=source_user_id,
        source_type=source_type,
        source_transaction_id=source_transaction_id,
        level=level,
        gross_amount=gross_amount,
        commission_amount=commission_amount,
        status=AffiliateCommissionStatus.PENDING,
    )
    db.add(commission)

    # Update balance
    new_balance = float(user.affiliate_balance or 0) + float(commission_amount)
    user.affiliate_balance = new_balance
    await db.flush()

    # Paiement automatique dès que le solde cumulé atteint MIN_CASHOUT (1$) —
    # en dessous, NowPayments rejette silencieusement le virement (voir
    # MIN_CASHOUT ci-dessus). Une seule commission peut suffire à franchir le
    # seuil, ou plusieurs petites commissions accumulées au fil du temps.
    if new_balance >= MIN_CASHOUT:
        await _trigger_auto_payout_for_user(db, user)

    # Email de notification
    try:
        from app.services.email_service import send_affiliate_commission_notification
        affiliate_dashboard_url = f"{settings.FRONTEND_URL}/affiliate"
        await send_affiliate_commission_notification(
            to=user.email,
            display_name=user.display_name or user.email,
            commission_amount=float(commission_amount),
            new_balance=new_balance,
            source_type=source_type.value if hasattr(source_type, "value") else str(source_type),
            level=level,
            dashboard_url=affiliate_dashboard_url,
        )
    except Exception:
        pass


async def _trigger_auto_payout_for_user(db, user: User):
    """
    Regroupe toutes les commissions PENDING de l'utilisateur (leur somme vient
    de franchir MIN_CASHOUT) et tente UN seul virement NowPayments pour le
    total — pas un virement par commission, pour éviter d'en envoyer plusieurs
    en dessous du plancher réseau.

    Ne marque PAS les commissions comme payées ici : `send_payout`/
    `verify_payout` ne renvoient qu'une confirmation HTTP de la demande,
    jamais une garantie que l'argent est réellement parti — NowPayments peut
    encore rejeter le virement après coup, silencieusement (`error: null`,
    voir historique 2026-07-24). Les commissions passent à READY (en attente
    de confirmation réelle) et c'est `_confirm_payout_and_finalize`, lancé en
    tâche de fond, qui les marquera PAID (ou les remettra PENDING) une fois le
    statut définitif connu via `get_payout_status`.
    """
    from app.services.nowpayments_service import send_single_payout

    if not settings.NOWPAYMENTS_PAYOUT_API_KEY:
        return

    wallet_address = user.usdt_wallet_address
    if not wallet_address:
        return

    # Évite un second virement pendant qu'un premier est déjà en cours de confirmation.
    pending_cashout_q = await db.execute(
        select(func.count()).where(
            AffiliateCashoutRequest.user_id == user.id,
            AffiliateCashoutRequest.status == CashoutStatus.PROCESSING,
        )
    )
    if (pending_cashout_q.scalar() or 0) > 0:
        return

    commissions_q = await db.execute(
        select(AffiliateCommission).where(
            AffiliateCommission.affiliate_user_id == user.id,
            AffiliateCommission.status == AffiliateCommissionStatus.PENDING,
        )
    )
    commissions = commissions_q.scalars().all()
    attempt_amount = round(sum(float(c.commission_amount) for c in commissions), 2)
    if attempt_amount < MIN_CASHOUT:
        return

    cashout = AffiliateCashoutRequest(
        user_id=user.id,
        gross_amount=attempt_amount,
        fee=0.00,
        net_amount=attempt_amount,
        payout_method="nowpayments_crypto",
        usdt_wallet_snapshot=wallet_address,
        payout_currency_snapshot=user.payout_currency,
        status=CashoutStatus.PROCESSING,
    )
    db.add(cashout)
    await db.flush()

    for c in commissions:
        c.status = AffiliateCommissionStatus.READY
        c.cashout_request_id = cashout.id
    await db.flush()

    try:
        result = await send_single_payout(
            wallet_address=wallet_address,
            amount_usd=attempt_amount,
            currency=user.payout_currency or "usdtbsc",
            extra_id=user.payout_extra_id,
        )
        batch_id = str(result.get("id") or "")
        if not batch_id:
            raise RuntimeError("NowPayments payout: id de batch absent de la réponse.")
        cashout.payout_reference = batch_id
        commission_ids = [c.id for c in commissions]
        await db.commit()
    except Exception:
        logger.exception(
            "Échec de la création du payout NowPayments pour user=%s (montant=%s) — commissions remises en PENDING, retry possible",
            user.id, attempt_amount,
        )
        cashout.status = CashoutStatus.FAILED
        for c in commissions:
            c.status = AffiliateCommissionStatus.PENDING
            c.cashout_request_id = None
        await db.commit()
        return

    # Confirmation asynchrone : NowPayments met de 10s à ~1min pour finaliser
    # (WAITING -> SENDING -> FINISHED), largement au-delà de ce qu'on peut
    # attendre dans le flux qui a déclenché cette commission (souvent un
    # webhook de paiement lui-même soumis à son propre timeout).
    asyncio.create_task(_confirm_payout_and_finalize(batch_id, cashout.id, commission_ids, user.id, attempt_amount))


async def _confirm_payout_and_finalize(
    batch_id: str, cashout_id: uuid.UUID, commission_ids: list[uuid.UUID], user_id: uuid.UUID, attempt_amount: float,
):
    """Tâche de fond : sonde le statut réel du batch jusqu'à un état définitif,
    puis met à jour la base en conséquence. Voir `_trigger_auto_payout_for_user`
    pour le pourquoi (jamais marquer payé sur la seule foi d'un HTTP 200)."""
    from app.core.database import get_db_no_rls
    from app.services.nowpayments_service import get_payout_status

    FINAL_OK = {"FINISHED"}
    FINAL_FAILED = {"REJECTED", "REJECTED_NOT_CHECKED", "FAILED"}

    for _ in range(20):  # ~20 x 6s = 2 minutes max
        await asyncio.sleep(6)
        try:
            status_data = await get_payout_status(batch_id)
        except Exception:
            logger.exception("Erreur pendant le sondage du statut payout %s", batch_id)
            continue

        withdrawal = (status_data.get("withdrawals") or [{}])[0]
        wstatus = withdrawal.get("status")

        if wstatus in FINAL_OK:
            async for db in get_db_no_rls():
                cashout = await db.get(AffiliateCashoutRequest, cashout_id)
                user = await db.get(User, user_id)
                now = datetime.now(timezone.utc)
                if cashout:
                    cashout.status = CashoutStatus.PAID
                    cashout.processed_at = now
                    hash_ = withdrawal.get("hash")
                    cashout.notes = f"Confirmé FINISHED, hash={hash_}" if hash_ else "Confirmé FINISHED"
                for cid in commission_ids:
                    commission = await db.get(AffiliateCommission, cid)
                    if commission:
                        commission.status = AffiliateCommissionStatus.PAID
                        commission.paid_at = now
                if user:
                    user.affiliate_balance = max(0, float(user.affiliate_balance or 0) - attempt_amount)
                await db.commit()
                break
            return

        if wstatus in FINAL_FAILED:
            async for db in get_db_no_rls():
                cashout = await db.get(AffiliateCashoutRequest, cashout_id)
                if cashout:
                    cashout.status = CashoutStatus.REJECTED
                    cashout.notes = f"NowPayments a rejeté le virement (status={wstatus})"
                for cid in commission_ids:
                    commission = await db.get(AffiliateCommission, cid)
                    if commission:
                        commission.status = AffiliateCommissionStatus.PENDING
                        commission.cashout_request_id = None
                await db.commit()
                break
            logger.warning("Payout %s rejeté par NowPayments (status=%s) — commissions remises en PENDING pour retry.", batch_id, wstatus)
            return

    logger.warning("Payout %s non confirmé après 2 minutes de sondage — reste PROCESSING, vérification manuelle requise.", batch_id)


# ── Register referral (called at user registration, first login) ──

async def register_referral_for_user(db, new_user_id: uuid.UUID, referral_code: str):
    """
    Called when a new user registers with a referral code (their very first
    successful login). Builds the closure table entries for the new user.
    Resolves the code against the canonical `users.affiliate_code` first,
    then falls back to `affiliate_code_aliases` for legacy codes generated
    back when affiliation lived on individual blogs.
    """
    code = referral_code.strip().upper()
    if not code:
        return

    referrer_q = await db.execute(select(User).where(User.affiliate_code == code))
    referrer = referrer_q.scalar_one_or_none()

    if not referrer:
        alias_q = await db.execute(select(AffiliateCodeAlias).where(AffiliateCodeAlias.code == code))
        alias = alias_q.scalar_one_or_none()
        if alias:
            referrer = await db.get(User, alias.user_id)

    if not referrer:
        return  # Invalid code — silently ignore

    if referrer.id == new_user_id:
        return  # Self-referral guard

    # Get referrer's ancestors (up to 9 levels)
    existing_q = await db.execute(
        select(AffiliateRelationship)
        .where(AffiliateRelationship.descendant_user_id == referrer.id)
        .order_by(AffiliateRelationship.level)
    )
    referrer_ancestors = existing_q.scalars().all()

    # Add direct relationship (L1)
    db.add(AffiliateRelationship(
        descendant_user_id=new_user_id,
        ancestor_user_id=referrer.id,
        level=1,
    ))

    # Propagate up the tree (L2 onwards)
    for rel in referrer_ancestors:
        if rel.level < 10:
            db.add(AffiliateRelationship(
                descendant_user_id=new_user_id,
                ancestor_user_id=rel.ancestor_user_id,
                level=rel.level + 1,
            ))

    new_user = await db.get(User, new_user_id)
    if new_user:
        new_user.referred_by_user_id = referrer.id

    await db.commit()


# ── Super Admin routes ────────────────────────────────────────────

@superadmin_router.get("/list")
async def admin_list_affiliates(
    payload: TokenPayload,
    db: DBSession,
    limit: int = Query(15, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List all users with an active affiliate code and their stats."""
    if not (payload.get("is_super_admin") or payload.get("role") == "SUPER_ADMIN"):
        raise ForbiddenException("Super admin required.")

    from sqlalchemy import text as _text
    rows = await db.execute(_text("""
        SELECT
            u.id, u.email, u.display_name, u.affiliate_code, u.plan,
            CAST(COALESCE(u.affiliate_balance, 0) AS FLOAT) AS balance,
            COUNT(DISTINCT ar.descendant_user_id) AS referral_count,
            CAST(COALESCE(SUM(ac.commission_amount) FILTER (
                WHERE ac.status IN ('pending','ready','paid')
            ), 0) AS FLOAT) AS total_earned,
            CAST(COALESCE(SUM(ac.commission_amount) FILTER (
                WHERE ac.status = 'paid'
            ), 0) AS FLOAT) AS total_paid,
            BOOL_OR(CASE WHEN acr.status IN ('requested','processing') THEN TRUE ELSE FALSE END) AS cashout_pending
        FROM users u
        LEFT JOIN affiliate_relationships ar ON ar.ancestor_user_id = u.id AND ar.level = 1
        LEFT JOIN affiliate_commissions ac ON ac.affiliate_user_id = u.id
        LEFT JOIN affiliate_cashout_requests acr ON acr.user_id = u.id
        WHERE u.affiliate_code IS NOT NULL
        GROUP BY u.id
        ORDER BY balance DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": limit, "offset": offset})

    total_row = await db.execute(_text(
        "SELECT COUNT(*) FROM users WHERE affiliate_code IS NOT NULL"
    ))
    total = total_row.scalar_one() or 0

    affiliates = []
    for r in rows:
        affiliates.append({
            "id": str(r.id),
            "name": r.display_name or r.email,
            "email": r.email,
            "affiliate_code": r.affiliate_code,
            "plan": r.plan,
            "affiliate_balance": r.balance,
            "referral_count": int(r.referral_count or 0),
            "total_earned": float(r.total_earned or 0),
            "total_paid_out": float(r.total_paid or 0),
            "cashout_pending": bool(r.cashout_pending),
        })
    return {"affiliates": affiliates, "total": total}


@superadmin_router.get("/cashouts")
async def admin_list_cashouts(
    payload: TokenPayload,
    db: DBSession,
    status: str | None = Query(None),
    limit: int = Query(15, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    if not (payload.get("is_super_admin") or payload.get("role") == "SUPER_ADMIN"):
        raise ForbiddenException("Super admin required.")

    base = (
        select(
            AffiliateCashoutRequest,
            User.email.label("user_email"),
            User.display_name.label("user_display_name"),
        )
        .join(User, User.id == AffiliateCashoutRequest.user_id)
    )
    if status:
        base = base.where(AffiliateCashoutRequest.status == status)

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    result = await db.execute(base.order_by(AffiliateCashoutRequest.requested_at.desc()).limit(limit).offset(offset))
    rows = result.all()

    return {
        "cashouts": [
            {
                "id": str(r.AffiliateCashoutRequest.id),
                "user_id": str(r.AffiliateCashoutRequest.user_id),
                "user_email": r.user_email,
                "user_display_name": r.user_display_name,
                "amount": float(r.AffiliateCashoutRequest.gross_amount),
                "fee": float(r.AffiliateCashoutRequest.fee),
                "net_amount": float(r.AffiliateCashoutRequest.net_amount),
                "status": r.AffiliateCashoutRequest.status.value,
                "payout_method": r.AffiliateCashoutRequest.payout_method,
                "payout_reference": r.AffiliateCashoutRequest.payout_reference,
                "notes": r.AffiliateCashoutRequest.notes,
                "requested_at": r.AffiliateCashoutRequest.requested_at.isoformat(),
                "processed_at": r.AffiliateCashoutRequest.processed_at.isoformat() if r.AffiliateCashoutRequest.processed_at else None,
            }
            for r in rows
        ],
        "total": total,
    }


class ProcessCashoutRequest(BaseModel):
    action: str  # 'approve' | 'reject'
    notes: str | None = None
    payout_reference: str | None = None


@superadmin_router.patch("/cashouts/{cashout_id}")
async def admin_process_cashout(
    cashout_id: uuid.UUID,
    body: ProcessCashoutRequest,
    payload: TokenPayload,
    db: DBSession,
):
    if not (payload.get("is_super_admin") or payload.get("role") == "SUPER_ADMIN"):
        raise ForbiddenException("Super admin required.")

    cashout = await db.get(AffiliateCashoutRequest, cashout_id)
    if not cashout:
        raise NotFoundException("Cashout request not found.")

    if cashout.status not in [CashoutStatus.REQUESTED, CashoutStatus.PROCESSING]:
        raise ValidationException("This request can no longer be modified.")

    now = datetime.now(timezone.utc)

    if body.action == "approve":
        cashout.status = CashoutStatus.PAID
        cashout.processed_at = now
        cashout.payout_reference = body.payout_reference
        cashout.notes = body.notes
    elif body.action == "reject":
        cashout.status = CashoutStatus.REJECTED
        cashout.processed_at = now
        cashout.notes = body.notes
        # Restore balance — find PAID commissions in this cashout and restore them
        commissions_q = await db.execute(
            select(AffiliateCommission).where(AffiliateCommission.cashout_request_id == cashout_id)
        )
        commissions = commissions_q.scalars().all()
        if commissions:
            user = await db.get(User, cashout.user_id)
            restored = sum(float(c.commission_amount) for c in commissions)
            if user:
                user.affiliate_balance = float(user.affiliate_balance or 0) + restored
            for c in commissions:
                c.status = AffiliateCommissionStatus.READY
                c.cashout_request_id = None
                c.paid_at = None
    else:
        raise ValidationException("Invalid action. Use 'approve' or 'reject'.")

    await db.commit()
    return {"status": cashout.status.value}
