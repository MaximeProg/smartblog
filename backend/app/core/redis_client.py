import redis.asyncio as aioredis
from app.core.config import settings

redis: aioredis.Redis = aioredis.from_url(
    settings.REDIS_URL,
    encoding="utf-8",
    decode_responses=True,
    socket_connect_timeout=2.0,
    socket_timeout=2.0,
)


async def get_redis() -> aioredis.Redis:
    return redis


# ── Clés Redis (centralisées pour éviter les typos) ───────────────

def key_tenant_slug(slug: str) -> str:
    return f"tenant:subdomain:{slug}"

def key_tenant_domain(domain: str) -> str:
    return f"tenant:domain:{domain}"

def key_tenant_config(tenant_id: str) -> str:
    return f"tenant:config:{tenant_id}"

def key_jwt_blacklist(jti: str) -> str:
    return f"jwt:blacklist:{jti}"

def key_refresh_token(token_hash: str) -> str:
    return f"refresh:{token_hash}"

def key_rate_limit(ip: str, route: str) -> str:
    return f"rate:ip:{ip}:{route}"

def key_api_rate(api_key: str) -> str:
    return f"rate:apikey:{api_key}"

def key_cache_article(slug: str) -> str:
    return f"cache:article:{slug}"

def key_cache_ai(task_hash: str) -> str:
    return f"cache:ai:{task_hash}"

def key_translate(lang: str, content_hash: str) -> str:
    return f"cache:translate:{lang}:{content_hash}"

def key_ad_scan(url_hash: str) -> str:
    return f"session:scan:{url_hash}"

def key_social_token(tenant_id: str, platform: str) -> str:
    return f"social:tokens:{tenant_id}:{platform}"
