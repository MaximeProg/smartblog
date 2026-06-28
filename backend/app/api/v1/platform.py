"""
Endpoints publics de la plateforme NexusBlog (sans auth).
Sert les données gérées par l'admin super: tarifs, config, etc.
"""
from fastapi import APIRouter
from sqlalchemy import select, text
from pydantic import BaseModel
from decimal import Decimal

from app.core.dependencies import DBSession

router = APIRouter(prefix="/platform", tags=["platform"])


# ── Schémas ──────────────────────────────────────────────────────────

class PricingPlan(BaseModel):
    id: str
    name: str
    name_fr: str
    slug: str
    price_monthly: float | None
    price_yearly: float | None
    currency: str
    description: str | None
    description_fr: str | None
    features: list[str]
    features_fr: list[str]
    is_highlighted: bool
    badge: str | None
    badge_fr: str | None


# ── GET /platform/pricing ─────────────────────────────────────────────

@router.get("/pricing", response_model=list[PricingPlan])
async def get_pricing(db: DBSession):
    result = await db.execute(
        text("""
            SELECT id, name, name_fr, slug, price_monthly, price_yearly, currency,
                   description, description_fr, features, features_fr,
                   is_highlighted, badge, badge_fr
            FROM pricing_plans
            WHERE is_active = TRUE
            ORDER BY sort_order ASC
        """)
    )
    rows = result.fetchall()
    return [
        PricingPlan(
            id=str(row.id),
            name=row.name,
            name_fr=row.name_fr,
            slug=row.slug,
            price_monthly=float(row.price_monthly) if row.price_monthly is not None else None,
            price_yearly=float(row.price_yearly) if row.price_yearly is not None else None,
            currency=row.currency,
            description=row.description,
            description_fr=row.description_fr,
            features=row.features if isinstance(row.features, list) else [],
            features_fr=row.features_fr if isinstance(row.features_fr, list) else [],
            is_highlighted=row.is_highlighted,
            badge=row.badge,
            badge_fr=row.badge_fr,
        )
        for row in rows
    ]
