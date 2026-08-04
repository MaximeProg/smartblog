"""ARQ background tasks — newsletter campaign + auto-publish cron."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone, timedelta

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


# ── Health check ping (cron toutes les 5 min) — alimente /platform/stats ───────

async def health_check_ping(ctx: dict) -> None:
    """Vérifie DB + Redis directement (pas de vrai appel HTTP à /health — inutile
    en interne) et logue le résultat pour calculer un vrai % de disponibilité
    sur 30 jours. Ne sera significatif qu'après plusieurs semaines de collecte."""
    import time
    from sqlalchemy import text
    from app.core.database import AsyncSessionLocal
    from app.core.redis_client import redis

    t0 = time.monotonic()
    db_ok = True
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("SELECT 1"))
    except Exception as exc:
        db_ok = False
        logger.error("health_check_ping: DB check failed", error=str(exc))

    redis_ok = True
    try:
        await redis.ping()
    except Exception as exc:
        redis_ok = False
        logger.error("health_check_ping: Redis check failed", error=str(exc))

    latency_ms = int((time.monotonic() - t0) * 1000)

    try:
        async with AsyncSessionLocal() as db:
            await db.execute(
                text(
                    "INSERT INTO health_check_log (success, latency_ms, db_ok, redis_ok) "
                    "VALUES (:success, :latency, :db_ok, :redis_ok)"
                ),
                {"success": db_ok and redis_ok, "latency": latency_ms, "db_ok": db_ok, "redis_ok": redis_ok},
            )
            await db.commit()
    except Exception as exc:
        logger.error("health_check_ping: failed to log result", error=str(exc))


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


# ── Achat de domaine (registrar) ─────────────────────────────────────────────

async def register_purchased_domain(ctx: dict, order_id: str) -> None:
    """Enregistre un domaine acheté auprès du registrar après confirmation du
    paiement, configure sa zone DNS, et crée la ligne custom_domains
    correspondante. Idempotent : ignore les commandes qui ne sont plus en
    statut PAID (déjà traitées ou en échec)."""
    from sqlalchemy import text
    from app.core.config import settings
    from app.core.database import AsyncSessionLocal
    from app.models.domain import DomainOrder, CustomDomain
    from app.models.enums import DomainOrderStatus, DomainSource, DomainVerificationStatus
    from app.models.payment import Transaction  # noqa: F401 — DomainOrder.transaction_id FK doit trouver ce modèle enregistré dans ce process worker (import local, sinon NoReferencedTableError)
    from app.services.registrars.registry import get_registrar
    from app.services.registrars.base import RegistrarError
    from app.services.log_service import log_event

    async with AsyncSessionLocal() as db:
        order = await db.get(DomainOrder, uuid.UUID(order_id))
        if not order or order.status != DomainOrderStatus.PAID:
            return

        order.status = DomainOrderStatus.REGISTERING
        await db.commit()

        registrar = get_registrar(order.registrar)
        is_renewal = order.custom_domain_id is not None
        try:
            if is_renewal:
                # ── Renouvellement d'un domaine déjà enregistré ──────────
                existing_domain = await db.get(CustomDomain, order.custom_domain_id)
                if not existing_domain:
                    raise RegistrarError(f"custom_domain {order.custom_domain_id} introuvable pour renouvellement.")

                result = await registrar.renew_domain(
                    registrar_domain_id=existing_domain.registrar_domain_id or "",
                    years=order.years,
                )
                if result.expires_at:
                    try:
                        existing_domain.expires_at = datetime.fromisoformat(result.expires_at.replace("Z", "+00:00"))
                    except ValueError:
                        pass
                existing_domain.renewal_price = order.renewal_price
                existing_domain.last_synced_at = datetime.now(timezone.utc)

                order.registrar_order_id = result.registrar_order_id
                order.status = DomainOrderStatus.REGISTERED
                order.registered_at = datetime.now(timezone.utc)
                await db.commit()

                await log_event(db, "domain.renewed", level="success",
                                target_type="custom_domain", target_id=str(existing_domain.id),
                                details=f"{order.domain_name} via {order.registrar} — {order.years} an(s)")
                logger.info("register_purchased_domain: renewal success", order_id=order_id, domain=order.domain_name)

                try:
                    from app.services.tenant_service import get_tenant_owner_user_id
                    from app.services.notification_service import notify_user
                    owner_id = await get_tenant_owner_user_id(db, order.tenant_id)
                    if owner_id:
                        await notify_user(
                            db, owner_id, type="success", category="domain",
                            title="Domain renewed",
                            body=f"{order.domain_name} — {order.years} year(s)",
                            action_url="/domains",
                        )
                        await db.commit()
                except Exception:
                    pass

            else:
                # ── Nouvel enregistrement ─────────────────────────────────
                result = await registrar.register_domain(
                    domain=order.domain_name,
                    years=order.years,
                    registrant_info=order.registrant_info,
                )
                await registrar.configure_dns(
                    domain=order.domain_name,
                    records=[
                        {"name": "", "type": "A", "value": settings.VPS_HOST_IP},
                        {"name": "www", "type": "A", "value": settings.VPS_HOST_IP},
                    ],
                    template_name=settings.OPENPROVIDER_DNS_TEMPLATE_NAME,
                )

                expires_at = None
                if result.expires_at:
                    try:
                        expires_at = datetime.fromisoformat(result.expires_at.replace("Z", "+00:00"))
                    except ValueError:
                        expires_at = None

                custom_domain = CustomDomain(
                    tenant_id=order.tenant_id,
                    domain=order.domain_name,
                    verification_status=DomainVerificationStatus.VERIFIED,
                    ssl_enabled=True,
                    verified_at=datetime.now(timezone.utc),
                    source=DomainSource.PURCHASED,
                    is_primary=False,
                    registrar=order.registrar,
                    registrar_domain_id=result.registrar_domain_id,
                    purchased_at=datetime.now(timezone.utc),
                    expires_at=expires_at,
                    auto_renew=order.auto_renew,
                    purchase_price=order.purchase_price,
                    renewal_price=order.renewal_price,
                    last_synced_at=datetime.now(timezone.utc),
                )
                db.add(custom_domain)
                await db.flush()

                order.custom_domain_id = custom_domain.id
                order.registrar_domain_id = result.registrar_domain_id
                order.registrar_order_id = result.registrar_order_id
                order.status = DomainOrderStatus.REGISTERED
                order.registered_at = datetime.now(timezone.utc)

                await db.execute(
                    text("UPDATE tenants SET domains_count = domains_count + 1 WHERE id = :tid"),
                    {"tid": str(order.tenant_id)},
                )
                await db.commit()

                await log_event(db, "domain.registered", level="success",
                                target_type="custom_domain", target_id=str(custom_domain.id),
                                details=f"{order.domain_name} via {order.registrar}")
                logger.info("register_purchased_domain: success", order_id=order_id, domain=order.domain_name)

                try:
                    from app.services.tenant_service import get_tenant_owner_user_id
                    from app.services.notification_service import notify_user
                    owner_id = await get_tenant_owner_user_id(db, order.tenant_id)
                    if owner_id:
                        await notify_user(
                            db, owner_id, type="success", category="domain",
                            title="Domain is live",
                            body=f"{order.domain_name} has been registered and connected to your blog.",
                            action_url="/domains",
                        )
                        await db.commit()
                except Exception:
                    pass

        except RegistrarError as exc:
            order.status = DomainOrderStatus.REGISTRATION_FAILED
            order.error_message = str(exc)[:2000]
            await db.commit()
            await log_event(db, "domain.registration_failed", level="error",
                            target_type="domain_order", target_id=str(order.id),
                            details=f"{order.domain_name}: {exc}")
            logger.error("register_purchased_domain: registrar error", order_id=order_id, error=str(exc))
            await _notify_domain_registration_failed(db, order, str(exc))
        except Exception as exc:
            order.status = DomainOrderStatus.REGISTRATION_FAILED
            order.error_message = str(exc)[:2000]
            await db.commit()
            await log_event(db, "domain.registration_failed", level="error",
                            target_type="domain_order", target_id=str(order.id),
                            details=f"{order.domain_name}: unexpected error — {exc}")
            logger.error("register_purchased_domain: unexpected error", order_id=order_id, error=str(exc))
            await _notify_domain_registration_failed(db, order, str(exc))


async def _notify_domain_registration_failed(db, order, error: str) -> None:
    """Argent déjà encaissé (order.status passait par PAID avant ce job) —
    un échec d'enregistrement doit être visible, pas seulement loggé.
    Notifie le propriétaire du tenant ET les super admins (remboursement/
    action manuelle probablement nécessaire côté registrar)."""
    try:
        from app.services.tenant_service import get_tenant_owner_user_id
        from app.services.notification_service import notify_user, notify_super_admins
        owner_id = await get_tenant_owner_user_id(db, order.tenant_id)
        if owner_id:
            await notify_user(
                db, owner_id, type="error", category="domain",
                title="Domain registration failed",
                body=f"{order.domain_name} could not be registered. Our team has been notified.",
                action_url="/domains",
            )
        await notify_super_admins(
            db, type="error", category="domain",
            title="Domain registration failed",
            body=f"{order.domain_name} ({order.registrar}): {error[:200]}",
            action_url="/superadmin",
        )
        await db.commit()
    except Exception:
        pass


# ── Synchronisation statut domaines (cron quotidien) ─────────────────────────

async def sync_purchased_domains_status(ctx: dict) -> None:
    """Recale expires_at/statut des domaines achetés depuis le registrar —
    pas de webhook OpenProvider confirmé pour ces changements, donc polling
    périodique plutôt que push."""
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models.domain import CustomDomain
    from app.models.enums import DomainSource
    from app.services.registrars.registry import get_registrar
    from app.services.registrars.base import RegistrarError
    from app.services.log_service import log_event

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(CustomDomain).where(CustomDomain.source == DomainSource.PURCHASED)
        )
        domains = result.scalars().all()
        if not domains:
            return

        for d in domains:
            if not d.registrar_domain_id:
                continue
            try:
                registrar = get_registrar(d.registrar)
                info = await registrar.get_domain_info(d.registrar_domain_id)
                if info.expires_at:
                    try:
                        d.expires_at = datetime.fromisoformat(info.expires_at.replace("Z", "+00:00"))
                    except ValueError:
                        pass
                d.last_synced_at = datetime.now(timezone.utc)
                await db.commit()
            except RegistrarError as exc:
                await log_event(db, "domain.sync_error", level="warning",
                                target_type="custom_domain", target_id=str(d.id),
                                details=f"{d.domain}: {exc}")
                logger.warning("sync_purchased_domains_status: registrar error", domain=d.domain, error=str(exc))
            except Exception as exc:
                logger.error("sync_purchased_domains_status: unexpected error", domain=d.domain, error=str(exc))


# ── Rappels de renouvellement (cron quotidien) ───────────────────────────────

async def send_domain_renewal_reminders(ctx: dict) -> None:
    """Les paiements crypto ne peuvent pas être auto-débités : pour les
    domaines expirant sous 20 jours sans auto-renouvellement (ou en attente
    de l'action du propriétaire), on envoie un rappel email plutôt qu'un
    renouvellement silencieux."""
    from sqlalchemy import select
    from app.core.database import AsyncSessionLocal
    from app.models.domain import CustomDomain
    from app.models.enums import DomainSource
    from app.services.tenant_service import get_tenant_owner_user_id
    from app.models.user import User as UserModel
    from app.services.email_service import send_domain_expiry_reminder

    threshold = datetime.now(timezone.utc) + timedelta(days=20)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(CustomDomain).where(
                CustomDomain.source == DomainSource.PURCHASED,
                CustomDomain.expires_at.isnot(None),
                CustomDomain.expires_at <= threshold,
            )
        )
        domains = result.scalars().all()
        if not domains:
            return

        for d in domains:
            try:
                owner_id = await get_tenant_owner_user_id(db, d.tenant_id)
                if not owner_id:
                    continue
                owner = await db.get(UserModel, owner_id)
                if not owner or not owner.email:
                    continue
                await send_domain_expiry_reminder(
                    to=owner.email,
                    domain=d.domain,
                    expires_at=d.expires_at.strftime("%Y-%m-%d") if d.expires_at else "soon",
                )
                from app.services.notification_service import notify_user
                await notify_user(
                    db, owner_id, type="warning", category="domain",
                    title="Domain expiring soon",
                    body=f"{d.domain} expires on {d.expires_at.strftime('%Y-%m-%d') if d.expires_at else 'soon'}.",
                    action_url="/domains",
                )
                await db.commit()
                logger.info("send_domain_renewal_reminders: sent", domain=d.domain, to=owner.email)
            except Exception as exc:
                logger.error("send_domain_renewal_reminders: failed", domain=d.domain, error=str(exc))
            await db.rollback()

