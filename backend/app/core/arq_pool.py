"""Pool ARQ partagé — instancié à la première utilisation, réutilisé ensuite."""
from __future__ import annotations

import arq
from arq.connections import ArqRedis, RedisSettings

_pool: ArqRedis | None = None


async def get_arq_pool() -> ArqRedis:
    global _pool
    if _pool is None:
        from app.core.config import settings
        _pool = await arq.create_pool(RedisSettings.from_dsn(settings.REDIS_URL))
    return _pool


async def close_arq_pool() -> None:
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None
