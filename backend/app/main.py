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
from app.core.exceptions import NexusBlogException
from app.middleware.tenant import TenantMiddleware
from app.api.v1 import api_router

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("NexusBlog API starting", env=settings.APP_ENV)
    # Pre-initialize Firebase Admin so the first login doesn't pay the cold-start cost
    # (fetching Google public keys for token verification)
    try:
        from app.services.firebase_service import get_firebase_app
        get_firebase_app()
        logger.info("Firebase Admin initialized")
    except Exception as e:
        logger.warning("Firebase Admin init failed", error=str(e))
    yield
    logger.info("NexusBlog API shutting down")


app = FastAPI(
    title="NexusBlog API",
    version="1.0.0",
    description="Multi-Tenant SaaS Blog Platform",
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    openapi_url="/openapi.json" if not settings.is_production else None,
    lifespan=lifespan,
)

# ── Middlewares ────────────────────────────────────────────────────

def _origin_allowed(origin: str) -> bool:
    if origin in settings.cors_origins:
        return True
    # Support wildcard subdomains: *.nexusblog.io
    platform = settings.PLATFORM_DOMAIN
    if origin.startswith("https://") and origin.endswith(f".{platform}"):
        return True
    return False


class DynamicCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        origin = request.headers.get("origin", "")
        allowed = _origin_allowed(origin)

        if request.method == "OPTIONS":
            if allowed:
                return Response(
                    status_code=204,
                    headers={
                        "Access-Control-Allow-Origin": origin,
                        "Access-Control-Allow-Credentials": "true",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
                        "Access-Control-Allow-Headers": "*",
                        "Access-Control-Max-Age": "600",
                    },
                )
            return Response(status_code=403)

        response = await call_next(request)
        if allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
        return response


app.add_middleware(DynamicCORSMiddleware)

app.add_middleware(TenantMiddleware)


# ── Gestionnaires d'erreurs ────────────────────────────────────────

@app.exception_handler(NexusBlogException)
async def nexusblog_exception_handler(request: Request, exc: NexusBlogException):
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
        content={
            "error": "VALIDATION_ERROR",
            "message": first.get("msg", "Données invalides."),
            "details": errors,
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    trace_id = str(uuid.uuid4())[:8]
    logger.error("Unhandled exception", exc_info=exc, path=request.url.path, trace_id=trace_id)
    return JSONResponse(
        status_code=500,
        content={
            "error": "INTERNAL_SERVER_ERROR",
            "message": "Une erreur interne est survenue.",
            "trace_id": trace_id,
        },
    )


# ── Routes ────────────────────────────────────────────────────────

app.include_router(api_router)


@app.get("/health", tags=["infra"])
async def health():
    return {"status": "ok", "env": settings.APP_ENV}
