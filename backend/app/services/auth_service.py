import uuid
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User
from app.models.tenant import Tenant
from app.models.tenant_user import TenantUser
from app.models.enums import UserRole
from app.core.security import (
    create_access_token, generate_refresh_token,
    store_refresh_token, get_refresh_token_data, revoke_refresh_token,
    generate_totp_secret, verify_totp, generate_totp_uri,
    generate_backup_codes, encrypt_value, decrypt_value,
)
from app.core.config import settings
from app.core.exceptions import (
    UnauthorizedException, ForbiddenException, NotFoundException, ValidationException
)
from app.schemas.auth import LoginResponse, UserInfo, TenantInfo, RefreshResponse


async def login_with_firebase(
    db: AsyncSession,
    firebase_uid: str,
    email: str,
    display_name: str | None,
    avatar_url: str | None,
    tenant_id: str | None,
    ip_address: str | None = None,
    sign_in_provider: str | None = None,
    email_verified: bool = False,
) -> LoginResponse:
    """
    Crée ou met à jour l'utilisateur, génère les tokens.
    """
    # Cherche par firebase_uid (chemin normal)
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()

    if not user:
        # Fallback : cherche par email (cas migration ou conflit de UID)
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if user:
            # Associe le nouveau firebase_uid à ce compte existant
            user.firebase_uid = firebase_uid

    if not user:
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            display_name=display_name,
            avatar_url=avatar_url,
            sign_in_provider=sign_in_provider,
            email_verified=email_verified,
        )
        db.add(user)
        await db.flush()
    else:
        if display_name and not user.display_name:
            user.display_name = display_name
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        user.last_login_at = datetime.now(timezone.utc)
        user.last_login_ip = ip_address
        if sign_in_provider:
            user.sign_in_provider = sign_in_provider
        user.email_verified = email_verified

    # Si 2FA activé → retour sans tokens (client doit valider le code)
    if user.two_fa_enabled:
        await db.commit()
        return LoginResponse(
            access_token="",
            expires_in=0,
            user=UserInfo.model_validate(user),
            requires_2fa=True,
        )

    return await _issue_tokens(db, user, preferred_tenant_id=tenant_id)


async def _issue_tokens(
    db: AsyncSession,
    user: User,
    preferred_tenant_id: str | None = None,
) -> LoginResponse:
    """Génère access token + refresh token, retourne tous les tenants de l'utilisateur."""
    # Récupère tous les tenants de l'utilisateur
    rows = await db.execute(
        select(TenantUser, Tenant)
        .join(Tenant, Tenant.id == TenantUser.tenant_id)
        .where(TenantUser.user_id == user.id)
        .order_by(Tenant.created_at)
    )
    memberships = rows.all()

    tenants_list = [
        TenantInfo(
            id=str(tenant.id),
            name=tenant.name,
            slug=tenant.slug,
            plan=tenant.plan,
            role=tenant_user.role,
        )
        for tenant_user, tenant in memberships
    ]

    # Rôle JWT : super admin, sinon cherche le tenant préféré ou prend le premier
    if user.is_super_admin:
        role = "SUPER_ADMIN"
        jwt_tenant_id = ""
    else:
        # Priorise preferred_tenant_id si l'utilisateur en est membre
        active_membership = None
        if preferred_tenant_id:
            active_membership = next(
                ((tu, t) for tu, t in memberships if str(t.id) == preferred_tenant_id),
                None,
            )
        if active_membership is None and memberships:
            active_membership = memberships[0]

        if active_membership:
            tenant_user, tenant = active_membership
            role = tenant_user.role.value
            jwt_tenant_id = str(tenant.id)
        else:
            role = UserRole.VIEWER.value
            jwt_tenant_id = ""

    access_token, jti, expire = create_access_token(
        user_id=str(user.id),
        tenant_id=jwt_tenant_id,
        role=role,
        email=user.email,
    )

    refresh_plain, refresh_hash = generate_refresh_token()
    await store_refresh_token(
        token_hash=refresh_hash,
        user_id=str(user.id),
        tenant_id=jwt_tenant_id,
        role=role,
    )

    await db.commit()

    result = LoginResponse(
        access_token=access_token,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserInfo.model_validate(user),
        tenants=tenants_list,
    )
    result._refresh_token = refresh_plain
    return result


async def refresh_access_token(
    db: AsyncSession,
    refresh_token_plain: str,
) -> tuple[str, str]:
    """
    Valide le refresh token, en émet un nouveau (rotation).
    Retourne (new_access_token, new_refresh_token_plain).
    """
    data = await get_refresh_token_data(refresh_token_plain)
    if not data:
        raise UnauthorizedException("Refresh token invalide ou expiré.")

    # Rotation : révoque l'ancien, crée le nouveau
    await revoke_refresh_token(refresh_token_plain)

    result = await db.execute(select(User).where(User.id == uuid.UUID(data["user_id"])))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("Utilisateur introuvable.")

    access_token, _, _ = create_access_token(
        user_id=data["user_id"],
        tenant_id=data["tenant_id"],
        role=data["role"],
        email=user.email,
    )

    new_refresh_plain, new_refresh_hash = generate_refresh_token()
    await store_refresh_token(
        token_hash=new_refresh_hash,
        user_id=data["user_id"],
        tenant_id=data["tenant_id"],
        role=data["role"],
    )

    return access_token, new_refresh_plain


async def setup_2fa(db: AsyncSession, user_id: uuid.UUID) -> dict:
    """Génère un secret TOTP, retourne URI + backup codes (non confirmé)."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("Utilisateur")

    if user.two_fa_enabled:
        raise ValidationException("Le 2FA est déjà activé.")

    secret = generate_totp_secret()
    backup_codes = generate_backup_codes()
    backup_hashes = [encrypt_value(c) for c in backup_codes]

    # Stockage temporaire chiffré (confirmé seulement après verify)
    user.two_fa_secret_enc = encrypt_value(secret)
    user.two_fa_backup_codes = {"codes": backup_hashes, "confirmed": False}
    await db.commit()

    uri = generate_totp_uri(secret, user.email)
    return {"uri": uri, "backup_codes": backup_codes, "secret": secret}


async def confirm_2fa(db: AsyncSession, user_id: uuid.UUID, code: str) -> bool:
    """Active le 2FA après vérification du premier code."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.two_fa_secret_enc:
        raise ValidationException("Setup 2FA non initié.")

    secret = decrypt_value(user.two_fa_secret_enc)
    if not verify_totp(secret, code):
        return False

    user.two_fa_enabled = True
    user.two_fa_backup_codes = {
        "codes": user.two_fa_backup_codes["codes"],
        "confirmed": True,
    }
    await db.commit()
    return True


async def disable_2fa(db: AsyncSession, user_id: uuid.UUID, code: str) -> bool:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.two_fa_enabled:
        raise ValidationException("Le 2FA n'est pas activé.")

    secret = decrypt_value(user.two_fa_secret_enc)
    if not verify_totp(secret, code):
        return False

    user.two_fa_enabled = False
    user.two_fa_secret_enc = None
    user.two_fa_backup_codes = None
    await db.commit()
    return True
