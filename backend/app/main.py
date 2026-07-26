from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import structlog
import uuid

from app.core.config import settings
from app.core.exceptions import SmarterBloggersException
from app.core.redis_client import redis, key_tenant_domain
from app.middleware.tenant import TenantMiddleware
from app.middleware.maintenance import MaintenanceModeMiddleware
from app.api.v1 import api_router

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SmarterBloggers API starting", env=settings.APP_ENV)
    # Pre-initialize Firebase Admin so the first login doesn't pay the cold-start cost
    # (fetching Google public keys for token verification)
    try:
        from app.services.firebase_service import get_firebase_app
        get_firebase_app()
        logger.info("Firebase Admin initialized")
    except Exception as e:
        logger.warning("Firebase Admin init failed", error=str(e))
    yield
    logger.info("SmarterBloggers API shutting down")


app = FastAPI(
    title="SmarterBloggers API",
    version="1.0.0",
    description="Multi-Tenant SaaS Blog Platform",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── Middlewares ────────────────────────────────────────────────────

async def _is_verified_tenant_domain(host: str) -> bool:
    """Un blog avec un domaine personnalisé (externe OU acheté) appelle l'API
    directement depuis le navigateur avec Origin = son propre domaine
    (ex: kaluta.tech) — jamais dans settings.cors_origins (liste statique
    plateforme uniquement). Même cache Redis que la résolution tenant par
    domaine (app/middleware/tenant.py) pour éviter une requête DB par preflight."""
    try:
        cached = await redis.get(key_tenant_domain(host))
        if cached:
            return True
    except Exception:
        pass

    try:
        from app.core.database import get_db_no_rls
        from sqlalchemy import text

        async for session in get_db_no_rls():
            result = await session.execute(
                text("SELECT tenant_id FROM custom_domains WHERE domain = :domain AND verification_status = 'verified'"),
                {"domain": host},
            )
            row = result.fetchone()
            if row:
                try:
                    await redis.setex(key_tenant_domain(host), 3600, str(row[0]))
                except Exception:
                    pass
                return True
    except Exception:
        pass
    return False


async def _origin_allowed(origin: str) -> bool:
    if origin in settings.cors_origins:
        return True
    if not origin.startswith("https://") and not origin.startswith("http://"):
        return False

    host = origin.split("://", 1)[1].split("/", 1)[0].split(":")[0]

    # Support wildcard subdomains: *.smarterbloggers.com
    platform = settings.PLATFORM_DOMAIN
    if origin.startswith("https://") and host.endswith(f".{platform}"):
        return True

    # Domaine personnalisé d'un tenant (externe ou acheté via OpenProvider)
    if await _is_verified_tenant_domain(host):
        return True

    return False


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        allowed = await _origin_allowed(origin)

        if request.method == "OPTIONS":
            if allowed:
                return Response(
                    status_code=204,
                    headers={
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Credentials": "true",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-Tenant-ID, X-API-Key",
                        "Access-Control-Max-Age": "600",
                    },
                )
            return Response(status_code=403)

        response = await call_next(request)
        if allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        return response


app.add_middleware(TenantMiddleware)

app.add_middleware(MaintenanceModeMiddleware)

app.add_middleware(DynamicCORSMiddleware)


# ── Helper CORS pour les exception handlers ────────────────────────
# BaseHTTPMiddleware ne rattrape pas les exceptions qui remontent de
# call_next, donc les réponses d'erreur n'ont pas de headers CORS.
# On les injecte manuellement dans chaque handler.

async def _cors_headers(request: Request) -> dict[str, str]:
    origin = request.headers.get("origin", "")
    if await _origin_allowed(origin):
        return {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
        }
    return {}


# ── Gestionnaires d'erreurs ────────────────────────────────────────

@app.exception_handler(SmarterBloggersException)
async def smarterbloggers_exception_handler(request: Request, exc: SmarterBloggersException):
    trace_id = str(uuid.uuid4())[:8]
    logger.warning(
        "API error",
        status=exc.status_code,
        error=exc.detail.get("error") if isinstance(exc.detail, dict) else exc.detail,
        path=request.url.path,
        trace_id=trace_id,
    )
    return JSONResponse(
        status_code=exc.status_code,
        headers=await _cors_headers(request),
        content={**exc.detail, "trace_id": trace_id} if isinstance(exc.detail, dict) else {
            "error": "ERROR",
            "message": str(exc.detail),
            "trace_id": trace_id,
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first = errors[0] if errors else {}
    return JSONResponse(
        status_code=422,
        headers=await _cors_headers(request),
        content={
            "error": "VALIDATION_ERROR",
            "message": first.get("msg", "Invalid data."),
            "details": errors,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    trace_id = str(uuid.uuid4())[:8]
    logger.error("Unhandled exception", exc_info=exc, path=request.url.path, trace_id=trace_id)
    return JSONResponse(
        status_code=500,
        headers=await _cors_headers(request),
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "An internal error occurred.",
            "trace_id": trace_id,
        },
    )


# ── Routes ────────────────────────────────────────────────────────

app.include_router(api_router)


@app.get("/", tags=["infra"])
async def root():
    return {"status": "ok", "name": "SmarterBloggers API", "version": "1.0.0"}


@app.get("/health", tags=["infra"])
async def health():
    return {"status": "ok", "env": settings.APP_ENV}
