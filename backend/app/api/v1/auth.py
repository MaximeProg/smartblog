from fastapi import APIRouter, Request, Response, Depends, Cookie
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import TokenPayload, DBSession, get_current_user_from_token
from app.core.exceptions import UnauthorizedException, ValidationException
from app.core.config import settings
from app.core.database import get_db
from app.schemas.auth import (
    FirebaseLoginRequest, LoginResponse, RefreshResponse,
    TwoFASetupResponse, TwoFAVerifyRequest, TwoFADisableRequest,
    UpdateProfileRequest,
)
from app.services.firebase_service import verify_firebase_id_token
from app.services.auth_service import (
    login_with_firebase, refresh_access_token,
    setup_2fa, confirm_2fa, disable_2fa,
)

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "nexusblog_refresh"
COOKIE_CONFIG = {
    "httponly": True,
    "secure": settings.is_production,
    "samesite": "lax",
    "max_age": settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
}


def _set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(REFRESH_COOKIE, token, **COOKIE_CONFIG)


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(REFRESH_COOKIE)


# ── POST /auth/login ────────────────────────────────────────────────

@router.post("/login", response_model=LoginResponse)
async def login(
    body: FirebaseLoginRequest,
    request: Request,
    response: Response,
    db: DBSession,
):
    """Login via Firebase ID Token (Google Sign-In or email/password)."""
    try:
        firebase_data = await verify_firebase_id_token(body.firebase_id_token)
    except ValueError as e:
        if "EMAIL_NOT_VERIFIED" in str(e):
            raise ValidationException(
                "Please verify your email address before signing in."
            )
        raise UnauthorizedException("Invalid Firebase token.")
    except Exception:
        raise UnauthorizedException("Invalid Firebase token.")

    tenant_id = str(request.state.tenant_id) if getattr(request.state, "tenant_id", None) else None
    ip = request.client.host if request.client else None

    result = await login_with_firebase(
        db=db,
        firebase_uid=firebase_data["uid"],
        email=firebase_data["email"],
        display_name=firebase_data.get("name"),
        avatar_url=firebase_data.get("picture"),
        tenant_id=tenant_id,
        ip_address=ip,
        sign_in_provider=firebase_data.get("sign_in_provider"),
        email_verified=firebase_data.get("email_verified", False),
    )

    # Extract refresh token before serialization
    refresh_plain = getattr(result, "_refresh_token", None)
    if refresh_plain:
        _set_refresh_cookie(response, refresh_plain)

    return result


# ── POST /auth/refresh ──────────────────────────────────────────────

@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    response: Response,
    db: DBSession,
    nexusblog_refresh: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
):
    """Rotation du refresh token (HttpOnly cookie → nouveau JWT + cookie)."""
    if not nexusblog_refresh:
        raise UnauthorizedException("Refresh token manquant.")

    new_access, new_refresh = await refresh_access_token(db, nexusblog_refresh)
    _set_refresh_cookie(response, new_refresh)

    return RefreshResponse(
        access_token=new_access,
        expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


# ── POST /auth/logout ──────────────────────────────────────────────

@router.post("/logout", status_code=204)
async def logout(
    response: Response,
    payload: TokenPayload,
    nexusblog_refresh: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
):
    """Invalide le JWT (blacklist) et révoque le refresh token."""
    from app.core.security import blacklist_token
    from datetime import datetime, timezone, timedelta

    jti = payload.get("jti")
    exp = payload.get("exp")
    if jti and exp:
        expire = datetime.fromtimestamp(exp, tz=timezone.utc)
        await blacklist_token(jti, expire)

    if nexusblog_refresh:
        from app.core.security import revoke_refresh_token
        await revoke_refresh_token(nexusblog_refresh)

    _clear_refresh_cookie(response)


# ── GET /auth/me ───────────────────────────────────────────────────

@router.get("/me")
async def get_me(payload: TokenPayload, db: DBSession):
    from sqlalchemy import select
    from app.models.user import User
    import uuid

    result = await db.execute(
        select(User).where(User.id == uuid.UUID(payload["sub"]))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("Utilisateur introuvable.")

    from app.schemas.auth import UserInfo
    return UserInfo.model_validate(user)


# ── PATCH /auth/me ─────────────────────────────────────────────────

@router.patch("/me")
async def update_profile(
    body: UpdateProfileRequest,
    payload: TokenPayload,
    db: DBSession,
):
    from sqlalchemy import select
    from app.models.user import User
    import uuid

    result = await db.execute(
        select(User).where(User.id == uuid.UUID(payload["sub"]))
    )
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("Utilisateur introuvable.")

    if body.display_name is not None:
        user.display_name = body.display_name
    if body.bio is not None:
        user.bio = body.bio

    await db.commit()
    from app.schemas.auth import UserInfo
    return UserInfo.model_validate(user)


# ── 2FA ───────────────────────────────────────────────────────────

@router.post("/2fa/setup", response_model=TwoFASetupResponse)
async def setup_2fa_route(payload: TokenPayload, db: DBSession):
    import uuid, qrcode, io, base64
    from qrcode.image.svg import SvgImage

    user_id = uuid.UUID(payload["sub"])
    data = await setup_2fa(db, user_id)

    # Génération du QR code SVG
    qr = qrcode.QRCode(image_factory=SvgImage)
    qr.add_data(data["uri"])
    qr.make(fit=True)
    svg_img = qr.make_image()
    buf = io.BytesIO()
    svg_img.save(buf)
    svg_str = buf.getvalue().decode("utf-8")

    return TwoFASetupResponse(
        otpauth_uri=data["uri"],
        qr_code_svg=svg_str,
        backup_codes=data["backup_codes"],
    )


@router.post("/2fa/verify", status_code=200)
async def verify_2fa_route(body: TwoFAVerifyRequest, payload: TokenPayload, db: DBSession):
    import uuid
    user_id = uuid.UUID(payload["sub"])
    success = await confirm_2fa(db, user_id, body.code)
    if not success:
        raise ValidationException("Code TOTP invalide.")
    return {"message": "2FA activé avec succès."}


@router.delete("/2fa", status_code=200)
async def disable_2fa_route(body: TwoFADisableRequest, payload: TokenPayload, db: DBSession):
    import uuid
    user_id = uuid.UUID(payload["sub"])
    success = await disable_2fa(db, user_id, body.code)
    if not success:
        raise ValidationException("Code TOTP invalide.")
    return {"message": "2FA désactivé."}
