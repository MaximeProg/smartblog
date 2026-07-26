"""OAuth flows for social platform connections.

Redirect URIs registered with each provider (fixed, already communicated
externally — do not change the `{platform}/callback` path segment without
re-registering with every provider):

  https://{PLATFORM_API_DOMAIN}/api/v1/oauth/facebook/callback
  https://{PLATFORM_API_DOMAIN}/api/v1/oauth/instagram/callback
  https://{PLATFORM_API_DOMAIN}/api/v1/oauth/linkedin/callback
  https://{PLATFORM_API_DOMAIN}/api/v1/oauth/x/callback
  https://{PLATFORM_API_DOMAIN}/api/v1/oauth/tiktok/callback
  https://{PLATFORM_API_DOMAIN}/api/v1/oauth/threads/callback
  https://{PLATFORM_API_DOMAIN}/api/v1/oauth/pinterest/callback
  https://{PLATFORM_API_DOMAIN}/api/v1/oauth/youtube/callback
  https://{PLATFORM_API_DOMAIN}/api/v1/oauth/google-business/callback

Connect / disconnect / refresh are internal endpoints (only our own frontend
calls them) — tenant is passed as `?tenant_id=` and authorized the same way
as every other tenant-scoped route (`_assert_role` against `TenantUser`),
not trusted from a JWT claim.

Note technique — YouTube : l'API publique YouTube Data v3 n'expose aucun
endpoint pour créer un post "Communauté" (Community tab). La connexion du
compte est donc fonctionnelle (identification de la chaîne), mais la
publication automatique d'un article n'est pas réalisable via l'API
publique tant que Google n'expose pas cet endpoint.
"""
from __future__ import annotations

import base64
import hashlib
import secrets
import time
import uuid

import httpx
from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse

from jose import JWTError, jwt
from sqlalchemy import select

from app.core.config import settings
from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import ValidationException, NotFoundException
from app.core.redis_client import redis, key_oauth_pkce, key_oauth_state
from app.core.security import encrypt_value, decrypt_value
from app.models.enums import SocialPlatform, UserRole
from app.models.social import SocialAccount
from app.api.v1.tenants import _assert_role

router = APIRouter(prefix="/oauth", tags=["oauth"])

_STATE_TTL = 600  # 10 minutes

# Slug externe (registré chez le fournisseur) → valeur interne (enum SocialPlatform)
_ALIASES = {
    "x": "twitter",
    "youtube": "youtube_community",
    "google-business": "google_business",
}
# Valeur interne → slug externe (pour construire un redirect_uri toujours identique
# à celui enregistré, quel que soit le slug utilisé par l'appelant)
_EXTERNAL_SLUG = {v: k for k, v in _ALIASES.items()}

_PLATFORMS = [
    "facebook", "linkedin", "twitter", "tiktok", "instagram",
    "threads", "pinterest", "youtube_community", "google_business",
]


def _to_internal(platform: str) -> str:
    return _ALIASES.get(platform, platform)


def _to_external(internal: str) -> str:
    return _EXTERNAL_SLUG.get(internal, internal)


# ── State helpers ─────────────────────────────────────────────────────────────

def _make_state(tenant_id: str, user_id: str, platform: str, locale: str) -> str:
    payload = {
        "tid": tenant_id,
        "uid": user_id,
        "p": platform,
        "loc": locale,
        "exp": int(time.time()) + _STATE_TTL,
    }
    return jwt.encode(payload, settings.APP_SECRET_KEY, algorithm="HS256")


def _decode_state(state: str) -> dict:
    try:
        return jwt.decode(state, settings.APP_SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        raise ValidationException("Invalid or expired OAuth state")


def _state_hash(state: str) -> str:
    return hashlib.sha256(state.encode()).hexdigest()[:24]


def _callback_url(internal_platform: str) -> str:
    external = _to_external(internal_platform)
    return f"https://{settings.PLATFORM_API_DOMAIN}/api/v1/oauth/{external}/callback"


def _dashboard_url(tenant_id: str, internal_platform: str, locale: str) -> str:
    return f"{settings.FRONTEND_URL}/{locale}/blogs/{tenant_id}/social?connected={internal_platform}"


def _dashboard_error_url(tenant_id: str, locale: str, error: str) -> str:
    return f"{settings.FRONTEND_URL}/{locale}/blogs/{tenant_id}/social?error={error}"


def _pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge


async def _require_admin(db, tenant_id: uuid.UUID, payload: dict) -> None:
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)


# ── Connect ───────────────────────────────────────────────────────────────────

@router.get("/{platform}/connect")
async def get_connect_url(
    platform: str,
    payload: TokenPayload,
    db: DBSession,
    tenant_id: uuid.UUID = Query(...),
    locale: str = Query(default="en"),
):
    await _require_admin(db, tenant_id, payload)

    internal = _to_internal(platform)
    if internal not in _PLATFORMS:
        raise ValidationException(f"Platform '{platform}' not supported")

    state = _make_state(str(tenant_id), payload["sub"], internal, locale)
    sh = _state_hash(state)
    cb = _callback_url(internal)

    if internal == "facebook":
        if not settings.FACEBOOK_APP_ID:
            raise ValidationException("Facebook app not configured")
        url = (
            f"https://www.facebook.com/v22.0/dialog/oauth"
            f"?client_id={settings.FACEBOOK_APP_ID}"
            f"&redirect_uri={cb}"
            f"&scope=pages_manage_posts,pages_read_engagement,public_profile"
            f"&state={state}"
        )

    elif internal == "linkedin":
        if not settings.LINKEDIN_CLIENT_ID:
            raise ValidationException("LinkedIn app not configured")
        url = (
            f"https://www.linkedin.com/oauth/v2/authorization"
            f"?response_type=code"
            f"&client_id={settings.LINKEDIN_CLIENT_ID}"
            f"&redirect_uri={cb}"
            f"&scope=openid+profile+email+w_member_social"
            f"&state={state}"
        )

    elif internal == "twitter":
        if not settings.TWITTER_CLIENT_ID:
            raise ValidationException("Twitter/X app not configured")
        verifier, challenge = _pkce_pair()
        await redis.setex(key_oauth_pkce(sh), _STATE_TTL, verifier)
        url = (
            f"https://twitter.com/i/oauth2/authorize"
            f"?response_type=code"
            f"&client_id={settings.TWITTER_CLIENT_ID}"
            f"&redirect_uri={cb}"
            f"&scope=tweet.read+tweet.write+users.read+offline.access"
            f"&state={state}"
            f"&code_challenge={challenge}"
            f"&code_challenge_method=S256"
        )

    elif internal == "tiktok":
        if not settings.TIKTOK_CLIENT_KEY:
            raise ValidationException("TikTok app not configured")
        url = (
            f"https://www.tiktok.com/v2/auth/authorize/"
            f"?client_key={settings.TIKTOK_CLIENT_KEY}"
            f"&redirect_uri={cb}"
            f"&scope=user.info.basic,video.list"
            f"&response_type=code"
            f"&state={state}"
        )

    elif internal == "instagram":
        if not settings.INSTAGRAM_APP_ID:
            raise ValidationException("Instagram app not configured")
        url = (
            f"https://www.instagram.com/oauth/authorize"
            f"?client_id={settings.INSTAGRAM_APP_ID}"
            f"&redirect_uri={cb}"
            f"&scope=instagram_business_basic,instagram_business_content_publish"
            f"&response_type=code"
            f"&state={state}"
        )

    elif internal == "threads":
        if not settings.THREADS_APP_ID:
            raise ValidationException("Threads app not configured")
        url = (
            f"https://threads.net/oauth/authorize"
            f"?client_id={settings.THREADS_APP_ID}"
            f"&redirect_uri={cb}"
            f"&scope=threads_basic,threads_content_publish"
            f"&response_type=code"
            f"&state={state}"
        )

    elif internal == "pinterest":
        if not settings.PINTEREST_APP_ID:
            raise ValidationException("Pinterest app not configured")
        url = (
            f"https://www.pinterest.com/oauth/"
            f"?client_id={settings.PINTEREST_APP_ID}"
            f"&redirect_uri={cb}"
            f"&scope=boards:read,pins:read,pins:write"
            f"&response_type=code"
            f"&state={state}"
        )

    elif internal == "youtube_community":
        if not settings.GOOGLE_CLIENT_ID:
            raise ValidationException("Google app not configured")
        url = (
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={settings.GOOGLE_CLIENT_ID}"
            f"&redirect_uri={cb}"
            f"&response_type=code"
            f"&access_type=offline&prompt=consent"
            f"&scope=https://www.googleapis.com/auth/youtube.readonly"
            f"&state={state}"
        )

    elif internal == "google_business":
        if not settings.GOOGLE_CLIENT_ID:
            raise ValidationException("Google app not configured")
        url = (
            f"https://accounts.google.com/o/oauth2/v2/auth"
            f"?client_id={settings.GOOGLE_CLIENT_ID}"
            f"&redirect_uri={cb}"
            f"&response_type=code"
            f"&access_type=offline&prompt=consent"
            f"&scope=https://www.googleapis.com/auth/business.manage"
            f"&state={state}"
        )

    else:
        raise ValidationException(f"Platform '{platform}' not supported")

    return {"url": url}


# ── Callback ──────────────────────────────────────────────────────────────────

@router.get("/{platform}/callback")
async def oauth_callback(
    platform: str,
    db: DBSession,
    code: str | None = Query(default=None),
    state: str = Query(...),
    error: str | None = Query(default=None),
):
    try:
        claims = _decode_state(state)
        tenant_id = uuid.UUID(claims["tid"])
        locale = claims.get("loc", "en")
    except Exception:
        return RedirectResponse(f"{settings.FRONTEND_URL}/en/blogs?social_error=invalid_state")

    if error or not code:
        return RedirectResponse(_dashboard_error_url(str(tenant_id), locale, error or "no_code"))

    user_id = uuid.UUID(claims["uid"])
    internal = claims["p"]
    sh = _state_hash(state)

    try:
        if internal == "facebook":
            account_data = await _handle_facebook(code)
        elif internal == "linkedin":
            account_data = await _handle_linkedin(code)
        elif internal == "twitter":
            account_data = await _handle_twitter(code, sh)
        elif internal == "tiktok":
            account_data = await _handle_tiktok(code)
        elif internal == "instagram":
            account_data = await _handle_instagram(code)
        elif internal == "threads":
            account_data = await _handle_threads(code)
        elif internal == "pinterest":
            account_data = await _handle_pinterest(code)
        elif internal == "youtube_community":
            account_data = await _handle_youtube(code)
        elif internal == "google_business":
            account_data = await _handle_google_business(code)
        else:
            return RedirectResponse(_dashboard_error_url(str(tenant_id), locale, "unsupported"))
    except Exception:
        return RedirectResponse(_dashboard_error_url(str(tenant_id), locale, "oauth_failed"))

    existing = await db.execute(
        select(SocialAccount).where(
            SocialAccount.tenant_id == tenant_id,
            SocialAccount.platform == SocialPlatform(internal),
            SocialAccount.platform_user_id == account_data["platform_user_id"],
        )
    )
    acct = existing.scalar_one_or_none()
    if acct:
        acct.access_token_enc = encrypt_value(account_data["access_token"])
        if account_data.get("refresh_token"):
            acct.refresh_token_enc = encrypt_value(account_data["refresh_token"])
        acct.platform_username = account_data.get("username")
        acct.platform_display_name = account_data.get("display_name")
        acct.platform_avatar_url = account_data.get("avatar_url")
        acct.is_active = True
    else:
        acct = SocialAccount(
            tenant_id=tenant_id,
            connected_by=user_id,
            platform=SocialPlatform(internal),
            platform_user_id=account_data["platform_user_id"],
            platform_username=account_data.get("username"),
            platform_display_name=account_data.get("display_name"),
            platform_avatar_url=account_data.get("avatar_url"),
            access_token_enc=encrypt_value(account_data["access_token"]),
            refresh_token_enc=encrypt_value(account_data["refresh_token"]) if account_data.get("refresh_token") else None,
            scopes=account_data.get("scopes"),
        )
        db.add(acct)

    await db.commit()
    return RedirectResponse(_dashboard_url(str(tenant_id), internal, locale))


# ── Disconnect ────────────────────────────────────────────────────────────────

@router.post("/{platform}/disconnect", status_code=204)
async def oauth_disconnect(
    platform: str,
    payload: TokenPayload,
    db: DBSession,
    tenant_id: uuid.UUID = Query(...),
):
    await _require_admin(db, tenant_id, payload)
    internal = _to_internal(platform)

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.tenant_id == tenant_id,
            SocialAccount.platform == SocialPlatform(internal),
            SocialAccount.is_active == True,
        )
    )
    accounts = result.scalars().all()
    if not accounts:
        raise NotFoundException("Social account")
    for acct in accounts:
        acct.is_active = False
    await db.commit()


# ── Refresh ───────────────────────────────────────────────────────────────────

@router.post("/{platform}/refresh")
async def oauth_refresh(
    platform: str,
    payload: TokenPayload,
    db: DBSession,
    tenant_id: uuid.UUID = Query(...),
):
    await _require_admin(db, tenant_id, payload)
    internal = _to_internal(platform)

    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.tenant_id == tenant_id,
            SocialAccount.platform == SocialPlatform(internal),
            SocialAccount.is_active == True,
        )
    )
    accounts = result.scalars().all()
    if not accounts:
        raise NotFoundException("Social account")

    refreshed = 0
    for acct in accounts:
        new_tokens = await _refresh_account(internal, acct)
        if new_tokens:
            acct.access_token_enc = encrypt_value(new_tokens["access_token"])
            if new_tokens.get("refresh_token"):
                acct.refresh_token_enc = encrypt_value(new_tokens["refresh_token"])
            refreshed += 1

    await db.commit()
    if not refreshed:
        raise ValidationException("Unable to refresh this account — reconnection required.")
    return {"refreshed": refreshed}


async def _refresh_account(internal: str, acct: SocialAccount) -> dict | None:
    async with httpx.AsyncClient(timeout=15) as client:
        if internal == "facebook":
            if not acct.access_token_enc:
                return None
            current = decrypt_value(acct.access_token_enc)
            resp = await client.get(
                "https://graph.facebook.com/v22.0/oauth/access_token",
                params={
                    "grant_type": "fb_exchange_token",
                    "client_id": settings.FACEBOOK_APP_ID,
                    "client_secret": settings.FACEBOOK_APP_SECRET,
                    "fb_exchange_token": current,
                },
            )
            if resp.status_code != 200:
                return None
            return {"access_token": resp.json()["access_token"]}

        if internal in ("instagram", "threads"):
            if not acct.access_token_enc:
                return None
            current = decrypt_value(acct.access_token_enc)
            host = "graph.instagram.com" if internal == "instagram" else "graph.threads.net"
            grant = "ig_refresh_token" if internal == "instagram" else "th_refresh_token"
            resp = await client.get(
                f"https://{host}/refresh_access_token",
                params={"grant_type": grant, "access_token": current},
            )
            if resp.status_code != 200:
                return None
            return {"access_token": resp.json()["access_token"]}

        if not acct.refresh_token_enc:
            return None
        refresh_token = decrypt_value(acct.refresh_token_enc)

        if internal == "linkedin":
            resp = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": settings.LINKEDIN_CLIENT_ID,
                    "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        elif internal == "twitter":
            credentials = base64.b64encode(
                f"{settings.TWITTER_CLIENT_ID}:{settings.TWITTER_CLIENT_SECRET}".encode()
            ).decode()
            resp = await client.post(
                "https://api.twitter.com/2/oauth2/token",
                data={"grant_type": "refresh_token", "refresh_token": refresh_token},
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            )
        elif internal == "tiktok":
            resp = await client.post(
                "https://open.tiktokapis.com/v2/oauth/token/",
                data={
                    "client_key": settings.TIKTOK_CLIENT_KEY,
                    "client_secret": settings.TIKTOK_CLIENT_SECRET,
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        elif internal == "pinterest":
            credentials = base64.b64encode(
                f"{settings.PINTEREST_APP_ID}:{settings.PINTEREST_APP_SECRET}".encode()
            ).decode()
            resp = await client.post(
                "https://api.pinterest.com/v5/oauth/token",
                data={"grant_type": "refresh_token", "refresh_token": refresh_token},
                headers={
                    "Authorization": f"Basic {credentials}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            )
        elif internal in ("youtube_community", "google_business"):
            resp = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": settings.GOOGLE_CLIENT_ID,
                    "client_secret": settings.GOOGLE_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
        else:
            return None

        if resp.status_code != 200:
            return None
        tokens = resp.json()
        return {
            "access_token": tokens["access_token"],
            "refresh_token": tokens.get("refresh_token"),
        }


# ── Per-platform handlers (connect exchange) ──────────────────────────────────

async def _handle_facebook(code: str) -> dict:
    cb = _callback_url("facebook")
    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.get(
            "https://graph.facebook.com/v22.0/oauth/access_token",
            params={
                "client_id": settings.FACEBOOK_APP_ID,
                "client_secret": settings.FACEBOOK_APP_SECRET,
                "redirect_uri": cb,
                "code": code,
            },
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()
        access_token = tokens["access_token"]

        me_resp = await client.get(
            "https://graph.facebook.com/v22.0/me",
            params={"fields": "id,name,picture", "access_token": access_token},
        )
        me = me_resp.json()

        pages_resp = await client.get(
            "https://graph.facebook.com/v22.0/me/accounts",
            params={"access_token": access_token},
        )
        pages = pages_resp.json().get("data", [])
        if pages:
            page = pages[0]
            return {
                "platform_user_id": page["id"],
                "username": page.get("name"),
                "display_name": page.get("name"),
                "avatar_url": me.get("picture", {}).get("data", {}).get("url"),
                "access_token": page["access_token"],
                "scopes": ["pages_manage_posts", "pages_read_engagement"],
            }

        return {
            "platform_user_id": me["id"],
            "username": me.get("name"),
            "display_name": me.get("name"),
            "avatar_url": me.get("picture", {}).get("data", {}).get("url"),
            "access_token": access_token,
            "scopes": ["public_profile"],
        }


async def _handle_linkedin(code: str) -> dict:
    cb = _callback_url("linkedin")
    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.post(
            "https://www.linkedin.com/oauth/v2/accessToken",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": cb,
                "client_id": settings.LINKEDIN_CLIENT_ID,
                "client_secret": settings.LINKEDIN_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()
        access_token = tokens["access_token"]

        me_resp = await client.get(
            "https://api.linkedin.com/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        me = me_resp.json()

        return {
            "platform_user_id": me["sub"],
            "username": None,
            "display_name": me.get("name") or me["sub"],
            "avatar_url": me.get("picture"),
            "access_token": access_token,
            "refresh_token": tokens.get("refresh_token"),
            "scopes": ["openid", "profile", "email", "w_member_social"],
        }


async def _handle_twitter(code: str, sh: str) -> dict:
    cb = _callback_url("twitter")
    verifier = await redis.get(key_oauth_pkce(sh))
    if not verifier:
        raise ValueError("PKCE verifier expired or missing")
    await redis.delete(key_oauth_pkce(sh))

    credentials = base64.b64encode(
        f"{settings.TWITTER_CLIENT_ID}:{settings.TWITTER_CLIENT_SECRET}".encode()
    ).decode()

    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.post(
            "https://api.twitter.com/2/oauth2/token",
            data={
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": cb,
                "code_verifier": verifier,
            },
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()
        access_token = tokens["access_token"]

        me_resp = await client.get(
            "https://api.twitter.com/2/users/me",
            params={"user.fields": "profile_image_url,name,username"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        me = me_resp.json().get("data", {})

    return {
        "platform_user_id": me.get("id", ""),
        "username": me.get("username"),
        "display_name": me.get("name"),
        "avatar_url": me.get("profile_image_url"),
        "access_token": access_token,
        "refresh_token": tokens.get("refresh_token"),
        "scopes": tokens.get("scope", "").split(),
    }


async def _handle_tiktok(code: str) -> dict:
    cb = _callback_url("tiktok")
    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.post(
            "https://open.tiktokapis.com/v2/oauth/token/",
            data={
                "client_key": settings.TIKTOK_CLIENT_KEY,
                "client_secret": settings.TIKTOK_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": cb,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_resp.raise_for_status()
        tokens = token_resp.json().get("data", token_resp.json())
        access_token = tokens["access_token"]

        me_resp = await client.get(
            "https://open.tiktokapis.com/v2/user/info/",
            params={"fields": "open_id,union_id,display_name,avatar_url"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        me = me_resp.json().get("data", {}).get("user", {})

    return {
        "platform_user_id": me.get("open_id") or me.get("union_id", ""),
        "username": me.get("display_name"),
        "display_name": me.get("display_name"),
        "avatar_url": me.get("avatar_url"),
        "access_token": access_token,
        "refresh_token": tokens.get("refresh_token"),
        "scopes": ["user.info.basic", "video.list"],
    }


async def _handle_instagram(code: str) -> dict:
    cb = _callback_url("instagram")
    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.post(
            "https://api.instagram.com/oauth/access_token",
            data={
                "client_id": settings.INSTAGRAM_APP_ID,
                "client_secret": settings.INSTAGRAM_APP_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": cb,
                "code": code,
            },
        )
        token_resp.raise_for_status()
        short = token_resp.json()
        short_token = short["access_token"]
        ig_user_id = str(short["user_id"])

        long_resp = await client.get(
            "https://graph.instagram.com/access_token",
            params={
                "grant_type": "ig_exchange_token",
                "client_secret": settings.INSTAGRAM_APP_SECRET,
                "access_token": short_token,
            },
        )
        long_resp.raise_for_status()
        access_token = long_resp.json()["access_token"]

        me_resp = await client.get(
            "https://graph.instagram.com/me",
            params={"fields": "id,username,profile_picture_url", "access_token": access_token},
        )
        me = me_resp.json()

    return {
        "platform_user_id": ig_user_id,
        "username": me.get("username"),
        "display_name": me.get("username"),
        "avatar_url": me.get("profile_picture_url"),
        "access_token": access_token,
        "scopes": ["user_profile", "user_media"],
    }


async def _handle_threads(code: str) -> dict:
    cb = _callback_url("threads")
    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.post(
            "https://graph.threads.net/oauth/access_token",
            data={
                "client_id": settings.THREADS_APP_ID,
                "client_secret": settings.THREADS_APP_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": cb,
                "code": code,
            },
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()
        access_token = tokens["access_token"]
        user_id = str(tokens["user_id"])

        ll_resp = await client.get(
            "https://graph.threads.net/access_token",
            params={
                "grant_type": "th_exchange_token",
                "client_secret": settings.THREADS_APP_SECRET,
                "access_token": access_token,
            },
        )
        if ll_resp.status_code == 200:
            access_token = ll_resp.json().get("access_token", access_token)

        me_resp = await client.get(
            f"https://graph.threads.net/v1.0/{user_id}",
            params={"fields": "id,username,threads_profile_picture_url", "access_token": access_token},
        )
        me = me_resp.json()

    return {
        "platform_user_id": user_id,
        "username": me.get("username"),
        "display_name": me.get("username"),
        "avatar_url": me.get("threads_profile_picture_url"),
        "access_token": access_token,
        "scopes": ["threads_basic", "threads_content_publish"],
    }


async def _handle_pinterest(code: str) -> dict:
    cb = _callback_url("pinterest")
    credentials = base64.b64encode(
        f"{settings.PINTEREST_APP_ID}:{settings.PINTEREST_APP_SECRET}".encode()
    ).decode()
    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.post(
            "https://api.pinterest.com/v5/oauth/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": cb,
            },
            headers={
                "Authorization": f"Basic {credentials}",
                "Content-Type": "application/x-www-form-urlencoded",
            },
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()
        access_token = tokens["access_token"]

        me_resp = await client.get(
            "https://api.pinterest.com/v5/user_account",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        me = me_resp.json()

    return {
        "platform_user_id": me.get("username", ""),
        "username": me.get("username"),
        "display_name": me.get("display_name") or me.get("username"),
        "avatar_url": me.get("profile_image"),
        "access_token": access_token,
        "refresh_token": tokens.get("refresh_token"),
        "scopes": ["boards:read", "pins:read", "pins:write"],
    }


async def _handle_youtube(code: str) -> dict:
    cb = _callback_url("youtube_community")
    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": cb,
                "code": code,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()
        access_token = tokens["access_token"]

        me_resp = await client.get(
            "https://www.googleapis.com/youtube/v3/channels",
            params={"part": "snippet", "mine": "true"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        items = me_resp.json().get("items", [])
        channel = items[0] if items else {}
        snippet = channel.get("snippet", {})

    return {
        "platform_user_id": channel.get("id", ""),
        "username": snippet.get("customUrl") or snippet.get("title"),
        "display_name": snippet.get("title"),
        "avatar_url": (snippet.get("thumbnails", {}).get("default", {}) or {}).get("url"),
        "access_token": access_token,
        "refresh_token": tokens.get("refresh_token"),
        "scopes": ["youtube.readonly"],
    }


async def _handle_google_business(code: str) -> dict:
    cb = _callback_url("google_business")
    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "redirect_uri": cb,
                "code": code,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        token_resp.raise_for_status()
        tokens = token_resp.json()
        access_token = tokens["access_token"]

        accounts_resp = await client.get(
            "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        accounts = accounts_resp.json().get("accounts", []) if accounts_resp.status_code == 200 else []
        account = accounts[0] if accounts else {}

    return {
        "platform_user_id": account.get("name", ""),
        "username": account.get("accountName"),
        "display_name": account.get("accountName"),
        "avatar_url": account.get("profilePhotoUri"),
        "access_token": access_token,
        "refresh_token": tokens.get("refresh_token"),
        "scopes": ["business.manage"],
    }
