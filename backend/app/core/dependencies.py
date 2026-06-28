from typing import Annotated
from fastapi import Depends, Request, Cookie
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.security import decode_access_token, is_token_blacklisted
from app.core.exceptions import (
    UnauthorizedException, InvalidTokenException, TokenRevokedException, ForbiddenException
)
from app.core.database import get_db
from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_user import TenantUser
from app.models.enums import UserRole


async def get_current_user_from_token(request: Request) -> dict:
    """Extrait et valide le JWT depuis le header Authorization."""
    authorization = request.headers.get("Authorization", "")
    if not authorization.startswith("Bearer "):
        raise UnauthorizedException()

    token = authorization.split(" ", 1)[1]
    try:
        payload = decode_access_token(token)
    except JWTError:
        raise InvalidTokenException()

    jti = payload.get("jti")
    if jti and await is_token_blacklisted(jti):
        raise TokenRevokedException()

    return payload


async def get_db_session(request: Request) -> AsyncSession:
    """Session DB avec RLS injecté depuis request.state."""
    tenant_id = getattr(request.state, "tenant_id", None)
    user_id = getattr(request.state, "user_id", None)
    is_super_admin = getattr(request.state, "is_super_admin", False)

    async for session in get_db(
        tenant_id=str(tenant_id) if tenant_id else None,
        user_id=str(user_id) if user_id else None,
        is_super_admin=is_super_admin,
    ):
        yield session


# ── Types typés pour injection ────────────────────────────────────

TokenPayload = Annotated[dict, Depends(get_current_user_from_token)]
DBSession = Annotated[AsyncSession, Depends(get_db_session)]


def require_role(*roles: UserRole):
    """Factory de dependency qui vérifie le rôle."""
    async def _check_role(payload: TokenPayload):
        role = payload.get("role")
        if role not in [r.value for r in roles]:
            raise ForbiddenException(
                f"Rôle requis : {', '.join(r.value for r in roles)}. Rôle actuel : {role}"
            )
        return payload
    return _check_role


def require_super_admin():
    async def _check(payload: TokenPayload):
        if not payload.get("is_super_admin"):
            raise ForbiddenException("Accès Super Admin requis.")
        return payload
    return _check
