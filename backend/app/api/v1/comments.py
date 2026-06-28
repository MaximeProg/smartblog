import uuid
from datetime import datetime
from fastapi import APIRouter, Request, Query
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException, ForbiddenException
from app.models.comment import Comment, CommentBan
from app.models.article import Article
from app.models.user import User
from app.models.enums import CommentStatus, UserRole
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/articles/{article_id}/comments", tags=["comments"])


class CreateCommentRequest(BaseModel):
    content: str
    parent_id: str | None = None
    author_name: str | None = None
    author_email: EmailStr | None = None
    author_website: str | None = None


class CommentAuthor(BaseModel):
    id: str | None
    display_name: str | None
    avatar_url: str | None


class CommentResponse(BaseModel):
    id: str
    content: str
    status: CommentStatus
    parent_id: str | None
    author: CommentAuthor
    likes_count: int
    replies_count: int
    created_at: datetime


class ModerateRequest(BaseModel):
    status: CommentStatus


class BanRequest(BaseModel):
    email: str | None = None
    ip_address: str | None = None
    reason: str | None = None


# ── GET /comments ─────────────────────────────────────────────────

@router.get("", response_model=list[CommentResponse])
async def list_comments(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    status: CommentStatus | None = Query(default=None),
    limit: int = Query(default=20, le=100),
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    query = (
        select(Comment, User)
        .outerjoin(User, User.id == Comment.author_user_id)
        .where(Comment.tenant_id == tenant_id, Comment.article_id == article_id, Comment.parent_id.is_(None))
    )
    if status:
        query = query.where(Comment.status == status)
    query = query.order_by(Comment.created_at.asc()).limit(limit)
    result = await db.execute(query)
    return [_to_response(c, u) for c, u in result.all()]


# ── POST /comments ────────────────────────────────────────────────

@router.post("", response_model=CommentResponse, status_code=201)
async def create_comment(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    body: CreateCommentRequest,
    request: Request,
    payload: TokenPayload,
    db: DBSession,
):
    # Vérifier que l'article existe et accepte les commentaires
    art_result = await db.execute(
        select(Article).where(
            Article.id == article_id,
            Article.tenant_id == tenant_id,
            Article.deleted_at.is_(None),
        )
    )
    article = art_result.scalar_one_or_none()
    if not article:
        raise NotFoundException("Article")
    if not article.allow_comments:
        raise ValidationException("Les commentaires sont désactivés pour cet article.")
    if article.comments_closed_at and article.comments_closed_at < datetime.now(article.comments_closed_at.tzinfo):
        raise ValidationException("Les commentaires sont fermés pour cet article.")

    user_id = uuid.UUID(payload["sub"])

    # Vérifier bans (email ou IP)
    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one_or_none()
    ip = request.client.host if request.client else None

    if user:
        ban_q = select(CommentBan).where(
            CommentBan.tenant_id == tenant_id,
            CommentBan.email == user.email,
        )
        if ip:
            from sqlalchemy import or_
            ban_q = select(CommentBan).where(
                CommentBan.tenant_id == tenant_id,
            ).where(
                (CommentBan.email == user.email) | (CommentBan.ip_address == ip)
            )
        ban = await db.execute(ban_q)
        if ban.scalar_one_or_none():
            raise ForbiddenException("Vous avez été banni de commentaires sur ce blog.")

    comment = Comment(
        tenant_id=tenant_id,
        article_id=article_id,
        author_user_id=user_id,
        parent_id=uuid.UUID(body.parent_id) if body.parent_id else None,
        content=body.content,
        ip_address=ip,
        user_agent=request.headers.get("user-agent", "")[:500],
    )
    db.add(comment)

    # Incrémenter compteur article
    from sqlalchemy import text
    await db.execute(
        text("UPDATE articles SET comments_count = comments_count + 1 WHERE id = :aid"),
        {"aid": str(article_id)},
    )
    if body.parent_id:
        await db.execute(
            text("UPDATE comments SET replies_count = replies_count + 1 WHERE id = :pid"),
            {"pid": body.parent_id},
        )

    await db.commit()
    await db.refresh(comment)
    return _to_response(comment, user)


# ── POST /comments/{comment_id}/moderate ─────────────────────────

@router.post("/{comment_id}/moderate", response_model=CommentResponse)
async def moderate(
    tenant_id: uuid.UUID, article_id: uuid.UUID,
    comment_id: uuid.UUID, body: ModerateRequest,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    comment, user = await _get_or_404(db, tenant_id, comment_id)
    comment.status = body.status
    await db.commit()
    await db.refresh(comment)
    return _to_response(comment, user)


# ── DELETE /comments/{comment_id} ────────────────────────────────

@router.delete("/{comment_id}", status_code=204)
async def delete_comment(
    tenant_id: uuid.UUID, article_id: uuid.UUID,
    comment_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    comment, _ = await _get_or_404(db, tenant_id, comment_id)
    await db.delete(comment)
    from sqlalchemy import text
    await db.execute(
        text("UPDATE articles SET comments_count = GREATEST(0, comments_count - 1) WHERE id = :aid"),
        {"aid": str(comment.article_id)},
    )
    await db.commit()


# ── POST /comments/bans ───────────────────────────────────────────

@router.post("/bans", status_code=201)
async def ban_user(
    tenant_id: uuid.UUID, article_id: uuid.UUID,
    body: BanRequest, payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    if not body.email and not body.ip_address:
        raise ValidationException("Fournir un email ou une adresse IP à bannir.")
    db.add(CommentBan(
        tenant_id=tenant_id,
        email=body.email,
        ip_address=body.ip_address,
        reason=body.reason,
        created_by=uuid.UUID(payload["sub"]),
    ))
    await db.commit()
    return {"message": "Banni avec succès."}


# ── Helpers ───────────────────────────────────────────────────────

async def _get_or_404(db, tenant_id: uuid.UUID, comment_id: uuid.UUID):
    result = await db.execute(
        select(Comment, User)
        .outerjoin(User, User.id == Comment.author_user_id)
        .where(Comment.id == comment_id, Comment.tenant_id == tenant_id)
    )
    row = result.first()
    if not row:
        raise NotFoundException("Commentaire")
    return row


def _to_response(c: Comment, u: User | None) -> CommentResponse:
    return CommentResponse(
        id=str(c.id),
        content=c.content,
        status=c.status,
        parent_id=str(c.parent_id) if c.parent_id else None,
        author=CommentAuthor(
            id=str(u.id) if u else None,
            display_name=u.display_name if u else c.author_name,
            avatar_url=u.avatar_url if u else None,
        ),
        likes_count=c.likes_count,
        replies_count=c.replies_count,
        created_at=c.created_at,
    )
