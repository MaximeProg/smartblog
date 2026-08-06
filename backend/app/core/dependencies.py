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
    """Session DB avec RLS injecté — tenant_id/user_id/is_super_admin.

    Bug réel corrigé le 2026-08-06 : cette dépendance lisait ces 3 valeurs
    depuis request.state, que TenantMiddleware met TOUJOURS à
    tenant_id=None/is_super_admin=False pour tout /api/v1/ (bypass exprès —
    ce middleware ne résout le tenant que par nom d'hôte, pour les pages
    publiques d'un blog, pas pour les appels API authentifiés). Résultat :
    les policies RLS (`is_super_admin() OR tenant_id = current_tenant_id()`)
    étaient fausses sur chaque requête API — sans conséquence tant que RLS
    n'est qu'ENABLE (pas FORCE) et que le rôle applicatif reste propriétaire
    des tables, mais ça rendait RLS totalement inopérant pour ce trafic dès
    l'instant où FORCE serait activé (voir migration 069).

    - user_id / is_super_admin : décodés directement du JWT (si présent et
      valide — sinon session anonyme, comme avant, pour ne jamais casser un
      endpoint public qui ne dépend pas de TokenPayload). is_super_admin
      vient du claim JWT plutôt que d'une requête DB fraîche : acceptable
      pour ce verrou de secours (defense-in-depth), la fenêtre de validité
      est bornée par l'expiration du token (15 min) — les actions
      superadmin sensibles, elles, continuent de revérifier en base via
      _require_super_admin, jamais sur la seule foi du JWT.
    - tenant_id : jamais depuis le JWT (un JWT est émis pour UN SEUL tenant
      "préféré" à la connexion — voir auth_service.py::login — alors qu'un
      utilisateur membre de plusieurs tenants appelle
      /tenants/{tenant_id}/... avec des tenant_id différents dans l'URL
      selon le blog visé, avec le MÊME token). Lu depuis le path param de
      l'URL, qui est ce que chaque endpoint vérifie déjà explicitement via
      _assert_role/_assert_member — RLS ne fait que dupliquer cette même
      valeur déjà validée comme deuxième filet, jamais une vérification
      indépendante de l'appartenance elle-même.
    - Repli sur request.state.tenant_id pour les routes hors /api/v1/ (blog
      public résolu par nom d'hôte par TenantMiddleware), qui n'ont pas de
      tenant_id dans le chemin."""
    user_id: str | None = None
    is_super_admin = False

    authorization = request.headers.get("Authorization", "")
    if authorization.startswith("Bearer "):
        try:
            payload = decode_access_token(authorization.split(" ", 1)[1])
            user_id = payload.get("sub")
            is_super_admin = bool(payload.get("is_super_admin", False))
        except JWTError:
            pass  # Session anonyme — la route elle-même exigera TokenPayload si l'auth est requise.

    tenant_id = request.path_params.get("tenant_id") or getattr(request.state, "tenant_id", None)

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
