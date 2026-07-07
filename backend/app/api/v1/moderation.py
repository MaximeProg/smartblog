"""
API de modération des commentaires au niveau tenant.
GET /tenants/{tenant_id}/moderation/comments  — liste tous les commentaires de tous les articles
"""
import uuid
from datetime import datetime
from fastapi import APIRouter, Query
from sqlalchemy import select, func
from pydantic import BaseModel
from typing import Optional

from app.core.dependencies import TokenPayload, DBSession
from app.models.comment import Comment, CommentBan
from app.models.article import Article
from app.models.user import User
from app.models.enums import CommentStatus, UserRole
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/moderation", tags=["moderation"])


class CommentListItem(BaseModel):
    id: str
    article_id: str
    article_title: str
    parent_id: Optional[str]
    author_name: Optional[str]
    author_email: Optional[str]
    author_website: Optional[str]
    content: str
    status: CommentStatus
    likes_count: int
    replies_count: int
    ip_address: Optional[str]
    created_at: datetime


class CommentStats(BaseModel):
    total: int
    pending: int
    approved: int
    rejected: int
    spam: int


@router.get("/comments", response_model=list[CommentListItem])
async def list_all_comments(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    status: Optional[CommentStatus] = Query(default=None),
    article_id: Optional[uuid.UUID] = Query(default=None),
    search: Optional[str] = Query(default=None),
    limit: int = Query(default=30, le=100),
    offset: int = Query(default=0, ge=0),
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)

    query = (
        select(Comment, Article.title.label("article_title"))
        .join(Article, Article.id == Comment.article_id)
        .where(Comment.tenant_id == tenant_id)
    )
    if status:
        query = query.where(Comment.status == status)
    if article_id:
        query = query.where(Comment.article_id == article_id)
    if search:
        query = query.where(
            Comment.content.ilike(f"%{search}%") |
            Comment.author_name.ilike(f"%{search}%") |
            Comment.author_email.ilike(f"%{search}%")
        )

    query = query.order_by(Comment.created_at.desc()).limit(limit).offset(offset)
    result = await db.execute(query)

    return [
        CommentListItem(
            id=str(c.id),
            article_id=str(c.article_id),
            article_title=article_title,
            parent_id=str(c.parent_id) if c.parent_id else None,
            author_name=c.author_name,
            author_email=c.author_email,
            author_website=c.author_website,
            content=c.content,
            status=c.status,
            likes_count=c.likes_count,
            replies_count=c.replies_count,
            ip_address=c.ip_address,
            created_at=c.created_at,
        )
        for c, article_title in result.all()
    ]


@router.get("/comments/stats", response_model=CommentStats)
async def comment_stats(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)

    rows = await db.execute(
        select(Comment.status, func.count(Comment.id).label("cnt"))
        .where(Comment.tenant_id == tenant_id)
        .group_by(Comment.status)
    )
    counts = {r.status: r.cnt for r in rows.all()}
    total = sum(counts.values())

    return CommentStats(
        total=total,
        pending=counts.get(CommentStatus.PENDING, 0),
        approved=counts.get(CommentStatus.APPROVED, 0),
        rejected=counts.get(CommentStatus.REJECTED, 0),
        spam=counts.get(CommentStatus.SPAM, 0),
    )


@router.patch("/comments/{comment_id}", response_model=CommentListItem)
async def moderate_comment(
    tenant_id: uuid.UUID,
    comment_id: uuid.UUID,
    body: dict,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)

    result = await db.execute(
        select(Comment, Article.title.label("article_title"))
        .join(Article, Article.id == Comment.article_id)
        .where(Comment.id == comment_id, Comment.tenant_id == tenant_id)
    )
    row = result.first()
    if not row:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Commentaire")

    c, article_title = row
    if "status" in body:
        c.status = CommentStatus(body["status"])
    await db.commit()
    await db.refresh(c)

    return CommentListItem(
        id=str(c.id),
        article_id=str(c.article_id),
        article_title=article_title,
        parent_id=str(c.parent_id) if c.parent_id else None,
        author_name=c.author_name,
        author_email=c.author_email,
        author_website=c.author_website,
        content=c.content,
        status=c.status,
        likes_count=c.likes_count,
        replies_count=c.replies_count,
        ip_address=c.ip_address,
        created_at=c.created_at,
    )


@router.delete("/comments/{comment_id}", status_code=204)
async def delete_comment(
    tenant_id: uuid.UUID,
    comment_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)

    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.tenant_id == tenant_id)
    )
    c = result.scalar_one_or_none()
    if not c:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Commentaire")

    await db.delete(c)
    from sqlalchemy import text
    await db.execute(
        text("UPDATE articles SET comments_count = GREATEST(0, comments_count - 1) WHERE id = :aid"),
        {"aid": str(c.article_id)},
    )
    await db.commit()


@router.post("/bans", status_code=201)
async def ban(
    tenant_id: uuid.UUID,
    body: dict,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    if not body.get("email") and not body.get("ip_address"):
        from app.core.exceptions import ValidationException
        raise ValidationException("Fournir un email ou une adresse IP à bannir.")

    db.add(CommentBan(
        tenant_id=tenant_id,
        email=body.get("email"),
        ip_address=body.get("ip_address"),
        reason=body.get("reason"),
        created_by=uuid.UUID(payload["sub"]),
    ))
    await db.commit()
    return {"message": "Banni avec succès."}


class BanResponse(BaseModel):
    id: str
    email: Optional[str]
    ip_address: Optional[str]
    reason: Optional[str]
    created_at: datetime


@router.get("/bans", response_model=list[BanResponse])
async def list_bans(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(CommentBan)
        .where(CommentBan.tenant_id == tenant_id)
        .order_by(CommentBan.created_at.desc())
        .limit(200)
    )
    bans = result.scalars().all()
    return [
        BanResponse(
            id=str(b.id),
            email=b.email,
            ip_address=b.ip_address,
            reason=b.reason,
            created_at=b.created_at,
        )
        for b in bans
    ]


@router.delete("/bans/{ban_id}", status_code=204)
async def delete_ban(
    tenant_id: uuid.UUID,
    ban_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(CommentBan).where(
            CommentBan.id == ban_id,
            CommentBan.tenant_id == tenant_id,
        )
    )
    ban = result.scalar_one_or_none()
    if not ban:
        from app.core.exceptions import NotFoundException
        raise NotFoundException("Bannissement")
    await db.delete(ban)
    await db.commit()
