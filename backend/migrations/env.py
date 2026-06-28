import asyncio
from logging.config import fileConfig
from sqlalchemy import pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context

from app.core.config import settings
from app.models.base import Base
# Import all models so Alembic détecte les tables
from app.models.tenant import Tenant
from app.models.user import User
from app.models.tenant_user import TenantUser, UserInvitation

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_SYNC_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    from sqlalchemy.ext.asyncio import create_async_engine
    from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

    raw_url = settings.DATABASE_URL
    parsed = urlparse(raw_url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    params.pop("sslmode", None)
    params.pop("channel_binding", None)
    clean_url = urlunparse(parsed._replace(query=urlencode({k: v[0] for k, v in params.items()})))

    engine = create_async_engine(
        clean_url,
        poolclass=pool.NullPool,
        connect_args={"ssl": "require"},
    )
    async with engine.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await engine.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
