import uuid
from datetime import datetime
from fastapi import APIRouter, Query
from sqlalchemy import select
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException
from app.core.security import encrypt_value, decrypt_value
from app.models.social import SocialAccount, SocialPost
from app.models.enums import SocialPlatform, SocialPostStatus, UserRole
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/social", tags=["social"])


# ── Schemas ───────────────────────────────────────────────────────

class ConnectAccountRequest(BaseModel):
    platform: SocialPlatform
    platform_user_id: str
    platform_username: str | None = None
    platform_display_name: str | None = None
    platform_avatar_url: str | None = None
    platform_profile_url: str | None = None
    access_token: str
    refresh_token: str | None = None
    token_expires_at: datetime | None = None
    scopes: list[str] | None = None


class SocialAccountResponse(BaseModel):
    id: str
    platform: SocialPlatform
    platform_username: str | None
    platform_display_name: str | None
    platform_avatar_url: str | None
    platform_profile_url: str | None
    is_active: bool
    token_expires_at: datetime | None
    created_at: datetime


class CreatePostRequest(BaseModel):
    social_account_id: str
    content: str
    article_id: str | None = None
    media_urls: list[str] | None = None
    scheduled_at: datetime | None = None


class UpdatePostRequest(BaseModel):
    content: str | None = None
    scheduled_at: datetime | None = None
    media_urls: list[str] | None = None


class SocialPostResponse(BaseModel):
    id: str
    platform: SocialPlatform
    content: str
    status: SocialPostStatus
    article_id: str | None
    scheduled_at: datetime | None
    published_at: datetime | None
    platform_post_url: str | None
    error_message: str | None
    created_at: datetime


# ── Comptes connectés ─────────────────────────────────────────────

@router.get("/accounts", response_model=list[SocialAccountResponse])
async def list_accounts(tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(SocialAccount)
        .where(SocialAccount.tenant_id == tenant_id, SocialAccount.is_active == True)
        .order_by(SocialAccount.platform)
    )
    return [_account_response(a) for a in result.scalars().all()]


@router.post("/accounts", response_model=SocialAccountResponse, status_code=201)
async def connect_account(
    tenant_id: uuid.UUID,
    body: ConnectAccountRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)

    # Vérifier doublon
    existing = await db.execute(
        select(SocialAccount).where(
            SocialAccount.tenant_id == tenant_id,
            SocialAccount.platform == body.platform,
            SocialAccount.platform_user_id == body.platform_user_id,
        )
    )
    if existing.scalar_one_or_none():
        raise ValidationException(f"Ce compte {body.platform.value} est déjà connecté.")

    account = SocialAccount(
        tenant_id=tenant_id,
        connected_by=uuid.UUID(payload["sub"]),
        platform=body.platform,
        platform_user_id=body.platform_user_id,
        platform_username=body.platform_username,
        platform_display_name=body.platform_display_name,
        platform_avatar_url=body.platform_avatar_url,
        platform_profile_url=body.platform_profile_url,
        access_token_enc=encrypt_value(body.access_token),
        refresh_token_enc=encrypt_value(body.refresh_token) if body.refresh_token else None,
        token_expires_at=body.token_expires_at,
        scopes=body.scopes,
    )
    db.add(account)
    await db.commit()
    await db.refresh(account)
    return _account_response(account)


@router.delete("/accounts/{account_id}", status_code=204)
async def disconnect_account(
    tenant_id: uuid.UUID, account_id: uuid.UUID,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id == account_id,
            SocialAccount.tenant_id == tenant_id,
        )
    )
    account = result.scalar_one_or_none()
    if not account:
        raise NotFoundException("Compte social")
    account.is_active = False
    await db.commit()


# ── Posts programmés ──────────────────────────────────────────────

@router.get("/posts", response_model=list[SocialPostResponse])
async def list_posts(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    status: SocialPostStatus | None = Query(default=None),
    platform: SocialPlatform | None = Query(default=None),
    limit: int = Query(default=20, le=100),
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    query = select(SocialPost).where(SocialPost.tenant_id == tenant_id)
    if status:
        query = query.where(SocialPost.status == status)
    if platform:
        query = query.where(SocialPost.platform == platform)
    query = query.order_by(SocialPost.scheduled_at.asc().nullslast(), SocialPost.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return [_post_response(p) for p in result.scalars().all()]


@router.post("/posts", response_model=SocialPostResponse, status_code=201)
async def create_post(
    tenant_id: uuid.UUID,
    body: CreatePostRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)

    # Vérifier que le compte appartient bien au tenant
    acc_result = await db.execute(
        select(SocialAccount).where(
            SocialAccount.id == uuid.UUID(body.social_account_id),
            SocialAccount.tenant_id == tenant_id,
            SocialAccount.is_active == True,
        )
    )
    account = acc_result.scalar_one_or_none()
    if not account:
        raise NotFoundException("Compte social")

    post = SocialPost(
        tenant_id=tenant_id,
        social_account_id=account.id,
        article_id=uuid.UUID(body.article_id) if body.article_id else None,
        created_by=uuid.UUID(payload["sub"]),
        platform=account.platform,
        content=body.content,
        media_urls=body.media_urls,
        scheduled_at=body.scheduled_at,
        status=SocialPostStatus.SCHEDULED if body.scheduled_at else SocialPostStatus.PENDING,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)
    return _post_response(post)


@router.patch("/posts/{post_id}", response_model=SocialPostResponse)
async def update_post(
    tenant_id: uuid.UUID,
    post_id: uuid.UUID,
    body: UpdatePostRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    post = await _get_post_or_404(db, tenant_id, post_id)

    if post.status == SocialPostStatus.PUBLISHED:
        raise ValidationException("Impossible de modifier un post déjà publié.")

    if body.content is not None:
        post.content = body.content
    if body.scheduled_at is not None:
        post.scheduled_at = body.scheduled_at
        post.status = SocialPostStatus.SCHEDULED
    if body.media_urls is not None:
        post.media_urls = body.media_urls

    await db.commit()
    await db.refresh(post)
    return _post_response(post)


@router.delete("/posts/{post_id}", status_code=204)
async def delete_post(
    tenant_id: uuid.UUID, post_id: uuid.UUID,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    post = await _get_post_or_404(db, tenant_id, post_id)
    if post.status == SocialPostStatus.PUBLISHED:
        raise ValidationException("Impossible de supprimer un post déjà publié.")
    post.status = SocialPostStatus.CANCELED
    await db.commit()


@router.post("/posts/{post_id}/publish", response_model=SocialPostResponse)
async def publish_now(
    tenant_id: uuid.UUID,
    post_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    """Publie immédiatement le post (enqueue tâche ARQ)."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    post = await _get_post_or_404(db, tenant_id, post_id)

    if post.status == SocialPostStatus.PUBLISHED:
        raise ValidationException("Ce post est déjà publié.")

    # TODO: enqueue ARQ task pour publication réelle via API plateforme (sprint 4)
    post.status = SocialPostStatus.PENDING
    post.scheduled_at = None
    await db.commit()
    await db.refresh(post)
    return _post_response(post)


# ── Helpers ───────────────────────────────────────────────────────

async def _get_post_or_404(db, tenant_id: uuid.UUID, post_id: uuid.UUID) -> SocialPost:
    result = await db.execute(
        select(SocialPost).where(SocialPost.id == post_id, SocialPost.tenant_id == tenant_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise NotFoundException("Post social")
    return p


def _account_response(a: SocialAccount) -> SocialAccountResponse:
    return SocialAccountResponse(
        id=str(a.id),
        platform=a.platform,
        platform_username=a.platform_username,
        platform_display_name=a.platform_display_name,
        platform_avatar_url=a.platform_avatar_url,
        platform_profile_url=a.platform_profile_url,
        is_active=a.is_active,
        token_expires_at=a.token_expires_at,
        created_at=a.created_at,
    )


def _post_response(p: SocialPost) -> SocialPostResponse:
    return SocialPostResponse(
        id=str(p.id),
        platform=p.platform,
        content=p.content,
        status=p.status,
        article_id=str(p.article_id) if p.article_id else None,
        scheduled_at=p.scheduled_at,
        published_at=p.published_at,
        platform_post_url=p.platform_post_url,
        error_message=p.error_message,
        created_at=p.created_at,
    )
