import uuid
from fastapi import APIRouter, UploadFile, File, Query
from sqlalchemy import select
from pydantic import BaseModel
from datetime import datetime

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException
from app.models.media import Media
from app.models.enums import MediaType, UserRole
from app.services.cloudinary_service import upload_file, delete_file
from app.api.v1.tenants import _assert_member, _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/media", tags=["media"])


class MediaResponse(BaseModel):
    id: str
    cloudinary_public_id: str
    cloudinary_secure_url: str
    media_type: MediaType
    original_filename: str | None
    alt_text: str | None
    caption: str | None
    file_size_bytes: int | None
    width: int | None
    height: int | None
    duration_seconds: int | None
    format: str | None
    created_at: datetime


class UpdateMediaRequest(BaseModel):
    alt_text: str | None = None
    caption: str | None = None


# ── POST /media/upload ────────────────────────────────────────────

@router.post("/upload", response_model=MediaResponse, status_code=201)
async def upload(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    file: UploadFile = File(...),
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)

    result = await upload_file(file, str(tenant_id))

    media = Media(
        tenant_id=tenant_id,
        uploaded_by=uuid.UUID(payload["sub"]),
        cloudinary_public_id=result["public_id"],
        cloudinary_url=result["url"],
        cloudinary_secure_url=result["secure_url"],
        cloudinary_resource_type=result["resource_type"],
        media_type=result["media_type"],
        original_filename=result["original_filename"],
        file_size_bytes=result["file_size_bytes"],
        width=result["width"],
        height=result["height"],
        duration_seconds=result["duration_seconds"],
        format=result["format"],
    )
    db.add(media)

    # Mettre à jour le storage du tenant
    from sqlalchemy import text
    if result["file_size_bytes"]:
        await db.execute(
            text("UPDATE tenants SET storage_used_bytes = storage_used_bytes + :size WHERE id = :tid"),
            {"size": result["file_size_bytes"], "tid": str(tenant_id)},
        )

    await db.commit()
    await db.refresh(media)
    return _to_response(media)


# ── GET /media ────────────────────────────────────────────────────

@router.get("", response_model=list[MediaResponse])
async def list_media(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
    media_type: MediaType | None = Query(default=None),
    limit: int = Query(default=20, le=100),
    cursor: str | None = Query(default=None),
):
    await _assert_member(db, tenant_id, uuid.UUID(payload["sub"]), payload)
    query = select(Media).where(Media.tenant_id == tenant_id)
    if media_type:
        query = query.where(Media.media_type == media_type)
    if cursor:
        from datetime import datetime
        query = query.where(Media.created_at < datetime.fromisoformat(cursor))
    query = query.order_by(Media.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return [_to_response(m) for m in result.scalars().all()]


# ── PATCH /media/{media_id} ───────────────────────────────────────

@router.patch("/{media_id}", response_model=MediaResponse)
async def update_media(
    tenant_id: uuid.UUID, media_id: uuid.UUID,
    body: UpdateMediaRequest, payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    media = await _get_or_404(db, tenant_id, media_id)
    if body.alt_text is not None:
        media.alt_text = body.alt_text
    if body.caption is not None:
        media.caption = body.caption
    await db.commit()
    await db.refresh(media)
    return _to_response(media)


# ── DELETE /media/{media_id} ──────────────────────────────────────

@router.delete("/{media_id}", status_code=204)
async def delete_media(
    tenant_id: uuid.UUID, media_id: uuid.UUID,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    media = await _get_or_404(db, tenant_id, media_id)

    await delete_file(media.cloudinary_public_id, media.cloudinary_resource_type)

    if media.file_size_bytes:
        from sqlalchemy import text
        await db.execute(
            text("UPDATE tenants SET storage_used_bytes = GREATEST(0, storage_used_bytes - :size) WHERE id = :tid"),
            {"size": media.file_size_bytes, "tid": str(tenant_id)},
        )

    await db.delete(media)
    await db.commit()


# ── Helpers ───────────────────────────────────────────────────────

async def _get_or_404(db, tenant_id: uuid.UUID, media_id: uuid.UUID) -> Media:
    result = await db.execute(
        select(Media).where(Media.id == media_id, Media.tenant_id == tenant_id)
    )
    m = result.scalar_one_or_none()
    if not m:
        raise NotFoundException("Media")
    return m


def _to_response(m: Media) -> MediaResponse:
    return MediaResponse(
        id=str(m.id),
        cloudinary_public_id=m.cloudinary_public_id,
        cloudinary_secure_url=m.cloudinary_secure_url,
        media_type=m.media_type,
        original_filename=m.original_filename,
        alt_text=m.alt_text,
        caption=m.caption,
        file_size_bytes=m.file_size_bytes,
        width=m.width,
        height=m.height,
        duration_seconds=m.duration_seconds,
        format=m.format,
        created_at=m.created_at,
    )
