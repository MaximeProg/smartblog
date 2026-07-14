import uuid
import hashlib
import socket
from datetime import datetime, timezone
from fastapi import APIRouter, Query
from sqlalchemy import select, func
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException, ForbiddenException
from app.models.domain import CustomDomain
from app.models.enums import DomainVerificationStatus, UserRole
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


class AddDomainRequest(BaseModel):
    domain: str


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
        raise ValidationException("Domaine invalide.")

    # Unicité
    existing = await db.execute(select(CustomDomain).where(CustomDomain.domain == domain))
    if existing.scalar_one_or_none():
        raise ValidationException("Ce domaine est déjà enregistré.")

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
        raise ForbiddenException(f"Votre plan autorise {limits.domains_max} domaine(s) personnalisé(s).")

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
    )
