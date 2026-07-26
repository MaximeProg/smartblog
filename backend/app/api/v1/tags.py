import uuid
import re
from fastapi import APIRouter, Query
from sqlalchemy import select
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException
from app.models.article import Tag, ArticleTag
from app.models.enums import UserRole
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/tags", tags=["tags"])


class TagResponse(BaseModel):
    id: str
    name: str
    slug: str
    articles_count: int


class CreateTagRequest(BaseModel):
    name: str


class UpdateTagRequest(BaseModel):
    name: str


class MergeTagsRequest(BaseModel):
    source_ids: list[str]
    target_id: str


def _slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^\w\s-]", "", s)
    return re.sub(r"[\s_-]+", "-", s).strip("-")


@router.get("", response_model=list[TagResponse])
async def list_tags(
    tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession,
    q: str | None = Query(default=None, description="Recherche par nom"),
    limit: int = Query(default=50, le=200),
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    query = select(Tag).where(Tag.tenant_id == tenant_id)
    if q:
        query = query.where(Tag.name.ilike(f"%{q}%"))
    query = query.order_by(Tag.articles_count.desc(), Tag.name).limit(limit)
    result = await db.execute(query)
    return [TagResponse(id=str(t.id), name=t.name, slug=t.slug, articles_count=t.articles_count)
            for t in result.scalars().all()]


@router.post("", response_model=TagResponse, status_code=201)
async def create_tag(
    tenant_id: uuid.UUID, body: CreateTagRequest,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    slug = _slugify(body.name)
    if not slug:
        raise ValidationException("Invalid tag name.")

    existing = await db.execute(
        select(Tag).where(Tag.tenant_id == tenant_id, Tag.slug == slug)
    )
    if existing.scalar_one_or_none():
        raise ValidationException(f"Tag '{slug}' already exists.")

    tag = Tag(tenant_id=tenant_id, name=body.name.strip(), slug=slug)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return TagResponse(id=str(tag.id), name=tag.name, slug=tag.slug, articles_count=tag.articles_count)


@router.patch("/{tag_id}", response_model=TagResponse)
async def rename_tag(
    tenant_id: uuid.UUID, tag_id: uuid.UUID,
    body: UpdateTagRequest, payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(Tag).where(Tag.id == tag_id, Tag.tenant_id == tenant_id)
    )
    tag = result.scalar_one_or_none()
    if not tag:
        raise NotFoundException("Tag")

    new_slug = _slugify(body.name)
    if new_slug != tag.slug:
        conflict = await db.execute(
            select(Tag).where(Tag.tenant_id == tenant_id, Tag.slug == new_slug)
        )
        if conflict.scalar_one_or_none():
            raise ValidationException(f"Tag '{new_slug}' already exists.")

    tag.name = body.name.strip()
    tag.slug = new_slug
    await db.commit()
    await db.refresh(tag)
    return TagResponse(id=str(tag.id), name=tag.name, slug=tag.slug, articles_count=tag.articles_count)


@router.post("/merge", status_code=200, response_model=TagResponse)
async def merge_tags(
    tenant_id: uuid.UUID, body: MergeTagsRequest,
    payload: TokenPayload, db: DBSession,
):
    """Redirige tous les articles des tags source vers le tag cible, puis supprime les sources."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)

    target_id = uuid.UUID(body.target_id)
    target_res = await db.execute(
        select(Tag).where(Tag.id == target_id, Tag.tenant_id == tenant_id)
    )
    target = target_res.scalar_one_or_none()
    if not target:
        raise NotFoundException("Target tag")

    for src_id_str in body.source_ids:
        src_id = uuid.UUID(src_id_str)
        if src_id == target_id:
            continue
        src_res = await db.execute(
            select(Tag).where(Tag.id == src_id, Tag.tenant_id == tenant_id)
        )
        src = src_res.scalar_one_or_none()
        if not src:
            continue

        # Move article_tags rows to target (skip duplicates)
        from sqlalchemy import text
        await db.execute(text(
            "INSERT INTO article_tags (article_id, tag_id, tenant_id) "
            "SELECT article_id, :target_id, tenant_id FROM article_tags "
            "WHERE tag_id = :src_id "
            "ON CONFLICT DO NOTHING"
        ), {"target_id": str(target_id), "src_id": str(src_id)})
        await db.delete(src)

    await db.commit()
    await db.refresh(target)

    # Recompute articles_count for target
    count_res = await db.execute(
        select(ArticleTag).where(ArticleTag.tag_id == target_id)
    )
    target.articles_count = len(count_res.scalars().all())
    await db.commit()
    await db.refresh(target)

    return TagResponse(id=str(target.id), name=target.name, slug=target.slug, articles_count=target.articles_count)


@router.delete("/{tag_id}", status_code=204)
async def delete_tag(
    tenant_id: uuid.UUID, tag_id: uuid.UUID,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(Tag).where(Tag.id == tag_id, Tag.tenant_id == tenant_id)
    )
    tag = result.scalar_one_or_none()
    if not tag:
        raise NotFoundException("Tag")
    await db.delete(tag)
    await db.commit()
