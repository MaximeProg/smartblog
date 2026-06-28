import re
from pydantic import BaseModel, field_validator
from app.models.enums import PlanTier, TenantStatus, CommentsMode


class CreateTenantRequest(BaseModel):
    name: str
    slug: str
    description: str | None = None
    category: str | None = None
    language: str = "en"
    timezone: str = "UTC"
    theme: str = "minimal"
    primary_color: str = "#3B82F6"
    font_family: str = "Inter"

    @field_validator("slug")
    @classmethod
    def validate_slug(cls, v: str) -> str:
        v = v.lower().strip()
        if not re.match(r"^[a-z0-9][a-z0-9\-]{2,48}[a-z0-9]$", v):
            raise ValueError(
                "Le slug doit contenir entre 4 et 50 caractères (lettres minuscules, chiffres, tirets)."
            )
        return v


class UpdateTenantRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    logo_url: str | None = None
    favicon_url: str | None = None
    theme: str | None = None
    primary_color: str | None = None
    secondary_color: str | None = None
    font_family: str | None = None
    language: str | None = None
    timezone: str | None = None
    comments_mode: CommentsMode | None = None
    seo_title_template: str | None = None
    seo_meta_description: str | None = None
    ga4_measurement_id: str | None = None
    matomo_url: str | None = None
    facebook_pixel_id: str | None = None
    footer_text: str | None = None
    social_links: dict | None = None
    sidebar_config: list | None = None


class TenantLimits(BaseModel):
    articles_max: int | None
    authors_max: int | None
    storage_gb: float
    subscribers_max: int | None
    domains_max: int
    api_requests_monthly: int | None


class TenantUsage(BaseModel):
    articles_count: int
    authors_count: int
    storage_used_gb: float
    subscribers_count: int
    domains_count: int


class TenantResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str | None
    logo_url: str | None
    favicon_url: str | None
    theme: str
    primary_color: str
    font_family: str
    category: str | None
    language: str
    timezone: str
    plan: PlanTier
    status: TenantStatus
    comments_mode: CommentsMode
    ga4_measurement_id: str | None
    pwa_enabled: bool
    social_links: dict
    limits: TenantLimits | None = None
    usage: TenantUsage | None = None

    model_config = {"from_attributes": True}


class SlugCheckResponse(BaseModel):
    available: bool
    slug: str
