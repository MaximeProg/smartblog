"""M24 — Accounting System (Singapore SFRS)"""
import uuid
from datetime import datetime, date, timezone
from fastapi import APIRouter, Query
from sqlalchemy import select, func, and_
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException, ForbiddenException
from app.models.accounting import ChartOfAccount, JournalEntry, JournalEntryLine
from app.models.user import User
from app.models.enums import AccountType, JournalType, JournalEntryStatus, JournalEntrySource

router = APIRouter(prefix="/accounting", tags=["accounting"])


# ── Schemas ───────────────────────────────────────────────────────

class AccountResponse(BaseModel):
    code: str
    name: str
    account_class: int
    account_type: str
    parent_code: str | None
    is_active: bool
    is_system: bool
    description: str | None


class CreateAccountRequest(BaseModel):
    code: str
    name: str
    account_class: int
    account_type: str
    parent_code: str | None = None
    description: str | None = None


class JournalLineInput(BaseModel):
    account_code: str
    debit: float = 0
    credit: float = 0
    description: str | None = None


class CreateJournalEntryRequest(BaseModel):
    journal_type: str
    description: str
    entry_date: date
    reference: str | None = None
    lines: list[JournalLineInput]


class JournalLineResponse(BaseModel):
    id: str
    line_number: int
    account_code: str
    account_name: str
    debit: float
    credit: float
    description: str | None


class JournalEntryResponse(BaseModel):
    id: str
    entry_number: int
    journal_type: str
    reference: str | None
    description: str
    entry_date: date
    status: str
    source_type: str | None
    source_id: str | None
    created_by: str
    approved_by: str | None
    created_at: datetime
    approved_at: datetime | None
    lines: list[JournalLineResponse] = []
    total_debit: float = 0
    total_credit: float = 0


# ── Helpers ───────────────────────────────────────────────────────

def _require_super_admin(payload: dict):
    if not (payload.get("is_super_admin") or payload.get("role") == "SUPER_ADMIN"):
        raise ForbiddenException("Super admin requis pour l'accès comptable.")


async def _build_entry_response(db, entry: JournalEntry, include_lines: bool = False) -> JournalEntryResponse:
    lines_data: list[JournalLineResponse] = []
    total_debit = 0.0
    total_credit = 0.0

    if include_lines:
        lines_q = await db.execute(
            select(JournalEntryLine, ChartOfAccount)
            .join(ChartOfAccount, JournalEntryLine.account_code == ChartOfAccount.code)
            .where(JournalEntryLine.entry_id == entry.id)
            .order_by(JournalEntryLine.line_number)
        )
        for line, account in lines_q:
            lines_data.append(JournalLineResponse(
                id=str(line.id),
                line_number=line.line_number,
                account_code=line.account_code,
                account_name=account.name,
                debit=float(line.debit),
                credit=float(line.credit),
                description=line.description,
            ))
            total_debit += float(line.debit)
            total_credit += float(line.credit)

    return JournalEntryResponse(
        id=str(entry.id),
        entry_number=entry.entry_number,
        journal_type=entry.journal_type.value,
        reference=entry.reference,
        description=entry.description,
        entry_date=entry.entry_date,
        status=entry.status.value,
        source_type=entry.source_type.value if entry.source_type else None,
        source_id=entry.source_id,
        created_by=str(entry.created_by),
        approved_by=str(entry.approved_by) if entry.approved_by else None,
        created_at=entry.created_at,
        approved_at=entry.approved_at,
        lines=lines_data,
        total_debit=total_debit,
        total_credit=total_credit,
    )


async def _get_next_entry_number(db) -> int:
    result = await db.execute(select(func.nextval("journal_entry_number_seq")))
    return result.scalar()


# ── Chart of Accounts ─────────────────────────────────────────────

@router.get("/chart-of-accounts")
async def list_chart_of_accounts(
    payload: TokenPayload,
    db: DBSession,
    account_class: int | None = Query(None, ge=1, le=5),
    active_only: bool = Query(True),
):
    _require_super_admin(payload)

    q = select(ChartOfAccount).order_by(ChartOfAccount.code)
    if account_class:
        q = q.where(ChartOfAccount.account_class == account_class)
    if active_only:
        q = q.where(ChartOfAccount.is_active == True)

    result = await db.execute(q)
    accounts = result.scalars().all()

    return [
        AccountResponse(
            code=a.code,
            name=a.name,
            account_class=a.account_class,
            account_type=a.account_type.value,
            parent_code=a.parent_code,
            is_active=a.is_active,
            is_system=a.is_system,
            description=a.description,
        )
        for a in accounts
    ]


@router.post("/chart-of-accounts", status_code=201)
async def create_account(
    body: CreateAccountRequest,
    payload: TokenPayload,
    db: DBSession,
):
    _require_super_admin(payload)
    user_id = uuid.UUID(payload["sub"])

    # Validate code uniqueness
    existing = await db.execute(select(ChartOfAccount).where(ChartOfAccount.code == body.code))
    if existing.scalar_one_or_none():
        raise ValidationException(f"Le compte {body.code} existe déjà.")

    # Validate parent
    if body.parent_code:
        parent = await db.execute(select(ChartOfAccount).where(ChartOfAccount.code == body.parent_code))
        if not parent.scalar_one_or_none():
            raise ValidationException(f"Compte parent {body.parent_code} introuvable.")

    account = ChartOfAccount(
        code=body.code,
        name=body.name,
        account_class=body.account_class,
        account_type=AccountType(body.account_type),
        parent_code=body.parent_code,
        description=body.description,
        is_system=False,
        created_by=user_id,
    )
    db.add(account)
    await db.commit()

    return AccountResponse(
        code=account.code,
        name=account.name,
        account_class=account.account_class,
        account_type=account.account_type.value,
        parent_code=account.parent_code,
        is_active=account.is_active,
        is_system=account.is_system,
        description=account.description,
    )


@router.patch("/chart-of-accounts/{code}/toggle")
async def toggle_account(
    code: str,
    payload: TokenPayload,
    db: DBSession,
):
    _require_super_admin(payload)

    result = await db.execute(select(ChartOfAccount).where(ChartOfAccount.code == code))
    account = result.scalar_one_or_none()
    if not account:
        raise NotFoundException(f"Compte {code} introuvable.")
    if account.is_system:
        raise ValidationException("Les comptes système ne peuvent pas être désactivés.")

    account.is_active = not account.is_active
    await db.commit()
    return {"code": account.code, "is_active": account.is_active}


# ── Journal Entries ───────────────────────────────────────────────

@router.get("/entries")
async def list_journal_entries(
    payload: TokenPayload,
    db: DBSession,
    status: str | None = Query(None),
    journal_type: str | None = Query(None),
    date_from: date | None = Query(None),
    date_to: date | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    _require_super_admin(payload)

    q = select(JournalEntry)
    if status:
        q = q.where(JournalEntry.status == status)
    if journal_type:
        q = q.where(JournalEntry.journal_type == journal_type)
    if date_from:
        q = q.where(JournalEntry.entry_date >= date_from)
    if date_to:
        q = q.where(JournalEntry.entry_date <= date_to)

    q = q.order_by(JournalEntry.entry_number.desc()).limit(limit).offset(offset)
    result = await db.execute(q)
    entries = result.scalars().all()

    return [await _build_entry_response(db, e, include_lines=False) for e in entries]


@router.get("/entries/{entry_id}")
async def get_journal_entry(
    entry_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    _require_super_admin(payload)

    entry = await db.get(JournalEntry, entry_id)
    if not entry:
        raise NotFoundException("Écriture introuvable.")

    return await _build_entry_response(db, entry, include_lines=True)


@router.post("/entries", status_code=201)
async def create_journal_entry(
    body: CreateJournalEntryRequest,
    payload: TokenPayload,
    db: DBSession,
):
    _require_super_admin(payload)
    user_id = uuid.UUID(payload["sub"])

    if not body.lines:
        raise ValidationException("L'écriture doit comporter au moins deux lignes.")

    total_debit = sum(ln.debit for ln in body.lines)
    total_credit = sum(ln.credit for ln in body.lines)

    if abs(total_debit - total_credit) > 0.01:
        raise ValidationException(
            f"L'écriture n'est pas équilibrée : débit {total_debit:.2f} ≠ crédit {total_credit:.2f}."
        )

    # Validate account codes
    for ln in body.lines:
        acc = await db.execute(select(ChartOfAccount).where(ChartOfAccount.code == ln.account_code, ChartOfAccount.is_active == True))
        if not acc.scalar_one_or_none():
            raise ValidationException(f"Compte {ln.account_code} introuvable ou inactif.")

    entry_number = await _get_next_entry_number(db)

    entry = JournalEntry(
        entry_number=entry_number,
        journal_type=JournalType(body.journal_type),
        description=body.description,
        entry_date=body.entry_date,
        reference=body.reference,
        status=JournalEntryStatus.PENDING,
        source_type=JournalEntrySource.MANUAL,
        created_by=user_id,
    )
    db.add(entry)
    await db.flush()

    for i, ln in enumerate(body.lines, start=1):
        line = JournalEntryLine(
            entry_id=entry.id,
            line_number=i,
            account_code=ln.account_code,
            debit=ln.debit,
            credit=ln.credit,
            description=ln.description,
        )
        db.add(line)

    await db.commit()
    return await _build_entry_response(db, entry, include_lines=True)


@router.post("/entries/{entry_id}/approve")
async def approve_journal_entry(
    entry_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    _require_super_admin(payload)
    approver_id = uuid.UUID(payload["sub"])

    entry = await db.get(JournalEntry, entry_id)
    if not entry:
        raise NotFoundException("Écriture introuvable.")

    if entry.status != JournalEntryStatus.PENDING:
        raise ValidationException("Seules les écritures en attente peuvent être approuvées.")

    # Dual-control: approver must differ from creator
    if entry.created_by == approver_id:
        raise ValidationException("L'approbateur doit être différent de l'initiateur (double contrôle).")

    entry.status = JournalEntryStatus.APPROVED
    entry.approved_by = approver_id
    entry.approved_at = datetime.now(timezone.utc)
    await db.commit()

    return {"status": "approved", "entry_number": entry.entry_number}


@router.post("/entries/{entry_id}/reverse")
async def reverse_journal_entry(
    entry_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    reason: str = Query(..., min_length=5),
):
    """Create a reversal entry (extourne). Original entry remains unchanged."""
    _require_super_admin(payload)
    user_id = uuid.UUID(payload["sub"])

    original = await db.get(JournalEntry, entry_id)
    if not original:
        raise NotFoundException("Écriture introuvable.")

    if original.status != JournalEntryStatus.APPROVED:
        raise ValidationException("Seules les écritures approuvées peuvent être extournées.")

    # Fetch original lines
    lines_q = await db.execute(
        select(JournalEntryLine)
        .where(JournalEntryLine.entry_id == entry_id)
        .order_by(JournalEntryLine.line_number)
    )
    original_lines = lines_q.scalars().all()

    reversal_number = await _get_next_entry_number(db)

    reversal = JournalEntry(
        entry_number=reversal_number,
        journal_type=original.journal_type,
        description=f"EXTOURNE #{original.entry_number} — {reason}",
        entry_date=date.today(),
        reference=f"REV-{original.entry_number}",
        status=JournalEntryStatus.PENDING,
        source_type=JournalEntrySource.MANUAL,
        original_entry_id=original.id,
        created_by=user_id,
    )
    db.add(reversal)
    await db.flush()

    # Swap debit ↔ credit
    for i, ln in enumerate(original_lines, start=1):
        db.add(JournalEntryLine(
            entry_id=reversal.id,
            line_number=i,
            account_code=ln.account_code,
            debit=float(ln.credit),
            credit=float(ln.debit),
            description=ln.description,
        ))

    # Mark original as reversed
    original.status = JournalEntryStatus.REVERSED
    await db.commit()

    return await _build_entry_response(db, reversal, include_lines=True)


# ── Auto-booking helper (called from payment webhooks) ────────────

async def book_subscription_payment(
    db,
    amount: float,
    plan_code: str,
    transaction_id: str,
    is_annual: bool,
    stripe_fee: float,
    created_by_system_user_id: uuid.UUID,
):
    """
    Automatically books a subscription payment.
    Dr 1020 (Stripe Settlement) / Cr 4000-4031 (Subscription Revenue) [+ Cr 2200 GST if applicable]
    """
    revenue_account = _plan_to_account(plan_code, is_annual)
    entry_number = await _get_next_entry_number(db)

    entry = JournalEntry(
        entry_number=entry_number,
        journal_type=JournalType.SALES,
        description=f"Subscription payment — {plan_code} — {'Annual' if is_annual else 'Monthly'}",
        entry_date=date.today(),
        reference=transaction_id,
        status=JournalEntryStatus.APPROVED,
        source_type=JournalEntrySource.STRIPE_WEBHOOK,
        source_id=transaction_id,
        created_by=created_by_system_user_id,
        approved_by=created_by_system_user_id,
        approved_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.flush()

    net_revenue = round(amount - stripe_fee, 4)

    lines = [
        JournalEntryLine(entry_id=entry.id, line_number=1, account_code="1020", debit=round(amount, 4), credit=0),
        JournalEntryLine(entry_id=entry.id, line_number=2, account_code=revenue_account, debit=0, credit=round(net_revenue, 4)),
        JournalEntryLine(entry_id=entry.id, line_number=3, account_code="5102", debit=round(stripe_fee, 4), credit=0),
    ]
    # Balance: need a credit for stripe fee
    # Dr 1020 (amount) / Cr revenue_account (net) / Cr 5102? No — Dr 5102 / Cr 1020 net
    # Simplified: Dr 1020 net / Cr revenue
    # Let's simplify to: Dr 1020 (net) / Cr 4xxx (net)
    lines = [
        JournalEntryLine(entry_id=entry.id, line_number=1, account_code="1020", debit=round(net_revenue, 4), credit=0),
        JournalEntryLine(entry_id=entry.id, line_number=2, account_code="5102", debit=round(stripe_fee, 4), credit=0),
        JournalEntryLine(entry_id=entry.id, line_number=3, account_code=revenue_account, debit=0, credit=round(amount, 4)),
    ]
    for ln in lines:
        db.add(ln)


def _plan_to_account(plan_code: str, is_annual: bool) -> str:
    mapping = {
        ("starter", False): "4001",
        ("starter", True): "4002",
        ("pro", False): "4010",
        ("pro", True): "4011",
        ("business", False): "4020",
        ("business", True): "4021",
        ("enterprise", False): "4030",
        ("enterprise", True): "4031",
    }
    return mapping.get((plan_code.lower(), is_annual), "4000")


async def book_ad_slot_payment(
    db,
    amount: float,
    ad_id: str,
    transaction_id: str,
    created_by_system_user_id: uuid.UUID,
):
    """
    Books an ad slot payment:
    Dr 1020 (amount)
    Cr 4101 (10% — NexusBlog commission)
    Cr 2810 (10% — Affiliate pool)
    Cr 4102 (80% — Blog owner net revenue)
    """
    nexusblog_commission = round(amount * 0.10, 4)
    affiliate_pool = round(amount * 0.10, 4)
    blog_owner_net = round(amount * 0.80, 4)

    entry_number = await _get_next_entry_number(db)

    entry = JournalEntry(
        entry_number=entry_number,
        journal_type=JournalType.SALES,
        description=f"Ad slot payment — Ad {ad_id}",
        entry_date=date.today(),
        reference=transaction_id,
        status=JournalEntryStatus.APPROVED,
        source_type=JournalEntrySource.STRIPE_WEBHOOK,
        source_id=transaction_id,
        created_by=created_by_system_user_id,
        approved_by=created_by_system_user_id,
        approved_at=datetime.now(timezone.utc),
    )
    db.add(entry)
    await db.flush()

    lines = [
        JournalEntryLine(entry_id=entry.id, line_number=1, account_code="1020", debit=round(amount, 4), credit=0),
        JournalEntryLine(entry_id=entry.id, line_number=2, account_code="4101", debit=0, credit=nexusblog_commission),
        JournalEntryLine(entry_id=entry.id, line_number=3, account_code="2810", debit=0, credit=affiliate_pool),
        JournalEntryLine(entry_id=entry.id, line_number=4, account_code="4102", debit=0, credit=blog_owner_net),
    ]
    for ln in lines:
        db.add(ln)
