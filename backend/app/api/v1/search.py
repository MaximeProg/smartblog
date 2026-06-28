import uuid
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.services.search_service import search_articles
from app.api.v1.tenants import _assert_member

router = APIRouter(prefix="/tenants/{tenant_id}/search", tags=["search"])


class SearchResponse(BaseModel):
    total: int
    hits: list[dict]
    query: str | None


@router.get("", response_model=SearchResponse)
async def search(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    q: str | None = Query(default=None, description="Recherche plein texte"),
    category_id: str | None = Query(default=None),
    tags: list[str] | None = Query(default=None),
    article_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, le=50),
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)

    from sqlalchemy import select
    from app.models.tenant import Tenant
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    tenant_slug = tenant.slug if tenant else str(tenant_id)

    result = await search_articles(
        tenant_slug=tenant_slug,
        q=q,
        category_id=category_id,
        tags=tags,
        article_type=article_type,
        from_=(page - 1) * size,
        size=size,
    )

    return SearchResponse(total=result["total"], hits=result["hits"], query=q)


# ── Endpoint public (blogs publics sans auth) ─────────────────────

@router.get("/public", response_model=SearchResponse)
async def public_search(
    tenant_id: uuid.UUID,
    db: DBSession,
    q: str | None = Query(default=None),
    category_id: str | None = Query(default=None),
    tags: list[str] | None = Query(default=None),
    article_type: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, le=50),
):
    from sqlalchemy import select
    from app.models.tenant import Tenant
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    tenant_slug = tenant.slug if tenant else str(tenant_id)

    result = await search_articles(
        tenant_slug=tenant_slug,
        q=q,
        category_id=category_id,
        tags=tags,
        article_type=article_type,
        status="published",
        from_=(page - 1) * size,
        size=size,
    )
    return SearchResponse(total=result["total"], hits=result["hits"], query=q)
