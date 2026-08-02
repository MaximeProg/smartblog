from typing import Annotated
import uuid
from datetime import datetime
from fastapi import Depends, Request, HTTPException
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
                f"Required role: {', '.join(r.value for r in roles)}. Current role: {role}"
            )
        return payload
    return _check_role


def require_super_admin():
    async def _check(payload: TokenPayload):
        if not (payload.get("is_super_admin") or payload.get("role") == "SUPER_ADMIN"):
            raise ForbiddenException("Super Admin access required.")
        return payload
    return _check


async def require_kyc_verified(
    db: AsyncSession = Depends(get_db_session),
    payload: dict = Depends(get_current_user_from_token),
) -> dict:
    """Bloque l'accès au programme d'affiliation tant que le KYC n'est pas
    validé (décision PDG 2026-08-01 — condition de conformité, pas
    seulement une restriction d'UI). Voir kyc.py et
    affiliate.py::AffiliateDashboardResponse pour le même verrou appliqué
    au niveau du dashboard lui-même."""
    from app.models.enums import KycStatus

    user_id = uuid.UUID(payload["sub"])
    user = await db.get(User, user_id)
    if user is None or user.kyc_status != KycStatus.VERIFIED:
        raise HTTPException(
            status_code=402,
            detail={
                "code": "KYC_REQUIRED",
                "message": "KYC verification is required to access the affiliate program.",
            },
        )
    return payload


async def check_plan_active(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db_session),
    payload: dict = Depends(get_current_user_from_token),
) -> None:
    """Bloque l'accès si le trial est expiré ou l'abonnement inactif.
    Super admins et tenants sans subscription sont toujours autorisés.
    """
    if payload.get("is_super_admin"):
        return

    from app.models.payment import UserSubscription
    from app.models.enums import SubscriptionStatus
    from app.services.tenant_service import get_tenant_owner_user_id

    owner_user_id = await get_tenant_owner_user_id(db, tenant_id)
    if owner_user_id is None:
        return

    result = await db.execute(
        select(UserSubscription).where(UserSubscription.user_id == owner_user_id)
    )
    sub = result.scalar_one_or_none()

    if sub is None:
        return  # Nouveau compte, aucun enregistrement → autoriser

    now = datetime.utcnow()

    if sub.status == SubscriptionStatus.TRIALING:
        if sub.trial_ends_at and sub.trial_ends_at < now:
            raise HTTPException(
                status_code=402,
                detail={
                    "code": "TRIAL_EXPIRED",
                    "message": "Your trial period has expired. Upgrade to a paid plan to continue.",
                },
            )
    elif sub.status in (
        SubscriptionStatus.CANCELED,
        SubscriptionStatus.PAST_DUE,
        SubscriptionStatus.UNPAID,
        SubscriptionStatus.PAUSED,
    ):
        raise HTTPException(
            status_code=402,
            detail={
                "code": "SUBSCRIPTION_INACTIVE",
                "message": "Your subscription is inactive. Renew your plan to access this feature.",
            },
        )
