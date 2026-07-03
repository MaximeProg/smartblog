"""
API publique d'engagement : vues, likes, partages, commentaires anonymes.
Aucune authentification requise pour les visiteurs.
"""
import uuid
import hashlib
from datetime import datetime
from fastapi import APIRouter, Request, Query, HTTPException
from sqlalchemy import select, func, text
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.core.dependencies import DBSession
from app.models.article import Article
from app.models.engagement import ArticleLike, ArticleShare
from app.models.comment import Comment, CommentBan
from app.models.enums import CommentStatus

router = APIRouter(prefix="/public/articles/{article_id}", tags=["engagement"])


# ── Helpers ────────────────────────────────────────────────────────────────────

def _fingerprint(request: Request, extra: str = "") -> str:
    ip = request.client.host if request.client else "unknown"
    ua = request.headers.get("user-agent", "")
    raw = f"{ip}:{ua}:{extra}"
    return hashlib.sha256(raw.encode()).hexdigest()[:64]


def _ip_hash(request: Request) -> str:
    ip = request.client.host if request.client else "unknown"
    return hashlib.sha256(ip.encode()).hexdigest()[:64]


async def _get_article(db, article_id: uuid.UUID) -> Article:
    result = await db.execute(
        select(Article).where(Article.id == article_id, Article.deleted_at.is_(None))
    )
    article = result.scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article introuvable")
    return article


# ── Likes ──────────────────────────────────────────────────────────────────────

class LikeResponse(BaseModel):
    article_id: str
    likes_count: int
    liked: bool


@router.post("/like", response_model=LikeResponse)
async def toggle_like(
    article_id: uuid.UUID,
    request: Request,
    db: DBSession,
):
    article = await _get_article(db, article_id)
    fp = _fingerprint(request)
    ip_h = _ip_hash(request)

    existing = await db.execute(
        select(ArticleLike).where(
            ArticleLike.article_id == article_id,
            ArticleLike.fingerprint == fp,
        )
    )
    like = existing.scalar_one_or_none()

    if like:
        await db.delete(like)
        await db.execute(
            text("UPDATE articles SET likes_count = GREATEST(0, likes_count - 1) WHERE id = :aid"),
            {"aid": str(article_id)},
        )
        liked = False
    else:
        db.add(ArticleLike(
            article_id=article_id,
            tenant_id=article.tenant_id,
            fingerprint=fp,
            ip_hash=ip_h,
        ))
        await db.execute(
            text("UPDATE articles SET likes_count = likes_count + 1 WHERE id = :aid"),
            {"aid": str(article_id)},
        )
        liked = True

    await db.commit()

    count_result = await db.execute(
        select(func.count(ArticleLike.id)).where(ArticleLike.article_id == article_id)
    )
    return LikeResponse(
        article_id=str(article_id),
        likes_count=count_result.scalar_one(),
        liked=liked,
    )


@router.get("/like", response_model=LikeResponse)
async def get_like_status(
    article_id: uuid.UUID,
    request: Request,
    db: DBSession,
):
    fp = _fingerprint(request)

    count_result = await db.execute(
        select(func.count(ArticleLike.id)).where(ArticleLike.article_id == article_id)
    )
    existing = await db.execute(
        select(ArticleLike).where(
            ArticleLike.article_id == article_id,
            ArticleLike.fingerprint == fp,
        )
    )
    return LikeResponse(
        article_id=str(article_id),
        likes_count=count_result.scalar_one(),
        liked=existing.scalar_one_or_none() is not None,
    )


# ── Shares ─────────────────────────────────────────────────────────────────────

VALID_PLATFORMS = {"facebook", "twitter", "linkedin", "whatsapp", "telegram", "pinterest", "copy"}


class ShareRequest(BaseModel):
    platform: str


class ShareResponse(BaseModel):
    article_id: str
    platform: str
    shares_count: int
    by_platform: dict


@router.post("/share", response_model=ShareResponse)
async def record_share(
    article_id: uuid.UUID,
    body: ShareRequest,
    request: Request,
    db: DBSession,
):
    if body.platform not in VALID_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"Plateforme invalide. Valeurs acceptées : {', '.join(VALID_PLATFORMS)}")

    article = await _get_article(db, article_id)
    fp = _fingerprint(request, body.platform)
    ip_h = _ip_hash(request)

    db.add(ArticleShare(
        article_id=article_id,
        tenant_id=article.tenant_id,
        platform=body.platform,
        fingerprint=fp,
        ip_hash=ip_h,
    ))
    await db.execute(
        text("UPDATE articles SET shares_count = shares_count + 1 WHERE id = :aid"),
        {"aid": str(article_id)},
    )
    await db.commit()

    total = await db.execute(
        select(func.count(ArticleShare.id)).where(ArticleShare.article_id == article_id)
    )
    by_p = await db.execute(text("""
        SELECT platform, COUNT(*) as cnt
        FROM article_shares WHERE article_id = :aid
        GROUP BY platform
    """), {"aid": str(article_id)})

    return ShareResponse(
        article_id=str(article_id),
        platform=body.platform,
        shares_count=total.scalar_one(),
        by_platform={r.platform: r.cnt for r in by_p},
    )


# ── Commentaires anonymes ──────────────────────────────────────────────────────

class PublicCommentRequest(BaseModel):
    content: str
    parent_id: Optional[str] = None
    author_name: str
    author_email: EmailStr
    author_website: Optional[str] = None


class PublicCommentResponse(BaseModel):
    id: str
    content: str
    status: CommentStatus
    parent_id: Optional[str]
    author_name: Optional[str]
    author_email: Optional[str]
    author_website: Optional[str]
    likes_count: int
    replies_count: int
    created_at: datetime


@router.get("/comments", response_model=list[PublicCommentResponse])
async def list_public_comments(
    article_id: uuid.UUID,
    db: DBSession,
    limit: int = Query(default=20, le=100),
    offset: int = Query(default=0, ge=0),
):
    result = await db.execute(
        select(Comment)
        .where(
            Comment.article_id == article_id,
            Comment.parent_id.is_(None),
            Comment.status == CommentStatus.APPROVED,
        )
        .order_by(Comment.created_at.asc())
        .limit(limit)
        .offset(offset)
    )
    return [_to_public_response(c) for c in result.scalars()]


@router.post("/comments", response_model=PublicCommentResponse, status_code=201)
async def post_public_comment(
    article_id: uuid.UUID,
    body: PublicCommentRequest,
    request: Request,
    db: DBSession,
):
    article = await _get_article(db, article_id)
    if not article.allow_comments:
        raise HTTPException(status_code=403, detail="Les commentaires sont désactivés.")
    if article.comments_closed_at and article.comments_closed_at < datetime.utcnow():
        raise HTTPException(status_code=403, detail="Les commentaires sont fermés.")

    ip = request.client.host if request.client else None
    fp = _fingerprint(request)

    # Vérifier bans
    if ip or body.author_email:
        from sqlalchemy import or_
        conditions = []
        if body.author_email:
            conditions.append(CommentBan.email == str(body.author_email))
        if ip:
            conditions.append(CommentBan.ip_address == ip)
        if conditions:
            ban = await db.execute(
                select(CommentBan).where(
                    CommentBan.tenant_id == article.tenant_id,
                    or_(*conditions),
                )
            )
            if ban.scalar_one_or_none():
                raise HTTPException(status_code=403, detail="Vous avez été banni de commentaires sur ce blog.")

    comment = Comment(
        tenant_id=article.tenant_id,
        article_id=article_id,
        parent_id=uuid.UUID(body.parent_id) if body.parent_id else None,
        author_name=body.author_name,
        author_email=str(body.author_email),
        author_website=body.author_website,
        content=body.content,
        status=CommentStatus.PENDING,
        ip_address=ip,
        user_agent=request.headers.get("user-agent", "")[:500],
        fingerprint=fp,
    )
    db.add(comment)

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
    return _to_public_response(comment)


def _to_public_response(c: Comment) -> PublicCommentResponse:
    return PublicCommentResponse(
        id=str(c.id),
        content=c.content,
        status=c.status,
        parent_id=str(c.parent_id) if c.parent_id else None,
        author_name=c.author_name,
        author_email=c.author_email,
        author_website=c.author_website,
        likes_count=c.likes_count,
        replies_count=c.replies_count,
        created_at=c.created_at,
    )
