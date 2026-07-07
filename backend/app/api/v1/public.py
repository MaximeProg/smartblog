"""
API publique — blogs en lecture sans authentification.
Résout le tenant par slug (path param).
"""
import uuid
import random
from fastapi import APIRouter, Query, Request
from fastapi.responses import Response
from sqlalchemy import select, and_, update, func, text as sa_text
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from datetime import datetime, timezone
import xml.etree.ElementTree as ET

from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.exceptions import NotFoundException, ValidationException
from app.models.tenant import Tenant
from app.models.article import Article, Category, Tag
from app.models.comment import Comment
from app.models.ad import Ad
from app.models.enums import (
    ArticleStatus, ContentVisibility, TenantStatus, CommentStatus,
    AdCampaignStatus, AdSubmissionStatus, LinkSafetyStatus,
)
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
    article_type: str | None
    video_url: str | None
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
    article_type: str | None
    video_url: str | None
    audio_url: str | None
    episode_number: int | None
    season: int | None
    seo_title: str | None
    seo_description: str | None
    seo_keywords: list[str] | None
    canonical_url: str | None = None
    robots_noindex: bool = False


class PublicBlogInfo(BaseModel):
    id: str
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
    template_config: dict | None


# ── GET /public/{slug} — info blog ───────────────────────────────

@router.get("", response_model=PublicBlogInfo)
async def get_blog_info(slug: str, db: DBSession):
    tenant = await _resolve_tenant(db, slug)
    return PublicBlogInfo(
        id=str(tenant.id),
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
        template_config=tenant.template_config,
    )


# ── GET /public/{slug}/articles ───────────────────────────────────

@router.get("/articles", response_model=list[PublicArticle])
async def list_public_articles(
    slug: str,
    db: DBSession,
    category: str | None = Query(default=None),
    tag: str | None = Query(default=None),
    q: str | None = Query(default=None),
    type: str | None = Query(default=None, alias="type"),
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
    if type:
        query = query.where(Article.article_type == type)

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
    base = _to_public(article).model_dump()
    return PublicArticleFull(
        **base,
        content=article.content if not is_paid else None,
        audio_url=getattr(article, 'audio_url', None),
        episode_number=getattr(article, 'episode_number', None),
        season=getattr(article, 'season', None),
        seo_title=article.seo_title,
        seo_description=article.seo_description,
        seo_keywords=article.seo_keywords,
        canonical_url=getattr(article, 'canonical_url', None),
        robots_noindex=getattr(article, 'robots_noindex', False),
    )


# ── POST /public/{slug}/articles/{article_slug}/view ─────────────

@router.post("/articles/{article_slug}/view", status_code=200)
async def track_article_view(slug: str, article_slug: str, db: DBSession):
    """Increment view counter for a published article. Idempotent — silent on miss."""
    tenant = await _resolve_tenant(db, slug)
    result = await db.execute(
        select(Article).where(
            Article.tenant_id == tenant.id,
            Article.slug == article_slug,
            Article.status == ArticleStatus.PUBLISHED,
            Article.deleted_at.is_(None),
        )
    )
    article = result.scalar_one_or_none()
    if article:
        await db.execute(
            update(Article)
            .where(Article.id == article.id)
            .values(views_count=Article.views_count + 1)
        )
        await db.commit()
    return {"ok": True}


# ── GET /public/{slug}/categories ─────────────────────────────────

@router.get("/categories")
async def list_public_categories(slug: str, db: DBSession):
    tenant = await _resolve_tenant(db, slug)

    # 1. Fetch all categories for this tenant
    cat_result = await db.execute(
        select(Category)
        .where(Category.tenant_id == tenant.id)
        .order_by(Category.sort_order, Category.name)
    )
    categories = cat_result.scalars().all()
    if not categories:
        return []

    # 2. Count published articles per category in one query
    count_result = await db.execute(
        select(Article.category_id, func.count().label("cnt"))
        .where(
            Article.tenant_id == tenant.id,
            Article.status == ArticleStatus.PUBLISHED,
            Article.deleted_at.is_(None),
            Article.category_id.in_([c.id for c in categories]),
        )
        .group_by(Article.category_id)
    )
    counts: dict[str, int] = {str(row.category_id): row.cnt for row in count_result.all()}

    return [
        {
            "id": str(c.id),
            "name": c.name,
            "slug": c.slug,
            "description": c.description,
            "cover_image_url": c.cover_image_url,
            "articles_count": counts.get(str(c.id), 0),
        }
        for c in categories
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


# ── GET /public/{slug}/podcast/rss ───────────────────────────────

@router.get("/podcast/rss", response_class=Response)
async def podcast_rss_feed(slug: str, db: DBSession):
    """iTunes-compatible podcast RSS feed (type=audio|podcast articles only)."""
    tenant = await _resolve_tenant(db, slug)
    result = await db.execute(
        select(Article).where(
            Article.tenant_id == tenant.id,
            Article.status == ArticleStatus.PUBLISHED,
            Article.deleted_at.is_(None),
            Article.article_type.in_(["podcast", "audio"]),
        ).order_by(Article.published_at.desc()).limit(100)
    )
    articles = result.scalars().all()

    blog_url = f"https://{tenant.slug}.nexusblog.io"

    rss = ET.Element("rss", version="2.0")
    rss.set("xmlns:itunes", "http://www.itunes.com/dtds/podcast-1.0.dtd")
    rss.set("xmlns:atom", "http://www.w3.org/2005/Atom")
    channel = ET.SubElement(rss, "channel")

    ET.SubElement(channel, "title").text = f"{tenant.name} — Podcast"
    ET.SubElement(channel, "link").text = f"{blog_url}/podcast"
    ET.SubElement(channel, "description").text = tenant.description or tenant.name
    ET.SubElement(channel, "language").text = tenant.language or "fr"
    ET.SubElement(channel, "lastBuildDate").text = datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S +0000")

    atom_link = ET.SubElement(channel, "atom:link")
    atom_link.set("href", f"{blog_url}/podcast/rss")
    atom_link.set("rel", "self")
    atom_link.set("type", "application/rss+xml")

    if tenant.logo_url:
        img = ET.SubElement(channel, "image")
        ET.SubElement(img, "url").text = tenant.logo_url
        ET.SubElement(img, "title").text = tenant.name
        ET.SubElement(img, "link").text = blog_url
        itunes_img = ET.SubElement(channel, "itunes:image")
        itunes_img.set("href", tenant.logo_url)

    ET.SubElement(channel, "itunes:author").text = tenant.name

    for a in articles:
        item = ET.SubElement(channel, "item")
        ET.SubElement(item, "title").text = a.title
        ET.SubElement(item, "link").text = f"{blog_url}/{a.slug}"
        ET.SubElement(item, "guid").text = f"{blog_url}/{a.slug}"
        if a.excerpt:
            ET.SubElement(item, "description").text = a.excerpt
        if a.published_at:
            ET.SubElement(item, "pubDate").text = a.published_at.strftime("%a, %d %b %Y %H:%M:%S +0000")
        if a.audio_url:
            enc = ET.SubElement(item, "enclosure")
            enc.set("url", a.audio_url)
            enc.set("type", "audio/mpeg")
            enc.set("length", "0")
        if a.episode_number:
            ET.SubElement(item, "itunes:episode").text = str(a.episode_number)
        if a.season:
            ET.SubElement(item, "itunes:season").text = str(a.season)
        if a.audio_duration_seconds:
            mins, secs = divmod(int(a.audio_duration_seconds), 60)
            ET.SubElement(item, "itunes:duration").text = f"{mins}:{secs:02d}"
        if a.cover_image_url:
            ep_img = ET.SubElement(item, "itunes:image")
            ep_img.set("href", a.cover_image_url)

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
        article_type=a.article_type.value if getattr(a, 'article_type', None) else None,
        video_url=getattr(a, 'video_url', None),
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
    """Returns all active public blogs with live article counts."""
    # 1. Fetch matching tenants
    query = select(Tenant).where(Tenant.status == TenantStatus.ACTIVE, Tenant.deleted_at.is_(None))
    if category:
        query = query.where(Tenant.category == category)
    if q:
        query = query.where(
            Tenant.name.ilike(f"%{q}%") | Tenant.description.ilike(f"%{q}%")
        )
    query = query.order_by(Tenant.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    tenants = result.scalars().all()
    if not tenants:
        return []

    # 2. Count published articles per tenant in one query
    tenant_ids = [t.id for t in tenants]
    count_result = await db.execute(
        select(Article.tenant_id, func.count().label("cnt"))
        .where(
            Article.tenant_id.in_(tenant_ids),
            Article.status == ArticleStatus.PUBLISHED,
            Article.deleted_at.is_(None),
        )
        .group_by(Article.tenant_id)
    )
    counts: dict[str, int] = {str(row.tenant_id): row.cnt for row in count_result.all()}

    # 3. Sort by real article count descending
    tenants_sorted = sorted(tenants, key=lambda t: counts.get(str(t.id), 0), reverse=True)
    rows = [(t, counts.get(str(t.id), 0)) for t in tenants_sorted]
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
            articles_count=real_count,
        )
        for t, real_count in rows
    ]


# ── GET /public/{slug}/ads/rotator ───────────────────────────────────────────

class PublicAdCard(BaseModel):
    id: str
    title: str
    description: str | None
    image_url: str | None
    click_url: str
    placement: str | None


@router.get("/ads/rotator", response_model=PublicAdCard | None)
async def get_rotator_ad(slug: str, db: DBSession):
    """
    Retourne la publicité à afficher selon l'algorithme de rotation pondérée.
    Le poids de chaque annonce = total_budget (plus le budget est élevé,
    plus la pub a de chances d'être sélectionnée). Retourne null si aucune
    campagne active.
    """
    tenant = await _resolve_tenant(db, slug)
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(Ad).where(
            Ad.tenant_id == tenant.id,
            Ad.submission_status == AdSubmissionStatus.APPROVED,
            Ad.campaign_status == AdCampaignStatus.ACTIVE,
            Ad.link_safety_status != LinkSafetyStatus.DANGEROUS,
            # Respecter les dates de campagne si définies
            (Ad.starts_at.is_(None) | (Ad.starts_at <= now)),
            (Ad.ends_at.is_(None) | (Ad.ends_at >= now)),
        )
    )
    ads = result.scalars().all()

    if not ads:
        return None

    # Rotation pondérée par budget (total_budget, défaut 1)
    weights = [float(a.total_budget or 1) for a in ads]
    selected: Ad = random.choices(ads, weights=weights, k=1)[0]

    return PublicAdCard(
        id=str(selected.id),
        title=selected.title,
        description=selected.description,
        image_url=selected.image_url,
        click_url=selected.click_url,
        placement=selected.placement,
    )


@router.post("/ads/{ad_id}/impression", status_code=204)
async def track_ad_impression(slug: str, ad_id: uuid.UUID, db: DBSession):
    """Comptabilise une impression (appelé automatiquement à chaque affichage)."""
    tenant = await _resolve_tenant(db, slug)
    await db.execute(
        sa_text(
            "UPDATE ads SET impressions_count = impressions_count + 1 "
            "WHERE id = :id AND tenant_id = :tid AND campaign_status = 'active'"
        ),
        {"id": str(ad_id), "tid": str(tenant.id)},
    )
    await db.commit()


@router.post("/ads/{ad_id}/click", status_code=204)
async def track_ad_click(slug: str, ad_id: uuid.UUID, db: DBSession):
    """Comptabilise un clic. Bloque si le lien est dangereux."""
    tenant = await _resolve_tenant(db, slug)
    result = await db.execute(
        select(Ad).where(Ad.id == ad_id, Ad.tenant_id == tenant.id)
    )
    ad = result.scalar_one_or_none()
    if not ad:
        return
    if ad.link_safety_status == LinkSafetyStatus.DANGEROUS:
        raise ValidationException("Ce lien publicitaire a été signalé comme dangereux.")
    await db.execute(
        sa_text(
            "UPDATE ads SET clicks_count = clicks_count + 1 WHERE id = :id AND tenant_id = :tid"
        ),
        {"id": str(ad_id), "tid": str(tenant.id)},
    )
    await db.commit()


# ─── Public comments ──────────────────────────────────────────────────────────

class PublicCommentAuthor(BaseModel):
    display_name: str | None
    avatar_url: str | None = None


class PublicCommentResponse(BaseModel):
    id: str
    content: str
    author: PublicCommentAuthor
    parent_id: str | None
    replies_count: int
    created_at: datetime


class PublicCreateCommentRequest(BaseModel):
    content: str
    author_name: str | None = None
    author_email: str | None = None
    parent_id: str | None = None


async def _resolve_public_article(db: AsyncSession, tenant: Tenant, article_slug: str) -> Article:
    result = await db.execute(
        select(Article).where(
            Article.tenant_id == tenant.id,
            Article.slug == article_slug,
            Article.status == ArticleStatus.PUBLISHED,
            Article.deleted_at.is_(None),
        )
    )
    article = result.scalar_one_or_none()
    if not article:
        raise NotFoundException("Article")
    return article


@router.get("/articles/{article_slug}/comments", response_model=list[PublicCommentResponse])
async def list_public_comments(slug: str, article_slug: str, db: DBSession):
    tenant = await _resolve_tenant(db, slug)
    article = await _resolve_public_article(db, tenant, article_slug)

    result = await db.execute(
        select(Comment).where(
            Comment.tenant_id == tenant.id,
            Comment.article_id == article.id,
            Comment.status == CommentStatus.APPROVED,
            Comment.parent_id.is_(None),
        ).order_by(Comment.created_at.asc()).limit(100)
    )
    comments = result.scalars().all()
    return [
        PublicCommentResponse(
            id=str(c.id),
            content=c.content,
            author=PublicCommentAuthor(
                display_name=c.author_name or "Anonymous",
                avatar_url=None,
            ),
            parent_id=str(c.parent_id) if c.parent_id else None,
            replies_count=c.replies_count,
            created_at=c.created_at,
        )
        for c in comments
    ]


@router.post("/articles/{article_slug}/comments", response_model=PublicCommentResponse, status_code=201)
async def create_public_comment(
    slug: str,
    article_slug: str,
    body: PublicCreateCommentRequest,
    request: Request,
    db: DBSession,
):
    if not body.content or len(body.content.strip()) < 2:
        raise ValidationException("Le commentaire est trop court.")
    if len(body.content) > 5000:
        raise ValidationException("Le commentaire est trop long (max 5000 caractères).")

    tenant = await _resolve_tenant(db, slug)
    article = await _resolve_public_article(db, tenant, article_slug)

    if not article.allow_comments:
        raise ValidationException("Les commentaires sont désactivés pour cet article.")

    ip = request.client.host if request.client else None

    comment = Comment(
        tenant_id=tenant.id,
        article_id=article.id,
        author_name=body.author_name or "Anonymous",
        author_email=body.author_email,
        parent_id=uuid.UUID(body.parent_id) if body.parent_id else None,
        content=body.content.strip(),
        ip_address=ip,
        user_agent=request.headers.get("user-agent", "")[:500],
        status=CommentStatus.PENDING,
    )
    db.add(comment)

    from sqlalchemy import text
    await db.execute(
        text("UPDATE articles SET comments_count = comments_count + 1 WHERE id = :aid"),
        {"aid": str(article.id)},
    )
    if body.parent_id:
        await db.execute(
            text("UPDATE comments SET replies_count = replies_count + 1 WHERE id = :pid"),
            {"pid": body.parent_id},
        )

    await db.commit()
    await db.refresh(comment)

    return PublicCommentResponse(
        id=str(comment.id),
        content=comment.content,
        author=PublicCommentAuthor(display_name=comment.author_name or "Anonymous"),
        parent_id=str(comment.parent_id) if comment.parent_id else None,
        replies_count=comment.replies_count,
        created_at=comment.created_at,
    )
