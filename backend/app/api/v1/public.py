"""
API publique — blogs en lecture sans authentification.
Résout le tenant par slug (path param).
"""
from fastapi import APIRouter, Query
from fastapi.responses import Response
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime
import xml.etree.ElementTree as ET

from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.models.tenant import Tenant
from app.models.article import Article, Category, Tag
from app.models.enums import ArticleStatus, ContentVisibility, TenantStatus
from app.core.dependencies import DBSession

router = APIRouter(prefix="/public/{slug}", tags=["public"])
explore_router = APIRouter(prefix="/public", tags=["explore"])


# ── Résolution tenant par slug ────────────────────────────────────

async def _resolve_tenant(db: AsyncSession, slug: str) -> Tenant:
    result = await db.execute(
        select(Tenant).where(Tenant.slug == slug, Tenant.status == "active")
    )
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise NotFoundException("Blog")
    return tenant


# ── Schémas publics ────────────────────────────────────────────────

class PublicArticle(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str | None
    cover_image_url: str | None
    author_name: str | None
    category_slug: str | None
    category_name: str | None
    tags: list[str]
    published_at: datetime | None
    reading_time_minutes: int | None
    views_count: int
    likes_count: int
    is_paid: bool
    price: float | None


class PublicArticleFull(PublicArticle):
    content: str | None  # None si payant et non acheté
    audio_url: str | None
    seo_title: str | None
    seo_description: str | None
    seo_keywords: list[str] | None


class PublicBlogInfo(BaseModel):
    name: str
    slug: str
    description: str | None
    category: str | None
    logo_url: str | None
    favicon_url: str | None
    cover_image_url: str | None
    language: str
    theme: str
    primary_color: str
    font_family: str
    social_links: dict


# ── GET /public/{slug} — info blog ───────────────────────────────

@router.get("", response_model=PublicBlogInfo)
async def get_blog_info(slug: str, db: DBSession):
    tenant = await _resolve_tenant(db, slug)
    return PublicBlogInfo(
        name=tenant.name,
        slug=tenant.slug,
        description=tenant.description,
        category=tenant.category,
        logo_url=tenant.logo_url,
        favicon_url=tenant.favicon_url,
        cover_image_url=tenant.cover_image_url,
        language=tenant.language,
        theme=tenant.theme,
        primary_color=tenant.primary_color,
        font_family=getattr(tenant, 'font_family', 'Inter'),
        social_links=tenant.social_links or {},
    )


# ── GET /public/{slug}/articles ───────────────────────────────────

@router.get("/articles", response_model=list[PublicArticle])
async def list_public_articles(
    slug: str,
    db: DBSession,
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=20, le=50),
    cursor: str | None = Query(default=None),
):
    tenant = await _resolve_tenant(db, slug)

    query = (
        select(Article)
        .options(joinedload(Article.category), joinedload(Article.author))
        .where(
            Article.tenant_id == tenant.id,
            Article.status == ArticleStatus.PUBLISHED,
            Article.visibility == ContentVisibility.PUBLIC,
            Article.deleted_at.is_(None),
        )
    )

    if cursor:
        query = query.where(Article.published_at < datetime.fromisoformat(cursor))
    if q:
        query = query.where(
            Article.title.ilike(f"%{q}%") | Article.excerpt.ilike(f"%{q}%")
        )

    query = query.order_by(Article.published_at.desc()).limit(limit)
    result = await db.execute(query)
    articles = result.unique().scalars().all()

    return [_to_public(a) for a in articles]


# ── GET /public/{slug}/articles/{article_slug} ───────────────────

@router.get("/articles/{article_slug}", response_model=PublicArticleFull)
async def get_public_article(
    slug: str, article_slug: str, db: DBSession,
):
    tenant = await _resolve_tenant(db, slug)
    result = await db.execute(
        select(Article)
        .options(joinedload(Article.category), joinedload(Article.author))
        .where(
            Article.tenant_id == tenant.id,
            Article.slug == article_slug,
            Article.status == ArticleStatus.PUBLISHED,
            Article.deleted_at.is_(None),
        )
    )
    article = result.scalar_one_or_none()
    if not article:
        raise NotFoundException("Article")

    is_paid = article.visibility == ContentVisibility.PAID
    return PublicArticleFull(
        **_to_public(article).__dict__,
        content=article.content if not is_paid else None,
        audio_url=article.audio_url,
        seo_title=article.seo_title,
        seo_description=article.seo_description,
        seo_keywords=article.seo_keywords,
    )


# ── GET /public/{slug}/categories ─────────────────────────────────

@router.get("/categories")
async def list_public_categories(slug: str, db: DBSession):
    tenant = await _resolve_tenant(db, slug)
    result = await db.execute(
        select(Category)
        .where(Category.tenant_id == tenant.id)
        .order_by(Category.sort_order, Category.name)
    )
    return [
        {
            "id": str(c.id),
            "name": c.name,
            "slug": c.slug,
            "description": c.description,
            "cover_image_url": c.cover_image_url,
            "articles_count": c.articles_count,
        }
        for c in result.scalars().all()
    ]


# ── GET /public/{slug}/tags ───────────────────────────────────────

@router.get("/tags")
async def list_public_tags(slug: str, db: DBSession):
    tenant = await _resolve_tenant(db, slug)
    result = await db.execute(
        select(Tag).where(Tag.tenant_id == tenant.id)
        .order_by(Tag.articles_count.desc()).limit(50)
    )
    return [{"name": t.name, "slug": t.slug, "count": t.articles_count} for t in result.scalars().all()]


# ── GET /public/{slug}/rss ────────────────────────────────────────

@router.get("/rss", response_class=Response)
async def rss_feed(slug: str, db: DBSession):
    tenant = await _resolve_tenant(db, slug)
    result = await db.execute(
        select(Article).where(
            Article.tenant_id == tenant.id,
            Article.status == ArticleStatus.PUBLISHED,
            Article.deleted_at.is_(None),
        ).order_by(Article.published_at.desc()).limit(50)
    )
    articles = result.scalars().all()

    rss = ET.Element("rss", version="2.0")
    rss.set("xmlns:atom", "http://www.w3.org/2005/Atom")
    channel = ET.SubElement(rss, "channel")

    blog_url = f"https://{tenant.slug}.nexusblog.io"
    ET.SubElement(channel, "title").text = tenant.name
    ET.SubElement(channel, "link").text = blog_url
    ET.SubElement(channel, "description").text = tenant.description or tenant.name
    ET.SubElement(channel, "language").text = "fr"
    ET.SubElement(channel, "lastBuildDate").text = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")

    atom_link = ET.SubElement(channel, "atom:link")
    atom_link.set("href", f"{blog_url}/rss")
    atom_link.set("rel", "self")
    atom_link.set("type", "application/rss+xml")

    for a in articles:
        item = ET.SubElement(channel, "item")
        ET.SubElement(item, "title").text = a.title
        ET.SubElement(item, "link").text = f"{blog_url}/{a.slug}"
        ET.SubElement(item, "guid").text = f"{blog_url}/{a.slug}"
        if a.excerpt:
            ET.SubElement(item, "description").text = a.excerpt
        if a.published_at:
            ET.SubElement(item, "pubDate").text = a.published_at.strftime("%a, %d %b %Y %H:%M:%S +0000")

    xml_str = '<?xml version="1.0" encoding="UTF-8"?>' + ET.tostring(rss, encoding="unicode")
    return Response(content=xml_str, media_type="application/rss+xml; charset=utf-8")


# ── GET /public/{slug}/sitemap.xml ───────────────────────────────

@router.get("/sitemap.xml", response_class=Response)
async def sitemap(slug: str, db: DBSession):
    tenant = await _resolve_tenant(db, slug)
    result = await db.execute(
        select(Article).where(
            Article.tenant_id == tenant.id,
            Article.status == ArticleStatus.PUBLISHED,
            Article.deleted_at.is_(None),
        ).order_by(Article.published_at.desc())
    )
    articles = result.scalars().all()

    blog_url = f"https://{tenant.slug}.nexusblog.io"
    urlset = ET.Element("urlset")
    urlset.set("xmlns", "http://www.sitemaps.org/schemas/sitemap/0.9")

    # Page d'accueil
    home = ET.SubElement(urlset, "url")
    ET.SubElement(home, "loc").text = blog_url
    ET.SubElement(home, "changefreq").text = "daily"
    ET.SubElement(home, "priority").text = "1.0"

    for a in articles:
        url = ET.SubElement(urlset, "url")
        ET.SubElement(url, "loc").text = f"{blog_url}/{a.slug}"
        if a.published_at:
            ET.SubElement(url, "lastmod").text = a.published_at.date().isoformat()
        ET.SubElement(url, "changefreq").text = "weekly"
        ET.SubElement(url, "priority").text = "0.8"

    xml_str = '<?xml version="1.0" encoding="UTF-8"?>' + ET.tostring(urlset, encoding="unicode")
    return Response(content=xml_str, media_type="application/xml; charset=utf-8")


# ── Helper ────────────────────────────────────────────────────────

def _to_public(a: Article) -> PublicArticle:
    author_name = a.author.display_name if a.author else None
    category_slug = a.category.slug if a.category else None
    category_name = a.category.name if a.category else None
    return PublicArticle(
        id=str(a.id),
        title=a.title,
        slug=a.slug,
        excerpt=a.excerpt,
        cover_image_url=a.cover_image_url,
        author_name=author_name,
        category_slug=category_slug,
        category_name=category_name,
        tags=[],
        published_at=a.published_at,
        reading_time_minutes=a.reading_time_minutes,
        views_count=a.views_count,
        likes_count=a.likes_count,
        is_paid=a.visibility == ContentVisibility.PAID,
        price=float(a.price) if a.price else None,
    )


# ── GET /public — liste de tous les blogs publics ──────────────────

class PublicBlogCard(BaseModel):
    name: str
    slug: str
    description: str | None
    category: str | None
    logo_url: str | None
    cover_image_url: str | None
    language: str
    theme: str
    primary_color: str
    articles_count: int


@explore_router.get("", response_model=list[PublicBlogCard])
async def list_public_blogs(
    db: DBSession,
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=24, le=100),
    offset: int = Query(default=0, ge=0),
):
    """Returns all active public blogs, sorted by article count descending."""
    query = select(Tenant).where(Tenant.status == TenantStatus.ACTIVE, Tenant.deleted_at.is_(None))
    if category:
        query = query.where(Tenant.category == category)
    if q:
        query = query.where(
            Tenant.name.ilike(f"%{q}%") | Tenant.description.ilike(f"%{q}%")
        )
    query = query.order_by(Tenant.articles_count.desc(), Tenant.created_at.desc())
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    tenants = result.scalars().all()
    return [
        PublicBlogCard(
            name=t.name,
            slug=t.slug,
            description=t.description,
            category=t.category,
            logo_url=t.logo_url,
            cover_image_url=t.cover_image_url,
            language=t.language,
            theme=t.theme,
            primary_color=t.primary_color,
            articles_count=t.articles_count,
        )
        for t in tenants
    ]
