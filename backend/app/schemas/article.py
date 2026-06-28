import re
from datetime import datetime
from pydantic import BaseModel, field_validator
from app.models.enums import ArticleType, ArticleStatus, ContentVisibility


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return re.sub(r"^-+|-+$", "", text)


class CreateArticleRequest(BaseModel):
    title: str
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    content_json: dict | None = None
    article_type: ArticleType = ArticleType.ARTICLE
    visibility: ContentVisibility = ContentVisibility.PUBLIC
    cover_image_url: str | None = None
    cover_image_alt: str | None = None
    audio_url: str | None = None
    video_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    seo_keywords: list[str] | None = None
    category_id: str | None = None
    tags: list[str] = []
    price: float | None = None
    currency: str = "EUR"
    is_featured: bool = False
    allow_comments: bool = True
    scheduled_at: datetime | None = None

    @field_validator("slug", mode="before")
    @classmethod
    def auto_slug(cls, v, info):
        if not v:
            title = info.data.get("title", "")
            return slugify(title) if title else None
        return slugify(v)


class UpdateArticleRequest(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    content_json: dict | None = None
    visibility: ContentVisibility | None = None
    cover_image_url: str | None = None
    cover_image_alt: str | None = None
    audio_url: str | None = None
    video_url: str | None = None
    seo_title: str | None = None
    seo_description: str | None = None
    seo_keywords: list[str] | None = None
    category_id: str | None = None
    tags: list[str] | None = None
    price: float | None = None
    is_featured: bool | None = None
    allow_comments: bool | None = None
    scheduled_at: datetime | None = None

    @field_validator("slug", mode="before")
    @classmethod
    def clean_slug(cls, v):
        return slugify(v) if v else v


class PublishRequest(BaseModel):
    scheduled_at: datetime | None = None


class ArticleAuthor(BaseModel):
    id: str
    display_name: str | None
    avatar_url: str | None


class ArticleResponse(BaseModel):
    id: str
    tenant_id: str
    title: str
    slug: str
    excerpt: str | None
    article_type: ArticleType
    status: ArticleStatus
    visibility: ContentVisibility
    cover_image_url: str | None
    audio_url: str | None
    video_url: str | None
    seo_title: str | None
    seo_description: str | None
    seo_keywords: list[str] | None
    category_id: str | None
    tags: list[str] = []
    price: float | None
    currency: str
    views_count: int
    likes_count: int
    comments_count: int
    is_featured: bool
    allow_comments: bool
    reading_time_minutes: int | None
    word_count: int | None
    published_at: datetime | None
    scheduled_at: datetime | None
    current_version: int
    author: ArticleAuthor | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ArticleListItem(BaseModel):
    id: str
    title: str
    slug: str
    excerpt: str | None
    article_type: ArticleType
    status: ArticleStatus
    visibility: ContentVisibility
    cover_image_url: str | None
    is_featured: bool
    views_count: int
    published_at: datetime | None
    author: ArticleAuthor | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ArticleVersionResponse(BaseModel):
    id: str
    version_number: int
    title: str
    change_summary: str | None
    created_by: str
    created_at: datetime

    model_config = {"from_attributes": True}
