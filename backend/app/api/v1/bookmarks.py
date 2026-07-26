"""
Bookmarks — persistance en base de données.
GET  /tenants/{tenant_id}/bookmarks          — liste les bookmarks de l'utilisateur
POST /tenants/{tenant_id}/bookmarks          — ajouter un bookmark
DELETE /tenants/{tenant_id}/bookmarks/{article_id} — supprimer un bookmark
"""
import uuid
from datetime import datetime
from fastapi import APIRouter
from sqlalchemy import select
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException
from app.models.bookmark import Bookmark
from app.models.article import Article
from app.models.enums import ArticleStatus
from app.api.v1.tenants import _assert_member

router = APIRouter(prefix="/tenants/{tenant_id}/bookmarks", tags=["bookmarks"])


class BookmarkResponse(BaseModel):
    id: str
    article_id: str
    article_title: str
    article_slug: str
    cover_image_url: str | None
    created_at: datetime


@router.get("", response_model=list[BookmarkResponse])
async def list_bookmarks(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    user_id = uuid.UUID(payload["sub"])
    await _assert_member(db, tenant_id, user_id, payload)

    result = await db.execute(
        select(Bookmark, Article.title, Article.slug, Article.cover_image_url)
        .join(Article, Article.id == Bookmark.article_id)
        .where(
            Bookmark.tenant_id == tenant_id,
            Bookmark.user_id == user_id,
            Article.deleted_at.is_(None),
        )
        .order_by(Bookmark.created_at.desc())
    )
    rows = result.all()
    return [
        BookmarkResponse(
            id=str(row.Bookmark.id),
            article_id=str(row.Bookmark.article_id),
            article_title=row.title,
            article_slug=row.slug,
            cover_image_url=row.cover_image_url,
            created_at=row.Bookmark.created_at,
        )
        for row in rows
    ]


@router.post("", status_code=201)
async def add_bookmark(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    body: dict,
):
    user_id = uuid.UUID(payload["sub"])
    await _assert_member(db, tenant_id, user_id, payload)

    article_id_str = body.get("article_id")
    if not article_id_str:
        raise ValidationException("article_id required.")

    try:
        article_id = uuid.UUID(str(article_id_str))
    except ValueError:
        raise ValidationException("Invalid article_id.")

    # Verify article exists
    art = await db.execute(
        select(Article).where(
            Article.id == article_id,
            Article.tenant_id == tenant_id,
            Article.deleted_at.is_(None),
        )
    )
    if not art.scalar_one_or_none():
        raise NotFoundException("Article")

    # Upsert — ignore if already exists
    existing = await db.execute(
        select(Bookmark).where(
            Bookmark.user_id == user_id,
            Bookmark.article_id == article_id,
        )
    )
    if existing.scalar_one_or_none():
        return {"bookmarked": True, "already_exists": True}

    bm = Bookmark(tenant_id=tenant_id, user_id=user_id, article_id=article_id)
    db.add(bm)
    await db.commit()
    return {"bookmarked": True, "id": str(bm.id)}


@router.delete("/{article_id}", status_code=200)
async def remove_bookmark(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    user_id = uuid.UUID(payload["sub"])
    await _assert_member(db, tenant_id, user_id, payload)

    result = await db.execute(
        select(Bookmark).where(
            Bookmark.user_id == user_id,
            Bookmark.article_id == article_id,
            Bookmark.tenant_id == tenant_id,
        )
    )
    bm = result.scalar_one_or_none()
    if bm:
        await db.delete(bm)
        await db.commit()
    return {"bookmarked": False}
