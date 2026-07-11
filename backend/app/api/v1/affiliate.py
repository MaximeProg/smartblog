"""M23 — Affiliate Program API"""
import uuid
import random
import string
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from sqlalchemy import select, func, update
from pydantic import BaseModel

from app.core.config import settings
from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException, ForbiddenException
from app.models.affiliate import AffiliateRelationship, AffiliateCommission, AffiliateCashoutRequest
from app.models.tenant import Tenant
from app.models.enums import AffiliateCommissionStatus, CashoutStatus, UserRole
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/affiliate", tags=["affiliate"])
superadmin_router = APIRouter(prefix="/superadmin/affiliate", tags=["affiliate-admin"])

CASHOUT_FEE = 20.00
MIN_CASHOUT = 50.00


# ── Schemas ───────────────────────────────────────────────────────

class AffiliateDashboardResponse(BaseModel):
    affiliate_code: str
    referral_url: str
    balance: float
    cashout_threshold: float
    can_cashout: bool
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


class CashoutRequest(BaseModel):
    payout_method: str = "stripe"


class RegisterReferralRequest(BaseModel):
    referral_code: str


class ReferralItem(BaseModel):
    tenant_id: str
    name: str
    slug: str
    plan: str
    status: str
    joined_at: str | None
    total_commission: float


# ── Helpers ───────────────────────────────────────────────────────

def _generate_affiliate_code() -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=8))


# ── Tenant affiliate routes ───────────────────────────────────────

@router.get("", response_model=AffiliateDashboardResponse)
async def get_affiliate_dashboard(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)

    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise NotFoundException("Blog non trouvé.")

    # Ensure affiliate_code exists
    if not tenant.affiliate_code:
        tenant.affiliate_code = _generate_affiliate_code()
        await db.commit()
        await db.refresh(tenant)

    # Count referrals at level 1
    total_referrals_q = await db.execute(
        select(func.count()).where(
            AffiliateRelationship.ancestor_id == tenant_id,
            AffiliateRelationship.level == 1,
        )
    )
    total_referrals = total_referrals_q.scalar() or 0

    # Aggregate earned
    earned_q = await db.execute(
        select(func.coalesce(func.sum(AffiliateCommission.commission_amount), 0)).where(
            AffiliateCommission.affiliate_tenant_id == tenant_id,
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
            AffiliateCommission.affiliate_tenant_id == tenant_id,
            AffiliateCommission.status == AffiliateCommissionStatus.PAID,
        )
    )
    total_paid_out = float(paid_out_q.scalar() or 0)

    pending_q = await db.execute(
        select(func.count()).where(
            AffiliateCommission.affiliate_tenant_id == tenant_id,
            AffiliateCommission.status == AffiliateCommissionStatus.PENDING,
        )
    )
    pending_commissions = pending_q.scalar() or 0

    balance = float(tenant.affiliate_balance or 0)
    threshold = float(tenant.affiliate_cashout_threshold or MIN_CASHOUT)

    return AffiliateDashboardResponse(
        affiliate_code=tenant.affiliate_code,
        referral_url=f"{settings.FRONTEND_URL}/register?ref={tenant.affiliate_code}",
        balance=balance,
        cashout_threshold=threshold,
        can_cashout=balance >= threshold,
        total_earned=total_earned,
        total_paid_out=total_paid_out,
        total_referrals=total_referrals,
        pending_commissions=pending_commissions,
    )


@router.get("/commissions")
async def list_commissions(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    status: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)

    q = select(AffiliateCommission).where(AffiliateCommission.affiliate_tenant_id == tenant_id)
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


@router.get("/cashouts")
async def list_cashouts(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)

    result = await db.execute(
        select(AffiliateCashoutRequest)
        .where(AffiliateCashoutRequest.tenant_id == tenant_id)
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


@router.post("/cashout", status_code=201)
async def request_cashout(
    tenant_id: uuid.UUID,
    body: CashoutRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)

    tenant = await db.get(Tenant, tenant_id)
    if not tenant:
        raise NotFoundException("Blog non trouvé.")

    balance = float(tenant.affiliate_balance or 0)
    threshold = float(tenant.affiliate_cashout_threshold or MIN_CASHOUT)

    if balance < threshold:
        raise ValidationException(f"Solde insuffisant. Minimum requis : ${threshold:.2f}, solde actuel : ${balance:.2f}")

    # Check no pending cashout request
    pending_q = await db.execute(
        select(func.count()).where(
            AffiliateCashoutRequest.tenant_id == tenant_id,
            AffiliateCashoutRequest.status.in_([CashoutStatus.REQUESTED, CashoutStatus.PROCESSING]),
        )
    )
    if (pending_q.scalar() or 0) > 0:
        raise ValidationException("Une demande de retrait est déjà en cours.")

    net_amount = balance - CASHOUT_FEE
    if net_amount <= 0:
        raise ValidationException(f"Le solde (${balance:.2f}) ne couvre pas les frais de retrait (${CASHOUT_FEE:.2f}).")

    cashout = AffiliateCashoutRequest(
        tenant_id=tenant_id,
        gross_amount=balance,
        fee=CASHOUT_FEE,
        net_amount=net_amount,
        payout_method=body.payout_method,
        status=CashoutStatus.REQUESTED,
    )
    db.add(cashout)

    # Mark READY commissions as part of this cashout
    ready_commissions_q = await db.execute(
        select(AffiliateCommission).where(
            AffiliateCommission.affiliate_tenant_id == tenant_id,
            AffiliateCommission.status.in_([AffiliateCommissionStatus.PENDING, AffiliateCommissionStatus.READY]),
        )
    )
    ready_commissions = ready_commissions_q.scalars().all()

    await db.flush()  # get cashout.id

    for commission in ready_commissions:
        commission.cashout_request_id = cashout.id
        commission.status = AffiliateCommissionStatus.PAID
        commission.paid_at = datetime.now(timezone.utc)

    # Zero out balance
    tenant.affiliate_balance = 0
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


# ── Commission computation helpers (called from payment webhooks) ─

async def compute_and_accrue_commissions(
    db,
    source_tenant_id: uuid.UUID,
    source_type: str,
    source_transaction_id: str,
    gross_amount: float,
):
    """
    Compute affiliate commissions for a given transaction and accrue them.
    Called from payment webhook handlers.

    For subscriptions: 20% pool
      - L1: 50% of pool
      - L2-L10: 50% / 9 each (missing levels go to NexusBlog)

    For ad slots: 10% of gross (the other 10% goes to NexusBlog account 4101)
      - Same L1/L2-L10 split on this 10%
    """
    from app.models.enums import AffiliateCommissionSource

    if source_type == "subscription":
        affiliate_pool = round(gross_amount * 0.20, 4)
    else:  # ad_slot
        affiliate_pool = round(gross_amount * 0.10, 4)

    # Fetch affiliate tree for the source tenant
    ancestors_q = await db.execute(
        select(AffiliateRelationship)
        .where(AffiliateRelationship.descendant_id == source_tenant_id)
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
        await _accrue_commission(db, l1.ancestor_id, source_tenant_id, commission_source, source_transaction_id, 1, gross_amount, l1_amount)

    # Accrue L2-L10
    for rel in l2_to_l10:
        if per_level_amount > 0:
            await _accrue_commission(db, rel.ancestor_id, source_tenant_id, commission_source, source_transaction_id, rel.level, gross_amount, per_level_amount)


async def _accrue_commission(db, affiliate_tenant_id, source_tenant_id, source_type, source_transaction_id, level, gross_amount, commission_amount):
    from app.models.enums import AffiliateCommissionStatus

    tenant = await db.get(Tenant, affiliate_tenant_id)
    if not tenant:
        return

    commission = AffiliateCommission(
        affiliate_tenant_id=affiliate_tenant_id,
        source_tenant_id=source_tenant_id,
        source_type=source_type,
        source_transaction_id=source_transaction_id,
        level=level,
        gross_amount=gross_amount,
        commission_amount=commission_amount,
        status=AffiliateCommissionStatus.PENDING,
    )
    db.add(commission)

    # Update balance
    new_balance = float(tenant.affiliate_balance or 0) + float(commission_amount)
    tenant.affiliate_balance = new_balance

    # Mark ready if above threshold
    threshold = float(tenant.affiliate_cashout_threshold or 50)
    if new_balance >= threshold:
        commission.status = AffiliateCommissionStatus.READY


@router.get("/referrals")
async def list_referrals(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """List direct referrals (level=1) for this affiliate tenant."""
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)

    result = await db.execute(
        select(
            AffiliateRelationship.descendant_id,
            AffiliateRelationship.created_at.label("referred_at"),
            Tenant.name,
            Tenant.slug,
            Tenant.plan,
            Tenant.status,
        )
        .join(Tenant, Tenant.id == AffiliateRelationship.descendant_id)
        .where(
            AffiliateRelationship.ancestor_id == tenant_id,
            AffiliateRelationship.level == 1,
            Tenant.deleted_at.is_(None),
        )
        .order_by(AffiliateRelationship.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    rows = result.all()

    total_q = await db.execute(
        select(func.count()).where(
            AffiliateRelationship.ancestor_id == tenant_id,
            AffiliateRelationship.level == 1,
        )
    )
    total = total_q.scalar_one() or 0

    referrals = []
    for row in rows:
        comm_q = await db.execute(
            select(func.coalesce(func.sum(AffiliateCommission.commission_amount), 0)).where(
                AffiliateCommission.affiliate_tenant_id == tenant_id,
                AffiliateCommission.source_tenant_id == row.descendant_id,
            )
        )
        total_commission = float(comm_q.scalar() or 0)
        referrals.append(ReferralItem(
            tenant_id=str(row.descendant_id),
            name=row.name,
            slug=row.slug,
            plan=row.plan.value if hasattr(row.plan, "value") else str(row.plan),
            status=row.status.value if hasattr(row.status, "value") else str(row.status),
            joined_at=row.referred_at.isoformat() if row.referred_at else None,
            total_commission=total_commission,
        ))

    return {"referrals": referrals, "total": total}


# ── Register referral (called at tenant creation) ─────────────────

async def register_referral(db, new_tenant_id: uuid.UUID, referral_code: str):
    """
    Called when a new tenant is created with a referral code.
    Builds the closure table entries for the new tenant.
    """
    # Find the referrer
    referrer_q = await db.execute(
        select(Tenant).where(Tenant.affiliate_code == referral_code.upper())
    )
    referrer = referrer_q.scalar_one_or_none()
    if not referrer:
        return  # Invalid code — silently ignore

    # Prevent self-referral
    if referrer.id == new_tenant_id:
        return

    # Get referrer's ancestors (up to 9 levels)
    existing_q = await db.execute(
        select(AffiliateRelationship)
        .where(AffiliateRelationship.descendant_id == referrer.id)
        .order_by(AffiliateRelationship.level)
    )
    referrer_ancestors = existing_q.scalars().all()

    # Add direct relationship (L1)
    db.add(AffiliateRelationship(
        descendant_id=new_tenant_id,
        ancestor_id=referrer.id,
        level=1,
    ))

    # Propagate up the tree (L2 onwards)
    for rel in referrer_ancestors:
        if rel.level < 10:
            db.add(AffiliateRelationship(
                descendant_id=new_tenant_id,
                ancestor_id=rel.ancestor_id,
                level=rel.level + 1,
            ))

    # Record referred_by on the new tenant
    new_tenant = await db.get(Tenant, new_tenant_id)
    if new_tenant:
        new_tenant.referred_by_tenant_id = referrer.id

    await db.commit()


# ── Super Admin routes ────────────────────────────────────────────

@superadmin_router.get("/list")
async def admin_list_affiliates(
    payload: TokenPayload,
    db: DBSession,
    limit: int = Query(15, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """List all tenants with an active affiliate code and their stats."""
    if not (payload.get("is_super_admin") or payload.get("role") == "SUPER_ADMIN"):
        raise ForbiddenException("Super admin requis.")

    from sqlalchemy import text as _text
    rows = await db.execute(_text("""
        SELECT
            t.id, t.name, t.slug, t.affiliate_code, t.plan,
            CAST(COALESCE(t.affiliate_balance, 0) AS FLOAT) AS balance,
            COUNT(DISTINCT ar.descendant_id) AS referral_count,
            CAST(COALESCE(SUM(ac.commission_amount) FILTER (
                WHERE ac.status IN ('pending','ready','paid')
            ), 0) AS FLOAT) AS total_earned,
            CAST(COALESCE(SUM(ac.commission_amount) FILTER (
                WHERE ac.status = 'paid'
            ), 0) AS FLOAT) AS total_paid,
            BOOL_OR(CASE WHEN acr.status IN ('requested','processing') THEN TRUE ELSE FALSE END) AS cashout_pending
        FROM tenants t
        LEFT JOIN affiliate_relationships ar ON ar.ancestor_id = t.id AND ar.level = 1
        LEFT JOIN affiliate_commissions ac ON ac.affiliate_tenant_id = t.id
        LEFT JOIN affiliate_cashout_requests acr ON acr.tenant_id = t.id
        WHERE t.affiliate_code IS NOT NULL AND t.status != 'deleted'
        GROUP BY t.id
        ORDER BY balance DESC
        LIMIT :limit OFFSET :offset
    """), {"limit": limit, "offset": offset})

    total_row = await db.execute(_text(
        "SELECT COUNT(*) FROM tenants WHERE affiliate_code IS NOT NULL AND status != 'deleted'"
    ))
    total = total_row.scalar_one() or 0

    affiliates = []
    for r in rows:
        affiliates.append({
            "id": str(r.id),
            "name": r.name,
            "slug": r.slug,
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
        raise ForbiddenException("Super admin requis.")

    base = (
        select(
            AffiliateCashoutRequest,
            Tenant.name.label("tenant_name"),
            Tenant.slug.label("tenant_slug"),
        )
        .join(Tenant, Tenant.id == AffiliateCashoutRequest.tenant_id)
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
                "tenant_id": str(r.AffiliateCashoutRequest.tenant_id),
                "tenant_name": r.tenant_name,
                "tenant_slug": r.tenant_slug,
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
        raise ForbiddenException("Super admin requis.")

    cashout = await db.get(AffiliateCashoutRequest, cashout_id)
    if not cashout:
        raise NotFoundException("Demande de retrait introuvable.")

    if cashout.status not in [CashoutStatus.REQUESTED, CashoutStatus.PROCESSING]:
        raise ValidationException("Cette demande ne peut plus être modifiée.")

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
            tenant = await db.get(Tenant, cashout.tenant_id)
            restored = sum(float(c.commission_amount) for c in commissions)
            if tenant:
                tenant.affiliate_balance = float(tenant.affiliate_balance or 0) + restored
            for c in commissions:
                c.status = AffiliateCommissionStatus.READY
                c.cashout_request_id = None
                c.paid_at = None
    else:
        raise ValidationException("Action invalide. Utilisez 'approve' ou 'reject'.")

    await db.commit()
    return {"status": cashout.status.value}
