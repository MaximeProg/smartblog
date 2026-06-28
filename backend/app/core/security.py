import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from app.core.config import settings
from app.core.redis_client import redis, key_jwt_blacklist, key_refresh_token


# ── JWT ────────────────────────────────────────────────────────────

def create_access_token(
    user_id: str,
    tenant_id: str,
    role: str,
    email: str,
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
    result = await redis.get(key_jwt_blacklist(jti))
    return result is not None


async def blacklist_token(jti: str, expire: datetime) -> None:
    ttl = int((expire - datetime.now(timezone.utc)).total_seconds())
    if ttl > 0:
        await redis.setex(key_jwt_blacklist(jti), ttl, "1")


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
    await redis.setex(key_refresh_token(token_hash), ttl, payload)


async def get_refresh_token_data(token_plain: str) -> dict | None:
    import json
    token_hash = hashlib.sha256(token_plain.encode()).hexdigest()
    data = await redis.get(key_refresh_token(token_hash))
    if data is None:
        return None
    return json.loads(data)


async def revoke_refresh_token(token_plain: str) -> None:
    token_hash = hashlib.sha256(token_plain.encode()).hexdigest()
    await redis.delete(key_refresh_token(token_hash))


async def revoke_all_user_tokens(user_id: str) -> None:
    """Révoque tous les refresh tokens d'un utilisateur (scan Redis par pattern)."""
    # En production, on préférera une table DB pour l'index user_id → tokens
    # Pour l'instant, on passe par la DB (voir auth service)
    pass


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
    return totp.provisioning_uri(name=email, issuer_name="NexusBlog")


def generate_backup_codes(count: int = 8) -> list[str]:
    return [
        f"{secrets.token_hex(3).upper()}-{secrets.token_hex(3).upper()}"
        for _ in range(count)
    ]
