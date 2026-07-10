import uuid
from fastapi import APIRouter, Query
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.services.search_service import search_articles
from app.api.v1.tenants import _assert_member, _assert_role
from app.models.enums import UserRole

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


class ReindexResponse(BaseModel):
    indexed: int
    tenant_slug: str


@router.post("/reindex", response_model=ReindexResponse)
async def reindex_all(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    """Re-indexes all published articles for this tenant in Elasticsearch."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)

    from sqlalchemy import select
    from sqlalchemy.orm import joinedload
    from app.models.tenant import Tenant
    from app.models.article import Article
    from app.models.enums import ArticleStatus
    from app.services.search_service import index_article

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if not tenant:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Tenant")

    arts_result = await db.execute(
        select(Article).options(joinedload(Article.category), joinedload(Article.author))
        .where(
            Article.tenant_id == tenant_id,
            Article.status == ArticleStatus.PUBLISHED,
            Article.deleted_at.is_(None),
        )
    )
    articles = arts_result.scalars().all()

    for a in articles:
        await index_article(tenant.slug, {
            "id": str(a.id),
            "tenant_id": str(a.tenant_id),
            "title": a.title,
            "slug": a.slug,
            "excerpt": a.excerpt or "",
            "content": a.content or "",
            "article_type": a.article_type.value if a.article_type else None,
            "status": a.status.value,
            "visibility": a.visibility.value if a.visibility else None,
            "category_id": str(a.category_id) if a.category_id else None,
            "category_name": a.category.name if a.category else None,
            "author_id": str(a.author_id) if a.author_id else None,
            "author_name": a.author.display_name if a.author else None,
            "tags": [t.name for t in a.tags] if a.tags else [],
            "cover_image_url": a.cover_image_url,
            "reading_time_minutes": a.reading_time_minutes or 0,
            "views_count": a.views_count or 0,
            "likes_count": a.likes_count or 0,
            "published_at": a.published_at.isoformat() if a.published_at else None,
        })

    return ReindexResponse(indexed=len(articles), tenant_slug=tenant.slug)
