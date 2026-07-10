"""ARQ background tasks — newsletter campaign + auto-publish cron."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

import structlog

logger = structlog.get_logger()


# ── Newsletter ─────────────────────────────────────────────────────────────────

async def send_newsletter_campaign(ctx: dict, campaign_id: str) -> None:
    """Envoie une campagne newsletter à tous les abonnés actifs du tenant."""
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models.newsletter import NewsletterCampaign, NewsletterSubscriber
    from app.models.tenant import Tenant
    from app.models.enums import SubscriberStatus, CampaignStatus
    from app.services.email_service import send_newsletter_campaign as _send_batch
    from app.core.config import settings

    async with AsyncSessionLocal() as db:
        campaign = None
        try:
            result = await db.execute(
                select(NewsletterCampaign).where(
                    NewsletterCampaign.id == uuid.UUID(campaign_id)
                )
            )
            campaign = result.scalar_one_or_none()

            if not campaign or campaign.status != CampaignStatus.SENDING:
                logger.warning(
                    "Campaign not found or not in SENDING state",
                    campaign_id=campaign_id,
                    status=campaign.status.value if campaign else None,
                )
                return

            tenant_res = await db.execute(
                select(Tenant).where(Tenant.id == campaign.tenant_id)
            )
            tenant = tenant_res.scalar_one_or_none()
            if not tenant:
                return

            subs_res = await db.execute(
                select(NewsletterSubscriber).where(
                    NewsletterSubscriber.tenant_id == campaign.tenant_id,
                    NewsletterSubscriber.status == SubscriberStatus.ACTIVE,
                )
            )
            subscribers = subs_res.scalars().all()

            if not subscribers:
                campaign.status = CampaignStatus.SENT
                campaign.recipients_count = 0
                campaign.sent_at = datetime.now(timezone.utc)
                await db.commit()
                logger.info("Campaign sent (0 subscribers)", campaign_id=campaign_id)
                return

            base_unsub = (
                f"https://{tenant.slug}.{settings.PLATFORM_DOMAIN}"
                f"/newsletter/unsubscribe"
            )
            emails = [s.email for s in subscribers]
            html = campaign.content_html or (
                f"<p>{campaign.preview_text}</p>" if campaign.preview_text else "<p></p>"
            )

            await _send_batch(
                to=emails,
                from_name=tenant.name,
                subject=campaign.subject,
                html=html,
                unsubscribe_url=base_unsub,
            )

            campaign.status = CampaignStatus.SENT
            campaign.recipients_count = len(emails)
            campaign.sent_at = datetime.now(timezone.utc)
            await db.commit()
            logger.info(
                "Newsletter campaign sent",
                campaign_id=campaign_id,
                tenant=tenant.slug,
                recipients=len(emails),
            )

        except Exception as exc:
            logger.error(
                "Newsletter campaign task failed",
                campaign_id=campaign_id,
                error=str(exc),
            )
            try:
                if campaign is not None and campaign.status == CampaignStatus.SENDING:
                    campaign.status = CampaignStatus.DRAFT
                    await db.commit()
            except Exception:
                await db.rollback()


# ── Social publish ────────────────────────────────────────────────────────────

async def publish_to_social(ctx: dict, post_id: str) -> None:
    """Publie un SocialPost sur la plateforme cible via API."""
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models.social import SocialAccount, SocialPost
    from app.models.enums import SocialPostStatus
    from app.services.social_publisher import publish_article
    from datetime import datetime, timezone

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(SocialPost).where(SocialPost.id == uuid.UUID(post_id))
        )
        post = result.scalar_one_or_none()
        if not post:
            logger.warning("publish_to_social: post not found", post_id=post_id)
            return

        acct_result = await db.execute(
            select(SocialAccount).where(SocialAccount.id == post.social_account_id)
        )
        account = acct_result.scalar_one_or_none()
        if not account:
            post.status = SocialPostStatus.FAILED
            post.error_message = "Social account not found"
            await db.commit()
            return

        # Build article URL from extra metadata stored on the post
        article_url = (post.extra or {}).get("article_url", "")
        title = (post.extra or {}).get("title", post.content[:80])
        excerpt = (post.extra or {}).get("excerpt")
        cover_url = (post.extra or {}).get("cover_url")

        post_url, error = await publish_article(account, article_url, title, excerpt, cover_url)

        if error:
            post.status = SocialPostStatus.FAILED
            post.error_message = error
            post.retry_count = (post.retry_count or 0) + 1
            logger.warning("publish_to_social: failed", post_id=post_id, error=error)
        else:
            post.status = SocialPostStatus.PUBLISHED
            post.published_at = datetime.now(timezone.utc)
            post.platform_post_url = post_url
            logger.info("publish_to_social: success", post_id=post_id, url=post_url)

        await db.commit()


# ── Scheduled publish (cron toutes les 60s) ───────────────────────────────────

async def auto_publish_scheduled(ctx: dict) -> None:
    """Publie automatiquement les articles SCHEDULED dont scheduled_at <= maintenant."""
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models.article import Article
    from app.models.enums import ArticleStatus
    from app.services.article_service import change_status

    now = datetime.now(timezone.utc)

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(Article).where(
                    Article.status == ArticleStatus.SCHEDULED,
                    Article.scheduled_at <= now,
                    Article.deleted_at.is_(None),
                )
            )
            articles = result.scalars().all()

            if not articles:
                return

            logger.info("auto_publish_scheduled: found articles", count=len(articles))

            for article in articles:
                try:
                    await change_status(db, article.tenant_id, article.id, ArticleStatus.PUBLISHED)
                    logger.info(
                        "Auto-published scheduled article",
                        article_id=str(article.id),
                        title=article.title,
                    )
                except Exception as exc:
                    logger.error(
                        "Auto-publish failed for article",
                        article_id=str(article.id),
                        error=str(exc),
                    )

        except Exception as exc:
            logger.error("auto_publish_scheduled: query failed", error=str(exc))
            await db.rollback()


# ── Scheduled newsletter auto-send (cron toutes les 60s) ─────────────────────

async def auto_send_scheduled_newsletters(ctx: dict) -> None:
    """Envoie automatiquement les campagnes newsletter dont scheduled_at <= maintenant."""
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models.newsletter import NewsletterCampaign
    from app.models.enums import CampaignStatus
    from app.core.arq_pool import get_arq_pool

    now = datetime.now(timezone.utc)

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(
                select(NewsletterCampaign).where(
                    NewsletterCampaign.status == CampaignStatus.SCHEDULED,
                    NewsletterCampaign.scheduled_at <= now,
                )
            )
            campaigns = result.scalars().all()

            if not campaigns:
                return

            logger.info("auto_send_scheduled_newsletters: found campaigns", count=len(campaigns))

            pool = await get_arq_pool()
            for campaign in campaigns:
                campaign.status = CampaignStatus.SENDING
                campaign.sent_at = now
                await db.flush()
                await pool.enqueue_job("send_newsletter_campaign", campaign_id=str(campaign.id))
                logger.info("Enqueued scheduled newsletter", campaign_id=str(campaign.id))

            await db.commit()

        except Exception as exc:
            logger.error("auto_send_scheduled_newsletters: failed", error=str(exc))
            await db.rollback()
