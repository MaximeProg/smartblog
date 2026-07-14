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
from app.schemas.article import RejectArticleRequest
from app.services.article_service import (
    create_article, get_article, list_articles,
    update_article, change_status, delete_article, list_versions,
    approve_article, reject_article,
)
from app.api.v1.tenants import _assert_role, _assert_member
import structlog

logger = structlog.get_logger()

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
    result = await change_status(db, tenant_id, article_id, ArticleStatus.PUBLISHED)
    try:
        from sqlalchemy import select as _select
        from app.models.user import User as _User
        from app.models.tenant import Tenant as _Tenant
        from app.services.email_service import send_superadmin_event
        from app.services.auth_service import _get_super_admin_emails
        sa_emails = await _get_super_admin_emails(db)
        author_res = await db.execute(_select(_User).where(_User.id == uuid.UUID(payload["sub"])))
        author = author_res.scalar_one_or_none()
        tenant_res = await db.execute(_select(_Tenant).where(_Tenant.id == tenant_id))
        tenant_obj = tenant_res.scalar_one_or_none()
        await send_superadmin_event(
            to=sa_emails,
            event_type="article.published",
            title=f"Article published — {result.title[:60]}",
            details=f"Blog: {tenant_obj.slug if tenant_obj else tenant_id}",
            actor_email=author.email if author else None,
        )
    except Exception:
        pass
    return result


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
    result = await change_status(db, tenant_id, article_id, ArticleStatus.IN_REVIEW)

    # Notify editors + admins that a new article needs review
    try:
        from sqlalchemy import select
        from app.models.tenant_user import TenantUser
        from app.models.user import User
        from app.models.enums import UserRole as UR
        from app.core.config import settings as _cfg
        from app.services.email_service import send_article_submitted_notification

        submitter_res = await db.execute(select(User).where(User.id == uuid.UUID(payload["sub"])))
        submitter = submitter_res.scalar_one_or_none()
        author_name = submitter.display_name or submitter.email if submitter else "Un auteur"

        editors_res = await db.execute(
            select(User).join(TenantUser, TenantUser.user_id == User.id).where(
                TenantUser.tenant_id == tenant_id,
                TenantUser.role.in_([UR.EDITOR, UR.TENANT_ADMIN]),
                User.id != uuid.UUID(payload["sub"]),
            )
        )
        editor_emails = [u.email for u in editors_res.scalars().all()]
        if editor_emails:
            review_url = f"{_cfg.FRONTEND_URL}/blogs/{tenant_id}/articles/{article_id}/edit"
            await send_article_submitted_notification(
                to=editor_emails,
                article_title=result.title,
                author_name=author_name,
                review_url=review_url,
            )
    except Exception as exc:
        logger.warning("submit_review: email notification failed", error=str(exc))

    return result


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


# ── POST /articles/{article_id}/approve ──────────────────────────

@router.post("/{article_id}/approve", response_model=ArticleResponse)
async def approve(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    return await approve_article(db, tenant_id, article_id)


# ── POST /articles/{article_id}/reject ───────────────────────────

@router.post("/{article_id}/reject", response_model=ArticleResponse)
async def reject(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    body: RejectArticleRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await reject_article(db, tenant_id, article_id, body.reason)

    # Notify the article author
    try:
        from sqlalchemy import select
        from app.models.user import User
        from app.core.config import settings as _cfg
        from app.services.email_service import send_article_rejected_notification

        if result.author and result.author.id:
            author_res = await db.execute(select(User).where(User.id == uuid.UUID(result.author.id)))
            author = author_res.scalar_one_or_none()
            if author:
                dashboard_url = f"{_cfg.FRONTEND_URL}/blogs/{tenant_id}/articles/{article_id}/edit"
                await send_article_rejected_notification(
                    to=author.email,
                    article_title=result.title,
                    reason=body.reason,
                    dashboard_url=dashboard_url,
                )
    except Exception as exc:
        logger.warning("reject: email notification failed", error=str(exc))

    return result


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
