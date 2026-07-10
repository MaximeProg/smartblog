"""OAuth flows for social platform connections.

Connect flow:
  GET /tenants/{tenant_id}/social/oauth/{platform}/connect  (auth required)
  → returns { url } for the frontend to redirect to

Callback flow:
  GET /social/oauth/{platform}/callback  (public — called by the platform)
  → exchanges code, saves account, redirects to frontend dashboard
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

from app.core.config import settings
from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import ValidationException
from app.core.redis_client import redis, key_oauth_pkce, key_oauth_state
from app.core.security import encrypt_value
from app.models.enums import SocialPlatform
from app.models.social import SocialAccount
from sqlalchemy import select

router = APIRouter(prefix="/tenants/{tenant_id}/social/oauth", tags=["social-oauth"])
callback_router = APIRouter(prefix="/social/oauth", tags=["social-oauth"])

_PLATFORMS = ["facebook", "linkedin", "twitter", "tiktok"]
_STATE_TTL = 600  # 10 minutes


# ── State helpers ─────────────────────────────────────────────────────────────

def _make_state(tenant_id: str, user_id: str, platform: str) -> str:
    payload = {
        "tid": tenant_id,
        "uid": user_id,
        "p": platform,
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


def _callback_url(platform: str) -> str:
    return f"https://{settings.PLATFORM_API_DOMAIN}/api/v1/social/oauth/{platform}/callback"


def _dashboard_url(tenant_id: str, platform: str) -> str:
    return f"{settings.FRONTEND_URL}/en/blogs/{tenant_id}/social?connected={platform}"


# ── PKCE helpers (Twitter only) ───────────────────────────────────────────────

def _pkce_pair() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(64)
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
    return verifier, challenge


# ── Connect endpoints ─────────────────────────────────────────────────────────

@router.get("/{platform}/connect")
async def get_connect_url(
    tenant_id: uuid.UUID,
    platform: str,
    payload: TokenPayload,
):
    if platform not in _PLATFORMS:
        raise ValidationException(f"Platform '{platform}' not supported")

    state = _make_state(str(tenant_id), payload["sub"], platform)
    sh = _state_hash(state)

    if platform == "facebook":
        if not settings.FACEBOOK_APP_ID:
            raise ValidationException("Facebook app not configured")
        cb = _callback_url("facebook")
        url = (
            f"https://www.facebook.com/v19.0/dialog/oauth"
            f"?client_id={settings.FACEBOOK_APP_ID}"
            f"&redirect_uri={cb}"
            f"&scope=pages_manage_posts,pages_read_engagement,public_profile"
            f"&state={state}"
        )

    elif platform == "linkedin":
        if not settings.LINKEDIN_CLIENT_ID:
            raise ValidationException("LinkedIn app not configured")
        cb = _callback_url("linkedin")
        url = (
            f"https://www.linkedin.com/oauth/v2/authorization"
            f"?response_type=code"
            f"&client_id={settings.LINKEDIN_CLIENT_ID}"
            f"&redirect_uri={cb}"
            f"&scope=w_member_social+r_liteprofile+r_emailaddress"
            f"&state={state}"
        )

    elif platform == "twitter":
        if not settings.TWITTER_CLIENT_ID:
            raise ValidationException("Twitter/X app not configured")
        verifier, challenge = _pkce_pair()
        await redis.setex(key_oauth_pkce(sh), _STATE_TTL, verifier)
        cb = _callback_url("twitter")
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

    elif platform == "tiktok":
        if not settings.TIKTOK_CLIENT_KEY:
            raise ValidationException("TikTok app not configured")
        cb = _callback_url("tiktok")
        url = (
            f"https://www.tiktok.com/v2/auth/authorize/"
            f"?client_key={settings.TIKTOK_CLIENT_KEY}"
            f"&redirect_uri={cb}"
            f"&scope=user.info.basic,video.list"
            f"&response_type=code"
            f"&state={state}"
        )

    return {"url": url}


# ── Callback endpoints ────────────────────────────────────────────────────────

@callback_router.get("/{platform}/callback")
async def oauth_callback(
    platform: str,
    db: DBSession,
    code: str = Query(...),
    state: str = Query(...),
    error: str | None = Query(default=None),
):
    if error:
        return RedirectResponse(f"{settings.FRONTEND_URL}/en/social?error={error}")

    try:
        claims = _decode_state(state)
    except Exception:
        return RedirectResponse(f"{settings.FRONTEND_URL}/en/social?error=invalid_state")

    tenant_id = uuid.UUID(claims["tid"])
    user_id = uuid.UUID(claims["uid"])
    sh = _state_hash(state)

    try:
        if platform == "facebook":
            account_data = await _handle_facebook(code, state, sh)
        elif platform == "linkedin":
            account_data = await _handle_linkedin(code, state, sh)
        elif platform == "twitter":
            account_data = await _handle_twitter(code, state, sh)
        elif platform == "tiktok":
            account_data = await _handle_tiktok(code, state, sh)
        else:
            return RedirectResponse(f"{settings.FRONTEND_URL}/en/social?error=unsupported")
    except Exception as exc:
        return RedirectResponse(f"{settings.FRONTEND_URL}/en/social?error=oauth_failed")

    # Upsert social account
    existing = await db.execute(
        select(SocialAccount).where(
            SocialAccount.tenant_id == tenant_id,
            SocialAccount.platform == SocialPlatform(platform),
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
            platform=SocialPlatform(platform),
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
    return RedirectResponse(_dashboard_url(str(tenant_id), platform))


# ── Per-platform handlers ─────────────────────────────────────────────────────

async def _handle_facebook(code: str, state: str, sh: str) -> dict:
    cb = _callback_url("facebook")
    async with httpx.AsyncClient(timeout=15) as client:
        token_resp = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
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

        # Get user profile (and pages)
        me_resp = await client.get(
            "https://graph.facebook.com/v19.0/me",
            params={"fields": "id,name,picture", "access_token": access_token},
        )
        me = me_resp.json()

        # Try to get the user's first managed page (for posting)
        pages_resp = await client.get(
            "https://graph.facebook.com/v19.0/me/accounts",
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
                "access_token": page["access_token"],  # page-level token
                "scopes": ["pages_manage_posts", "pages_read_engagement"],
            }

        # No pages — store user-level account (can post to personal profile in some regions)
        return {
            "platform_user_id": me["id"],
            "username": me.get("name"),
            "display_name": me.get("name"),
            "avatar_url": me.get("picture", {}).get("data", {}).get("url"),
            "access_token": access_token,
            "scopes": ["public_profile"],
        }


async def _handle_linkedin(code: str, state: str, sh: str) -> dict:
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
            "https://api.linkedin.com/v2/me",
            params={"projection": "(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
        me = me_resp.json()
        first = me.get("localizedFirstName", "")
        last = me.get("localizedLastName", "")
        display_name = f"{first} {last}".strip() or me.get("id", "")

        # Extract avatar
        try:
            elements = me["profilePicture"]["displayImage~"]["elements"]
            avatar_url = elements[-1]["identifiers"][0]["identifier"]
        except (KeyError, IndexError):
            avatar_url = None

        return {
            "platform_user_id": me["id"],
            "username": None,
            "display_name": display_name,
            "avatar_url": avatar_url,
            "access_token": access_token,
            "refresh_token": tokens.get("refresh_token"),
            "scopes": ["w_member_social", "r_liteprofile"],
        }


async def _handle_twitter(code: str, state: str, sh: str) -> dict:
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


async def _handle_tiktok(code: str, state: str, sh: str) -> dict:
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
