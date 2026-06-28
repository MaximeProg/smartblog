import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.models.tenant import Tenant
from app.models.tenant_user import TenantUser
from app.models.user import User
from app.models.enums import PlanTier, TenantStatus, UserRole
from app.core.exceptions import (
    SlugAlreadyExistsException, NotFoundException,
    ForbiddenException, PlanLimitReachedException,
)
from app.core.redis_client import redis, key_tenant_slug, key_tenant_config
from app.schemas.tenant import (
    CreateTenantRequest, UpdateTenantRequest,
    TenantResponse, TenantLimits, TenantUsage, SlugCheckResponse,
)

# ── Nombre max de blogs par plan utilisateur (account-level) ──────
# -1 = illimité

USER_PLAN_BLOG_LIMITS: dict[PlanTier, int] = {
    PlanTier.FREE: 1,
    PlanTier.STARTER: 1,
    PlanTier.PRO: 1,
    PlanTier.BUSINESS: 5,
    PlanTier.ENTERPRISE: -1,
}

# ── Limites de ressources par blog (héritées du plan utilisateur) ──

PLAN_LIMITS: dict[PlanTier, dict] = {
    PlanTier.FREE: {
        "articles_max": 10,
        "authors_max": 1,
        "storage_gb": 2.0,
        "subscribers_max": 500,
        "domains_max": 0,
        "api_requests_monthly": 0,
    },
    PlanTier.STARTER: {
        "articles_max": 100,
        "authors_max": 2,
        "storage_gb": 20.0,
        "subscribers_max": 5_000,
        "domains_max": 1,
        "api_requests_monthly": 5_000,
    },
    PlanTier.PRO: {
        "articles_max": 500,
        "authors_max": 5,
        "storage_gb": 50.0,
        "subscribers_max": 25_000,
        "domains_max": 3,
        "api_requests_monthly": 50_000,
    },
    PlanTier.BUSINESS: {
        "articles_max": 2_000,
        "authors_max": 20,
        "storage_gb": 200.0,
        "subscribers_max": 100_000,
        "domains_max": 10,
        "api_requests_monthly": 200_000,
    },
    PlanTier.ENTERPRISE: {
        "articles_max": None,
        "authors_max": None,
        "storage_gb": 500.0,
        "subscribers_max": None,
        "domains_max": 25,
        "api_requests_monthly": None,
    },
}

RESERVED_SLUGS = {
    "www", "api", "app", "admin", "superadmin", "dashboard",
    "blog", "blog-preview", "mail", "smtp", "ftp", "cdn", "static", "assets",
    "help", "support", "docs", "status", "billing", "preview", "demo",
    "onboarding", "login", "register", "signup", "logout", "settings",
}


def get_plan_limits(plan: PlanTier) -> TenantLimits:
    d = PLAN_LIMITS[plan]
    return TenantLimits(**d)


def check_plan_limit(tenant: Tenant, resource: str, current: int) -> None:
    limits = PLAN_LIMITS[tenant.plan]
    max_val = limits.get(f"{resource}_max")
    if max_val is not None and current >= max_val:
        raise PlanLimitReachedException(resource, max_val)


# ── CRUD ───────────────────────────────────────────────────────────

async def check_slug_available(db: AsyncSession, slug: str) -> SlugCheckResponse:
    if slug in RESERVED_SLUGS:
        return SlugCheckResponse(available=False, slug=slug)
    result = await db.execute(
        select(func.count()).where(Tenant.slug == slug, Tenant.deleted_at.is_(None))
    )
    count = result.scalar_one()
    return SlugCheckResponse(available=count == 0, slug=slug)


async def create_tenant(
    db: AsyncSession,
    user_id: uuid.UUID,
    data: CreateTenantRequest,
) -> Tenant:
    # Vérif slug
    check = await check_slug_available(db, data.slug)
    if not check.available:
        raise SlugAlreadyExistsException(data.slug)

    # Récupère le plan de l'utilisateur et vérifie la limite de blogs
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    user_plan = user.plan if user else PlanTier.FREE

    max_blogs = USER_PLAN_BLOG_LIMITS.get(user_plan, 1)
    if max_blogs != -1:
        blog_count_result = await db.execute(
            select(func.count())
            .select_from(TenantUser)
            .join(Tenant, Tenant.id == TenantUser.tenant_id)
            .where(
                TenantUser.user_id == user_id,
                TenantUser.role == UserRole.TENANT_ADMIN,
                Tenant.deleted_at.is_(None),
            )
        )
        blog_count = blog_count_result.scalar_one()
        if blog_count >= max_blogs:
            raise PlanLimitReachedException("blogs", max_blogs)

    # Le blog hérite du plan de l'utilisateur
    tenant = Tenant(
        name=data.name,
        slug=data.slug,
        description=data.description,
        category=data.category,
        language=data.language,
        timezone=data.timezone,
        theme=data.theme,
        primary_color=data.primary_color,
        font_family=data.font_family,
        plan=user_plan,
        trial_ends_at=datetime.now(timezone.utc) + timedelta(days=14),
    )
    db.add(tenant)
    await db.flush()  # tenant.id is now set

    # Set RLS context so the membership INSERT passes the tenant_users policy
    await db.execute(text(f"SET LOCAL app.current_tenant_id = '{tenant.id}'"))

    # The creator becomes TENANT_ADMIN
    membership = TenantUser(
        tenant_id=tenant.id,
        user_id=user_id,
        role=UserRole.TENANT_ADMIN,
    )
    db.add(membership)
    await db.commit()
    await db.refresh(tenant)

    # Invalide le cache slug si existait
    await redis.delete(key_tenant_slug(data.slug))

    return tenant


async def get_tenant(db: AsyncSession, tenant_id: uuid.UUID) -> Tenant:
    result = await db.execute(
        select(Tenant).where(Tenant.id == tenant_id, Tenant.deleted_at.is_(None))
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Blog")
    return tenant


async def get_tenant_by_slug(db: AsyncSession, slug: str) -> Tenant:
    result = await db.execute(
        select(Tenant).where(Tenant.slug == slug, Tenant.deleted_at.is_(None))
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Blog")
    return tenant


async def update_tenant(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    data: UpdateTenantRequest,
) -> Tenant:
    tenant = await get_tenant(db, tenant_id)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tenant, field, value)

    await db.commit()
    await db.refresh(tenant)

    # Invalide le cache config
    await redis.delete(key_tenant_config(str(tenant_id)))

    return tenant


async def delete_tenant(db: AsyncSession, tenant_id: uuid.UUID) -> None:
    tenant = await get_tenant(db, tenant_id)
    tenant.deleted_at = datetime.now(timezone.utc)
    tenant.status = TenantStatus.DELETED
    await db.commit()
    await redis.delete(key_tenant_slug(tenant.slug))
    await redis.delete(key_tenant_config(str(tenant_id)))


async def get_user_tenants(db: AsyncSession, user_id: uuid.UUID) -> list[dict]:
    """Retourne tous les tenants d'un utilisateur avec son rôle."""
    result = await db.execute(
        select(Tenant, TenantUser.role)
        .join(TenantUser, TenantUser.tenant_id == Tenant.id)
        .where(
            TenantUser.user_id == user_id,
            Tenant.deleted_at.is_(None),
        )
        .order_by(Tenant.created_at.desc())
    )
    rows = result.all()
    return [
        {
            "id": str(t.id),
            "name": t.name,
            "slug": t.slug,
            "logo_url": t.logo_url,
            "plan": t.plan,
            "status": t.status,
            "role": role,
        }
        for t, role in rows
    ]


def build_tenant_response(tenant: Tenant, include_limits: bool = False, include_usage: bool = False) -> TenantResponse:
    limits = get_plan_limits(tenant.plan) if include_limits else None
    usage = TenantUsage(
        articles_count=tenant.articles_count,
        authors_count=tenant.authors_count,
        storage_used_gb=round(tenant.storage_used_bytes / (1024 ** 3), 3),
        subscribers_count=tenant.subscribers_count,
        domains_count=tenant.domains_count,
    ) if include_usage else None

    return TenantResponse(
        id=str(tenant.id),
        name=tenant.name,
        slug=tenant.slug,
        description=tenant.description,
        category=tenant.category,
        logo_url=tenant.logo_url,
        favicon_url=tenant.favicon_url,
        theme=tenant.theme,
        primary_color=tenant.primary_color,
        font_family=tenant.font_family,
        language=tenant.language,
        timezone=tenant.timezone,
        plan=tenant.plan,
        status=tenant.status,
        comments_mode=tenant.comments_mode,
        ga4_measurement_id=tenant.ga4_measurement_id,
        pwa_enabled=tenant.pwa_enabled,
        social_links=tenant.social_links or {},
        limits=limits,
        usage=usage,
    )
