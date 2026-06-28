import uuid
import hashlib
from datetime import datetime, timezone, timedelta, date
from fastapi import APIRouter, Request, Query
from sqlalchemy import select, func, text
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.models.analytics import PageView, DailyAnalytics
from app.api.v1.tenants import _assert_role
from app.models.enums import UserRole

router = APIRouter(prefix="/tenants/{tenant_id}/analytics", tags=["analytics"])


class TrackRequest(BaseModel):
    article_id: str | None = None
    session_id: str | None = None
    referrer: str | None = None
    utm_source: str | None = None
    utm_medium: str | None = None
    utm_campaign: str | None = None
    duration_seconds: int | None = None
    scroll_depth_pct: int | None = None
    device_type: str | None = None


class OverviewResponse(BaseModel):
    period_days: int
    total_views: int
    unique_sessions: int
    avg_duration_seconds: float
    views_by_day: list[dict]
    top_articles: list[dict]
    top_referrers: list[dict]
    devices: dict


# ── POST /analytics/track (public) ───────────────────────────────

@router.post("/track", status_code=204)
async def track(
    tenant_id: uuid.UUID,
    body: TrackRequest,
    request: Request,
    db: DBSession,
):
    ip = request.client.host if request.client else "unknown"
    ip_hash = hashlib.sha256(ip.encode()).hexdigest()[:16]

    referrer_domain = None
    if body.referrer:
        try:
            from urllib.parse import urlparse
            referrer_domain = urlparse(body.referrer).netloc[:255]
        except Exception:
            pass

    pv = PageView(
        tenant_id=tenant_id,
        article_id=uuid.UUID(body.article_id) if body.article_id else None,
        session_id=body.session_id,
        ip_hash=ip_hash,
        referrer=body.referrer[:500] if body.referrer else None,
        referrer_domain=referrer_domain,
        utm_source=body.utm_source,
        utm_medium=body.utm_medium,
        utm_campaign=body.utm_campaign,
        duration_seconds=body.duration_seconds,
        scroll_depth_pct=body.scroll_depth_pct,
        device_type=body.device_type,
    )
    db.add(pv)

    # Incrémenter compteur article
    if body.article_id:
        await db.execute(
            text("UPDATE articles SET views_count = views_count + 1 WHERE id = :aid AND tenant_id = :tid"),
            {"aid": body.article_id, "tid": str(tenant_id)},
        )
    await db.commit()


# ── GET /analytics/overview ────────────────────────────────────────

@router.get("/overview", response_model=OverviewResponse)
async def get_overview(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    days: int = Query(default=30, ge=1, le=365),
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Total vues
    total = await db.execute(
        select(func.count(PageView.id)).where(
            PageView.tenant_id == tenant_id,
            PageView.created_at >= since,
        )
    )
    total_views = total.scalar_one()

    # Sessions uniques
    sessions = await db.execute(
        select(func.count(func.distinct(PageView.session_id))).where(
            PageView.tenant_id == tenant_id,
            PageView.created_at >= since,
            PageView.session_id.isnot(None),
        )
    )
    unique_sessions = sessions.scalar_one()

    # Durée moyenne
    avg_dur = await db.execute(
        select(func.avg(PageView.duration_seconds)).where(
            PageView.tenant_id == tenant_id,
            PageView.created_at >= since,
            PageView.duration_seconds.isnot(None),
        )
    )
    avg_duration = float(avg_dur.scalar_one() or 0)

    # Vues par jour
    daily = await db.execute(text("""
        SELECT DATE(created_at AT TIME ZONE 'UTC') as day,
               COUNT(*) as views
        FROM page_views
        WHERE tenant_id = :tid AND created_at >= :since
        GROUP BY day ORDER BY day
    """), {"tid": str(tenant_id), "since": since})
    views_by_day = [{"date": str(r.day), "views": r.views} for r in daily]

    # Top 10 articles
    top_arts = await db.execute(text("""
        SELECT pv.article_id::TEXT, a.title, a.slug, COUNT(*) as views
        FROM page_views pv
        JOIN articles a ON a.id = pv.article_id
        WHERE pv.tenant_id = :tid AND pv.created_at >= :since AND pv.article_id IS NOT NULL
        GROUP BY pv.article_id, a.title, a.slug
        ORDER BY views DESC LIMIT 10
    """), {"tid": str(tenant_id), "since": since})
    top_articles = [{"id": r.article_id, "title": r.title, "slug": r.slug, "views": r.views} for r in top_arts]

    # Top référents
    top_refs = await db.execute(text("""
        SELECT referrer_domain, COUNT(*) as visits
        FROM page_views
        WHERE tenant_id = :tid AND created_at >= :since AND referrer_domain IS NOT NULL
        GROUP BY referrer_domain
        ORDER BY visits DESC LIMIT 10
    """), {"tid": str(tenant_id), "since": since})
    top_referrers = [{"domain": r.referrer_domain, "visits": r.visits} for r in top_refs]

    # Appareils
    devs = await db.execute(text("""
        SELECT device_type, COUNT(*) as count
        FROM page_views
        WHERE tenant_id = :tid AND created_at >= :since AND device_type IS NOT NULL
        GROUP BY device_type
    """), {"tid": str(tenant_id), "since": since})
    devices = {r.device_type: r.count for r in devs}

    return OverviewResponse(
        period_days=days,
        total_views=total_views,
        unique_sessions=unique_sessions,
        avg_duration_seconds=avg_duration,
        views_by_day=views_by_day,
        top_articles=top_articles,
        top_referrers=top_referrers,
        devices=devices,
    )


# ── GET /analytics/articles/{article_id} ─────────────────────────

@router.get("/articles/{article_id}")
async def article_analytics(
    tenant_id: uuid.UUID,
    article_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    days: int = Query(default=30, ge=1, le=365),
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    since = datetime.now(timezone.utc) - timedelta(days=days)

    daily = await db.execute(text("""
        SELECT DATE(created_at AT TIME ZONE 'UTC') as day,
               COUNT(*) as views,
               COUNT(DISTINCT session_id) as sessions,
               AVG(duration_seconds) as avg_duration,
               AVG(scroll_depth_pct) as avg_scroll
        FROM page_views
        WHERE tenant_id = :tid AND article_id = :aid AND created_at >= :since
        GROUP BY day ORDER BY day
    """), {"tid": str(tenant_id), "aid": str(article_id), "since": since})

    rows = daily.all()
    return {
        "article_id": str(article_id),
        "period_days": days,
        "total_views": sum(r.views for r in rows),
        "total_sessions": sum(r.sessions for r in rows),
        "by_day": [
            {
                "date": str(r.day),
                "views": r.views,
                "sessions": r.sessions,
                "avg_duration": float(r.avg_duration or 0),
                "avg_scroll": float(r.avg_scroll or 0),
            }
            for r in rows
        ],
    }
