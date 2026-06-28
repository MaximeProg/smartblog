"""
Module SuperAdmin — accès global à toute la plateforme.
Nécessite is_super_admin = True sur l'utilisateur.
"""
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter
from sqlalchemy import select, func, text
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.tenant import Tenant
from app.models.user import User
from app.models.tenant_user import TenantUser
from app.models.enums import TenantStatus, PlanTier

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


async def _require_super_admin(payload: TokenPayload, db: DBSession) -> User:
    result = await db.execute(select(User).where(User.id == uuid.UUID(payload["sub"])))
    user = result.scalar_one_or_none()
    if not user or not user.is_super_admin:
        raise ForbiddenException("Accès réservé aux super-administrateurs.")
    return user


# ── Stats globales ────────────────────────────────────────────────

@router.get("/stats")
async def platform_stats(payload: TokenPayload, db: DBSession):
    await _require_super_admin(payload, db)

    total_tenants = (await db.execute(select(func.count(Tenant.id)))).scalar_one()
    active_tenants = (await db.execute(
        select(func.count(Tenant.id)).where(Tenant.status == TenantStatus.ACTIVE)
    )).scalar_one()
    total_users = (await db.execute(select(func.count(User.id)))).scalar_one()

    by_plan = await db.execute(text("""
        SELECT plan, COUNT(*) as count FROM tenants GROUP BY plan ORDER BY count DESC
    """))
    plans = {r.plan: r.count for r in by_plan}

    revenue = await db.execute(text("""
        SELECT COALESCE(SUM(amount), 0) as total,
               COUNT(*) as transactions
        FROM transactions WHERE status = 'completed'
    """))
    rev_row = revenue.first()

    new_today = await db.execute(text("""
        SELECT COUNT(*) FROM tenants
        WHERE created_at >= NOW() - INTERVAL '24 hours'
    """))

    return {
        "tenants": {
            "total": total_tenants,
            "active": active_tenants,
            "new_today": new_today.scalar_one(),
            "by_plan": plans,
        },
        "users": {"total": total_users},
        "revenue": {
            "total_usd": float(rev_row.total),
            "transactions": rev_row.transactions,
        },
    }


# ── Gestion tenants ───────────────────────────────────────────────

class TenantAdminView(BaseModel):
    id: str
    name: str
    slug: str
    plan: PlanTier
    status: TenantStatus
    articles_count: int
    subscribers_count: int
    storage_used_bytes: int
    created_at: datetime


@router.get("/tenants")
async def list_all_tenants(
    payload: TokenPayload,
    db: DBSession,
    status: TenantStatus | None = None,
    plan: PlanTier | None = None,
    limit: int = 50,
    offset: int = 0,
):
    await _require_super_admin(payload, db)
    query = select(Tenant)
    if status:
        query = query.where(Tenant.status == status)
    if plan:
        query = query.where(Tenant.plan == plan)
    query = query.order_by(Tenant.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)
    tenants = result.scalars().all()
    return [TenantAdminView(
        id=str(t.id), name=t.name, slug=t.slug, plan=t.plan,
        status=t.status, articles_count=t.articles_count,
        subscribers_count=t.subscribers_count,
        storage_used_bytes=t.storage_used_bytes or 0,
        created_at=t.created_at,
    ) for t in tenants]


@router.post("/tenants/{tenant_id}/suspend", status_code=200)
async def suspend_tenant(
    tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    await _require_super_admin(payload, db)
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Tenant")
    tenant.status = TenantStatus.SUSPENDED
    await db.commit()

    # Invalider le cache tenant
    from app.core.security import get_redis
    redis = await get_redis()
    await redis.delete(f"tenant:{tenant.slug}")
    return {"message": f"{tenant.name} suspendu."}


@router.post("/tenants/{tenant_id}/activate", status_code=200)
async def activate_tenant(
    tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    await _require_super_admin(payload, db)
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Tenant")
    tenant.status = TenantStatus.ACTIVE
    await db.commit()
    return {"message": f"{tenant.name} activé."}


@router.patch("/tenants/{tenant_id}/plan")
async def change_plan(
    tenant_id: uuid.UUID,
    plan: PlanTier,
    payload: TokenPayload,
    db: DBSession,
):
    await _require_super_admin(payload, db)
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Tenant")
    tenant.plan = plan
    await db.commit()
    return {"message": f"Plan changé → {plan.value}"}


@router.delete("/tenants/{tenant_id}", status_code=204)
async def delete_tenant(
    tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    await _require_super_admin(payload, db)
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Tenant")
    tenant.status = TenantStatus.DELETED
    await db.commit()


# ── Gestion utilisateurs ──────────────────────────────────────────

@router.get("/users")
async def list_all_users(
    payload: TokenPayload,
    db: DBSession,
    limit: int = 50,
    offset: int = 0,
):
    await _require_super_admin(payload, db)
    result = await db.execute(
        select(User).order_by(User.created_at.desc()).limit(limit).offset(offset)
    )
    users = result.scalars().all()
    return [
        {
            "id": str(u.id), "email": u.email,
            "display_name": u.display_name,
            "sign_in_provider": u.sign_in_provider,
            "is_super_admin": u.is_super_admin,
            "two_fa_enabled": u.two_fa_enabled,
            "last_login_at": u.last_login_at,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.post("/users/{user_id}/make-super-admin", status_code=200)
async def make_super_admin(
    user_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    await _require_super_admin(payload, db)
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("Utilisateur")
    user.is_super_admin = True
    await db.commit()
    return {"message": f"{user.email} est maintenant super-admin."}


@router.post("/users/{user_id}/revoke-super-admin", status_code=200)
async def revoke_super_admin(
    user_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    await _require_super_admin(payload, db)
    if str(user_id) == payload["sub"]:
        raise ForbiddenException("Vous ne pouvez pas révoquer vos propres droits.")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("Utilisateur")
    user.is_super_admin = False
    await db.commit()
    return {"message": f"Droits super-admin révoqués pour {user.email}."}
