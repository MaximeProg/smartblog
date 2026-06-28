import uuid
from fastapi import APIRouter, Query
from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import ForbiddenException
from app.models.enums import ArticleStatus, UserRole
from app.schemas.article import (
    CreateArticleRequest, UpdateArticleRequest,
    ArticleResponse, ArticleListItem, ArticleVersionResponse,
)
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.services.article_service import (
    create_article, get_article, list_articles,
    update_article, change_status, delete_article, list_versions,
)
from app.api.v1.tenants import _assert_role, _assert_member

router = APIRouter(prefix="/tenants/{tenant_id}/articles", tags=["articles"])


# ── GET /articles ─────────────────────────────────────────────────

@router.get("", response_model=PaginatedResponse[ArticleListItem])
async def list_(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    status: ArticleStatus | None = Query(default=None),
    category_id: uuid.UUID | None = Query(default=None),
    author_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=20, le=100),
    cursor: str | None = Query(default=None),
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    items, next_cursor = await list_articles(
        db, tenant_id, status, category_id, author_id, limit, cursor
    )
    return PaginatedResponse(
        data=items,
        meta=PaginationMeta(cursor=next_cursor, has_more=next_cursor is not None),
    )


# ── POST /articles ────────────────────────────────────────────────

@router.post("", response_model=ArticleResponse, status_code=201)
async def create(
    tenant_id: uuid.UUID,
    body: CreateArticleRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    return await create_article(db, tenant_id, uuid.UUID(payload["sub"]), body)


# ── GET /articles/{article_id} ────────────────────────────────────

@router.get("/{article_id}", response_model=ArticleResponse)
async def get_one(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    return await get_article(db, tenant_id, article_id)


# ── PATCH /articles/{article_id} ──────────────────────────────────

@router.patch("/{article_id}", response_model=ArticleResponse)
async def update(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    body: UpdateArticleRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    return await update_article(db, tenant_id, article_id, uuid.UUID(payload["sub"]), body)


# ── POST /articles/{article_id}/publish ───────────────────────────

@router.post("/{article_id}/publish", response_model=ArticleResponse)
async def publish(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    return await change_status(db, tenant_id, article_id, ArticleStatus.PUBLISHED)


# ── POST /articles/{article_id}/unpublish ─────────────────────────

@router.post("/{article_id}/unpublish", response_model=ArticleResponse)
async def unpublish(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    return await change_status(db, tenant_id, article_id, ArticleStatus.UNPUBLISHED)


# ── POST /articles/{article_id}/submit-review ─────────────────────

@router.post("/{article_id}/submit-review", response_model=ArticleResponse)
async def submit_review(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    return await change_status(db, tenant_id, article_id, ArticleStatus.IN_REVIEW)


# ── POST /articles/{article_id}/archive ───────────────────────────

@router.post("/{article_id}/archive", response_model=ArticleResponse)
async def archive(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    return await change_status(db, tenant_id, article_id, ArticleStatus.ARCHIVED)


# ── DELETE /articles/{article_id} ────────────────────────────────

@router.delete("/{article_id}", status_code=204)
async def delete(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    await delete_article(db, tenant_id, article_id)


# ── GET /articles/{article_id}/versions ───────────────────────────

@router.get("/{article_id}/versions", response_model=list[ArticleVersionResponse])
async def get_versions(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    return await list_versions(db, tenant_id, article_id)
