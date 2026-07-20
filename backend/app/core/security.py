import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt
from app.core.config import settings
from app.core.redis_client import (
    redis, key_jwt_blacklist, key_refresh_token,
    key_email_verification, key_password_reset, key_2fa_challenge,
)


# ── JWT ────────────────────────────────────────────────────────────

def create_access_token(
    user_id: str,
    tenant_id: str,
    role: str,
    email: str,
    is_super_admin: bool = False,
) -> tuple[str, str, datetime]:
    """
    Crée un JWT signé.
    Retourne (token, jti, expiry_datetime).
    """
    jti = str(uuid.uuid4())
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
    )
    payload = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "role": role,
        "email": email,
        "is_super_admin": is_super_admin,
        "jti": jti,
        "iat": datetime.now(timezone.utc),
        "exp": expire,
    }
    token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return token, jti, expire


def decode_access_token(token: str) -> dict:
    """Décode et vérifie un JWT. Lève JWTError si invalide."""
    return jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


async def is_token_blacklisted(jti: str) -> bool:
    try:
        result = await redis.get(key_jwt_blacklist(jti))
        return result is not None
    except Exception:
        # Redis unavailable — assume token is valid (fail open)
        return False


async def blacklist_token(jti: str, expire: datetime) -> None:
    ttl = int((expire - datetime.now(timezone.utc)).total_seconds())
    if ttl > 0:
        try:
            await redis.setex(key_jwt_blacklist(jti), ttl, "1")
        except Exception:
            pass


# ── Refresh Tokens ─────────────────────────────────────────────────

def generate_refresh_token() -> tuple[str, str]:
    """
    Génère un refresh token.
    Retourne (token_plain, token_hash).
    Le token_plain est envoyé au client (cookie).
    Le token_hash est stocké dans Redis + DB.
    """
    token_plain = secrets.token_urlsafe(64)
    token_hash = hashlib.sha256(token_plain.encode()).hexdigest()
    return token_plain, token_hash


async def store_refresh_token(
    token_hash: str,
    user_id: str,
    tenant_id: str,
    role: str,
) -> None:
    import json
    ttl = settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600
    payload = json.dumps({
        "user_id": user_id,
        "tenant_id": tenant_id,
        "role": role,
    })
    try:
        await redis.setex(key_refresh_token(token_hash), ttl, payload)
    except Exception:
        # Redis unavailable — login still works, refresh tokens won't persist
        pass


async def get_refresh_token_data(token_plain: str) -> dict | None:
    import json
    token_hash = hashlib.sha256(token_plain.encode()).hexdigest()
    try:
        data = await redis.get(key_refresh_token(token_hash))
    except Exception:
        return None
    if data is None:
        return None
    return json.loads(data)


async def revoke_refresh_token(token_plain: str) -> None:
    token_hash = hashlib.sha256(token_plain.encode()).hexdigest()
    try:
        await redis.delete(key_refresh_token(token_hash))
    except Exception:
        pass


async def revoke_all_user_tokens(user_id: str) -> None:
    """Révoque tous les refresh tokens d'un utilisateur (scan Redis par pattern)."""
    # En production, on préférera une table DB pour l'index user_id → tokens
    # Pour l'instant, on passe par la DB (voir auth service)
    pass


# ── Mot de passe (authentification native, sans Firebase) ─────────
# bcrypt directement (pas passlib — sa détection de version de bcrypt est
# cassée avec bcrypt>=4.1, cf. "module 'bcrypt' has no attribute '__about__'").
# bcrypt limite les mots de passe à 72 octets : tronqué explicitement pour que
# hash et vérification restent cohérents (pas une régression, une limite
# inhérente à l'algorithme).

def hash_password(plain: str) -> str:
    truncated = plain.encode("utf-8")[:72]
    return bcrypt.hashpw(truncated, bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        truncated = plain.encode("utf-8")[:72]
        return bcrypt.checkpw(truncated, hashed.encode("utf-8"))
    except Exception:
        return False


# ── Tokens éphémères à usage unique (vérification email, reset password,
# challenge 2FA) — même construction que les refresh tokens : token opaque
# côté client, hash SHA256 stocké dans Redis avec TTL. ──────────────

def _generate_opaque_token() -> tuple[str, str]:
    token_plain = secrets.token_urlsafe(48)
    token_hash = hashlib.sha256(token_plain.encode()).hexdigest()
    return token_plain, token_hash


async def _store_opaque_token(redis_key: str, ttl_seconds: int, payload: dict) -> None:
    import json
    try:
        await redis.setex(redis_key, ttl_seconds, json.dumps(payload))
    except Exception:
        pass


async def _get_opaque_token_data(redis_key: str) -> dict | None:
    import json
    try:
        data = await redis.get(redis_key)
    except Exception:
        return None
    return json.loads(data) if data else None


async def _delete_opaque_token(redis_key: str) -> None:
    try:
        await redis.delete(redis_key)
    except Exception:
        pass


async def create_email_verification_token(user_id: str) -> str:
    token_plain, token_hash = _generate_opaque_token()
    await _store_opaque_token(key_email_verification(token_hash), 24 * 3600, {"user_id": user_id})
    return token_plain


async def consume_email_verification_token(token_plain: str) -> str | None:
    """Retourne le user_id et invalide le token (usage unique), ou None si invalide/expiré."""
    token_hash = hashlib.sha256(token_plain.encode()).hexdigest()
    data = await _get_opaque_token_data(key_email_verification(token_hash))
    if not data:
        return None
    await _delete_opaque_token(key_email_verification(token_hash))
    return data["user_id"]


async def create_password_reset_token(user_id: str) -> str:
    token_plain, token_hash = _generate_opaque_token()
    await _store_opaque_token(key_password_reset(token_hash), 3600, {"user_id": user_id})
    return token_plain


async def consume_password_reset_token(token_plain: str) -> str | None:
    token_hash = hashlib.sha256(token_plain.encode()).hexdigest()
    data = await _get_opaque_token_data(key_password_reset(token_hash))
    if not data:
        return None
    await _delete_opaque_token(key_password_reset(token_hash))
    return data["user_id"]


async def create_2fa_challenge_token(user_id: str) -> str:
    token_plain, token_hash = _generate_opaque_token()
    await _store_opaque_token(key_2fa_challenge(token_hash), 5 * 60, {"user_id": user_id})
    return token_plain


async def get_2fa_challenge_user_id(token_plain: str) -> str | None:
    """Ne consomme pas le token — un code TOTP erroné doit pouvoir être retenté
    avant expiration, sans redemander le mot de passe."""
    token_hash = hashlib.sha256(token_plain.encode()).hexdigest()
    data = await _get_opaque_token_data(key_2fa_challenge(token_hash))
    return data["user_id"] if data else None


async def delete_2fa_challenge_token(token_plain: str) -> None:
    token_hash = hashlib.sha256(token_plain.encode()).hexdigest()
    await _delete_opaque_token(key_2fa_challenge(token_hash))


# ── Encryption (pour secrets sensibles en DB) ──────────────────────

def encrypt_value(plain: str) -> str:
    """Chiffrement AES-256 pour les tokens OAuth et secrets sensibles."""
    from cryptography.fernet import Fernet
    import base64
    key = base64.urlsafe_b64encode(
        hashlib.sha256(settings.APP_SECRET_KEY.encode()).digest()
    )
    f = Fernet(key)
    return f.encrypt(plain.encode()).decode()


def decrypt_value(encrypted: str) -> str:
    from cryptography.fernet import Fernet
    import base64
    key = base64.urlsafe_b64encode(
        hashlib.sha256(settings.APP_SECRET_KEY.encode()).digest()
    )
    f = Fernet(key)
    return f.decrypt(encrypted.encode()).decode()


# ── TOTP (2FA) ─────────────────────────────────────────────────────

def generate_totp_secret() -> str:
    import pyotp
    return pyotp.random_base32()


def verify_totp(secret: str, code: str) -> bool:
    import pyotp
    totp = pyotp.TOTP(secret)
    return totp.verify(code, valid_window=1)


def generate_totp_uri(secret: str, email: str) -> str:
    import pyotp
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=email, issuer_name="SmarterBloggers")


def generate_backup_codes(count: int = 8) -> list[str]:
    return [
        f"{secrets.token_hex(3).upper()}-{secrets.token_hex(3).upper()}"
        for _ in range(count)
    ]
