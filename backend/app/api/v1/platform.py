"""
Endpoints publics de la plateforme SmarterBloggers (sans auth).
Sert les données gérées par les super admins: tarifs, config, pages CMS, stats.
"""
import asyncio
import json

from fastapi import APIRouter, Query, Request, HTTPException
from sqlalchemy import text, func, select
from pydantic import BaseModel, EmailStr

from app.core.dependencies import DBSession
from app.core.database import get_db
from app.core.redis_client import redis, key_platform_stats, key_translate, key_rate_limit
from app.core.exceptions import NotFoundException, ValidationException
from app.models.tenant import Tenant
from app.models.article import Article
from app.models.user import User
from app.models.enums import TenantStatus, ArticleStatus
from app.services.translation_service import translate_json
from app.services.email_service import send_superadmin_event
from app.services.push_service import send_push_to_user

router = APIRouter(prefix="/platform", tags=["platform"])


# ── Schémas ──────────────────────────────────────────────────────────

class PublicPlan(BaseModel):
    id: str
    name: str
    description: str | None = None
    price_monthly: float
    price_yearly: float
    currency: str = "USD"
    max_articles: int
    max_storage_mb: int
    max_members: int
    max_ai_requests: int
    max_custom_domains: int
    features: list = []
    is_highlighted: bool = False
    is_default: bool = False
    sort_order: int = 0


# ── GET /platform/pricing ─────────────────────────────────────────────

@router.get("/pricing", response_model=list[PublicPlan])
async def get_pricing(db: DBSession):
    result = await db.execute(
        text("""
            SELECT id, name, description, price_monthly, price_yearly,
                   max_articles, max_storage_mb, max_members, max_ai_requests,
                   max_custom_domains, features, is_default, sort_order
            FROM subscription_plans
            WHERE is_active = TRUE
            ORDER BY sort_order ASC
        """)
    )
    rows = result.fetchall()
    return [
        PublicPlan(
            id=str(row.id),
            name=row.name,
            description=row.description,
            price_monthly=float(row.price_monthly),
            price_yearly=float(row.price_yearly),
            currency="USD",
            max_articles=row.max_articles,
            max_storage_mb=row.max_storage_mb,
            max_members=row.max_members,
            max_ai_requests=row.max_ai_requests,
            max_custom_domains=row.max_custom_domains,
            features=row.features if isinstance(row.features, list) else [],
            is_highlighted=str(row.id) == "pro",
            is_default=bool(row.is_default),
            sort_order=row.sort_order,
        )
        for row in rows
    ]


# ── GET /platform/pages/{slug} ────────────────────────────────────────

@router.get("/pages/{slug}")
async def get_platform_page(slug: str, db: DBSession, lang: str = Query(default="en")):
    row = (await db.execute(
        text("SELECT id, content, content_hash FROM platform_pages WHERE slug = :slug"),
        {"slug": slug},
    )).fetchone()
    if not row:
        raise NotFoundException("Page")

    if lang.lower() == "en":
        return {"slug": slug, "lang": "en", "content": row.content}

    cache_key = key_translate(f"{slug}:{lang.lower()}", row.content_hash)
    cached = await redis.get(cache_key)
    if cached:
        return {"slug": slug, "lang": lang.lower(), "content": json.loads(cached)}

    existing = (await db.execute(
        text(
            "SELECT content, source_hash FROM platform_page_translations "
            "WHERE page_id = :pid AND lang = :lang"
        ),
        {"pid": row.id, "lang": lang.lower()},
    )).fetchone()

    if existing and existing.source_hash == row.content_hash:
        translated = existing.content
    else:
        translated = await translate_json(row.content, lang)
        await db.execute(
            text("""
                INSERT INTO platform_page_translations (page_id, lang, content, source_hash)
                VALUES (:pid, :lang, CAST(:content AS JSONB), :hash)
                ON CONFLICT (page_id, lang) DO UPDATE
                SET content = EXCLUDED.content, source_hash = EXCLUDED.source_hash,
                    translated_at = now()
            """),
            {"pid": row.id, "lang": lang.lower(), "content": json.dumps(translated), "hash": row.content_hash},
        )
        await db.commit()

    await redis.setex(cache_key, 21600, json.dumps(translated))  # 6h — DB reste la source de vérité
    return {"slug": slug, "lang": lang.lower(), "content": translated}


# ── GET /platform/stats ────────────────────────────────────────────────
# Endpoint public (sans JWT) — bypass RLS explicite via is_super_admin=True.
# Ne renvoie QUE des agrégats COUNT, jamais de lignes tenant-scoped individuelles.

@router.get("/stats")
async def get_platform_stats():
    cached = await redis.get(key_platform_stats())
    if cached:
        return json.loads(cached)

    async for db in get_db(tenant_id=None, user_id=None, is_super_admin=True):
        active_blogs = (await db.execute(
            select(func.count(Tenant.id)).where(Tenant.status == TenantStatus.ACTIVE)
        )).scalar_one()
        published_articles = (await db.execute(
            select(func.count(Article.id)).where(Article.status == ArticleStatus.PUBLISHED)
        )).scalar_one()
        monthly_readers = (await db.execute(text(
            "SELECT COUNT(DISTINCT session_id) FROM page_views WHERE created_at >= NOW() - INTERVAL '30 days'"
        ))).scalar_one()
        uptime_row = (await db.execute(text("""
            SELECT COUNT(*) FILTER (WHERE success) AS ok, COUNT(*) AS total
            FROM health_check_log WHERE checked_at >= NOW() - INTERVAL '30 days'
        """))).fetchone()
        uptime_pct = round(uptime_row.ok * 100.0 / uptime_row.total, 2) if uptime_row.total else None

    result = {
        "active_blogs": active_blogs,
        "published_articles": published_articles,
        "monthly_readers": monthly_readers,
        "uptime_pct": uptime_pct,
    }
    await redis.setex(key_platform_stats(), 600, json.dumps(result))
    return result


# ── POST /platform/contact ──────────────────────────────────────────────
# Formulaire de contact public. Persiste le message (jamais perdu si l'email
# échoue), puis notifie tous les super admins par email (Resend, déjà en
# place) et par push (même mécanisme que les tickets support).

class ContactMessageBody(BaseModel):
    channel: str = "general"
    name: str
    email: EmailStr
    subject: str
    message: str


async def _push_all_super_admins(db: DBSession, title: str, body: str, url: str) -> None:
    try:
        result = await db.execute(select(User).where(User.is_super_admin == True, User.deleted_at.is_(None)))
        admins = result.scalars().all()
        tasks = [send_push_to_user(db, admin.id, title, body, url) for admin in admins]
        await asyncio.gather(*tasks, return_exceptions=True)
    except Exception:
        pass


@router.post("/contact", status_code=201)
async def submit_contact_message(body: ContactMessageBody, request: Request, db: DBSession):
    if len(body.message.strip()) < 5:
        raise ValidationException("Le message est trop court.")
    if len(body.message) > 5000:
        raise ValidationException("Le message est trop long (max 5000 caractères).")
    if not body.name.strip() or not body.subject.strip():
        raise ValidationException("Nom et sujet requis.")

    # Rate limiting : 5 messages par heure par IP — endpoint public déclenchant
    # de vrais emails/push, à protéger contre le spam.
    ip = request.client.host if request.client else "unknown"
    rate_key = key_rate_limit(ip, "contact")
    try:
        count = await redis.incr(rate_key)
        if count == 1:
            await redis.expire(rate_key, 3600)
        if count > 5:
            raise HTTPException(status_code=429, detail="Trop de messages envoyés. Réessayez dans une heure.")
    except HTTPException:
        raise
    except Exception:
        pass

    channel = body.channel if body.channel in ("sales", "support", "general") else "general"

    await db.execute(text("""
        INSERT INTO contact_messages (channel, name, email, subject, message)
        VALUES (:channel, :name, :email, :subject, :message)
    """), {
        "channel": channel, "name": body.name.strip(), "email": body.email,
        "subject": body.subject.strip(), "message": body.message.strip(),
    })
    await db.commit()

    admin_emails = (await db.execute(
        select(User.email).where(User.is_super_admin == True, User.deleted_at.is_(None))
    )).scalars().all()

    details = (
        f"From: {body.name.strip()} ({body.email})<br/>"
        f"Channel: {channel}<br/>"
        f"Subject: {body.subject.strip()}<br/><br/>"
        f"{body.message.strip()}"
    )
    try:
        await send_superadmin_event(
            to=list(admin_emails),
            event_type="contact.message",
            title=f"New contact message: {body.subject.strip()}",
            details=details,
            actor_email=body.email,
        )
    except Exception:
        pass  # Le message est déjà persisté — l'échec d'email ne doit jamais faire échouer la requête visiteur

    await _push_all_super_admins(
        db,
        title="New contact message",
        body=f"{body.name.strip()}: {body.subject.strip()}",
        url="/superadmin",
    )

    return {"ok": True}


# ── GET /platform/ui-translations ───────────────────────────────────────
# Traduit l'interface fixe du blog public (namespace next-intl `publicBlog`)
# pour les langues au-delà de en/fr, qui restent des fichiers statiques
# (messages/en.json, fr.json) inchangés — jamais routées ici.

import os
import hashlib

_UI_SOURCE_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")


def _load_ui_source(namespace: str) -> dict | None:
    path = os.path.join(_UI_SOURCE_DIR, f"ui_source_{namespace.lower()}.json")
    if not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/ui-translations")
async def get_ui_translations(db: DBSession, namespace: str = Query(...), lang: str = Query(...)):
    if lang.lower() in ("en", "fr"):
        raise NotFoundException("Translation (en/fr use static message files)")

    source = _load_ui_source(namespace)
    if source is None:
        raise NotFoundException("Namespace")

    source_hash = hashlib.sha256(json.dumps(source, sort_keys=True).encode()).hexdigest()

    existing = (await db.execute(text(
        "SELECT messages, source_hash FROM ui_translations WHERE namespace = :ns AND lang = :lang"
    ), {"ns": namespace, "lang": lang.lower()})).fetchone()

    if existing and existing.source_hash == source_hash:
        return {"namespace": namespace, "lang": lang.lower(), "messages": existing.messages}

    translated = await translate_json(source, lang.lower(), source_lang="en")

    await db.execute(text("""
        INSERT INTO ui_translations (namespace, lang, messages, source_hash)
        VALUES (:ns, :lang, CAST(:messages AS JSONB), :hash)
        ON CONFLICT (namespace, lang) DO UPDATE
        SET messages = EXCLUDED.messages, source_hash = EXCLUDED.source_hash, translated_at = now()
    """), {
        "ns": namespace, "lang": lang.lower(),
        "messages": json.dumps(translated), "hash": source_hash,
    })
    await db.commit()

    return {"namespace": namespace, "lang": lang.lower(), "messages": translated}
