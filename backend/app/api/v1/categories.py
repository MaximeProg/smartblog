import uuid
from fastapi import APIRouter
from sqlalchemy import select
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException
from app.models.article import Category
from app.models.enums import UserRole
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/categories", tags=["categories"])


class CreateCategoryRequest(BaseModel):
    name: str
    slug: str | None = None
    description: str | None = None
    cover_image_url: str | None = None
    parent_id: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    sort_order: int = 0

    def auto_slug(self) -> str:
        import re
        s = self.name.lower().strip()
        s = re.sub(r"[^\w\s-]", "", s)
        return re.sub(r"[\s_-]+", "-", s).strip("-")


class UpdateCategoryRequest(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    cover_image_url: str | None = None
    parent_id: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    sort_order: int | None = None


class CategoryResponse(BaseModel):
    id: str
    tenant_id: str
    parent_id: str | None
    name: str
    slug: str
    description: str | None
    cover_image_url: str | None
    seo_title: str | None
    sort_order: int
    articles_count: int

    model_config = {"from_attributes": True}


@router.get("", response_model=list[CategoryResponse])
async def list_categories(tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    result = await db.execute(
        select(Category)
        .where(Category.tenant_id == tenant_id)
        .order_by(Category.sort_order, Category.name)
    )
    cats = result.scalars().all()
    return [CategoryResponse(
        id=str(c.id), tenant_id=str(c.tenant_id),
        parent_id=str(c.parent_id) if c.parent_id else None,
        name=c.name, slug=c.slug, description=c.description,
        cover_image_url=c.cover_image_url, seo_title=c.seo_title,
        sort_order=c.sort_order, articles_count=c.articles_count,
    ) for c in cats]


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    tenant_id: uuid.UUID, body: CreateCategoryRequest,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    slug = body.slug or body.auto_slug()

    existing = await db.execute(
        select(Category).where(Category.tenant_id == tenant_id, Category.slug == slug)
    )
    if existing.scalar_one_or_none():
        raise ValidationException(f"Le slug '{slug}' est déjà utilisé.")

    cat = Category(
        tenant_id=tenant_id,
        name=body.name, slug=slug, description=body.description,
        cover_image_url=body.cover_image_url,
        parent_id=uuid.UUID(body.parent_id) if body.parent_id else None,
        seo_title=body.seo_title, seo_description=body.seo_description,
        sort_order=body.sort_order,
    )
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return CategoryResponse(
        id=str(cat.id), tenant_id=str(cat.tenant_id),
        parent_id=str(cat.parent_id) if cat.parent_id else None,
        name=cat.name, slug=cat.slug, description=cat.description,
        cover_image_url=cat.cover_image_url, seo_title=cat.seo_title,
        sort_order=cat.sort_order, articles_count=cat.articles_count,
    )


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    tenant_id: uuid.UUID, category_id: uuid.UUID,
    body: UpdateCategoryRequest, payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.tenant_id == tenant_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise NotFoundException("Catégorie")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return CategoryResponse(
        id=str(cat.id), tenant_id=str(cat.tenant_id),
        parent_id=str(cat.parent_id) if cat.parent_id else None,
        name=cat.name, slug=cat.slug, description=cat.description,
        cover_image_url=cat.cover_image_url, seo_title=cat.seo_title,
        sort_order=cat.sort_order, articles_count=cat.articles_count,
    )


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    tenant_id: uuid.UUID, category_id: uuid.UUID,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(Category).where(Category.id == category_id, Category.tenant_id == tenant_id)
    )
    cat = result.scalar_one_or_none()
    if not cat:
        raise NotFoundException("Catégorie")
    await db.delete(cat)
    await db.commit()
