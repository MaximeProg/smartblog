import uuid
from fastapi import APIRouter, Query
from sqlalchemy import select
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException
from app.models.article import Tag
from app.models.enums import UserRole
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/tags", tags=["tags"])


class TagResponse(BaseModel):
    id: str
    name: str
    slug: str
    articles_count: int


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
    query = query.order_by(Tag.articles_count.desc()).limit(limit)
    result = await db.execute(query)
    return [TagResponse(id=str(t.id), name=t.name, slug=t.slug, articles_count=t.articles_count)
            for t in result.scalars().all()]


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
