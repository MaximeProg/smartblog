import json
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from app.core.redis_client import redis, key_tenant_slug, key_tenant_domain
from app.core.config import settings


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Identifie le tenant à partir du host de la requête.
    Injecte tenant_id dans request.state.
    Bypass pour les routes /superadmin et /api/v1/auth.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        path = request.url.path

        # Pas de résolution tenant pour ces routes
        LOCAL_HOSTS = {"127.0.0.1", "localhost", "testclient"}
        host_raw = request.headers.get("host", "").split(":")[0].lower()

        API_BYPASS_PREFIXES = ("/api/v1/", "/superadmin", "/health", "/metrics", "/docs", "/openapi.json", "/redoc")
        if any(path.startswith(p) for p in API_BYPASS_PREFIXES) or host_raw in LOCAL_HOSTS:
            request.state.tenant_id = None
            request.state.is_super_admin = False
            return await call_next(request)

        host = request.headers.get("host", "").split(":")[0].lower()
        platform_domain = settings.PLATFORM_DOMAIN

        tenant_id = None

        if host.endswith(f".{platform_domain}"):
            # Sous-domaine : monblog.nexusblog.io → slug = "monblog"
            slug = host.replace(f".{platform_domain}", "")
            if slug not in ("www", "api", "app"):
                tenant_id = await self._resolve_by_slug(slug)

        elif host not in (platform_domain, f"www.{platform_domain}", settings.PLATFORM_API_DOMAIN):
            # Domaine personnalisé
            tenant_id = await self._resolve_by_domain(host)

        request.state.tenant_id = tenant_id
        request.state.is_super_admin = False
        request.state.user_id = None

        return await call_next(request)

    async def _resolve_by_slug(self, slug: str) -> str | None:
        cached = await redis.get(key_tenant_slug(slug))
        if cached:
            return cached

        # Fallback DB (lazy import pour éviter les imports circulaires)
        from app.core.database import get_db_no_rls
        from app.models.tenant import Tenant
        from sqlalchemy import select

        async for session in get_db_no_rls():
            result = await session.execute(
                select(Tenant.id).where(Tenant.slug == slug, Tenant.deleted_at.is_(None))
            )
            row = result.scalar_one_or_none()
            if row:
                tenant_id = str(row)
                await redis.setex(key_tenant_slug(slug), 3600, tenant_id)
                return tenant_id
        return None

    async def _resolve_by_domain(self, domain: str) -> str | None:
        cached = await redis.get(key_tenant_domain(domain))
        if cached:
            return cached

        from app.core.database import get_db_no_rls
        from sqlalchemy import select, text

        async for session in get_db_no_rls():
            result = await session.execute(
                text("SELECT tenant_id FROM custom_domains WHERE domain = :domain AND verification_status = 'verified'"),
                {"domain": domain},
            )
            row = result.fetchone()
            if row:
                tenant_id = str(row[0])
                await redis.setex(key_tenant_domain(domain), 3600, tenant_id)
                return tenant_id
        return None
