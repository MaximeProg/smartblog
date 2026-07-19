import json

from jose import JWTError
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse

from app.core.redis_client import redis
from app.core.security import decode_access_token

_BYPASS_PREFIXES = (
    "/api/v1/auth",
    "/api/v1/superadmin",
    "/api/v1/platform/maintenance-status",
    "/health",
    "/docs",
    "/openapi.json",
    "/redoc",
)


class MaintenanceModeMiddleware(BaseHTTPMiddleware):
    """Bloque toute la plateforme (blogs publics + dashboard) quand
    platform:settings.maintenance_mode est actif — sauf pour les Super Admins
    (JWT avec is_super_admin=true) et les routes d'auth/superadmin/infra,
    pour qu'un admin puisse toujours se connecter et désactiver le mode."""

    async def dispatch(self, request: Request, call_next):
        path = request.url.path
        if any(path.startswith(p) for p in _BYPASS_PREFIXES):
            return await call_next(request)

        try:
            raw = await redis.get("platform:settings")
            overrides = json.loads(raw) if raw else {}
            if not overrides.get("maintenance_mode"):
                return await call_next(request)
        except Exception:
            # Redis indisponible — ne jamais bloquer la plateforme par erreur.
            return await call_next(request)

        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                payload = decode_access_token(auth_header[7:])
                if payload.get("is_super_admin"):
                    return await call_next(request)
            except JWTError:
                pass

        return JSONResponse(
            status_code=503,
            content={
                "maintenance": True,
                "message": "SmarterBloggers is currently under maintenance. Please check back shortly.",
            },
        )
