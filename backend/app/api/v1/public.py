"""
API publique — blogs en lecture sans authentification.
Résout le tenant par slug (path param).
"""
import uuid
import random
import secrets
import structlog

logger = structlog.get_logger()
from fastapi import APIRouter, Query, Request, HTTPException
from fastapi.responses import Response, PlainTextResponse, RedirectResponse
from sqlalchemy import select, and_, update, func, text as sa_text
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
import xml.etree.ElementTree as ET

from sqlalchemy.orm import joinedload

from app.core.database import get_db
from app.core.exceptions import NotFoundException, ValidationException
from app.models.tenant import Tenant
from app.models.article import Article, Category, Tag, SlugRedirect
from app.models.comment import Comment
from app.models.ad import Ad
from app.models.newsletter import NewsletterSubscriber
from app.models.domain import CustomDomain
from app.models.tenant_user import TenantUser
from app.models.user import User
from app.models.enums import (
    ArticleStatus, ContentVisibility, TenantStatus, CommentStatus,
    AdCampaignStatus, AdSubmissionStatus, LinkSafetyStatus, SubscriberStatus,
    DomainVerificationStatus, UserRole, PlanTier,
)
from app.core.dependencies import DBSession
from app.services import email_service

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


async def _owner_plan(db: AsyncSession, tenant: Tenant) -> PlanTier:
    """L'abonnement est rattaché à l'utilisateur (propriétaire du blog), pas
    au tenant — Tenant.plan n'est qu'une copie figée au moment de la création
    du blog, jamais resynchronisée après un upgrade/downgrade (le webhook de
    paiement ne met à jour que User.plan). On résout donc le vrai plan actif
    via le TENANT_ADMIN, comme le fait le webhook de paiement lui-même."""
    result = await db.execute(
        select(User.plan)
        .join(TenantUser, TenantUser.user_id == User.id)
        .where(
            TenantUser.tenant_id == tenant.id,
            TenantUser.role == UserRole.TENANT_ADMIN,
        )
        .limit(1)
    )
    plan = result.scalar_one_or_none()
    return plan if plan is not None else tenant.plan


async def _allowed_languages(db: AsyncSession, tenant: Tenant) -> list[str]:
    """Langues de traduction que ce tenant a le droit de proposer à ses
    visiteurs — réservé aux plans payants, quel que soit le contenu resté
    en base (ex: après un downgrade vers le plan gratuit)."""
    if await _owner_plan(db, tenant) == PlanTier.FREE:
        return []
    return tenant.enabled_languages or []


async def _is_lang_allowed(db: AsyncSession, tenant: Tenant, lang: str) -> bool:
    """Une langue est toujours autorisée si c'est la langue source du tenant
    (aucune traduction nécessaire), sinon seulement si activée explicitement."""
    if lang == (tenant.language or "en").lower():
        return True
    return lang in await _allowed_languages(db, tenant)


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
    enabled_languages: list[str] = []


# ── GET /public/{slug} — info blog ───────────────────────────────

@router.get("", response_model=PublicBlogInfo)
async def get_blog_info(slug: str, db: DBSession, lang: str | None = Query(default=None)):
    tenant = await _resolve_tenant(db, slug)

    template_config = tenant.template_config
    source_lang = (tenant.language or "en").lower()
    target_lang = (lang or source_lang).lower()
    allowed_languages = await _allowed_languages(db, tenant)
    if target_lang != source_lang and template_config and (target_lang in allowed_languages):
        translated = await _get_or_create_tenant_content_translation(db, tenant, target_lang)
        if translated is not None:
            template_config = translated

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
        template_config=template_config,
        enabled_languages=allowed_languages,
    )


async def _get_or_create_tenant_content_translation(db: DBSession, tenant: Tenant, lang: str) -> dict | None:
    """Traduction complète de template_config, même pattern que les pages CMS
    plateforme (hash source, upsert atomique, jamais d'exception propagée)."""
    import hashlib
    import json as _json
    from app.services.translation_service import translate_json

    source_hash = hashlib.sha256(
        _json.dumps(tenant.template_config, sort_keys=True).encode()
    ).hexdigest()

    existing = (await db.execute(sa_text(
        "SELECT template_config, source_hash FROM tenant_content_translations WHERE tenant_id = :tid AND lang = :lang"
    ), {"tid": str(tenant.id), "lang": lang})).fetchone()

    if existing and existing.source_hash == source_hash:
        return existing.template_config

    try:
        translated = await translate_json(tenant.template_config, lang, source_lang=(tenant.language or "en"))
    except Exception:
        logger.warning("tenant content translation failed", tenant_id=str(tenant.id), lang=lang)
        return None

    await db.execute(sa_text("""
        INSERT INTO tenant_content_translations (tenant_id, lang, template_config, source_hash)
        VALUES (:tid, :lang, CAST(:content AS JSONB), :hash)
        ON CONFLICT (tenant_id, lang) DO UPDATE
        SET template_config = EXCLUDED.template_config, source_hash = EXCLUDED.source_hash,
            translated_at = now()
    """), {
        "tid": str(tenant.id), "lang": lang,
        "content": _json.dumps(translated), "hash": source_hash,
    })
    await db.commit()

    return translated


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
    lang: str | None = Query(default=None),
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

    source_lang = (tenant.language or "en").lower()
    target_lang = (lang or source_lang).lower()
    if target_lang != source_lang and articles and await _is_lang_allowed(db, tenant, target_lang):
        previews = await _get_or_create_article_previews(db, tenant, articles, target_lang)
        out = []
        for a in articles:
            p = _to_public(a)
            preview = previews.get(str(a.id))
            if preview:
                p.title = preview["title"]
                p.excerpt = preview["excerpt"] or None
            out.append(p)
        return out

    return [_to_public(a) for a in articles]


async def _get_or_create_article_previews(db: DBSession, tenant: Tenant, articles: list[Article], lang: str) -> dict:
    """Traduction groupée titre+extrait (un seul appel DeepL pour toute la
    page de résultats) — ne touche jamais `content` (laissé NULL/inchangé,
    généré seulement quand un lecteur ouvre l'article en entier)."""
    import hashlib
    import json as _json
    from app.services.translation_service import translate_json

    def _hash(a: Article) -> str:
        return hashlib.sha256(
            _json.dumps({"title": a.title, "excerpt": a.excerpt, "content": a.content}, sort_keys=True).encode()
        ).hexdigest()

    ids = [str(a.id) for a in articles]
    hashes = {str(a.id): _hash(a) for a in articles}

    existing_rows = (await db.execute(sa_text(
        "SELECT article_id, title, excerpt, source_hash FROM article_translations "
        "WHERE lang = :lang AND article_id = ANY(:ids)"
    ), {"lang": lang, "ids": ids})).fetchall()
    existing = {str(r.article_id): r for r in existing_rows}

    result_map: dict[str, dict] = {}
    to_translate: dict[str, dict] = {}
    for a in articles:
        aid = str(a.id)
        row = existing.get(aid)
        if row and row.source_hash == hashes[aid]:
            result_map[aid] = {"title": row.title, "excerpt": row.excerpt}
        else:
            to_translate[aid] = {"title": a.title, "excerpt": a.excerpt or ""}

    if to_translate:
        try:
            translated_batch = await translate_json(to_translate, lang, source_lang=(tenant.language or "en"))
        except Exception:
            logger.warning("article preview translation failed", tenant_id=str(tenant.id), lang=lang)
            translated_batch = to_translate

        for aid, vals in translated_batch.items():
            result_map[aid] = vals
            await db.execute(sa_text("""
                INSERT INTO article_translations (tenant_id, article_id, lang, title, excerpt, content, source_hash)
                VALUES (:tid, :aid, :lang, :title, :excerpt, NULL, :hash)
                ON CONFLICT (article_id, lang) DO UPDATE
                SET title = EXCLUDED.title, excerpt = EXCLUDED.excerpt,
                    source_hash = EXCLUDED.source_hash, translated_at = now()
            """), {
                "tid": str(tenant.id), "aid": aid, "lang": lang,
                "title": vals["title"], "excerpt": vals["excerpt"],
                "hash": hashes[aid],
            })
        await db.commit()

    return result_map


# ── GET /public/{slug}/articles/{article_slug} ───────────────────

@router.get("/articles/{article_slug}", response_model=PublicArticleFull)
async def get_public_article(
    slug: str, article_slug: str, db: DBSession,
    lang: str | None = Query(default=None),
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
        # Check for a 301 redirect (slug changed)
        from fastapi.responses import RedirectResponse
        redirect = await db.execute(
            select(SlugRedirect).where(
                SlugRedirect.tenant_id == tenant.id,
                SlugRedirect.old_slug == article_slug,
            ).order_by(SlugRedirect.created_at.desc()).limit(1)
        )
        redir = redirect.scalar_one_or_none()
        if redir:
            return RedirectResponse(
                url=f"/public/{slug}/articles/{redir.new_slug}",
                status_code=301,
            )
        raise NotFoundException("Article")

    is_paid = article.visibility == ContentVisibility.PAID
    base = _to_public(article).model_dump()

    title, excerpt = article.title, article.excerpt
    content = article.content if not is_paid else None
    seo_title, seo_description = article.seo_title, article.seo_description

    source_lang = (tenant.language or "en").lower()
    target_lang = (lang or source_lang).lower()
    if target_lang != source_lang and not is_paid and await _is_lang_allowed(db, tenant, target_lang):
        translation = await _get_or_create_article_translation(db, tenant, article, target_lang)
        if translation:
            title = translation["title"]
            excerpt = translation["excerpt"]
            content = translation["content"]
            seo_title = translation["seo_title"]
            seo_description = translation["seo_description"]
            base["title"] = title
            base["excerpt"] = excerpt

    return PublicArticleFull(
        **base,
        content=content,
        audio_url=getattr(article, 'audio_url', None),
        episode_number=getattr(article, 'episode_number', None),
        season=getattr(article, 'season', None),
        seo_title=seo_title,
        seo_description=seo_description,
        seo_keywords=article.seo_keywords,
        canonical_url=getattr(article, 'canonical_url', None),
        robots_noindex=getattr(article, 'robots_noindex', False),
    )


async def _get_or_create_article_translation(db: DBSession, tenant: Tenant, article: Article, lang: str) -> dict | None:
    """Lazy translation, same pattern as GET /platform/pages/{slug}?lang= —
    generates on first request, persists, upserts atomically, never raises
    (falls back to None → caller keeps serving the source content)."""
    import hashlib
    import json as _json
    from app.services.translation_service import translate_article

    source_hash = hashlib.sha256(
        _json.dumps(
            {"title": article.title, "excerpt": article.excerpt, "content": article.content},
            sort_keys=True,
        ).encode()
    ).hexdigest()

    existing = (await db.execute(sa_text(
        "SELECT title, excerpt, content, seo_title, seo_description, source_hash "
        "FROM article_translations WHERE article_id = :aid AND lang = :lang"
    ), {"aid": str(article.id), "lang": lang})).fetchone()

    if existing and existing.source_hash == source_hash:
        return {
            "title": existing.title, "excerpt": existing.excerpt, "content": existing.content,
            "seo_title": existing.seo_title, "seo_description": existing.seo_description,
        }

    try:
        translated = await translate_article(article, lang, source_lang=(tenant.language or "en"))
    except Exception:
        logger.warning("article translation failed", article_id=str(article.id), lang=lang)
        return None

    await db.execute(sa_text("""
        INSERT INTO article_translations (tenant_id, article_id, lang, title, excerpt, content, seo_title, seo_description, source_hash)
        VALUES (:tid, :aid, :lang, :title, :excerpt, :content, :seo_title, :seo_description, :hash)
        ON CONFLICT (article_id, lang) DO UPDATE
        SET title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, content = EXCLUDED.content,
            seo_title = EXCLUDED.seo_title, seo_description = EXCLUDED.seo_description,
            source_hash = EXCLUDED.source_hash, translated_at = now()
    """), {
        "tid": str(tenant.id), "aid": str(article.id), "lang": lang,
        "title": translated["title"], "excerpt": translated["excerpt"], "content": translated["content"],
        "seo_title": translated["seo_title"], "seo_description": translated["seo_description"],
        "hash": source_hash,
    })
    await db.commit()

    try:
        from app.services.search_service import index_article
        await index_article(
            tenant.slug,
            {
                "id": str(article.id),
                "tenant_id": str(article.tenant_id),
                "title": translated["title"],
                "slug": article.slug,
                "excerpt": translated["excerpt"] or "",
                "content": translated["content"] or "",
                "article_type": article.article_type.value if article.article_type else None,
                "status": article.status.value,
                "visibility": article.visibility.value if article.visibility else None,
                "category_id": str(article.category_id) if article.category_id else None,
                "published_at": article.published_at.isoformat() if article.published_at else None,
                "lang": lang,
            },
            doc_id=f"{article.id}:{lang}",
        )
    except Exception:
        logger.warning("ES indexing of article translation failed", article_id=str(article.id), lang=lang)

    return translated


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


# ── POST /public/{slug}/subscribe ────────────────────────────────

class PublicSubscribeRequest(BaseModel):
    email: EmailStr
    first_name: str | None = None
    last_name: str | None = None

@router.post("/subscribe", status_code=200)
async def public_subscribe(slug: str, body: PublicSubscribeRequest, request: Request, db: DBSession):
    tenant = await _resolve_tenant(db, slug)

    existing = await db.execute(
        select(NewsletterSubscriber).where(
            NewsletterSubscriber.tenant_id == tenant.id,
            NewsletterSubscriber.email == body.email,
        )
    )
    sub = existing.scalar_one_or_none()
    if sub:
        if sub.status == SubscriberStatus.UNSUBSCRIBED:
            sub.status = SubscriberStatus.PENDING
            sub.confirmation_token = secrets.token_urlsafe(32)
            await db.commit()
        return {"message": "ok"}

    ip = request.client.host if request.client else None
    sub = NewsletterSubscriber(
        tenant_id=tenant.id,
        email=body.email,
        first_name=body.first_name,
        last_name=body.last_name,
        source="website",
        confirmation_token=secrets.token_urlsafe(32),
        unsubscribe_token=secrets.token_urlsafe(32),
        ip_address=ip,
    )
    db.add(sub)
    try:
        await db.execute(
            sa_text("UPDATE tenants SET subscribers_count = subscribers_count + 1 WHERE id = :tid"),
            {"tid": str(tenant.id)},
        )
    except Exception:
        pass
    await db.commit()

    # Send welcome email to subscriber and notification to blog owner
    lang = tenant.language or "en"
    blog_url = f"https://{tenant.slug}.smarterbloggers.com"
    try:
        await email_service.send_newsletter_welcome_subscriber(
            to=body.email,
            blog_name=tenant.name,
            blog_url=blog_url,
            language=lang,
        )
    except Exception:
        logger.warning("public_subscribe: failed to send welcome email", email=body.email)

    try:
        owner_result = await db.execute(
            select(User.email)
            .join(TenantUser, TenantUser.user_id == User.id)
            .where(
                TenantUser.tenant_id == tenant.id,
                TenantUser.role == UserRole.TENANT_ADMIN,
            )
            .limit(1)
        )
        owner_email = owner_result.scalar_one_or_none()
        if owner_email:
            await email_service.send_newsletter_owner_notification(
                to=owner_email,
                blog_name=tenant.name,
                subscriber_email=body.email,
                language=lang,
            )
    except Exception:
        logger.warning("public_subscribe: failed to send owner notification", tenant_id=str(tenant.id))

    return {"message": "ok"}


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

    blog_url = f"https://{tenant.slug}.smarterbloggers.com"
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

    blog_url = f"https://{tenant.slug}.smarterbloggers.com"

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

    blog_url = f"https://{tenant.slug}.smarterbloggers.com"
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
    custom_domain: str | None = None


@explore_router.get("/resolve-domain")
async def resolve_domain(hostname: str, db: DBSession):
    """Resolve a custom domain to its tenant slug. Called by Next.js middleware."""
    clean = hostname.removeprefix("www.")

    result = await db.execute(
        select(CustomDomain, Tenant)
        .join(Tenant, CustomDomain.tenant_id == Tenant.id)
        .where(
            CustomDomain.domain.in_([hostname, clean]),
            CustomDomain.verification_status == DomainVerificationStatus.VERIFIED,
            Tenant.status == TenantStatus.ACTIVE,
            Tenant.deleted_at.is_(None),
        )
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Domain not found")

    _, tenant = row
    return {"slug": tenant.slug}


async def _get_or_create_tenant_card_translations(db: DBSession, tenants: list, lang: str) -> dict:
    """Traduction groupée nom+description des tenants pour la page Explorer
    (un seul appel DeepL pour toute la page), même pattern que les previews
    d'articles — hash source, upsert atomique, jamais d'exception propagée."""
    import hashlib
    import json as _json
    from app.services.translation_service import translate_json

    def _hash(t: Tenant) -> str:
        return hashlib.sha256(
            _json.dumps({"name": t.name, "description": t.description}, sort_keys=True).encode()
        ).hexdigest()

    ids = [str(t.id) for t in tenants]
    hashes = {str(t.id): _hash(t) for t in tenants}

    existing_rows = (await db.execute(sa_text(
        "SELECT tenant_id, name, description, source_hash FROM tenant_card_translations "
        "WHERE lang = :lang AND tenant_id = ANY(:ids)"
    ), {"lang": lang, "ids": ids})).fetchall()
    existing = {str(r.tenant_id): r for r in existing_rows}

    result_map: dict[str, dict] = {}
    # Chaque tenant peut avoir sa propre langue source — regroupe par langue
    # source pour ne faire qu'un appel DeepL groupé par groupe (et non par
    # tenant), tout en traduisant depuis la vraie langue d'origine de chacun.
    to_translate_by_source: dict[str, dict[str, dict]] = {}
    for t in tenants:
        tid = str(t.id)
        cached = existing.get(tid)
        if cached and cached.source_hash == hashes[tid]:
            result_map[tid] = {"name": cached.name, "description": cached.description}
            continue
        source = (t.language or "en").lower()
        if source == lang:
            result_map[tid] = {"name": t.name, "description": t.description}
            continue
        to_translate_by_source.setdefault(source, {})[tid] = {"name": t.name, "description": t.description or ""}

    for source, batch in to_translate_by_source.items():
        try:
            translated_batch = await translate_json(batch, lang, source_lang=source)
        except Exception:
            translated_batch = batch

        for tid, vals in translated_batch.items():
            result_map[tid] = vals
            await db.execute(sa_text("""
                INSERT INTO tenant_card_translations (tenant_id, lang, name, description, source_hash)
                VALUES (:tid, :lang, :name, :description, :hash)
                ON CONFLICT (tenant_id, lang) DO UPDATE
                SET name = EXCLUDED.name, description = EXCLUDED.description,
                    source_hash = EXCLUDED.source_hash, translated_at = now()
            """), {
                "tid": tid, "lang": lang, "name": vals["name"], "description": vals["description"] or None,
                "hash": hashes[tid],
            })
    if to_translate_by_source:
        await db.commit()

    return result_map


@explore_router.get("", response_model=list[PublicBlogCard])
async def list_public_blogs(
    db: DBSession,
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
    limit: int = Query(default=24, le=100),
    offset: int = Query(default=0, ge=0),
    lang: str | None = Query(default=None),
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

    # 3. Fetch verified custom domains for these tenants
    domain_result = await db.execute(
        select(CustomDomain.tenant_id, CustomDomain.domain)
        .where(
            CustomDomain.tenant_id.in_(tenant_ids),
            CustomDomain.verification_status == DomainVerificationStatus.VERIFIED,
        )
    )
    domains: dict[str, str] = {str(row.tenant_id): row.domain for row in domain_result.all()}

    # 4. Sort by real article count descending
    tenants_sorted = sorted(tenants, key=lambda t: counts.get(str(t.id), 0), reverse=True)
    rows = [(t, counts.get(str(t.id), 0)) for t in tenants_sorted]

    card_translations: dict[str, dict] = {}
    if lang and lang.lower() != "en" and tenants:
        card_translations = await _get_or_create_tenant_card_translations(db, tenants, lang.lower())

    return [
        PublicBlogCard(
            name=card_translations.get(str(t.id), {}).get("name") or t.name,
            slug=t.slug,
            description=card_translations.get(str(t.id), {}).get("description") if str(t.id) in card_translations else t.description,
            category=t.category,
            logo_url=t.logo_url,
            cover_image_url=t.cover_image_url,
            language=t.language,
            theme=t.theme,
            primary_color=t.primary_color,
            articles_count=real_count,
            custom_domain=domains.get(str(t.id)),
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
async def get_rotator_ad(slug: str, db: DBSession, exclude: str | None = Query(None)):
    """
    Retourne la publicité à afficher selon l'algorithme de rotation pondérée.
    Le poids de chaque annonce = total_budget (plus le budget est élevé,
    plus la pub a de chances d'être sélectionnée). Retourne null si aucune
    campagne active.
    Le paramètre ?exclude=<uuid> permet d'exclure une annonce déjà affichée
    (ex : l'annonce du haut ne doit pas être la même que celle du bas).
    """
    tenant = await _resolve_tenant(db, slug)
    now = datetime.now(timezone.utc)

    conditions = [
        Ad.tenant_id == tenant.id,
        Ad.submission_status == AdSubmissionStatus.APPROVED,
        Ad.campaign_status == AdCampaignStatus.ACTIVE,
        Ad.link_safety_status != LinkSafetyStatus.DANGEROUS,
        (Ad.starts_at.is_(None) | (Ad.starts_at <= now)),
        (Ad.ends_at.is_(None) | (Ad.ends_at >= now)),
    ]
    if exclude:
        try:
            exclude_id = uuid.UUID(exclude)
            conditions.append(Ad.id != exclude_id)
        except ValueError:
            pass

    result = await db.execute(select(Ad).where(*conditions))
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


@router.get("/articles/{article_slug}/comments/{comment_id}/replies", response_model=list[PublicCommentResponse])
async def list_public_replies(slug: str, article_slug: str, comment_id: str, db: DBSession):
    tenant = await _resolve_tenant(db, slug)
    article = await _resolve_public_article(db, tenant, article_slug)

    result = await db.execute(
        select(Comment).where(
            Comment.tenant_id == tenant.id,
            Comment.article_id == article.id,
            Comment.parent_id == uuid.UUID(comment_id),
            Comment.status == CommentStatus.APPROVED,
        ).order_by(Comment.created_at.asc()).limit(50)
    )
    replies = result.scalars().all()
    return [
        PublicCommentResponse(
            id=str(r.id),
            content=r.content,
            author=PublicCommentAuthor(display_name=r.author_name or "Anonymous"),
            parent_id=str(r.parent_id) if r.parent_id else None,
            replies_count=r.replies_count,
            created_at=r.created_at,
        )
        for r in replies
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

    # Rate limiting : 5 commentaires par heure par IP
    ip = request.client.host if request.client else "unknown"
    try:
        from app.core.redis_client import redis, key_rate_limit
        rate_key = key_rate_limit(ip, f"comments:{slug}")
        count = await redis.incr(rate_key)
        if count == 1:
            await redis.expire(rate_key, 3600)
        if count > 5:
            raise HTTPException(
                status_code=429,
                detail="Trop de commentaires. Réessayez dans une heure.",
            )
    except HTTPException:
        raise
    except Exception:
        pass  # Redis indisponible → on laisse passer

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


# ── GET /public/{slug}/robots.txt ────────────────────────────────

@router.get("/robots.txt", response_class=PlainTextResponse)
async def robots_txt(slug: str, db: DBSession):
    tenant = await _resolve_tenant(db, slug)
    if tenant.robots_txt:
        return tenant.robots_txt
    blog_url = f"https://{tenant.slug}.smarterbloggers.com"
    return (
        f"User-agent: *\n"
        f"Allow: /\n"
        f"Sitemap: {blog_url}/sitemap.xml\n"
    )


# ── GET /public/{slug}/search ─────────────────────────────────────

class PublicSearchResult(BaseModel):
    total: int
    hits: list[dict]
    query: str | None


@router.get("/search", response_model=PublicSearchResult)
async def public_blog_search(
    slug: str,
    db: DBSession,
    q: str | None = Query(default=None, min_length=1, max_length=200),
    category_id: str | None = Query(default=None),
    lang: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, le=20),
):
    from app.services.search_service import search_articles
    tenant = await _resolve_tenant(db, slug)
    result = await search_articles(
        tenant_slug=tenant.slug,
        q=q,
        category_id=category_id,
        lang=lang,
        status="published",
        from_=(page - 1) * size,
        size=size,
    )
    return PublicSearchResult(total=result["total"], hits=result["hits"], query=q)
