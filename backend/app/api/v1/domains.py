import uuid
import hashlib
import socket
from datetime import datetime, timezone
from fastapi import APIRouter, Query, HTTPException
from sqlalchemy import select, func, text
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException, ForbiddenException
from app.models.domain import CustomDomain
from app.models.enums import DomainVerificationStatus, DomainSource, UserRole
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/domains", tags=["domains"])

_TXT_PREFIX = "smarterbloggers-verify="


def _verification_token(tenant_id: uuid.UUID, domain: str) -> str:
    raw = f"{tenant_id}:{domain}"
    return _TXT_PREFIX + hashlib.sha256(raw.encode()).hexdigest()[:32]


class DomainResponse(BaseModel):
    id: str
    domain: str
    verification_status: DomainVerificationStatus
    ssl_enabled: bool
    created_at: datetime
    verified_at: datetime | None
    verification_token: str
    source: DomainSource
    is_primary: bool
    registrar: str | None
    purchased_at: datetime | None
    expires_at: datetime | None
    auto_renew: bool
    purchase_price: float | None
    renewal_price: float | None


class AddDomainRequest(BaseModel):
    domain: str


class DomainSearchResult(BaseModel):
    domain: str
    tld: str
    available: bool
    is_premium: bool
    price: float | None
    renewal_price: float | None
    currency: str


class DomainHistoryEntry(BaseModel):
    action: str
    level: str
    details: str | None
    created_at: datetime


class DomainOrderStatusResponse(BaseModel):
    id: str
    domain_name: str
    status: str
    error_message: str | None
    created_at: datetime
    registered_at: datetime | None


# ── GET /domains ──────────────────────────────────────────────────

@router.get("", response_model=list[DomainResponse])
async def list_domains(tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    result = await db.execute(
        select(CustomDomain)
        .where(CustomDomain.tenant_id == tenant_id)
        .order_by(CustomDomain.created_at.desc())
    )
    domains = result.scalars().all()
    return [_to_response(d, tenant_id) for d in domains]


# ── GET /domains/pending-orders — commandes payées sans domaine lié encore ──

@router.get("/pending-orders", response_model=list[DomainOrderStatusResponse])
async def list_pending_domain_orders(tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession):
    """Commandes d'achat/renouvellement dont le paiement est confirmé mais qui
    n'ont pas (encore, ou plus jamais) de custom_domains correspondante — en
    cours d'enregistrement par le worker, ou en échec. Sans cet endpoint, un
    achat payé mais bloqué (registrar en erreur, ou juste en cours) est
    totalement invisible sur la page domaines (bug réel trouvé le 2026-07-27)."""
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)

    from app.models.domain import DomainOrder
    from app.models.enums import DomainOrderStatus

    result = await db.execute(
        select(DomainOrder)
        .where(
            DomainOrder.tenant_id == tenant_id,
            DomainOrder.custom_domain_id.is_(None),
            DomainOrder.status.in_([
                DomainOrderStatus.PAID,
                DomainOrderStatus.REGISTERING,
                DomainOrderStatus.REGISTRATION_FAILED,
                DomainOrderStatus.REFUND_PENDING,
                DomainOrderStatus.REFUNDED,
            ]),
        )
        .order_by(DomainOrder.created_at.desc())
        .limit(10)
    )
    orders = result.scalars().all()
    return [
        DomainOrderStatusResponse(
            id=str(o.id),
            domain_name=o.domain_name,
            status=o.status.value,
            error_message=o.error_message,
            created_at=o.created_at,
            registered_at=o.registered_at,
        )
        for o in orders
    ]


# ── POST /domains ─────────────────────────────────────────────────

@router.post("", response_model=DomainResponse, status_code=201)
async def add_domain(
    tenant_id: uuid.UUID,
    body: AddDomainRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)

    domain = body.domain.strip().lower().lstrip("https://").lstrip("http://").rstrip("/")
    if not domain or "." not in domain:
        raise ValidationException("Invalid domain.")

    # Unicité
    existing = await db.execute(select(CustomDomain).where(CustomDomain.domain == domain))
    if existing.scalar_one_or_none():
        raise ValidationException("This domain is already registered.")

    # Limit par plan
    from app.models.tenant import Tenant
    from app.services.tenant_service import get_plan_limits
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Tenant")

    limits = get_plan_limits(tenant.plan)
    count_result = await db.execute(
        select(func.count()).where(CustomDomain.tenant_id == tenant_id)
    )
    current_count = count_result.scalar() or 0
    if limits and limits.domains_max is not None and current_count >= limits.domains_max:
        raise ForbiddenException(f"Your plan allows {limits.domains_max} custom domain(s).")

    d = CustomDomain(tenant_id=tenant_id, domain=domain)
    db.add(d)

    from sqlalchemy import text
    await db.execute(
        text("UPDATE tenants SET domains_count = domains_count + 1 WHERE id = :tid"),
        {"tid": str(tenant_id)},
    )
    await db.commit()
    await db.refresh(d)
    return _to_response(d, tenant_id)


# ── POST /domains/{domain_id}/verify ─────────────────────────────

@router.post("/{domain_id}/verify", response_model=DomainResponse)
async def verify_domain(
    tenant_id: uuid.UUID,
    domain_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    d = await _get_domain(db, tenant_id, domain_id)

    expected_token = _verification_token(tenant_id, d.domain)

    # DNS TXT lookup
    verified = False
    try:
        answers = socket.getaddrinfo(d.domain, None)
        # Try TXT records via dnspython if available, fall back to basic check
        try:
            import dns.resolver
            for rdata in dns.resolver.resolve(d.domain, "TXT"):
                txt = b"".join(rdata.strings).decode("utf-8", errors="ignore")
                if txt.strip() == expected_token:
                    verified = True
                    break
        except Exception:
            # dnspython not available or DNS error — mark as pending, user can retry
            pass
    except Exception:
        pass

    if verified:
        d.verification_status = DomainVerificationStatus.VERIFIED
        d.verified_at = datetime.now(timezone.utc)
        d.ssl_enabled = True
        # L'Apache vhost + certificat Let's Encrypt sont provisionnés côté VPS
        # par un cron qui scrute les domaines vérifiés (voir
        # scripts/provision_customer_domains.sh) — rien à faire ici.
    else:
        d.verification_status = DomainVerificationStatus.FAILED

    await db.commit()
    await db.refresh(d)
    return _to_response(d, tenant_id)


# ── DELETE /domains/{domain_id} ───────────────────────────────────

@router.delete("/{domain_id}", status_code=204)
async def delete_domain(
    tenant_id: uuid.UUID,
    domain_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    d = await _get_domain(db, tenant_id, domain_id)
    await db.delete(d)
    from sqlalchemy import text
    await db.execute(
        text("UPDATE tenants SET domains_count = GREATEST(domains_count - 1, 0) WHERE id = :tid"),
        {"tid": str(tenant_id)},
    )
    await db.commit()


# ── Helpers ───────────────────────────────────────────────────────

async def _get_domain(db, tenant_id, domain_id) -> CustomDomain:
    result = await db.execute(
        select(CustomDomain).where(
            CustomDomain.id == domain_id,
            CustomDomain.tenant_id == tenant_id,
        )
    )
    d = result.scalar_one_or_none()
    if not d:
        raise NotFoundException("Domain")
    return d


def _to_response(d: CustomDomain, tenant_id: uuid.UUID) -> DomainResponse:
    return DomainResponse(
        id=str(d.id),
        domain=d.domain,
        verification_status=d.verification_status,
        ssl_enabled=d.ssl_enabled,
        created_at=d.created_at,
        verified_at=d.verified_at,
        verification_token=_verification_token(tenant_id, d.domain),
        source=d.source,
        is_primary=d.is_primary,
        registrar=d.registrar,
        purchased_at=d.purchased_at,
        expires_at=d.expires_at,
        auto_renew=d.auto_renew,
        purchase_price=float(d.purchase_price) if d.purchase_price is not None else None,
        renewal_price=float(d.renewal_price) if d.renewal_price is not None else None,
    )


# ── GET /domains/search — achat de domaine ────────────────────────

@router.get("/search", response_model=list[DomainSearchResult])
async def search_domains(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    q: str = Query(..., min_length=1, max_length=63),
):
    """Recherche de disponibilité + prix sur la liste de TLD par défaut de la
    plateforme. Le nom saisi est nettoyé (pas d'extension attendue)."""
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)

    from app.core.config import settings
    from app.services.registrars.registry import get_registrar
    from app.services.registrars.pricing import apply_markup
    from app.services.registrars.base import RegistrarError

    root = q.strip().lower().split(".")[0]
    if not root or not root.replace("-", "").isalnum():
        raise ValidationException("Invalid domain name.")

    candidates = [f"{root}.{tld}" for tld in settings.DOMAIN_SEARCH_TLDS]

    registrar = get_registrar()
    try:
        results = await registrar.check_availability(candidates)
    except RegistrarError as e:
        raise HTTPException(status_code=502, detail=f"Registrar unavailable: {e}")

    by_domain = {r.domain: r for r in results}
    out: list[DomainSearchResult] = []
    for domain in candidates:
        r = by_domain.get(domain)
        if not r:
            continue
        price = await apply_markup(r.price) if r.price is not None else None
        renewal = await apply_markup(r.renewal_price) if r.renewal_price is not None else None
        out.append(DomainSearchResult(
            domain=domain, tld=r.tld, available=r.available, is_premium=r.is_premium,
            price=price, renewal_price=renewal, currency=r.currency,
        ))
    return out


# ── POST /domains/{id}/set-primary ─────────────────────────────────

@router.post("/{domain_id}/set-primary", response_model=DomainResponse)
async def set_primary_domain(
    tenant_id: uuid.UUID,
    domain_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    d = await _get_domain(db, tenant_id, domain_id)

    await db.execute(
        text("UPDATE custom_domains SET is_primary = false WHERE tenant_id = :tid"),
        {"tid": str(tenant_id)},
    )
    d.is_primary = True
    await db.commit()
    await db.refresh(d)
    return _to_response(d, tenant_id)


# ── POST /domains/{id}/renew — checkout de renouvellement ─────────

@router.post("/{domain_id}/renew")
async def renew_domain_endpoint(
    tenant_id: uuid.UUID,
    domain_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    years: int = 1,
    pay_currency: str = "usdtbsc",
):
    """Crée un paiement de renouvellement — même pipeline crypto que l'achat.
    L'appel registrar.renew_domain() a lieu après confirmation du paiement
    (voir _finalize_transaction + register_purchased_domain, qui détecte un
    renouvellement via custom_domain_id déjà renseigné sur la commande)."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    d = await _get_domain(db, tenant_id, domain_id)

    if d.source != DomainSource.PURCHASED:
        raise ValidationException("Only domains purchased through SmarterBloggers can be renewed here.")
    if d.renewal_price is None:
        raise ValidationException("Renewal price unavailable for this domain.")

    from app.models.domain import DomainOrder
    from app.models.enums import DomainOrderStatus, TransactionType
    from app.api.v1.payments import _create_crypto_transaction, _crypto_response

    user_id = uuid.UUID(payload["sub"])
    order = DomainOrder(
        tenant_id=tenant_id,
        user_id=user_id,
        custom_domain_id=d.id,
        domain_name=d.domain,
        tld=d.domain.split(".", 1)[1],
        years=max(1, years),
        registrar=d.registrar or "openprovider",
        registrant_info={},
        status=DomainOrderStatus.PENDING_PAYMENT,
        renewal_price=d.renewal_price,
        currency="USD",
        auto_renew=d.auto_renew,
    )
    db.add(order)
    await db.flush()

    order_id = f"domren_{tenant_id}_{order.id}_{uuid.uuid4().hex[:8]}"
    tx, _ = await _create_crypto_transaction(
        db,
        tenant_id=tenant_id,
        user_id=user_id,
        transaction_type=TransactionType.DOMAIN_PURCHASE,
        amount_usd=float(d.renewal_price),
        order_id=order_id,
        order_description=f"Renew {d.domain} ({years} an(s))",
        campaign_id=order.id,
        pay_currency=pay_currency,
    )
    order.transaction_id = tx.id
    await db.commit()

    return _crypto_response(tx, float(d.renewal_price))


# ── GET /domains/{id}/history ──────────────────────────────────────

@router.get("/{domain_id}/history", response_model=list[DomainHistoryEntry])
async def get_domain_history(
    tenant_id: uuid.UUID,
    domain_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    d = await _get_domain(db, tenant_id, domain_id)

    rows = (await db.execute(
        text("""
            SELECT action, level, details, ts AS created_at
            FROM activity_logs
            WHERE target_type IN ('custom_domain', 'domain_order') AND target_id = :did
            ORDER BY ts DESC LIMIT 50
        """),
        {"did": str(d.id)},
    )).fetchall()
    return [DomainHistoryEntry(action=r.action, level=r.level, details=r.details, created_at=r.created_at) for r in rows]
