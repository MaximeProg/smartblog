from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text, event
from typing import AsyncGenerator
from app.core.config import settings


def _clean_url(url: str) -> str:
    """Supprime les params SSL incompatibles avec asyncpg de l'URL."""
    from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
    parsed = urlparse(url)
    params = parse_qs(parsed.query, keep_blank_values=True)
    # asyncpg gère SSL via connect_args, pas via sslmode dans l'URL
    params.pop("sslmode", None)
    params.pop("channel_binding", None)
    new_query = urlencode({k: v[0] for k, v in params.items()})
    return urlunparse(parsed._replace(query=new_query))


_db_url = _clean_url(settings.DATABASE_URL)

engine: AsyncEngine = create_async_engine(
    _db_url,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
    echo=settings.DEBUG,
    connect_args={"ssl": "require"} if settings.DATABASE_SSL_REQUIRE else {},
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)


async def get_db(tenant_id: str | None = None, user_id: str | None = None, is_super_admin: bool = False) -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency qui fournit une session DB avec RLS configuré.
    Les services gèrent leurs propres commits/rollbacks.
    """
    async with AsyncSessionLocal() as session:
        try:
            # Use false (session-level) so RLS settings survive across multiple commits
            await session.execute(
                text(
                    "SELECT "
                    "set_config('app.current_tenant_id', :tid, false), "
                    "set_config('app.current_user_id', :uid, false), "
                    "set_config('app.is_super_admin', :admin, false)"
                ),
                {
                    "tid": str(tenant_id) if tenant_id else "",
                    "uid": str(user_id) if user_id else "",
                    "admin": "true" if is_super_admin else "false",
                },
            )
            yield session
        except Exception:
            await session.rollback()
            raise


async def get_db_no_rls() -> AsyncGenerator[AsyncSession, None]:
    """Session pour les tâches système (résolution de domaine, mode
    maintenance, polling de payout en arrière-plan, etc.) — opère
    légitimement à travers tous les tenants.

    Marque explicitement la session comme is_super_admin=true plutôt que de
    ne poser aucune variable de session : depuis l'activation de
    FORCE ROW LEVEL SECURITY (voir migration 069), même le rôle
    propriétaire des tables est soumis aux policies RLS, qui exigent
    `is_super_admin() OR tenant_id = current_tenant_id()`. Sans ce marquage,
    ces tâches système se seraient mises à voir zéro ligne du jour au
    lendemain sur toute table RLS — silencieusement, sans erreur explicite."""
    async with AsyncSessionLocal() as session:
        try:
            await session.execute(
                text("SELECT set_config('app.is_super_admin', 'true', false)"),
            )
            yield session
        except Exception:
            await session.rollback()
            raise


def admin_session() -> AsyncSession:
    """Variante `async with` de get_db_no_rls(), pour le code qui ouvre sa
    propre session directement (ex. app/workers/tasks.py) plutôt que de
    consommer un générateur — même raison d'être : contexte système,
    légitimement cross-tenant, doit rester lisible une fois FORCE RLS actif."""
    return _AdminSessionContext()


class _AdminSessionContext:
    def __init__(self) -> None:
        self._session: AsyncSession | None = None

    async def __aenter__(self) -> AsyncSession:
        self._session = AsyncSessionLocal()
        session = await self._session.__aenter__()
        await session.execute(
            text("SELECT set_config('app.is_super_admin', 'true', false)"),
        )
        return session

    async def __aexit__(self, exc_type, exc, tb) -> None:
        assert self._session is not None
        await self._session.__aexit__(exc_type, exc, tb)
