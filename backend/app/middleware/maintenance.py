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


def _key_super_admin_flag(user_id: str) -> str:
    return f"user:is_super_admin:{user_id}"


async def _is_super_admin_user(user_id: str) -> bool:
    """Vérité venant de la DB (User.is_super_admin), pas du claim JWT — le
    claim peut être absent/périmé selon le flux de connexion (voir
    _require_super_admin dans superadmin.py qui fait la même vérification
    DB, jamais confiance au seul JWT). Résultat mis en cache 60s dans Redis,
    ce endpoint pouvant être appelé à chaque requête pendant la maintenance."""
    cache_key = _key_super_admin_flag(user_id)
    try:
        cached = await redis.get(cache_key)
        if cached is not None:
            return cached == "1"
    except Exception:
        pass

    try:
        import uuid
        from app.core.database import get_db_no_rls
        from app.models.user import User
        from sqlalchemy import select

        async for session in get_db_no_rls():
            result = await session.execute(
                select(User.is_super_admin).where(User.id == uuid.UUID(user_id))
            )
            row = result.scalar_one_or_none()
            is_admin = bool(row)
            try:
                await redis.setex(cache_key, 60, "1" if is_admin else "0")
            except Exception:
                pass
            return is_admin
    except Exception:
        return False
    return False


class MaintenanceModeMiddleware(BaseHTTPMiddleware):
    """Bloque toute la plateforme (blogs publics + dashboard) quand
    platform:settings.maintenance_mode est actif — sauf pour les Super Admins
    et les routes d'auth/superadmin/infra, pour qu'un admin puisse toujours
    se connecter et désactiver le mode."""

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
                user_id = payload.get("sub")
                if user_id and await _is_super_admin_user(user_id):
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
