from fastapi import APIRouter, Request, Response, Depends, Cookie, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import TokenPayload, DBSession, get_current_user_from_token
from app.core.exceptions import UnauthorizedException, ValidationException
from app.core.config import settings
from app.core.database import get_db
from app.schemas.auth import (
    FirebaseLoginRequest, LoginResponse, RefreshResponse,
    TwoFASetupResponse, TwoFAVerifyRequest, TwoFADisableRequest,
    TwoFALoginRequest, UpdateProfileRequest,
    RegisterRequest, LoginPasswordRequest, TwoFALoginPasswordRequest,
    VerifyEmailRequest, ResendVerificationRequest,
    ForgotPasswordRequest, ResetPasswordRequest,
)
from app.services.firebase_service import verify_firebase_id_token
from app.services.auth_service import (
    login_with_firebase, refresh_access_token,
    setup_2fa, confirm_2fa, disable_2fa, check_backup_code,
    register_with_password, login_with_password, complete_2fa_login_native,
    verify_email_token, resend_verification_email,
    request_password_reset, reset_password_with_token,
)

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE = "smarterbloggers_refresh"
COOKIE_CONFIG = {
    "httponly": True,
    "secure": settings.is_production,
    # SameSite=None is required for cross-origin requests (frontend on Vercel,
    # backend on different domain). SameSite=Lax blocks cookies on cross-origin
    # POST requests, breaking the token refresh flow in production.
    "samesite": "none" if settings.is_production else "lax",
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
        referral_code=body.referral_code,
    )

    from app.services.log_service import log_event
    await log_event(
        db, "user.login",
        actor_email=firebase_data["email"],
        level="info",
        details=f"provider={firebase_data.get('sign_in_provider', 'password')}",
        ip=ip,
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
    smarterbloggers_refresh: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
):
    """Rotation du refresh token (HttpOnly cookie → nouveau JWT + cookie)."""
    if not smarterbloggers_refresh:
        raise UnauthorizedException("Refresh token manquant.")

    new_access, new_refresh = await refresh_access_token(db, smarterbloggers_refresh)
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
    smarterbloggers_refresh: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
):
    """Invalide le JWT (blacklist) et révoque le refresh token."""
    from app.core.security import blacklist_token
    from datetime import datetime, timezone, timedelta

    jti = payload.get("jti")
    exp = payload.get("exp")
    if jti and exp:
        expire = datetime.fromtimestamp(exp, tz=timezone.utc)
        await blacklist_token(jti, expire)

    if smarterbloggers_refresh:
        from app.core.security import revoke_refresh_token
        await revoke_refresh_token(smarterbloggers_refresh)

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
    if body.phone is not None:
        user.phone = body.phone or None
    if body.country is not None:
        user.country = body.country or None
    if body.continent is not None:
        user.continent = body.continent or None
    # Genre immuable : ignoré si déjà défini
    if body.gender is not None and user.gender is None:
        user.gender = body.gender

    await db.commit()
    from app.schemas.auth import UserInfo
    return UserInfo.model_validate(user)


# ── POST /auth/me/avatar ───────────────────────────────────────────

@router.post("/me/avatar")
async def upload_avatar(
    payload: TokenPayload,
    db: DBSession,
    file: UploadFile = File(...),
):
    from sqlalchemy import select
    from app.models.user import User
    from app.services.cloudinary_service import upload_avatar_image
    import uuid

    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("Utilisateur introuvable.")

    upload_result = await upload_avatar_image(file, str(user_id))
    user.avatar_url = upload_result["secure_url"]
    await db.commit()

    from app.schemas.auth import UserInfo
    return UserInfo.model_validate(user)


# ── PATCH /auth/me/wallet ─────────────────────────────────────────
# Exige que la 2FA soit activée (RG-AFF-10)

@router.patch("/me/wallet")
async def update_wallet(
    body: dict,
    payload: TokenPayload,
    db: DBSession,
):
    """
    Enregistre ou met à jour l'adresse USDT BSC (BEP20) de l'utilisateur.
    Requis : 2FA activé + code TOTP valide.

    Décision PDG : sans wallet enregistré, un utilisateur ne participe pas au
    programme d'affiliation et ne reçoit pas sa part de revenu publicitaire —
    aucune commission n'est jamais mise de côté en attendant qu'il en ajoute
    un. Cet endpoint ne fait donc qu'enregistrer l'adresse, sans déclencher de
    règlement rétroactif.
    """
    from sqlalchemy import select
    from app.models.user import User
    import uuid, re

    wallet_address: str = (body.get("usdt_wallet_address") or "").strip()

    if not wallet_address:
        raise ValidationException("Adresse USDT requise.")

    # Validation basique format BSC/BEP20 (adresse EVM standard : 0x + 40 hex)
    if not re.match(r"^0x[a-fA-F0-9]{40}$", wallet_address):
        raise ValidationException("Adresse USDT BSC invalide. Elle doit commencer par 0x et comporter 42 caractères.")

    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("Utilisateur introuvable.")

    # 2FA obligatoire — l'utilisateur doit avoir activé la 2FA
    # (la vérification du code a déjà eu lieu à la connexion)
    if not user.two_fa_enabled:
        raise ValidationException("Vous devez activer la double authentification (2FA) avant d'enregistrer votre adresse wallet.")

    user.usdt_wallet_address = wallet_address
    await db.commit()

    from app.schemas.auth import UserInfo
    return UserInfo.model_validate(user)


# ── GET /auth/me/notifications ─────────────────────────────────────

@router.get("/me/notifications")
async def list_notifications(payload: TokenPayload, db: DBSession):
    """Aggregate activity across all user tenants as in-app notifications."""
    import uuid
    from datetime import datetime, timedelta
    from sqlalchemy import select, and_
    from app.models.tenant import Tenant
    from app.models.tenant_user import TenantUser
    from app.models.comment import Comment
    from app.models.newsletter import NewsletterSubscriber
    from app.models.article import Article
    from app.models.enums import CommentStatus, ArticleStatus

    user_id = uuid.UUID(payload["sub"])

    # Get all tenant IDs the user belongs to
    tenant_rows = await db.execute(
        select(Tenant.id, Tenant.name)
        .join(TenantUser, TenantUser.tenant_id == Tenant.id)
        .where(TenantUser.user_id == user_id, Tenant.deleted_at.is_(None))
    )
    tenants = {str(r.id): r.name for r in tenant_rows.all()}

    if not tenants:
        return []

    tenant_ids = [uuid.UUID(tid) for tid in tenants]
    since_30d = datetime.utcnow() - timedelta(days=30)
    since_7d = datetime.utcnow() - timedelta(days=7)

    notifications = []

    # Pending comments needing moderation (last 30 days)
    pending_result = await db.execute(
        select(Comment)
        .where(
            Comment.tenant_id.in_(tenant_ids),
            Comment.status == CommentStatus.PENDING,
            Comment.created_at >= since_30d,
        )
        .order_by(Comment.created_at.desc())
        .limit(20)
    )
    pending_comments = pending_result.scalars().all()
    if pending_comments:
        blog_name = tenants.get(str(pending_comments[0].tenant_id), "")
        count = len(pending_comments)
        notifications.append({
            "id": "pending-comments",
            "type": "warning",
            "title": f"{count} comment{'s' if count > 1 else ''} awaiting moderation",
            "body": f"Review and approve comments on {blog_name}{'and other blogs' if len(tenants) > 1 else ''}.",
            "time": pending_comments[0].created_at.isoformat(),
            "read": False,
            "action_url": None,
        })

    # New newsletter subscribers (last 7 days)
    subs_result = await db.execute(
        select(NewsletterSubscriber)
        .where(
            NewsletterSubscriber.tenant_id.in_(tenant_ids),
            NewsletterSubscriber.created_at >= since_7d,
        )
        .order_by(NewsletterSubscriber.created_at.desc())
        .limit(50)
    )
    new_subs = subs_result.scalars().all()
    if new_subs:
        count = len(new_subs)
        notifications.append({
            "id": "new-subscribers",
            "type": "success",
            "title": f"{count} new subscriber{'s' if count > 1 else ''} this week",
            "body": "Your newsletter is growing! Keep publishing great content.",
            "time": new_subs[0].created_at.isoformat(),
            "read": False,
            "action_url": None,
        })

    # Recently published articles (last 7 days)
    articles_result = await db.execute(
        select(Article)
        .where(
            Article.tenant_id.in_(tenant_ids),
            Article.status == ArticleStatus.PUBLISHED,
            Article.published_at >= since_7d,
        )
        .order_by(Article.published_at.desc())
        .limit(10)
    )
    recent_articles = articles_result.scalars().all()
    for article in recent_articles[:3]:
        blog_name = tenants.get(str(article.tenant_id), "")
        notifications.append({
            "id": f"article-{article.id}",
            "type": "info",
            "title": f"Article published on {blog_name}",
            "body": article.title,
            "time": article.published_at.isoformat() if article.published_at else datetime.utcnow().isoformat(),
            "read": True,
            "action_url": None,
        })

    # Sort by time descending
    notifications.sort(key=lambda n: n["time"], reverse=True)
    return notifications


# ── GET /auth/me/notifications/count ──────────────────────────────

@router.get("/me/notifications/count")
async def notifications_count(payload: TokenPayload, db: DBSession):
    """Retourne le nombre de notifications non lues (léger, pour le badge TopBar)."""
    notifs = await list_notifications(payload, db)
    unread = sum(1 for n in notifs if not n.get("read", True))
    return {"unread": unread, "total": len(notifs)}


# ── Push subscriptions ─────────────────────────────────────────────

@router.post("/me/push-subscription", status_code=201)
async def save_push_subscription(
    payload: TokenPayload,
    db: DBSession,
    body: dict,
):
    from fastapi import HTTPException
    try:
        import uuid
        from sqlalchemy import select, delete
        from app.models.push_subscription import PushSubscription

        user_id  = uuid.UUID(payload["sub"])
        endpoint = body.get("endpoint", "")
        keys     = body.get("keys", {})

        if not endpoint or not keys.get("p256dh") or not keys.get("auth"):
            raise HTTPException(status_code=422, detail="Invalid subscription payload")

        await db.execute(
            delete(PushSubscription).where(
                PushSubscription.endpoint == endpoint,
                PushSubscription.user_id  != user_id,
            )
        )
        existing = await db.execute(
            select(PushSubscription).where(
                PushSubscription.endpoint == endpoint,
                PushSubscription.user_id  == user_id,
            )
        )
        if not existing.scalar_one_or_none():
            db.add(PushSubscription(
                user_id  = user_id,
                endpoint = endpoint,
                p256dh   = keys["p256dh"],
                auth     = keys["auth"],
            ))
            await db.commit()
        return {"ok": True}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"{type(exc).__name__}: {exc}",
        )


@router.delete("/me/push-subscription", status_code=204)
async def delete_push_subscription(payload: TokenPayload, db: DBSession, body: dict):
    import uuid
    from fastapi import HTTPException
    from sqlalchemy import delete as sa_delete
    from app.models.push_subscription import PushSubscription

    user_id  = uuid.UUID(payload["sub"])
    endpoint = body.get("endpoint", "")
    if endpoint:
        try:
            await db.execute(
                sa_delete(PushSubscription).where(
                    PushSubscription.user_id  == user_id,
                    PushSubscription.endpoint == endpoint,
                )
            )
            await db.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Push unsubscribe error: {exc}")


@router.get("/me/push-vapid-public-key")
async def get_vapid_public_key():
    """Retourne la clé VAPID publique en base64url (format attendu par pushManager.subscribe)."""
    if not settings.VAPID_PUBLIC_KEY:
        return {"public_key": ""}
    import base64
    from cryptography.hazmat.primitives.serialization import (
        load_pem_public_key, Encoding, PublicFormat,
    )
    key = load_pem_public_key(settings.VAPID_PUBLIC_KEY.encode())
    raw = key.public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
    return {"public_key": base64.urlsafe_b64encode(raw).rstrip(b"=").decode()}


# ── Test endpoints (dev/staging uniquement) ────────────────────────

@router.post("/me/test-email", status_code=200)
async def test_email(payload: TokenPayload, db: DBSession):
    """Envoie un email de test à l'utilisateur connecté (Resend)."""
    import uuid
    from datetime import datetime
    from fastapi import HTTPException
    from sqlalchemy import select
    from app.models.user import User
    from app.services.email_service import _send

    user_id = uuid.UUID(payload["sub"])
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise UnauthorizedException("Utilisateur introuvable.")

    # Sans domaine Resend vérifié, le TO doit être l'email du compte Resend
    recipient = settings.RESEND_TEST_RECIPIENT or user.email

    try:
        await _send(
            to=recipient,
            subject="✅ Test email SmarterBloggers — Resend fonctionne !",
            html=f"""
            <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
              <h2 style="color:#1e293b;">Test email — SmarterBloggers</h2>
              <p style="color:#475569;">Bonjour <strong>{user.display_name or user.email}</strong>,</p>
              <p style="color:#475569;">
                Cet email confirme que l'intégration <strong>Resend</strong> fonctionne correctement.
              </p>
              <p style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;
                         padding:12px 16px;color:#15803d;font-weight:600;">
                ✅ Configuration email opérationnelle
              </p>
              <p style="color:#94a3b8;font-size:12px;">Envoyé le {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}</p>
            </div>
            """,
        )
        return {"ok": True, "sent_to": recipient}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Resend error: {exc}")


@router.post("/me/test-push", status_code=200)
async def test_push(payload: TokenPayload, db: DBSession):
    """Envoie une notification push de test à tous les abonnements de l'utilisateur."""
    from fastapi import HTTPException
    try:
        import uuid
        from sqlalchemy import select
        from app.models.push_subscription import PushSubscription
        from app.services.push_service import send_push_to_user

        user_id = uuid.UUID(payload["sub"])

        result = await db.execute(
            select(PushSubscription).where(PushSubscription.user_id == user_id)
        )
        subs = result.scalars().all()

        if not subs:
            raise HTTPException(
                status_code=400,
                detail="Aucun abonnement push. Active les push sur la page /notifications d'abord.",
            )

        await send_push_to_user(
            db=db,
            user_id=user_id,
            title="🔔 Test push SmarterBloggers",
            body="Les notifications push fonctionnent correctement !",
            url="/notifications",
        )
        return {"ok": True, "subscriptions": len(subs)}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"{type(exc).__name__}: {exc}",
        )


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


@router.post("/2fa/login", response_model=LoginResponse)
async def login_with_2fa(
    body: TwoFALoginRequest,
    request: Request,
    response: Response,
    db: DBSession,
):
    """Complète la connexion pour un compte avec 2FA activé."""
    from sqlalchemy import select
    from app.models.user import User
    from app.core.security import decrypt_value, verify_totp
    from app.services.auth_service import _issue_tokens

    try:
        firebase_data = await verify_firebase_id_token(body.firebase_id_token)
    except Exception:
        raise UnauthorizedException("Firebase token invalide.")

    result = await db.execute(
        select(User).where(User.firebase_uid == firebase_data["uid"])
    )
    user = result.scalar_one_or_none()

    if not user or not user.two_fa_enabled or not user.two_fa_secret_enc:
        raise UnauthorizedException("Compte introuvable ou 2FA non activé.")

    # Vérifie le code TOTP
    secret = decrypt_value(user.two_fa_secret_enc)
    if not verify_totp(secret, body.code.strip()):
        # Tentative sur les backup codes
        if not check_backup_code(user, body.code.strip()):
            raise ValidationException("Code 2FA invalide.")

    tenant_id = str(request.state.tenant_id) if getattr(request.state, "tenant_id", None) else None
    issued = await _issue_tokens(db, user, preferred_tenant_id=tenant_id)
    refresh_plain = getattr(issued, "_refresh_token", None)
    if refresh_plain:
        _set_refresh_cookie(response, refresh_plain)
    return issued


# ── Authentification native (email/mot de passe, sans Firebase) ───
# Firebase reste utilisé uniquement pour la connexion Google (POST /auth/login).

@router.post("/register", status_code=201)
async def register(body: RegisterRequest, db: DBSession):
    """Inscription native — crée le compte et envoie l'email de vérification
    (Resend). Ne connecte pas immédiatement, voir /auth/login-password."""
    await register_with_password(
        db,
        email=body.email,
        password=body.password,
        display_name=body.display_name,
        referral_code=body.referral_code,
        locale=body.locale,
    )
    return {"message": "Compte créé. Vérifiez votre boîte mail pour activer votre compte."}


@router.post("/login-password", response_model=LoginResponse)
async def login_password(
    body: LoginPasswordRequest,
    request: Request,
    response: Response,
    db: DBSession,
):
    """Connexion native (email/mot de passe géré par notre backend)."""
    tenant_id = str(request.state.tenant_id) if getattr(request.state, "tenant_id", None) else None
    ip = request.client.host if request.client else None

    result = await login_with_password(
        db, email=body.email, password=body.password, ip_address=ip, tenant_id=tenant_id,
    )

    from app.services.log_service import log_event
    await log_event(db, "user.login", actor_email=body.email, level="info", details="provider=password", ip=ip)

    refresh_plain = getattr(result, "_refresh_token", None)
    if refresh_plain:
        _set_refresh_cookie(response, refresh_plain)
    return result


@router.post("/2fa/login-password", response_model=LoginResponse)
async def login_2fa_password(
    body: TwoFALoginPasswordRequest,
    request: Request,
    response: Response,
    db: DBSession,
):
    """Complète la connexion native pour un compte avec 2FA activé."""
    tenant_id = str(request.state.tenant_id) if getattr(request.state, "tenant_id", None) else None
    result = await complete_2fa_login_native(
        db, challenge_token=body.challenge_token, code=body.code, tenant_id=tenant_id,
    )
    refresh_plain = getattr(result, "_refresh_token", None)
    if refresh_plain:
        _set_refresh_cookie(response, refresh_plain)
    return result


@router.post("/verify-email", status_code=200)
async def verify_email(body: VerifyEmailRequest, db: DBSession):
    await verify_email_token(db, body.token)
    return {"message": "Email vérifié avec succès."}


@router.get("/email-verified-status")
async def email_verified_status(email: str, db: DBSession):
    """Sondé par l'écran 'vérifiez votre boîte mail' pour rediriger
    automatiquement vers la connexion dès que le lien est cliqué (dans un
    autre onglet). Ne révèle jamais si le compte existe — seulement un booléen."""
    from sqlalchemy import select
    from app.models.user import User
    result = await db.execute(select(User.email_verified).where(User.email == email))
    verified = result.scalar_one_or_none()
    return {"verified": bool(verified)}


@router.post("/resend-verification", status_code=200)
async def resend_verification(body: ResendVerificationRequest, db: DBSession):
    await resend_verification_email(db, body.email, locale=body.locale)
    return {"message": "Si ce compte existe, un email de vérification a été envoyé."}


@router.post("/forgot-password", status_code=200)
async def forgot_password(body: ForgotPasswordRequest, db: DBSession):
    await request_password_reset(db, body.email, locale=body.locale)
    return {"message": "Si ce compte existe, un email de réinitialisation a été envoyé."}


@router.post("/reset-password", status_code=200)
async def reset_password(body: ResetPasswordRequest, db: DBSession):
    await reset_password_with_token(db, body.token, body.new_password)
    return {"message": "Mot de passe réinitialisé avec succès."}
