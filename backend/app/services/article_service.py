import uuid
import math
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, update
import structlog

from app.models.article import Article, ArticleVersion, Category, Tag, ArticleTag
from app.models.tenant import Tenant
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

logger = structlog.get_logger()


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
        content=article.content,
        content_json=article.content_json,
        article_type=article.article_type,
        status=article.status,
        visibility=article.visibility,
        cover_image_url=article.cover_image_url,
        audio_url=article.audio_url,
        video_url=article.video_url,
        episode_number=article.episode_number,
        season=article.season,
        seo_title=article.seo_title,
        seo_description=article.seo_description,
        seo_keywords=article.seo_keywords,
        canonical_url=article.canonical_url,
        robots_noindex=article.robots_noindex,
        rejection_reason=article.rejection_reason,
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

    cat_id = uuid.UUID(data.category_id) if data.category_id else None

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
        episode_number=data.episode_number,
        season=data.season,
        seo_title=data.seo_title,
        seo_description=data.seo_description,
        seo_keywords=data.seo_keywords,
        canonical_url=data.canonical_url,
        robots_noindex=data.robots_noindex,
        category_id=cat_id,
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

    # Increment category counter
    if cat_id:
        await db.execute(
            update(Category).where(Category.id == cat_id).values(articles_count=Category.articles_count + 1)
        )

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
            reading_time_minutes=a.reading_time_minutes,
            published_at=a.published_at,
            author=_build_author(u),
            created_at=a.created_at,
            updated_at=a.updated_at,
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

    old_category_id = article.category_id
    old_status = article.status
    old_slug = article.slug

    changed = False
    for field, value in data.model_dump(exclude_unset=True, exclude={"tags", "category_id"}).items():
        if getattr(article, field) != value:
            setattr(article, field, value)
            changed = True

    # Handle category_id separately to manage articles_count counters
    if data.category_id is not None or "category_id" in data.model_fields_set:
        new_cat_id = uuid.UUID(data.category_id) if data.category_id else None
        if new_cat_id != old_category_id:
            if old_category_id:
                await db.execute(
                    update(Category).where(Category.id == old_category_id)
                    .values(articles_count=func.greatest(Category.articles_count - 1, 0))
                )
            if new_cat_id:
                await db.execute(
                    update(Category).where(Category.id == new_cat_id)
                    .values(articles_count=Category.articles_count + 1)
                )
            article.category_id = new_cat_id
            changed = True

    if data.content is not None:
        rt, wc = _estimate_reading_time(data.content)
        article.reading_time_minutes = rt
        article.word_count = wc

    if data.tags is not None:
        await _sync_tags(db, article, data.tags)

    # Sync tenant articles_count when status transitions through PUBLISHED
    new_status = article.status
    if old_status != ArticleStatus.PUBLISHED and new_status == ArticleStatus.PUBLISHED:
        await db.execute(
            update(Tenant).where(Tenant.id == tenant_id)
            .values(articles_count=Tenant.articles_count + 1)
        )
    elif old_status == ArticleStatus.PUBLISHED and new_status != ArticleStatus.PUBLISHED:
        await db.execute(
            update(Tenant).where(Tenant.id == tenant_id)
            .values(articles_count=func.greatest(Tenant.articles_count - 1, 0))
        )

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

        # Slug change → create 301 redirect
        if article.slug != old_slug:
            from app.models.article import SlugRedirect
            db.add(SlugRedirect(
                tenant_id=tenant_id,
                article_id=article.id,
                old_slug=old_slug,
                new_slug=article.slug,
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

    old_status = article.status
    article.status = new_status
    if new_status == ArticleStatus.PUBLISHED and not article.published_at:
        article.published_at = datetime.now(timezone.utc)
    if new_status == ArticleStatus.UNPUBLISHED:
        article.unpublished_at = datetime.now(timezone.utc)

    # Keep tenant articles_count in sync
    if old_status != ArticleStatus.PUBLISHED and new_status == ArticleStatus.PUBLISHED:
        await db.execute(
            update(Tenant).where(Tenant.id == tenant_id)
            .values(articles_count=Tenant.articles_count + 1)
        )
    elif old_status == ArticleStatus.PUBLISHED and new_status != ArticleStatus.PUBLISHED:
        await db.execute(
            update(Tenant).where(Tenant.id == tenant_id)
            .values(articles_count=func.greatest(Tenant.articles_count - 1, 0))
        )

    await db.commit()
    await db.refresh(article)

    # Post-publish hooks: ES indexing + push FCM
    if old_status != ArticleStatus.PUBLISHED and new_status == ArticleStatus.PUBLISHED:
        await _on_article_published(db, tenant_id, article)
    elif old_status == ArticleStatus.PUBLISHED and new_status != ArticleStatus.PUBLISHED:
        await _on_article_unpublished(db, tenant_id, article)

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
    was_published = article.status == ArticleStatus.PUBLISHED
    article.deleted_at = datetime.now(timezone.utc)
    if article.category_id:
        await db.execute(
            update(Category).where(Category.id == article.category_id)
            .values(articles_count=func.greatest(Category.articles_count - 1, 0))
        )
    if was_published:
        await db.execute(
            update(Tenant).where(Tenant.id == tenant_id)
            .values(articles_count=func.greatest(Tenant.articles_count - 1, 0))
        )
    await db.commit()

    # Désindexer de l'ES si l'article était publié
    if was_published:
        try:
            tenant_res = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
            tenant = tenant_res.scalar_one_or_none()
            if tenant:
                from app.services.search_service import delete_article as es_delete
                await es_delete(tenant.slug, str(article_id))
        except Exception as exc:
            logger.warning("ES deindex on delete failed", article_id=str(article_id), error=str(exc))


async def approve_article(
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
    if article.status != ArticleStatus.IN_REVIEW:
        raise ValidationException("Only articles IN_REVIEW can be approved")
    article.status = ArticleStatus.APPROVED
    article.rejection_reason = None
    await db.commit()
    await db.refresh(article)
    return await _build_response(db, article)


async def reject_article(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    reason: str | None = None,
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
    if article.status not in (ArticleStatus.IN_REVIEW, ArticleStatus.APPROVED):
        raise ValidationException("Only articles IN_REVIEW or APPROVED can be rejected")
    article.status = ArticleStatus.REJECTED
    article.rejection_reason = reason
    await db.commit()
    await db.refresh(article)
    return await _build_response(db, article)


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


# ── Post-publish hooks ─────────────────────────────────────────────────────────

async def _on_article_published(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    article: Article,
) -> None:
    """Indexation ES + notification push FCM — ne bloque jamais la réponse API."""
    try:
        tenant_res = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = tenant_res.scalar_one_or_none()
        if not tenant:
            return

        # 1. Elasticsearch indexation
        try:
            from app.services.search_service import index_article

            # Enrichir le payload avec tags, catégorie et auteur
            tags_q = await db.execute(
                select(Tag.name)
                .join(ArticleTag, ArticleTag.tag_id == Tag.id)
                .where(ArticleTag.article_id == article.id)
            )
            tag_names = [row[0] for row in tags_q.all()]

            category_name: str | None = None
            if article.category_id:
                cat_q = await db.execute(select(Category).where(Category.id == article.category_id))
                cat = cat_q.scalar_one_or_none()
                if cat:
                    category_name = cat.name

            author_name: str | None = None
            if article.author_id:
                auth_q = await db.execute(select(User).where(User.id == article.author_id))
                auth = auth_q.scalar_one_or_none()
                if auth:
                    author_name = auth.display_name or auth.email

            await index_article(tenant.slug, {
                "id": str(article.id),
                "tenant_id": str(article.tenant_id),
                "title": article.title,
                "slug": article.slug,
                "excerpt": article.excerpt or "",
                "content": article.content or "",
                "article_type": article.article_type.value if article.article_type else None,
                "status": article.status.value,
                "visibility": article.visibility.value if article.visibility else None,
                "category_id": str(article.category_id) if article.category_id else None,
                "category_name": category_name,
                "tags": tag_names,
                "author_id": str(article.author_id) if article.author_id else None,
                "author_name": author_name,
                "cover_image_url": article.cover_image_url,
                "reading_time_minutes": article.reading_time_minutes or 0,
                "views_count": article.views_count or 0,
                "likes_count": article.likes_count or 0,
                "published_at": article.published_at.isoformat() if article.published_at else None,
                "lang": (tenant.language or "en").lower(),
            })
        except Exception as exc:
            logger.warning("ES indexing failed", article_id=str(article.id), error=str(exc))

        # 2. Email de notification à l'auteur (si différent du publisher)
        try:
            from app.models.user import User
            from app.core.config import settings
            from app.services.email_service import send_article_published_notification

            if article.author_id:
                author_res = await db.execute(select(User).where(User.id == article.author_id))
                author = author_res.scalar_one_or_none()
                if author and author.email:
                    article_url = (
                        f"https://{tenant.slug}.{settings.PLATFORM_DOMAIN}/{article.slug}"
                    )
                    await send_article_published_notification(
                        to=author.email,
                        article_title=article.title,
                        article_url=article_url,
                    )
        except Exception as exc:
            logger.warning("Article published email failed", article_id=str(article.id), error=str(exc))

        # 3. Push FCM à tous les abonnés du tenant
        try:
            from app.models.push import PushToken
            from app.api.v1.push import _send_fcm, SendNotificationRequest
            from app.core.config import settings

            tokens_res = await db.execute(
                select(PushToken).where(
                    PushToken.tenant_id == tenant_id,
                    PushToken.is_active == True,
                )
            )
            tokens = [pt.token for pt in tokens_res.scalars().all()]

            if tokens:
                article_url = (
                    f"https://{tenant.slug}.{settings.PLATFORM_DOMAIN}"
                    f"/articles/{article.slug}"
                )
                notif_req = SendNotificationRequest(
                    title=article.title,
                    body=article.excerpt or "Nouvel article publié",
                    image_url=article.cover_image_url,
                    click_url=article_url,
                    article_id=str(article.id),
                )
                await _send_fcm(tokens, notif_req, "auto-publish")
        except Exception as exc:
            logger.warning("Push FCM failed", article_id=str(article.id), error=str(exc))

        # 3. Auto-post to connected social accounts
        try:
            from app.models.social import SocialAccount, SocialPost
            from app.models.enums import SocialPostStatus
            from app.core.arq_pool import get_arq_pool
            from app.core.config import settings as _cfg

            accts_res = await db.execute(
                select(SocialAccount).where(
                    SocialAccount.tenant_id == tenant_id,
                    SocialAccount.is_active == True,
                    SocialAccount.auto_post_enabled == True,
                )
            )
            social_accounts = accts_res.scalars().all()

            if social_accounts:
                article_url = (
                    f"https://{tenant.slug}.{_cfg.PLATFORM_DOMAIN}/{article.slug}"
                )
                content = f"{article.title}\n\n{article.excerpt or ''}\n\n{article_url}".strip()
                pool = await get_arq_pool()

                for acct in social_accounts:
                    post = SocialPost(
                        tenant_id=tenant_id,
                        social_account_id=acct.id,
                        article_id=article.id,
                        created_by=article.author_id,
                        platform=acct.platform,
                        content=content,
                        status=SocialPostStatus.PENDING,
                        extra={
                            "article_url": article_url,
                            "title": article.title,
                            "excerpt": article.excerpt,
                            "cover_url": article.cover_image_url,
                        },
                    )
                    db.add(post)
                    await db.flush()
                    await pool.enqueue_job("publish_to_social", post_id=str(post.id))

                await db.commit()
        except Exception as exc:
            logger.warning("Auto-social-post failed", article_id=str(article.id), error=str(exc))

    except Exception as exc:
        logger.warning("_on_article_published hooks failed", article_id=str(article.id), error=str(exc))


async def _on_article_unpublished(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    article: Article,
) -> None:
    """Désindexe l'article d'Elasticsearch quand il est dépublié/archivé."""
    try:
        tenant_res = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
        tenant = tenant_res.scalar_one_or_none()
        if tenant:
            from app.services.search_service import delete_article
            await delete_article(tenant.slug, str(article.id))
    except Exception as exc:
        logger.warning("ES deindex failed", article_id=str(article.id), error=str(exc))
