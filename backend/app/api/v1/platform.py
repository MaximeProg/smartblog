"""
Endpoints publics de la plateforme SmarterBloggers (sans auth).
Sert les données gérées par les super admins: tarifs, config, etc.
"""
from fastapi import APIRouter
from sqlalchemy import text
from pydantic import BaseModel

from app.core.dependencies import DBSession

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
