"""Marge plateforme appliquée aux prix registrar — configurable depuis le
Super Admin (platform:settings en Redis), pas un .env figé. Même mécanisme
que les autres réglages plateforme (voir app/api/v1/superadmin.py
get_platform_settings/update_platform_settings)."""
import json

DEFAULT_MARKUP_PERCENT = 20.0


async def get_domain_markup_percent() -> float:
    from app.core.redis_client import redis
    try:
        raw = await redis.get("platform:settings")
        overrides = json.loads(raw) if raw else {}
        value = overrides.get("domain_markup_percent")
        return float(value) if value is not None else DEFAULT_MARKUP_PERCENT
    except Exception:
        return DEFAULT_MARKUP_PERCENT


async def apply_markup(registrar_price: float) -> float:
    markup = await get_domain_markup_percent()
    return round(registrar_price * (1 + markup / 100), 2)
