"""
Module SuperAdmin — accès global à toute la plateforme.
Nécessite is_super_admin = True sur l'utilisateur.
"""
import uuid
import time
import os
from datetime import datetime, timezone
from fastapi import APIRouter, Query, UploadFile, File
from sqlalchemy import select, func, text
from pydantic import BaseModel
from typing import Any

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.tenant import Tenant
from app.models.user import User
from app.models.tenant_user import TenantUser
from app.models.platform_media import PlatformMedia
from app.models.enums import TenantStatus, PlanTier, UserRole

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
    q: str | None = None,
    limit: int = 15,
    offset: int = 0,
):
    await _require_super_admin(payload, db)
    base = select(Tenant)
    if status:
        base = base.where(Tenant.status == status)
    if plan:
        base = base.where(Tenant.plan == plan)
    if q:
        base = base.where(
            Tenant.name.ilike(f"%{q}%") | Tenant.slug.ilike(f"%{q}%")
        )
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    result = await db.execute(base.order_by(Tenant.created_at.desc()).limit(limit).offset(offset))
    tenants = result.scalars().all()
    return {
        "items": [TenantAdminView(
            id=str(t.id), name=t.name, slug=t.slug, plan=t.plan,
            status=t.status, articles_count=t.articles_count,
            subscribers_count=t.subscribers_count,
            storage_used_bytes=t.storage_used_bytes or 0,
            created_at=t.created_at,
        ) for t in tenants],
        "total": total,
    }


@router.post("/tenants/{tenant_id}/suspend", status_code=200)
async def suspend_tenant(
    tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    admin = await _require_super_admin(payload, db)
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Tenant")
    tenant.status = TenantStatus.SUSPENDED
    await db.commit()

    from app.core.redis_client import get_redis
    redis = await get_redis()
    await redis.delete(f"tenant:{tenant.slug}")

    from app.services.log_service import log_event
    await log_event(db, "tenant.suspended", actor_id=admin.id, actor_email=admin.email,
                    level="warning", target_type="tenant", target_id=str(tenant.id),
                    details=f"Blog: {tenant.slug}")
    return {"message": f"{tenant.name} suspendu."}


@router.post("/tenants/{tenant_id}/activate", status_code=200)
async def activate_tenant(
    tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    admin = await _require_super_admin(payload, db)
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Tenant")
    tenant.status = TenantStatus.ACTIVE
    await db.commit()

    from app.services.log_service import log_event
    await log_event(db, "tenant.reactivated", actor_id=admin.id, actor_email=admin.email,
                    level="success", target_type="tenant", target_id=str(tenant.id),
                    details=f"Blog: {tenant.slug}")
    return {"message": f"{tenant.name} activé."}


@router.patch("/tenants/{tenant_id}/plan")
async def change_plan(
    tenant_id: uuid.UUID,
    plan: PlanTier,
    payload: TokenPayload,
    db: DBSession,
):
    admin = await _require_super_admin(payload, db)
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Tenant")
    old_plan = tenant.plan.value if tenant.plan else "unknown"
    tenant.plan = plan
    await db.commit()

    action = "plan.upgraded" if plan.value > old_plan else "plan.downgraded"
    from app.services.log_service import log_event
    await log_event(db, action, actor_id=admin.id, actor_email=admin.email,
                    level="info", target_type="tenant", target_id=str(tenant.id),
                    details=f"{old_plan} → {plan.value} (blog: {tenant.slug})")
    return {"message": f"Plan changé → {plan.value}"}


@router.delete("/tenants/{tenant_id}", status_code=204)
async def delete_tenant(
    tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    admin = await _require_super_admin(payload, db)
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Tenant")
    tenant.status = TenantStatus.DELETED
    await db.commit()

    from app.services.log_service import log_event
    await log_event(db, "tenant.deleted", actor_id=admin.id, actor_email=admin.email,
                    level="error", target_type="tenant", target_id=str(tenant.id),
                    details=f"Blog: {tenant.slug}")


# ── Gestion utilisateurs ──────────────────────────────────────────

@router.get("/users")
async def list_all_users(
    payload: TokenPayload,
    db: DBSession,
    q: str | None = None,
    limit: int = 15,
    offset: int = 0,
):
    await _require_super_admin(payload, db)
    base = select(User)
    if q:
        base = base.where(
            User.email.ilike(f"%{q}%") | User.display_name.ilike(f"%{q}%")
        )
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    result = await db.execute(base.order_by(User.created_at.desc()).limit(limit).offset(offset))
    users = result.scalars().all()
    return {
        "items": [
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
        ],
        "total": total,
    }


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

    from app.services.log_service import log_event
    await log_event(db, "admin.role_granted", actor_id=admin.id, actor_email=admin.email,
                    level="warning", target_type="user", target_id=str(user.id),
                    details=f"Super-admin granted to {user.email}")
    return {"message": f"{user.email} est maintenant super-admin."}


@router.post("/users/{user_id}/revoke-super-admin", status_code=200)
async def revoke_super_admin(
    user_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    admin = await _require_super_admin(payload, db)
    if str(user_id) == payload["sub"]:
        raise ForbiddenException("Vous ne pouvez pas révoquer vos propres droits.")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("Utilisateur")
    user.is_super_admin = False
    await db.commit()

    from app.services.log_service import log_event
    await log_event(db, "admin.role_revoked", actor_id=admin.id, actor_email=admin.email,
                    level="warning", target_type="user", target_id=str(user.id),
                    details=f"Super-admin revoked from {user.email}")
    return {"message": f"Droits super-admin révoqués pour {user.email}."}


# ── Validation publicités (cross-tenant) ──────────────────────────

@router.get("/ads")
async def list_all_ads(
    payload: TokenPayload,
    db: DBSession,
    status: str | None = None,
    limit: int = 15,
    offset: int = 0,
):
    """Liste toutes les pubs de tous les blogs — super admin seulement."""
    await _require_super_admin(payload, db)

    from app.models.ad import Ad

    base = (
        select(
            Ad,
            Tenant.name.label("tenant_name"),
            Tenant.slug.label("tenant_slug"),
        )
        .join(Tenant, Tenant.id == Ad.tenant_id)
    )
    if status:
        base = base.where(Ad.submission_status == status)

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    result = await db.execute(base.order_by(Ad.created_at.desc()).limit(limit).offset(offset))
    rows = result.all()

    return {
        "items": [
            {
                "id": str(r.Ad.id),
                "tenant_id": str(r.Ad.tenant_id),
                "tenant_name": r.tenant_name,
                "tenant_slug": r.tenant_slug,
                "advertiser_name": r.Ad.advertiser_name,
                "advertiser_email": r.Ad.advertiser_email,
                "advertiser_company": r.Ad.advertiser_company,
                "title": r.Ad.title,
                "description": r.Ad.description,
                "click_url": r.Ad.click_url,
                "image_url": r.Ad.image_url,
                "placement": r.Ad.placement,
                "submission_status": r.Ad.submission_status.value,
                "campaign_status": r.Ad.campaign_status.value,
                "link_safety_status": r.Ad.link_safety_status.value,
                "total_budget": float(r.Ad.total_budget) if r.Ad.total_budget else None,
                "price_per_day": float(r.Ad.price_per_day) if r.Ad.price_per_day else None,
                "rejection_reason": r.Ad.rejection_reason,
                "impressions_count": r.Ad.impressions_count,
                "clicks_count": r.Ad.clicks_count,
                "starts_at": r.Ad.starts_at.isoformat() if r.Ad.starts_at else None,
                "ends_at": r.Ad.ends_at.isoformat() if r.Ad.ends_at else None,
                "created_at": r.Ad.created_at.isoformat(),
            }
            for r in rows
        ],
        "total": total,
    }


# ── Transactions / Paiements ──────────────────────────────────────

@router.get("/transactions")
async def list_all_transactions(
    payload: TokenPayload,
    db: DBSession,
    status: str | None = Query(None),
    tx_type: str | None = Query(None),
    limit: int = Query(15, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Liste toutes les transactions de la plateforme (super admin)."""
    await _require_super_admin(payload, db)

    from app.models.payment import Transaction

    base = (
        select(
            Transaction,
            Tenant.name.label("tenant_name"),
            Tenant.slug.label("tenant_slug"),
            User.email.label("user_email"),
            User.display_name.label("user_name"),
        )
        .join(Tenant, Tenant.id == Transaction.tenant_id)
        .outerjoin(User, User.id == Transaction.user_id)
    )
    if status:
        base = base.where(Transaction.status == status)
    if tx_type:
        base = base.where(Transaction.transaction_type == tx_type)

    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    result = await db.execute(base.order_by(Transaction.created_at.desc()).limit(limit).offset(offset))
    rows = result.all()

    # KPI aggregates
    totals = await db.execute(text("""
        SELECT
            COALESCE(SUM(amount) FILTER (WHERE status='completed'), 0) AS total_revenue,
            COALESCE(SUM(amount) FILTER (WHERE status='completed' AND created_at >= NOW() - INTERVAL '24 hours'), 0) AS rev_24h,
            COUNT(*) FILTER (WHERE status='pending') AS pending_count,
            COUNT(*) FILTER (WHERE status='failed')  AS failed_count
        FROM transactions
    """))
    kpi = totals.first()

    return {
        "kpi": {
            "total_revenue": float(kpi.total_revenue),
            "rev_24h": float(kpi.rev_24h),
            "pending": kpi.pending_count,
            "failed": kpi.failed_count,
        },
        "total": total,
        "transactions": [
            {
                "id": str(r.Transaction.id),
                "tenant_name": r.tenant_name,
                "tenant_slug": r.tenant_slug,
                "user_email": r.user_email,
                "user_name": r.user_name,
                "type": r.Transaction.transaction_type.value,
                "status": r.Transaction.status.value,
                "amount": float(r.Transaction.amount),
                "currency": r.Transaction.currency,
                "platform_fee": float(r.Transaction.platform_fee),
                "gateway": r.Transaction.payment_gateway.value,
                "nowpayments_order_id": r.Transaction.nowpayments_order_id,
                "created_at": r.Transaction.created_at.isoformat(),
            }
            for r in rows
        ],
    }


# ── Plans / Abonnements ───────────────────────────────────────────

PLAN_PRICES = {
    "free": 0, "starter": 5, "pro": 30, "business": 90, "enterprise": 500,
}

@router.get("/plans/stats")
async def plans_stats(payload: TokenPayload, db: DBSession):
    """Distribution des tenants par plan + MRR estimé."""
    await _require_super_admin(payload, db)

    by_plan = await db.execute(text("""
        SELECT plan, COUNT(*) AS count
        FROM tenants
        WHERE status != 'deleted'
        GROUP BY plan
        ORDER BY count DESC
    """))
    plan_rows = {r.plan: r.count for r in by_plan}

    plans = []
    total_mrr = 0
    for tier in PlanTier:
        count = plan_rows.get(tier.value, 0)
        mrr = count * PLAN_PRICES.get(tier.value, 0)
        total_mrr += mrr
        plans.append({
            "id": tier.value,
            "count": count,
            "mrr": mrr,
            "arpu": PLAN_PRICES.get(tier.value, 0),
        })

    total_tenants = sum(r["count"] for r in plans)
    paid_tenants  = sum(r["count"] for r in plans if r["id"] != "free")
    arpu = round(total_mrr / paid_tenants, 2) if paid_tenants else 0

    return {
        "plans": plans,
        "total_mrr": total_mrr,
        "total_tenants": total_tenants,
        "paid_tenants": paid_tenants,
        "arpu": arpu,
    }


# ── CRUD Plans (subscription_plans table) ────────────────────────

class PlanCreateBody(BaseModel):
    id: str
    name: str
    description: str = ""
    price_monthly: float = 0.0
    price_yearly: float = 0.0
    max_articles: int = 10
    max_storage_mb: int = 512
    max_members: int = 1
    max_ai_requests: int = 10
    max_custom_domains: int = 0
    features: list[str] = []
    is_active: bool = True
    sort_order: int = 0


class PlanUpdateBody(BaseModel):
    name: str | None = None
    description: str | None = None
    price_monthly: float | None = None
    price_yearly: float | None = None
    max_articles: int | None = None
    max_storage_mb: int | None = None
    max_members: int | None = None
    max_ai_requests: int | None = None
    max_custom_domains: int | None = None
    features: list[str] | None = None
    is_active: bool | None = None
    sort_order: int | None = None


@router.get("/plans/list")
async def list_plans(payload: TokenPayload, db: DBSession):
    """Liste tous les plans depuis subscription_plans."""
    await _require_super_admin(payload, db)

    rows = await db.execute(text("""
        SELECT id, name, description, price_monthly, price_yearly,
               max_articles, max_storage_mb, max_members, max_ai_requests,
               max_custom_domains, features, is_active, is_default, sort_order,
               created_at, updated_at
        FROM subscription_plans
        ORDER BY sort_order ASC, id ASC
    """))
    plans = rows.mappings().all()

    # Tenant counts per plan
    counts_q = await db.execute(text("""
        SELECT plan, COUNT(*) AS count
        FROM tenants WHERE status != 'deleted'
        GROUP BY plan
    """))
    counts = {r.plan: r.count for r in counts_q}

    return {
        "plans": [
            {
                "id": p["id"],
                "name": p["name"],
                "description": p["description"] or "",
                "price_monthly": float(p["price_monthly"]),
                "price_yearly": float(p["price_yearly"]),
                "max_articles": p["max_articles"],
                "max_storage_mb": p["max_storage_mb"],
                "max_members": p["max_members"],
                "max_ai_requests": p["max_ai_requests"],
                "max_custom_domains": p["max_custom_domains"],
                "features": p["features"] if p["features"] else [],
                "is_active": p["is_active"],
                "is_default": p["is_default"],
                "sort_order": p["sort_order"],
                "tenant_count": counts.get(p["id"], 0),
                "created_at": p["created_at"].isoformat() if p["created_at"] else None,
                "updated_at": p["updated_at"].isoformat() if p["updated_at"] else None,
            }
            for p in plans
        ]
    }


@router.post("/plans", status_code=201)
async def create_plan(body: PlanCreateBody, payload: TokenPayload, db: DBSession):
    """Créer un nouveau plan d'abonnement."""
    await _require_super_admin(payload, db)

    import json as _json
    existing = await db.execute(text("SELECT id FROM subscription_plans WHERE id = :id"), {"id": body.id})
    if existing.scalar_one_or_none():
        from fastapi import HTTPException as _HTTPEx
        raise _HTTPEx(status_code=400, detail=f"Un plan avec l'identifiant '{body.id}' existe déjà.")

    await db.execute(text("""
        INSERT INTO subscription_plans
            (id, name, description, price_monthly, price_yearly,
             max_articles, max_storage_mb, max_members, max_ai_requests,
             max_custom_domains, features, is_active, sort_order)
        VALUES
            (:id, :name, :description, :price_monthly, :price_yearly,
             :max_articles, :max_storage_mb, :max_members, :max_ai_requests,
             :max_custom_domains, CAST(:features AS JSONB), :is_active, :sort_order)
    """), {
        "id": body.id,
        "name": body.name,
        "description": body.description,
        "price_monthly": body.price_monthly,
        "price_yearly": body.price_yearly,
        "max_articles": body.max_articles,
        "max_storage_mb": body.max_storage_mb,
        "max_members": body.max_members,
        "max_ai_requests": body.max_ai_requests,
        "max_custom_domains": body.max_custom_domains,
        "features": _json.dumps(body.features),
        "is_active": body.is_active,
        "sort_order": body.sort_order,
    })
    await db.commit()
    return {"ok": True, "id": body.id}


@router.patch("/plans/{plan_id}")
async def update_plan(plan_id: str, body: PlanUpdateBody, payload: TokenPayload, db: DBSession):
    """Mettre à jour un plan d'abonnement."""
    await _require_super_admin(payload, db)

    import json as _json

    existing = await db.execute(text("SELECT id FROM subscription_plans WHERE id = :id"), {"id": plan_id})
    if not existing.scalar_one_or_none():
        raise NotFoundException("Plan")

    updates: list[str] = ["updated_at = NOW()"]
    params: dict[str, Any] = {"id": plan_id}

    if body.name is not None:
        updates.append("name = :name"); params["name"] = body.name
    if body.description is not None:
        updates.append("description = :description"); params["description"] = body.description
    if body.price_monthly is not None:
        updates.append("price_monthly = :price_monthly"); params["price_monthly"] = body.price_monthly
    if body.price_yearly is not None:
        updates.append("price_yearly = :price_yearly"); params["price_yearly"] = body.price_yearly
    if body.max_articles is not None:
        updates.append("max_articles = :max_articles"); params["max_articles"] = body.max_articles
    if body.max_storage_mb is not None:
        updates.append("max_storage_mb = :max_storage_mb"); params["max_storage_mb"] = body.max_storage_mb
    if body.max_members is not None:
        updates.append("max_members = :max_members"); params["max_members"] = body.max_members
    if body.max_ai_requests is not None:
        updates.append("max_ai_requests = :max_ai_requests"); params["max_ai_requests"] = body.max_ai_requests
    if body.max_custom_domains is not None:
        updates.append("max_custom_domains = :max_custom_domains"); params["max_custom_domains"] = body.max_custom_domains
    if body.features is not None:
        updates.append("features = CAST(:features AS JSONB)"); params["features"] = _json.dumps(body.features)
    if body.is_active is not None:
        updates.append("is_active = :is_active"); params["is_active"] = body.is_active
    if body.sort_order is not None:
        updates.append("sort_order = :sort_order"); params["sort_order"] = body.sort_order

    if len(updates) > 1:
        await db.execute(text(f"UPDATE subscription_plans SET {', '.join(updates)} WHERE id = :id"), params)
        await db.commit()

    return {"ok": True}


@router.delete("/plans/{plan_id}", status_code=204)
async def deactivate_plan(plan_id: str, payload: TokenPayload, db: DBSession):
    """Désactiver un plan (soft delete)."""
    await _require_super_admin(payload, db)

    existing = await db.execute(text("SELECT is_default FROM subscription_plans WHERE id = :id"), {"id": plan_id})
    row = existing.first()
    if not row:
        raise NotFoundException("Plan")
    if row.is_default:
        from fastapi import HTTPException as _HTTPEx
        raise _HTTPEx(status_code=400, detail="Impossible de désactiver un plan par défaut.")

    await db.execute(text("UPDATE subscription_plans SET is_active = false, updated_at = NOW() WHERE id = :id"), {"id": plan_id})
    await db.commit()


# ── CRUD Pages CMS plateforme (platform_pages table) ──────────────

class PlatformPageUpdateBody(BaseModel):
    content: dict


@router.get("/platform-pages")
async def list_platform_pages(payload: TokenPayload, db: DBSession):
    """Liste les pages CMS plateforme (pilote : home, about, contact)."""
    await _require_super_admin(payload, db)
    rows = await db.execute(text(
        "SELECT slug, updated_at FROM platform_pages ORDER BY slug ASC"
    ))
    return {
        "pages": [
            {"slug": r.slug, "updated_at": r.updated_at.isoformat() if r.updated_at else None}
            for r in rows
        ]
    }


@router.get("/platform-pages/{slug}")
async def get_platform_page_admin(slug: str, payload: TokenPayload, db: DBSession):
    """Contenu source EN complet d'une page CMS, pour préremplir le formulaire."""
    await _require_super_admin(payload, db)
    row = (await db.execute(
        text("SELECT content, updated_at FROM platform_pages WHERE slug = :slug"),
        {"slug": slug},
    )).fetchone()
    if not row:
        raise NotFoundException("Page")
    return {"slug": slug, "content": row.content, "updated_at": row.updated_at.isoformat() if row.updated_at else None}


@router.put("/platform-pages/{slug}")
async def update_platform_page(
    slug: str,
    body: PlatformPageUpdateBody,
    payload: TokenPayload,
    db: DBSession,
    force_retranslate: bool = Query(default=False),
):
    """Remplace le contenu source EN d'une page CMS. Les traductions existantes
    deviennent périmées automatiquement (comparaison de hash) et seront
    régénérées à la prochaine visite publique dans cette langue — sauf si
    force_retranslate=true, qui les supprime immédiatement pour forcer une
    régénération synchrone au prochain fetch."""
    import hashlib
    import json as _json

    admin = await _require_super_admin(payload, db)

    existing = (await db.execute(
        text("SELECT id FROM platform_pages WHERE slug = :slug"), {"slug": slug}
    )).fetchone()
    if not existing:
        raise NotFoundException("Page")

    content_hash = hashlib.sha256(_json.dumps(body.content, sort_keys=True).encode()).hexdigest()

    await db.execute(text("""
        UPDATE platform_pages
        SET content = CAST(:content AS JSONB), content_hash = :hash,
            updated_by = :updated_by, updated_at = NOW()
        WHERE slug = :slug
    """), {
        "content": _json.dumps(body.content),
        "hash": content_hash,
        "updated_by": str(admin.id),
        "slug": slug,
    })

    if force_retranslate:
        await db.execute(
            text("DELETE FROM platform_page_translations WHERE page_id = :pid"),
            {"pid": existing.id},
        )

    await db.commit()
    return {"ok": True, "content_hash": content_hash}


class PlatformPageAiGenerateBody(BaseModel):
    answers: dict[str, str]
    language: str = "en"


@router.post("/platform-pages/{slug}/ai-generate")
async def ai_generate_platform_page(
    slug: str,
    body: PlatformPageAiGenerateBody,
    payload: TokenPayload,
    db: DBSession,
):
    """Génère un brouillon de texte pour une page CMS via l'IA, à partir de
    quelques réponses du super admin — ne sauvegarde rien, la page continue
    de passer par le PUT existant une fois relue/ajustée."""
    from app.services.ai_service import generate_platform_page_content

    await _require_super_admin(payload, db)

    row = (await db.execute(
        text("SELECT content FROM platform_pages WHERE slug = :slug"), {"slug": slug}
    )).fetchone()
    if not row:
        raise NotFoundException("Page")

    generated = await generate_platform_page_content(row.content, body.answers, body.language)
    return generated


# ── Médias CMS plateforme (platform_media table) ───────────────────
# Indépendant des tenants clients : les images des pages home/about/...
# n'appartiennent à aucun blog, donc pas de tenant_id ni de FK vers tenants.

class PlatformMediaResponse(BaseModel):
    id: str
    cloudinary_secure_url: str
    media_type: str
    original_filename: str | None
    created_at: str


def _platform_media_to_response(m: PlatformMedia) -> PlatformMediaResponse:
    return PlatformMediaResponse(
        id=str(m.id),
        cloudinary_secure_url=m.cloudinary_secure_url,
        media_type=m.media_type.value,
        original_filename=m.original_filename,
        created_at=m.created_at.isoformat(),
    )


@router.post("/media/upload", response_model=PlatformMediaResponse, status_code=201)
async def upload_platform_media(payload: TokenPayload, db: DBSession, file: UploadFile = File(...)):
    from app.services.cloudinary_service import upload_file

    admin = await _require_super_admin(payload, db)
    result = await upload_file(file, "platform")

    media = PlatformMedia(
        uploaded_by=admin.id,
        cloudinary_public_id=result["public_id"],
        cloudinary_url=result["url"],
        cloudinary_secure_url=result["secure_url"],
        cloudinary_resource_type=result["resource_type"],
        media_type=result["media_type"],
        original_filename=result["original_filename"],
        file_size_bytes=result["file_size_bytes"],
        width=result["width"],
        height=result["height"],
        duration_seconds=result["duration_seconds"],
        format=result["format"],
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)
    return _platform_media_to_response(media)


@router.get("/media", response_model=list[PlatformMediaResponse])
async def list_platform_media(payload: TokenPayload, db: DBSession, limit: int = Query(default=60, le=200)):
    await _require_super_admin(payload, db)
    rows = (await db.execute(
        select(PlatformMedia).order_by(PlatformMedia.created_at.desc()).limit(limit)
    )).scalars().all()
    return [_platform_media_to_response(m) for m in rows]


# ── Santé système ─────────────────────────────────────────────────

_server_start = time.time()

@router.get("/system")
async def system_health(payload: TokenPayload, db: DBSession):
    """Métriques système et santé de la plateforme."""
    await _require_super_admin(payload, db)

    # Real DB stats
    db_stats = await db.execute(text("""
        SELECT
            (SELECT COUNT(*) FROM tenants)    AS tenants,
            (SELECT COUNT(*) FROM users)      AS users,
            (SELECT COUNT(*) FROM articles)   AS articles,
            (SELECT COUNT(*) FROM media)      AS media,
            pg_size_pretty(pg_database_size(current_database())) AS db_size,
            pg_database_size(current_database()) AS db_size_bytes
    """))
    stats = db_stats.first()

    uptime_seconds = int(time.time() - _server_start)
    hours, rem = divmod(uptime_seconds, 3600)
    minutes = rem // 60

    return {
        "uptime": {"hours": hours, "minutes": minutes, "seconds": uptime_seconds},
        "database": {
            "size": stats.db_size,
            "size_bytes": stats.db_size_bytes,
            "tenants": stats.tenants,
            "users": stats.users,
            "articles": stats.articles,
            "media": stats.media,
        },
        "services": [
            {"name": "API Server",      "status": "operational", "latency_ms": None},
            {"name": "Database",        "status": "operational", "latency_ms": None},
            {"name": "Workers (ARQ)",   "status": "operational", "latency_ms": None},
            {"name": "Redis",           "status": "operational", "latency_ms": None},
            {"name": "Email (SendGrid)","status": "operational", "latency_ms": None},
            {"name": "Storage (CDN)",   "status": "operational", "latency_ms": None},
        ],
        "env": os.getenv("APP_ENV", "development"),
    }


# ── Logs d'activité ───────────────────────────────────────────────

@router.get("/logs")
async def activity_logs(
    payload: TokenPayload,
    db: DBSession,
    level: str | None = Query(None),
    limit: int = Query(15, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Journal d'activité réel depuis activity_logs + données historiques."""
    await _require_super_admin(payload, db)

    where = "WHERE 1=1"
    params: dict = {"limit": limit, "offset": offset}
    if level:
        where += " AND level = :level"
        params["level"] = level

    rows = (await db.execute(text(f"""
        SELECT id, ts, level, action, actor_email, target_type, target_id, details, ip
        FROM activity_logs
        {where}
        ORDER BY ts DESC
        LIMIT :limit OFFSET :offset
    """), params)).mappings().all()

    total_row = (await db.execute(text(f"""
        SELECT COUNT(*) FROM activity_logs {where}
    """), {k: v for k, v in params.items() if k not in ("limit", "offset")})).scalar()

    logs = [
        {
            "ts":     r["ts"].isoformat() if r["ts"] else None,
            "level":  r["level"],
            "action": r["action"],
            "actor":  r["actor_email"] or "—",
            "details": (
                (f"[{r['target_type']}:{r['target_id']}] " if r["target_type"] else "") +
                (r["details"] or "") +
                (f" — IP {r['ip']}" if r["ip"] else "")
            ).strip() or "—",
        }
        for r in rows
    ]

    return {"logs": logs, "total": total_row or 0}


# ── Surveillance en temps réel ────────────────────────────────────

@router.get("/surveillance")
async def surveillance_dashboard(payload: TokenPayload, db: DBSession):
    """Real-time surveillance dashboard: active users, recent events, platform stats."""
    from datetime import timedelta
    await _require_super_admin(payload, db)

    fifteen_min_ago = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=15)

    # Users seen in the last 15 minutes
    online_q = await db.execute(text("""
        SELECT email, display_name, last_login_at, last_login_ip, plan
        FROM users
        WHERE last_login_at > :cutoff
        ORDER BY last_login_at DESC
        LIMIT 30
    """), {"cutoff": fifteen_min_ago})
    online_users = [
        {
            "email": r.email,
            "display_name": r.display_name,
            "last_seen": r.last_login_at.isoformat(),
            "ip": r.last_login_ip or "—",
            "plan": r.plan,
        }
        for r in online_q
    ]

    # Recent events (last 24 hours, all types)
    events: list[dict] = []

    logins_q = await db.execute(text("""
        SELECT email, display_name, last_login_at, last_login_ip
        FROM users
        WHERE last_login_at > NOW() - INTERVAL '24 hours'
        ORDER BY last_login_at DESC
        LIMIT 40
    """))
    for r in logins_q:
        events.append({
            "ts": r.last_login_at.isoformat(),
            "type": "login",
            "level": "info",
            "actor": r.email,
            "details": f"IP {r.last_login_ip or '—'}",
        })

    registrations_q = await db.execute(text("""
        SELECT email, display_name, created_at
        FROM users
        WHERE created_at > NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 20
    """))
    for r in registrations_q:
        events.append({
            "ts": r.created_at.isoformat(),
            "type": "registration",
            "level": "success",
            "actor": r.email,
            "details": "New account created",
        })

    payments_q = await db.execute(text("""
        SELECT t.status, t.amount, t.currency, t.transaction_type, t.created_at, u.email
        FROM transactions t
        LEFT JOIN users u ON u.id = t.user_id
        WHERE t.created_at > NOW() - INTERVAL '24 hours'
        ORDER BY t.created_at DESC
        LIMIT 20
    """))
    for r in payments_q:
        events.append({
            "ts": r.created_at.isoformat(),
            "type": "payment",
            "level": "success" if r.status == "completed" else "info",
            "actor": r.email or "—",
            "details": f"{r.transaction_type} · {r.amount} {r.currency}",
        })

    articles_q = await db.execute(text("""
        SELECT a.title, a.published_at, u.email, tn.slug AS tenant_slug
        FROM articles a
        LEFT JOIN users u ON u.id = a.author_id
        LEFT JOIN tenants tn ON tn.id = a.tenant_id
        WHERE a.status = 'published' AND a.published_at > NOW() - INTERVAL '24 hours'
        ORDER BY a.published_at DESC
        LIMIT 20
    """))
    for r in articles_q:
        if r.published_at:
            events.append({
                "ts": r.published_at.isoformat(),
                "type": "article",
                "level": "info",
                "actor": r.email or "—",
                "details": f"Published: {r.title[:60]}",
            })

    events.sort(key=lambda e: e["ts"], reverse=True)

    # Platform stats
    total_users = (await db.execute(text("SELECT COUNT(*) FROM users"))).scalar_one()
    users_today = (await db.execute(text("SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE"))).scalar_one()
    logins_today = (await db.execute(text("SELECT COUNT(*) FROM users WHERE last_login_at >= CURRENT_DATE"))).scalar_one()
    revenue_today = (await db.execute(text(
        "SELECT COALESCE(SUM(amount),0) FROM transactions WHERE status='completed' AND created_at >= CURRENT_DATE"
    ))).scalar_one()

    return {
        "online_users": online_users,
        "online_count": len(online_users),
        "events": events[:100],
        "stats": {
            "total_users": int(total_users),
            "users_today": int(users_today),
            "logins_today": int(logins_today),
            "revenue_today": float(revenue_today),
        },
    }


# ── Médias globaux ────────────────────────────────────────────────

@router.get("/media")
async def list_all_media(
    payload: TokenPayload,
    db: DBSession,
    media_type: str | None = Query(None),
    limit: int = Query(15, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Liste tous les médias de la plateforme (super admin)."""
    await _require_super_admin(payload, db)

    from app.models.media import Media

    base = (
        select(
            Media,
            Tenant.name.label("tenant_name"),
            Tenant.slug.label("tenant_slug"),
            User.email.label("uploader_email"),
        )
        .join(Tenant, Tenant.id == Media.tenant_id)
        .outerjoin(User, User.id == Media.uploaded_by)
    )
    if media_type:
        base = base.where(Media.media_type == media_type)

    filtered_total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar_one()
    result = await db.execute(base.order_by(Media.created_at.desc()).limit(limit).offset(offset))
    rows = result.all()

    total_size = await db.execute(text("SELECT COALESCE(SUM(file_size_bytes),0) FROM media"))
    total_count = await db.execute(text("SELECT COUNT(*) FROM media"))

    return {
        "stats": {
            "total": total_count.scalar_one(),
            "total_size_bytes": int(total_size.scalar_one()),
        },
        "total": filtered_total,
        "media": [
            {
                "id": str(r.Media.id),
                "tenant_name": r.tenant_name,
                "tenant_slug": r.tenant_slug,
                "uploader_email": r.uploader_email,
                "type": r.Media.media_type.value,
                "url": r.Media.cloudinary_secure_url,
                "filename": r.Media.original_filename,
                "size_bytes": r.Media.file_size_bytes,
                "width": r.Media.width,
                "height": r.Media.height,
                "created_at": r.Media.created_at.isoformat(),
            }
            for r in rows
        ],
    }


# ── Rôles plateforme ──────────────────────────────────────────────

@router.get("/roles")
async def list_roles(payload: TokenPayload, db: DBSession):
    """Liste des rôles de la plateforme avec statistiques."""
    await _require_super_admin(payload, db)

    role_counts = await db.execute(text("""
        SELECT role, COUNT(*) AS count
        FROM tenant_users
        GROUP BY role
    """))
    counts = {r.role: r.count for r in role_counts}

    roles = [
        {
            "id": role.value,
            "label": role.value.replace("_", " ").title(),
            "description": {
                UserRole.TENANT_ADMIN: "Full access to blog administration",
                UserRole.EDITOR: "Can publish and manage all content",
                UserRole.AUTHOR: "Can create and edit own content",
                UserRole.VIEWER: "Read-only access",
            }.get(role, ""),
            "user_count": counts.get(role.value, 0),
        }
        for role in UserRole
    ]

    super_admins = await db.execute(text("SELECT COUNT(*) FROM users WHERE is_super_admin = true"))

    return {
        "roles": roles,
        "super_admins": super_admins.scalar_one(),
    }


# ── Paramètres plateforme ─────────────────────────────────────────

@router.get("/settings")
async def get_platform_settings(payload: TokenPayload, db: DBSession):
    """Retourne la configuration de la plateforme."""
    await _require_super_admin(payload, db)

    from app.core.config import settings as cfg
    from app.core.redis_client import redis
    import json

    overrides: dict = {}
    try:
        raw = await redis.get("platform:settings")
        if raw:
            overrides = json.loads(raw)
    except Exception:
        pass

    return {
        "general": {
            "platform_name": overrides.get("platform_name", "SmarterBloggers"),
            "support_email": overrides.get("support_email", cfg.SENDGRID_FROM_EMAIL if hasattr(cfg, "SENDGRID_FROM_EMAIL") else ""),
            "max_blogs_per_user": overrides.get("max_blogs_per_user", 10),
            "maintenance_mode": overrides.get("maintenance_mode", False),
            "registrations_open": overrides.get("registrations_open", True),
        },
        "nowpayments": {
            "configured": bool(getattr(cfg, "NOWPAYMENTS_API_KEY", "")),
            "sandbox": bool(getattr(cfg, "NOWPAYMENTS_SANDBOX", True)),
            "platform_fee_percent": getattr(cfg, "NOWPAYMENTS_PLATFORM_FEE_PERCENT", 20),
        },
        "cloudinary": {
            "configured": bool(cfg.CLOUDINARY_CLOUD_NAME),
            "cloud_name": cfg.CLOUDINARY_CLOUD_NAME or "",
        },
        "ai": {
            "configured": bool(getattr(cfg, "OPENAI_API_KEY", "")),
            "model": overrides.get("ai_model", "gpt-4o-mini"),
        },
        "env": cfg.APP_ENV,
    }


@router.patch("/settings")
async def update_platform_settings(
    payload: TokenPayload,
    db: DBSession,
    body: dict[str, Any],
):
    """Met à jour les paramètres de la plateforme (stocké dans Redis)."""
    await _require_super_admin(payload, db)

    from app.core.redis_client import redis
    import json

    allowed_keys = {
        "platform_name", "support_email", "max_blogs_per_user",
        "maintenance_mode", "registrations_open", "ai_model",
    }

    try:
        raw = await redis.get("platform:settings")
        current: dict = json.loads(raw) if raw else {}
    except Exception:
        current = {}

    for key, value in body.items():
        if key in allowed_keys:
            current[key] = value

    try:
        await redis.set("platform:settings", json.dumps(current))
    except Exception:
        pass

    return {"ok": True, "settings": current}


# ── Support tickets ───────────────────────────────────────────────

from app.models.support_ticket import SupportTicket, SupportMessage, TicketStatus, TicketPriority
from app.services.ai_service import translate_text
from app.services.push_service import send_push_to_user
import asyncio as _asyncio
from fastapi import UploadFile, File as FastAPIFile


@router.post("/support/upload")
async def upload_admin_support_file(
    payload: TokenPayload,
    db: DBSession,
    file: UploadFile = FastAPIFile(...),
):
    await _require_super_admin(payload, db)
    from app.services.cloudinary_service import upload_file as cld_upload
    result = await cld_upload(file, "superadmin", folder_prefix="smarterbloggers/support")
    return {
        "url": result["secure_url"],
        "name": result["original_filename"],
        "type": file.content_type,
    }


@router.get("/support/tickets")
async def list_support_tickets(
    payload: TokenPayload,
    db: DBSession,
    status: str | None = Query(None),
    tenant_id: str | None = Query(None),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    await _require_super_admin(payload, db)

    q = select(SupportTicket)
    if status:
        q = q.where(SupportTicket.status == status)
    if tenant_id:
        q = q.where(SupportTicket.tenant_id == uuid.UUID(tenant_id))
    q = q.order_by(SupportTicket.updated_at.desc()).limit(limit).offset(offset)

    result = await db.execute(q)
    tickets = result.scalars().all()

    total_q = select(func.count()).select_from(SupportTicket)
    if status:
        total_q = total_q.where(SupportTicket.status == status)
    total_r = await db.execute(total_q)
    total = total_r.scalar() or 0

    # Enrich with tenant name + opener email
    enriched = []
    for t in tickets:
        tenant_r = await db.execute(select(Tenant).where(Tenant.id == t.tenant_id))
        tenant_obj = tenant_r.scalar_one_or_none()
        opener_r = await db.execute(select(User).where(User.id == t.opened_by)) if t.opened_by else None
        opener = opener_r.scalar_one_or_none() if opener_r else None

        # Last message
        last_msg_r = await db.execute(
            select(SupportMessage).where(SupportMessage.ticket_id == t.id)
            .order_by(SupportMessage.created_at.desc()).limit(1)
        )
        last_msg = last_msg_r.scalar_one_or_none()

        enriched.append({
            "id": str(t.id),
            "subject": t.subject,
            "status": t.status.value,
            "priority": t.priority.value,
            "tenant_id": str(t.tenant_id),
            "tenant_name": tenant_obj.name if tenant_obj else None,
            "tenant_slug": tenant_obj.slug if tenant_obj else None,
            "tenant_language": t.tenant_language,
            "opener_email": opener.email if opener else None,
            "opener_name": opener.display_name if opener else None,
            "last_message": last_msg.body_translated if last_msg else None,
            "last_message_from_admin": last_msg.is_from_admin if last_msg else False,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        })

    return {"tickets": enriched, "total": total}


@router.get("/support/tickets/{ticket_id}")
async def get_support_ticket(ticket_id: str, payload: TokenPayload, db: DBSession):
    await _require_super_admin(payload, db)
    tkid = uuid.UUID(ticket_id)

    t_r = await db.execute(select(SupportTicket).where(SupportTicket.id == tkid))
    ticket = t_r.scalar_one_or_none()
    if not ticket:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Ticket introuvable.")

    msgs_r = await db.execute(
        select(SupportMessage).where(SupportMessage.ticket_id == tkid)
        .order_by(SupportMessage.created_at.asc())
    )
    messages = msgs_r.scalars().all()

    tenant_r = await db.execute(select(Tenant).where(Tenant.id == ticket.tenant_id))
    tenant_obj = tenant_r.scalar_one_or_none()
    opener_r = await db.execute(select(User).where(User.id == ticket.opened_by)) if ticket.opened_by else None
    opener = opener_r.scalar_one_or_none() if opener_r else None

    msg_list = []
    for m in messages:
        sender_r = await db.execute(select(User).where(User.id == m.sender_id)) if m.sender_id else None
        sender = sender_r.scalar_one_or_none() if sender_r else None
        msg_list.append({
            "id": str(m.id),
            "is_from_admin": m.is_from_admin,
            "body_original": m.body_original,
            "body_translated": m.body_translated,
            "file_url": m.file_url,
            "file_name": m.file_name,
            "file_type": m.file_type,
            "sender_name": sender.display_name if sender else ("Admin" if m.is_from_admin else "Tenant"),
            "created_at": m.created_at.isoformat() if m.created_at else None,
        })

    return {
        "ticket": {
            "id": str(ticket.id),
            "subject": ticket.subject,
            "status": ticket.status.value,
            "priority": ticket.priority.value,
            "tenant_id": str(ticket.tenant_id),
            "tenant_name": tenant_obj.name if tenant_obj else None,
            "tenant_language": ticket.tenant_language,
            "opener_email": opener.email if opener else None,
            "created_at": ticket.created_at.isoformat() if ticket.created_at else None,
            "updated_at": ticket.updated_at.isoformat() if ticket.updated_at else None,
            "resolved_at": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        },
        "messages": msg_list,
    }


class AdminReplyBody(BaseModel):
    body: str = ""
    file_url: str | None = None
    file_name: str | None = None
    file_type: str | None = None


@router.post("/support/tickets/{ticket_id}/messages", status_code=201)
async def admin_reply(ticket_id: str, body: AdminReplyBody, payload: TokenPayload, db: DBSession):
    from app.core.exceptions import ValidationException
    if not body.body.strip() and not body.file_url:
        raise ValidationException("Un message ou un fichier est requis.")

    admin = await _require_super_admin(payload, db)
    tkid = uuid.UUID(ticket_id)

    t_r = await db.execute(select(SupportTicket).where(SupportTicket.id == tkid))
    ticket = t_r.scalar_one_or_none()
    if not ticket:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Ticket introuvable.")

    text_body = body.body.strip()
    target_lang = ticket.tenant_language or "fr"
    translated = await translate_text(text_body, target_lang) if text_body else ""

    msg = SupportMessage(
        ticket_id=tkid,
        sender_id=admin.id,
        is_from_admin=True,
        body_original=text_body,
        body_translated=translated,
        file_url=body.file_url,
        file_name=body.file_name,
        file_type=body.file_type,
    )
    db.add(msg)
    if ticket.status == TicketStatus.closed:
        ticket.status = TicketStatus.in_progress
    ticket.updated_at = datetime.now(timezone.utc)
    await db.commit()

    # Push all users of the tenant
    try:
        tu_r = await db.execute(
            select(TenantUser).where(TenantUser.tenant_id == ticket.tenant_id)
        )
        tenant_users = tu_r.scalars().all()
        push_body = text_body[:120] if text_body else f"📎 {body.file_name or 'File'}"
        tasks = [
            send_push_to_user(db, tu.user_id, "📩 Réponse du support", push_body,
                              f"/blogs/{ticket.tenant_id}/support/{ticket_id}")
            for tu in tenant_users
        ]
        await _asyncio.gather(*tasks, return_exceptions=True)
    except Exception:
        pass

    return {
        "id": str(msg.id),
        "is_from_admin": msg.is_from_admin,
        "body_original": msg.body_original,
        "body_translated": msg.body_translated,
        "file_url": msg.file_url,
        "file_name": msg.file_name,
        "file_type": msg.file_type,
        "sender_name": admin.display_name,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


class UpdateTicketBody(BaseModel):
    status: str | None = None
    priority: str | None = None


@router.patch("/support/tickets/{ticket_id}")
async def update_ticket_status(ticket_id: str, body: UpdateTicketBody, payload: TokenPayload, db: DBSession):
    await _require_super_admin(payload, db)
    tkid = uuid.UUID(ticket_id)

    t_r = await db.execute(select(SupportTicket).where(SupportTicket.id == tkid))
    ticket = t_r.scalar_one_or_none()
    if not ticket:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Ticket introuvable.")

    if body.status:
        try:
            ticket.status = TicketStatus(body.status)
            if body.status in ("resolved", "closed"):
                ticket.resolved_at = datetime.now(timezone.utc)
        except ValueError:
            pass
    if body.priority:
        try:
            ticket.priority = TicketPriority(body.priority)
        except ValueError:
            pass

    ticket.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return {"ok": True, "status": ticket.status.value, "priority": ticket.priority.value}


# ── Template Categories ───────────────────────────────────────────

class CategoryCreateBody(BaseModel):
    name: str
    slug: str
    description: str = ""
    sort_order: int = 0


@router.get("/template-categories")
async def list_template_categories(payload: TokenPayload, db: DBSession):
    await _require_super_admin(payload, db)
    rows = await db.execute(text("""
        SELECT btc.id, btc.name, btc.slug, btc.description, btc.is_active, btc.sort_order,
               COUNT(bt.id) AS template_count
        FROM blog_template_categories btc
        LEFT JOIN blog_templates bt ON bt.category_id = btc.id
        GROUP BY btc.id
        ORDER BY btc.sort_order ASC, btc.name ASC
    """))
    categories = [
        {
            "id": str(r.id), "name": r.name, "slug": r.slug,
            "description": r.description, "is_active": r.is_active,
            "sort_order": r.sort_order, "template_count": r.template_count or 0,
        }
        for r in rows
    ]
    return {"categories": categories, "total": len(categories)}


@router.post("/template-categories", status_code=201)
async def create_template_category(body: CategoryCreateBody, payload: TokenPayload, db: DBSession):
    await _require_super_admin(payload, db)
    existing = await db.execute(text("SELECT id FROM blog_template_categories WHERE slug = :slug"), {"slug": body.slug})
    if existing.scalar_one_or_none():
        from fastapi import HTTPException as _HTTPEx
        raise _HTTPEx(status_code=400, detail=f"Une catégorie avec le slug '{body.slug}' existe déjà.")
    result = await db.execute(text("""
        INSERT INTO blog_template_categories (name, slug, description, sort_order)
        VALUES (:name, :slug, :description, :sort_order)
        RETURNING id
    """), {"name": body.name, "slug": body.slug, "description": body.description, "sort_order": body.sort_order})
    new_id = result.scalar_one()
    await db.commit()
    return {"ok": True, "id": str(new_id)}


@router.patch("/template-categories/{category_id}/toggle")
async def toggle_template_category(category_id: str, payload: TokenPayload, db: DBSession):
    await _require_super_admin(payload, db)
    await db.execute(text("""
        UPDATE blog_template_categories SET is_active = NOT is_active WHERE id = :id
    """), {"id": category_id})
    await db.commit()
    return {"ok": True}


# ── Blog Templates ────────────────────────────────────────────────
# Built-in themes: defined in code (ThemeRenderer.tsx).
# Custom templates: uploaded by superadmin as ZIP → stored in blog_templates.
# The DB only stores is_active/is_featured overrides for built-in themes
# (matched by theme column = theme id), and full rows for custom ones.

import zipfile
import io
import json as _json
import base64 as _b64

from fastapi import UploadFile, File, HTTPException as _FastHTTPEx

BUILT_IN_THEMES = [
    {"id": "editorial", "name": "Editorial", "description": "Clean · Serif · Timeless — style Medium / The Atlantic", "accent": "#18181b"},
    {"id": "magazine",  "name": "Magazine",  "description": "Bold · Dense · Dynamic — style The Verge / Wired",       "accent": "#e11d48"},
    {"id": "creative",  "name": "Creative",  "description": "Dark · Visual · Immersive — style Cargo Collective",      "accent": "#7c3aed"},
    {"id": "luminary",  "name": "Luminary",  "description": "Prestige · Serif · Literary — style The New Yorker",      "accent": "#b8960c"},
    {"id": "corporate", "name": "Corporate", "description": "Professional · Clean · Business",                         "accent": "#1d4ed8"},
]
BUILT_IN_IDS = [t["id"] for t in BUILT_IN_THEMES]


@router.get("/templates")
async def list_templates(payload: TokenPayload, db: DBSession):
    await _require_super_admin(payload, db)

    # Status overrides for built-in themes
    rows_bi = await db.execute(text("""
        SELECT theme, is_active, is_featured
        FROM blog_templates
        WHERE theme = ANY(:ids)
    """), {"ids": BUILT_IN_IDS})
    bi_status = {r.theme: {"is_active": r.is_active, "is_featured": r.is_featured} for r in rows_bi}

    built_in = [
        {
            "id": t["id"],
            "name": t["name"],
            "description": t["description"],
            "accent": t["accent"],
            "theme": t["id"],
            "is_builtin": True,
            "is_active":   bi_status.get(t["id"], {}).get("is_active",   True),
            "is_featured": bi_status.get(t["id"], {}).get("is_featured", False),
            "thumbnail_url": None,
            "created_at": None,
        }
        for t in BUILT_IN_THEMES
    ]

    # Custom uploaded templates (rows whose theme column is NOT a built-in id)
    rows_custom = await db.execute(text("""
        SELECT id, name, description, theme, thumbnail_url,
               is_active, is_featured, sort_order, created_at
        FROM blog_templates
        WHERE NOT (theme = ANY(:ids))
        ORDER BY sort_order ASC, created_at DESC
    """), {"ids": BUILT_IN_IDS})
    custom = [
        {
            "id": str(r.id),
            "name": r.name,
            "description": r.description,
            "accent": None,
            "theme": r.theme,
            "is_builtin": False,
            "is_active": r.is_active,
            "is_featured": r.is_featured,
            "thumbnail_url": r.thumbnail_url,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows_custom
    ]

    templates = built_in + custom
    return {"templates": templates, "total": len(templates)}


@router.patch("/templates/{template_id}/toggle")
async def toggle_template(template_id: str, payload: TokenPayload, db: DBSession):
    await _require_super_admin(payload, db)

    if template_id in BUILT_IN_IDS:
        existing = (await db.execute(
            text("SELECT is_active FROM blog_templates WHERE theme = :theme"), {"theme": template_id}
        )).fetchone()
        if existing:
            await db.execute(text("""
                UPDATE blog_templates SET is_active = NOT is_active, updated_at = NOW()
                WHERE theme = :theme
            """), {"theme": template_id})
        else:
            name = next(t["name"] for t in BUILT_IN_THEMES if t["id"] == template_id)
            sort_order = BUILT_IN_IDS.index(template_id)
            await db.execute(text("""
                INSERT INTO blog_templates (name, theme, is_active, is_featured, sort_order)
                VALUES (:name, :theme, FALSE, FALSE, :sort_order)
            """), {"name": name, "theme": template_id, "sort_order": sort_order})
    else:
        # Custom template — toggle by UUID
        await db.execute(text("""
            UPDATE blog_templates SET is_active = NOT is_active, updated_at = NOW()
            WHERE id = :id
        """), {"id": template_id})

    await db.commit()
    return {"ok": True}


@router.post("/templates/upload", status_code=201)
async def upload_template(
    payload: TokenPayload,
    db: DBSession,
    file: UploadFile = File(...),
):
    await _require_super_admin(payload, db)

    if not (file.filename or "").endswith(".zip"):
        raise _FastHTTPEx(status_code=400, detail="Le fichier doit être un ZIP (.zip)")

    content = await file.read()
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            names = zf.namelist()
            if "template.json" not in names:
                raise _FastHTTPEx(status_code=400, detail="Le ZIP doit contenir un fichier template.json à la racine")

            meta = _json.loads(zf.read("template.json"))
            name        = str(meta.get("name", "Custom Template"))[:200]
            description = str(meta.get("description", ""))
            theme_base  = str(meta.get("theme_base", "editorial"))
            config      = meta.get("config", {})
            is_featured = bool(meta.get("is_featured", False))

            if theme_base not in BUILT_IN_IDS:
                raise _FastHTTPEx(status_code=400, detail=f"theme_base doit être l'un de : {', '.join(BUILT_IN_IDS)}")

            # Optional preview image → stored as data URL in thumbnail_url
            thumbnail_url: str | None = None
            for img_name in ["preview.png", "preview.jpg", "preview.jpeg", "thumbnail.png", "thumbnail.jpg"]:
                if img_name in names:
                    img_bytes = zf.read(img_name)
                    ext = img_name.rsplit(".", 1)[1].lower()
                    mime = "image/jpeg" if ext in ("jpg", "jpeg") else "image/png"
                    thumbnail_url = f"data:{mime};base64,{_b64.b64encode(img_bytes).decode()}"
                    break

    except zipfile.BadZipFile:
        raise _FastHTTPEx(status_code=400, detail="Fichier ZIP corrompu ou invalide")

    result = await db.execute(text("""
        INSERT INTO blog_templates (name, description, theme, thumbnail_url, config, is_featured, sort_order)
        VALUES (:name, :description, :theme, :thumbnail_url, CAST(:config AS JSONB), :is_featured, 100)
        RETURNING id
    """), {
        "name": name, "description": description, "theme": theme_base,
        "thumbnail_url": thumbnail_url,
        "config": _json.dumps(config),
        "is_featured": is_featured,
    })
    new_id = result.scalar_one()
    await db.commit()
    return {"ok": True, "id": str(new_id), "name": name}


# ── Notifications plateforme ──────────────────────────────────────

@router.get("/notifications")
async def list_platform_notifications(payload: TokenPayload, db: DBSession):
    await _require_super_admin(payload, db)
    rows = (await db.execute(
        text(
            "SELECT id, title, message, audience, sent_count, sent_at "
            "FROM platform_notifications ORDER BY sent_at DESC LIMIT 50"
        )
    )).mappings().all()
    notifications = [
        {
            "id": str(r["id"]),
            "title": r["title"],
            "message": r["message"],
            "audience": r["audience"],
            "sent_count": r["sent_count"],
            "sent_at": r["sent_at"].isoformat() if r["sent_at"] else None,
        }
        for r in rows
    ]
    return {"notifications": notifications, "total": len(notifications)}


@router.post("/notifications")
async def send_platform_notification(
    payload: TokenPayload,
    db: DBSession,
    body: dict[str, Any],
):
    admin = await _require_super_admin(payload, db)

    title    = str(body.get("title", "")).strip()
    message  = str(body.get("message", "")).strip()
    audience = str(body.get("audience", "all"))

    if not title or not message:
        return {"ok": False, "message": "title and message are required."}

    # Build user query based on audience — TENANT_ADMIN users only
    q = (
        select(User.id, User.email, User.display_name)
        .join(TenantUser, TenantUser.user_id == User.id)
        .join(Tenant, Tenant.id == TenantUser.tenant_id)
        .where(TenantUser.role == UserRole.TENANT_ADMIN)
        .where(Tenant.status == TenantStatus.ACTIVE)
        .distinct()
    )

    if audience == "paid":
        from app.models.payment import TenantSubscription
        from app.models.enums import SubscriptionStatus
        q = q.join(TenantSubscription, TenantSubscription.tenant_id == Tenant.id).where(
            TenantSubscription.status == SubscriptionStatus.ACTIVE
        )
    elif audience == "free":
        from app.models.payment import TenantSubscription
        from app.models.enums import SubscriptionStatus
        from sqlalchemy import exists as _exists
        paid_sub = (
            select(TenantSubscription.tenant_id)
            .where(TenantSubscription.status == SubscriptionStatus.ACTIVE)
            .correlate(Tenant)
            .where(TenantSubscription.tenant_id == Tenant.id)
        )
        q = q.where(~_exists(paid_sub))

    rows = (await db.execute(q)).all()

    if not rows:
        return {"ok": True, "sent": 0, "message": "No matching tenants."}

    # Send emails
    from app.services.email_service import _send, _base, _h1, _divider, _note, BRAND_TEXT
    body_html = (
        _h1(title) +
        f'<p style="margin:16px 0;font-size:15px;line-height:1.7;color:{BRAND_TEXT};'
        f'white-space:pre-wrap;">{message}</p>' +
        _divider() +
        _note("Vous recevez cet email en tant qu'administrateur d'un blog SmarterBloggers.")
    )
    html = _base(title=title, preview=title, body_html=body_html)

    sent = 0
    for row in rows:
        try:
            await _send(to=row.email, subject=f"[SmarterBloggers] {title}", html=html)
            sent += 1
        except Exception:
            pass

    # Send push notifications to all matched users
    from app.services.push_service import send_push_to_user
    import asyncio as _asyncio
    push_tasks = [
        send_push_to_user(db, row.id, title=title, body=message, url="/dashboard")
        for row in rows
    ]
    await _asyncio.gather(*push_tasks, return_exceptions=True)

    # Persist in platform_notifications for history
    await db.execute(
        text(
            "INSERT INTO platform_notifications (title, message, audience, sent_by, sent_count) "
            "VALUES (:title, :message, :audience, :sent_by, :sent_count)"
        ),
        {
            "title": title,
            "message": message,
            "audience": audience,
            "sent_by": admin.id,
            "sent_count": sent,
        },
    )
    await db.commit()

    return {"ok": True, "sent": sent, "total": len(rows)}


# ── Config IA (stub) ──────────────────────────────────────────────

@router.get("/ai/config")
async def get_ai_config(payload: TokenPayload, db: DBSession):
    await _require_super_admin(payload, db)
    from app.core.config import settings as cfg
    return {
        "configured": bool(getattr(cfg, "OPENAI_API_KEY", "")),
        "model": "gpt-4o-mini",
        "available_models": ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo"],
        "usage": {"tokens_used": 0, "requests": 0},
    }


# ── Email templates (stub) ────────────────────────────────────────

@router.get("/emails/templates")
async def list_email_templates(payload: TokenPayload, db: DBSession):
    await _require_super_admin(payload, db)
    return {
        "templates": [
            {"id": "welcome",          "name": "Welcome Email",          "active": True},
            {"id": "article_workflow", "name": "Article Workflow",       "active": True},
            {"id": "newsletter",       "name": "Newsletter Campaign",    "active": True},
            {"id": "password_reset",   "name": "Password Reset",         "active": True},
            {"id": "subscription",     "name": "Subscription Confirmation","active": True},
        ]
    }
