import uuid
import math
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.models.article import Article, ArticleVersion, Category, Tag, ArticleTag
from app.models.user import User
from app.models.enums import ArticleStatus, ContentVisibility
from app.core.exceptions import (
    NotFoundException, ForbiddenException, ValidationException,
    PlanLimitReachedException,
)
from app.services.tenant_service import get_tenant, PLAN_LIMITS
from app.schemas.article import (
    CreateArticleRequest, UpdateArticleRequest,
    ArticleResponse, ArticleListItem, ArticleAuthor, ArticleVersionResponse,
)


def _estimate_reading_time(content: str | None) -> tuple[int, int]:
    """Retourne (reading_time_minutes, word_count)."""
    if not content:
        return 0, 0
    words = len(content.split())
    minutes = max(1, math.ceil(words / 200))
    return minutes, words


def _build_author(user: User | None) -> ArticleAuthor | None:
    if not user:
        return None
    return ArticleAuthor(
        id=str(user.id),
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )


async def _get_article_tags(db: AsyncSession, article_id: uuid.UUID) -> list[str]:
    result = await db.execute(
        select(Tag.slug)
        .join(ArticleTag, ArticleTag.tag_id == Tag.id)
        .where(ArticleTag.article_id == article_id)
    )
    return [r[0] for r in result.all()]


async def _sync_tags(
    db: AsyncSession,
    article: Article,
    tag_slugs: list[str],
) -> None:
    if not tag_slugs:
        await db.execute(
            ArticleTag.__table__.delete().where(ArticleTag.article_id == article.id)
        )
        return

    await db.execute(
        ArticleTag.__table__.delete().where(ArticleTag.article_id == article.id)
    )

    for slug in set(tag_slugs):
        result = await db.execute(
            select(Tag).where(Tag.tenant_id == article.tenant_id, Tag.slug == slug)
        )
        tag = result.scalar_one_or_none()
        if not tag:
            tag = Tag(tenant_id=article.tenant_id, name=slug, slug=slug)
            db.add(tag)
            await db.flush()
        db.add(ArticleTag(article_id=article.id, tag_id=tag.id, tenant_id=article.tenant_id))


async def _build_response(db: AsyncSession, article: Article) -> ArticleResponse:
    user_result = await db.execute(select(User).where(User.id == article.author_id)) if article.author_id else None
    user = user_result.scalar_one_or_none() if user_result else None
    tags = await _get_article_tags(db, article.id)
    return ArticleResponse(
        id=str(article.id),
        tenant_id=str(article.tenant_id),
        title=article.title,
        slug=article.slug,
        excerpt=article.excerpt,
        article_type=article.article_type,
        status=article.status,
        visibility=article.visibility,
        cover_image_url=article.cover_image_url,
        audio_url=article.audio_url,
        video_url=article.video_url,
        seo_title=article.seo_title,
        seo_description=article.seo_description,
        seo_keywords=article.seo_keywords,
        category_id=str(article.category_id) if article.category_id else None,
        tags=tags,
        price=article.price,
        currency=article.currency,
        views_count=article.views_count,
        likes_count=article.likes_count,
        comments_count=article.comments_count,
        is_featured=article.is_featured,
        allow_comments=article.allow_comments,
        reading_time_minutes=article.reading_time_minutes,
        word_count=article.word_count,
        published_at=article.published_at,
        scheduled_at=article.scheduled_at,
        current_version=article.current_version,
        author=_build_author(user),
        created_at=article.created_at,
        updated_at=article.updated_at,
    )


# ── CRUD ───────────────────────────────────────────────────────────

async def create_article(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    author_id: uuid.UUID,
    data: CreateArticleRequest,
) -> ArticleResponse:
    tenant = await get_tenant(db, tenant_id)

    # Limite plan
    articles_max = PLAN_LIMITS[tenant.plan].get("articles_max")
    if articles_max is not None and tenant.articles_count >= articles_max:
        raise PlanLimitReachedException("articles", articles_max)

    # Slug unique dans le tenant
    slug = data.slug or data.title.lower().replace(" ", "-")
    existing = await db.execute(
        select(func.count()).where(
            Article.tenant_id == tenant_id,
            Article.slug == slug,
            Article.deleted_at.is_(None),
        )
    )
    if existing.scalar_one() > 0:
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    reading_time, word_count = _estimate_reading_time(data.content)

    article = Article(
        tenant_id=tenant_id,
        author_id=author_id,
        title=data.title,
        slug=slug,
        excerpt=data.excerpt,
        content=data.content,
        content_json=data.content_json,
        article_type=data.article_type,
        visibility=data.visibility,
        cover_image_url=data.cover_image_url,
        cover_image_alt=data.cover_image_alt,
        audio_url=data.audio_url,
        video_url=data.video_url,
        seo_title=data.seo_title,
        seo_description=data.seo_description,
        seo_keywords=data.seo_keywords,
        price=data.price,
        currency=data.currency,
        is_featured=data.is_featured,
        allow_comments=data.allow_comments,
        scheduled_at=data.scheduled_at,
        reading_time_minutes=reading_time,
        word_count=word_count,
        status=ArticleStatus.SCHEDULED if data.scheduled_at else ArticleStatus.DRAFT,
    )
    db.add(article)
    await db.flush()

    if data.tags:
        await _sync_tags(db, article, data.tags)

    # Snapshot version initiale
    db.add(ArticleVersion(
        article_id=article.id,
        tenant_id=tenant_id,
        version_number=1,
        title=data.title,
        content=data.content,
        content_json=data.content_json,
        created_by=author_id,
    ))

    await db.commit()
    await db.refresh(article)
    return await _build_response(db, article)


async def get_article(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
) -> ArticleResponse:
    result = await db.execute(
        select(Article).where(
            Article.id == article_id,
            Article.tenant_id == tenant_id,
            Article.deleted_at.is_(None),
        )
    )
    article = result.scalar_one_or_none()
    if not article:
        raise NotFoundException("Article")
    return await _build_response(db, article)


async def list_articles(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    status: ArticleStatus | None = None,
    category_id: uuid.UUID | None = None,
    author_id: uuid.UUID | None = None,
    limit: int = 20,
    cursor: str | None = None,
) -> tuple[list[ArticleListItem], str | None]:
    query = select(Article, User).outerjoin(
        User, User.id == Article.author_id
    ).where(
        Article.tenant_id == tenant_id,
        Article.deleted_at.is_(None),
    )
    if status:
        query = query.where(Article.status == status)
    if category_id:
        query = query.where(Article.category_id == category_id)
    if author_id:
        query = query.where(Article.author_id == author_id)
    if cursor:
        query = query.where(Article.created_at < datetime.fromisoformat(cursor))

    query = query.order_by(Article.created_at.desc()).limit(limit + 1)
    result = await db.execute(query)
    rows = result.all()

    has_more = len(rows) > limit
    rows = rows[:limit]
    next_cursor = rows[-1][0].created_at.isoformat() if has_more and rows else None

    items = [
        ArticleListItem(
            id=str(a.id),
            title=a.title,
            slug=a.slug,
            excerpt=a.excerpt,
            article_type=a.article_type,
            status=a.status,
            visibility=a.visibility,
            cover_image_url=a.cover_image_url,
            is_featured=a.is_featured,
            views_count=a.views_count,
            published_at=a.published_at,
            author=_build_author(u),
            created_at=a.created_at,
        )
        for a, u in rows
    ]
    return items, next_cursor


async def update_article(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    editor_id: uuid.UUID,
    data: UpdateArticleRequest,
) -> ArticleResponse:
    result = await db.execute(
        select(Article).where(
            Article.id == article_id,
            Article.tenant_id == tenant_id,
            Article.deleted_at.is_(None),
        )
    )
    article = result.scalar_one_or_none()
    if not article:
        raise NotFoundException("Article")

    changed = False
    for field, value in data.model_dump(exclude_unset=True, exclude={"tags"}).items():
        if getattr(article, field) != value:
            setattr(article, field, value)
            changed = True

    if data.content is not None:
        rt, wc = _estimate_reading_time(data.content)
        article.reading_time_minutes = rt
        article.word_count = wc

    if data.tags is not None:
        await _sync_tags(db, article, data.tags)

    if changed:
        article.current_version += 1
        db.add(ArticleVersion(
            article_id=article.id,
            tenant_id=tenant_id,
            version_number=article.current_version,
            title=article.title,
            content=article.content,
            content_json=article.content_json,
            created_by=editor_id,
        ))

    await db.commit()
    await db.refresh(article)
    return await _build_response(db, article)


async def change_status(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    new_status: ArticleStatus,
) -> ArticleResponse:
    result = await db.execute(
        select(Article).where(
            Article.id == article_id,
            Article.tenant_id == tenant_id,
            Article.deleted_at.is_(None),
        )
    )
    article = result.scalar_one_or_none()
    if not article:
        raise NotFoundException("Article")

    article.status = new_status
    if new_status == ArticleStatus.PUBLISHED and not article.published_at:
        article.published_at = datetime.now(timezone.utc)
    if new_status == ArticleStatus.UNPUBLISHED:
        article.unpublished_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(article)
    return await _build_response(db, article)


async def delete_article(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
) -> None:
    result = await db.execute(
        select(Article).where(
            Article.id == article_id,
            Article.tenant_id == tenant_id,
            Article.deleted_at.is_(None),
        )
    )
    article = result.scalar_one_or_none()
    if not article:
        raise NotFoundException("Article")
    article.deleted_at = datetime.now(timezone.utc)
    await db.commit()


async def list_versions(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
) -> list[ArticleVersionResponse]:
    result = await db.execute(
        select(ArticleVersion).where(
            ArticleVersion.article_id == article_id,
            ArticleVersion.tenant_id == tenant_id,
        ).order_by(ArticleVersion.version_number.desc())
    )
    return [
        ArticleVersionResponse(
            id=str(v.id),
            version_number=v.version_number,
            title=v.title,
            change_summary=v.change_summary,
            created_by=str(v.created_by),
            created_at=v.created_at,
        )
        for v in result.scalars().all()
    ]
