import uuid
import structlog
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

logger = structlog.get_logger()

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


async def _get_super_admin_emails(db: AsyncSession) -> list[str]:
    """Returns email addresses of all super admins."""
    result = await db.execute(select(User).where(User.is_super_admin == True))  # noqa: E712
    return [u.email for u in result.scalars().all()]


async def _send_new_user_emails(db: AsyncSession, email: str, display_name: str | None) -> None:
    """Email de bienvenue + alerte super admin — factorisé car utilisé par
    l'inscription native (immédiate) ET le premier login Firebase (le User
    n'est créé qu'à ce moment-là pour ce flux)."""
    try:
        from app.services.email_service import send_welcome_email, send_superadmin_event
        dashboard_url = f"{settings.FRONTEND_URL}/dashboard"
        await send_welcome_email(to=email, display_name=display_name or "", dashboard_url=dashboard_url)
        sa_emails = await _get_super_admin_emails(db)
        if sa_emails:
            await send_superadmin_event(
                to=sa_emails, event_type="user.register",
                title="New user registered", details=f"Email: {email}", actor_email=email,
            )
    except Exception as exc:
        logger.warning("new user emails failed", error=str(exc), email=email)


async def _finalize_login(
    db: AsyncSession,
    user: User,
    ip_address: str | None,
    tenant_id: str | None,
    *,
    send_notification: bool = True,
) -> LoginResponse:
    """Partie commune à toute connexion réussie (Firebase existant ou native) :
    notification de connexion, court-circuit 2FA, émission des tokens."""
    user.last_login_at = datetime.now(timezone.utc)
    user.last_login_ip = ip_address

    if send_notification:
        try:
            from app.services.email_service import send_login_notification
            ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
            await send_login_notification(
                to=user.email, display_name=user.display_name or "", ip=ip_address, timestamp=ts,
            )
        except Exception as exc:
            logger.warning("login_notification email failed", error=str(exc), email=user.email)

    # Si 2FA activé → retour sans tokens (client doit valider le code). Le
    # challenge_token permet au flux natif (sans firebase_id_token à renvoyer)
    # de prouver quel utilisateur termine la connexion à l'étape suivante.
    if user.two_fa_enabled:
        await db.commit()
        from app.core.security import create_2fa_challenge_token
        challenge_token = await create_2fa_challenge_token(str(user.id))
        return LoginResponse(
            access_token="",
            expires_in=0,
            user=UserInfo.model_validate(user),
            requires_2fa=True,
            two_fa_challenge_token=challenge_token,
        )

    return await _issue_tokens(db, user, preferred_tenant_id=tenant_id)


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
    referral_code: str | None = None,
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

    is_new_user = False
    if not user:
        is_new_user = True
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

        if referral_code:
            try:
                from app.api.v1.affiliate import register_referral_for_user
                await register_referral_for_user(db, user.id, referral_code)
            except Exception as exc:
                logger.warning("login: referral registration failed", error=str(exc), email=email)

        await _send_new_user_emails(db, email, display_name)
    else:
        if display_name and not user.display_name:
            user.display_name = display_name
        if avatar_url and not user.avatar_url:
            user.avatar_url = avatar_url
        if sign_in_provider:
            user.sign_in_provider = sign_in_provider
        user.email_verified = email_verified

    return await _finalize_login(db, user, ip_address, tenant_id, send_notification=not is_new_user)


# ── Authentification native (email/mot de passe, sans Firebase) ───
# Firebase reste utilisé uniquement pour la connexion Google — voir login_with_firebase.

async def register_with_password(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    display_name: str | None,
    referral_code: str | None = None,
    locale: str = "en",
) -> None:
    """Crée un compte natif. Ne connecte pas immédiatement — l'utilisateur doit
    vérifier son email puis se connecter via login_with_password."""
    existing = await db.execute(select(User).where(User.email == email))
    if existing.scalar_one_or_none():
        raise ValidationException("An account already exists with this email address.")

    from app.core.security import hash_password, create_email_verification_token

    user = User(
        email=email,
        password_hash=hash_password(password),
        display_name=display_name,
        sign_in_provider="password",
        email_verified=False,
    )
    db.add(user)
    await db.flush()

    if referral_code:
        try:
            from app.api.v1.affiliate import register_referral_for_user
            await register_referral_for_user(db, user.id, referral_code)
        except Exception as exc:
            logger.warning("register_with_password: referral registration failed", error=str(exc), email=email)

    await _send_new_user_emails(db, email, display_name)

    token = await create_email_verification_token(str(user.id))
    try:
        from app.services.email_service import send_verification_email
        verify_url = f"{settings.FRONTEND_URL}/{locale}/verify-email?token={token}"
        await send_verification_email(to=email, display_name=display_name or "", verify_url=verify_url)
    except Exception as exc:
        logger.warning("register_with_password: verification email failed", error=str(exc), email=email)

    await db.commit()


async def login_with_password(
    db: AsyncSession,
    *,
    email: str,
    password: str,
    ip_address: str | None,
    tenant_id: str | None,
) -> LoginResponse:
    from app.core.security import verify_password

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(password, user.password_hash):
        raise UnauthorizedException("Incorrect email or password.")

    require_verification = getattr(settings, "REQUIRE_EMAIL_VERIFICATION", "false").lower() == "true"
    if require_verification and not user.email_verified:
        raise ValidationException("Please verify your email address before logging in.")

    return await _finalize_login(db, user, ip_address, tenant_id)


async def complete_2fa_login_native(
    db: AsyncSession,
    *,
    challenge_token: str,
    code: str,
    tenant_id: str | None,
) -> LoginResponse:
    from app.core.security import (
        get_2fa_challenge_user_id, delete_2fa_challenge_token, decrypt_value, verify_totp,
    )

    user_id = await get_2fa_challenge_user_id(challenge_token)
    if not user_id:
        raise UnauthorizedException("Login session expired, please log in again.")

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if not user or not user.two_fa_enabled or not user.two_fa_secret_enc:
        raise UnauthorizedException("Account not found or 2FA not enabled.")

    secret = decrypt_value(user.two_fa_secret_enc)
    if not verify_totp(secret, code.strip()):
        if not check_backup_code(user, code.strip()):
            raise ValidationException("Invalid 2FA code.")

    await delete_2fa_challenge_token(challenge_token)
    return await _issue_tokens(db, user, preferred_tenant_id=tenant_id)


def check_backup_code(user: User, submitted: str) -> bool:
    """Vérifie et consomme un backup code (supprime après usage). Partagé entre
    la 2FA Firebase (api/v1/auth.py) et la 2FA native (ci-dessus)."""
    from app.core.security import decrypt_value
    backup = user.two_fa_backup_codes
    if not backup or not backup.get("confirmed"):
        return False
    codes = backup.get("codes", [])
    norm = submitted.upper().replace(" ", "").replace("-", "")
    for i, enc_code in enumerate(codes):
        try:
            plain = decrypt_value(enc_code)
            plain_norm = plain.upper().replace("-", "")
            if plain_norm == norm:
                new_codes = [c for j, c in enumerate(codes) if j != i]
                user.two_fa_backup_codes = {**backup, "codes": new_codes}
                return True
        except Exception:
            continue
    return False


async def verify_email_token(db: AsyncSession, token: str) -> None:
    from app.core.security import consume_email_verification_token
    user_id = await consume_email_verification_token(token)
    if not user_id:
        raise ValidationException("Invalid or expired verification link.")
    user = await db.get(User, uuid.UUID(user_id))
    if not user:
        raise NotFoundException("User")
    user.email_verified = True
    await db.commit()


async def resend_verification_email(db: AsyncSession, email: str, locale: str = "en") -> None:
    """Silencieux si l'email n'existe pas / est déjà vérifié / n'est pas natif
    (anti-énumération — même comportement que forgot-password)."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user or user.email_verified or user.sign_in_provider != "password":
        return

    from app.core.security import create_email_verification_token
    from app.services.email_service import send_verification_email

    token = await create_email_verification_token(str(user.id))
    verify_url = f"{settings.FRONTEND_URL}/{locale}/verify-email?token={token}"
    try:
        await send_verification_email(to=email, display_name=user.display_name or "", verify_url=verify_url)
    except Exception as exc:
        logger.warning("resend_verification_email failed", error=str(exc), email=email)


async def request_password_reset(db: AsyncSession, email: str, locale: str = "en") -> None:
    """Toujours silencieux pour une adresse email inconnue (anti-énumération).
    Un compte Google sans password_hash reçoit quand même le lien : ça lui
    permet de DÉFINIR un mot de passe pour la première fois (connexion
    email/mot de passe en plus de Google), pas seulement de le réinitialiser —
    tout utilisateur doit pouvoir obtenir un accès par mot de passe, quel que
    soit son mode d'inscription initial ou son rôle (décision PDG 2026-07-27,
    suite à un super admin inscrit via Google qui ne recevait jamais l'email)."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        return

    from app.core.security import create_password_reset_token
    from app.services.email_service import send_password_reset_email

    token = await create_password_reset_token(str(user.id))
    reset_url = f"{settings.FRONTEND_URL}/{locale}/reset-password?token={token}"
    try:
        await send_password_reset_email(to=email, display_name=user.display_name or "", reset_url=reset_url)
    except Exception as exc:
        logger.warning("request_password_reset failed", error=str(exc), email=email)


async def reset_password_with_token(db: AsyncSession, token: str, new_password: str) -> None:
    from app.core.security import consume_password_reset_token, hash_password, revoke_all_user_tokens

    user_id = await consume_password_reset_token(token)
    if not user_id:
        raise ValidationException("Invalid or expired reset link.")
    user = await db.get(User, uuid.UUID(user_id))
    if not user:
        raise NotFoundException("User")

    user.password_hash = hash_password(new_password)
    await db.commit()
    await revoke_all_user_tokens(str(user.id))


async def change_password(db: AsyncSession, user_id: uuid.UUID, current_password: str, new_password: str) -> None:
    """Requires the current password — unlike reset_password_with_token, which
    is for users who are locked out and relies on a mailed token instead."""
    from app.core.security import hash_password, verify_password

    user = await db.get(User, user_id)
    if not user:
        raise NotFoundException("User")
    if not user.password_hash:
        raise ValidationException("This account has no password set (sign in with Google instead).")
    if not verify_password(current_password, user.password_hash):
        raise ValidationException("Current password is incorrect.")

    user.password_hash = hash_password(new_password)
    await db.commit()


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
        is_super_admin=user.is_super_admin,
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
        raise UnauthorizedException("Invalid or expired refresh token.")

    # Rotation : révoque l'ancien, crée le nouveau
    await revoke_refresh_token(refresh_token_plain)

    result = await db.execute(select(User).where(User.id == uuid.UUID(data["user_id"])))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("User not found.")

    access_token, _, _ = create_access_token(
        user_id=data["user_id"],
        tenant_id=data["tenant_id"],
        role=data["role"],
        email=user.email,
        is_super_admin=user.is_super_admin,
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
    """Génère un secret TOTP, retourne URI + backup codes (non confirmé).
    Idempotent : si un secret pending existe déjà, le réutilise sans écraser."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundException("User")

    if user.two_fa_enabled:
        raise ValidationException("2FA is already enabled.")

    # Réutilise le secret pending si déjà initié (évite race conditions client)
    if user.two_fa_secret_enc and user.two_fa_backup_codes and not user.two_fa_backup_codes.get("confirmed"):
        secret = decrypt_value(user.two_fa_secret_enc)
        # Déchiffre les backup codes existants pour les renvoyer en clair
        existing_codes = user.two_fa_backup_codes.get("codes", [])
        backup_codes = [decrypt_value(c) for c in existing_codes]
    else:
        secret = generate_totp_secret()
        backup_codes = generate_backup_codes()
        backup_hashes = [encrypt_value(c) for c in backup_codes]
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
        raise ValidationException("2FA setup has not been initiated.")

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
        raise ValidationException("2FA is not enabled.")

    secret = decrypt_value(user.two_fa_secret_enc)
    if not verify_totp(secret, code):
        return False

    user.two_fa_enabled = False
    user.two_fa_secret_enc = None
    user.two_fa_backup_codes = None
    await db.commit()
    return True
