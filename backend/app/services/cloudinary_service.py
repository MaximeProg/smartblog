import uuid
import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from app.core.config import settings
from app.models.enums import MediaType

_configured = False


def _configure():
    global _configured
    if not _configured:
        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        _configured = True


ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/avi"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/wav", "audio/ogg", "audio/aac", "audio/flac"}
ALLOWED_DOC_TYPES = {"application/pdf"}

MAX_IMAGE_BYTES = 10 * 1024 * 1024   # 10 MB
MAX_VIDEO_BYTES = 200 * 1024 * 1024  # 200 MB
MAX_AUDIO_BYTES = 50 * 1024 * 1024   # 50 MB
MAX_DOC_BYTES = 25 * 1024 * 1024     # 25 MB


def detect_media_type(content_type: str) -> MediaType:
    if content_type in ALLOWED_IMAGE_TYPES:
        return MediaType.IMAGE
    if content_type in ALLOWED_VIDEO_TYPES:
        return MediaType.VIDEO
    if content_type in ALLOWED_AUDIO_TYPES:
        return MediaType.AUDIO
    if content_type in ALLOWED_DOC_TYPES:
        return MediaType.DOCUMENT
    raise ValueError(f"Type de fichier non supporté : {content_type}")


def get_max_size(media_type: MediaType) -> int:
    return {
        MediaType.IMAGE: MAX_IMAGE_BYTES,
        MediaType.VIDEO: MAX_VIDEO_BYTES,
        MediaType.AUDIO: MAX_AUDIO_BYTES,
        MediaType.DOCUMENT: MAX_DOC_BYTES,
    }[media_type]


async def upload_file(
    file: UploadFile,
    tenant_id: str,
    folder_prefix: str = "nexusblog",
) -> dict:
    """
    Upload un fichier vers Cloudinary et retourne les métadonnées.
    """
    from app.core.exceptions import ValidationException
    _configure()

    content_type = file.content_type or ""
    try:
        media_type = detect_media_type(content_type)
    except ValueError as e:
        raise ValidationException(str(e))

    contents = await file.read()
    max_size = get_max_size(media_type)
    if len(contents) > max_size:
        raise ValidationException(
            f"Fichier trop volumineux ({len(contents) // 1024}KB). "
            f"Maximum : {max_size // (1024*1024)}MB."
        )

    folder = f"{folder_prefix}/{tenant_id}/{media_type.value}s"
    resource_type = "video" if media_type in (MediaType.VIDEO, MediaType.AUDIO) else (
        "raw" if media_type == MediaType.DOCUMENT else "image"
    )

    result = cloudinary.uploader.upload(
        contents,
        folder=folder,
        resource_type=resource_type,
        use_filename=True,
        unique_filename=True,
        overwrite=False,
        # Transformations automatiques pour les images
        **({"eager": [{"quality": "auto", "fetch_format": "auto"}]} if media_type == MediaType.IMAGE else {}),
    )

    return {
        "public_id": result["public_id"],
        "url": result.get("url", ""),
        "secure_url": result.get("secure_url", ""),
        "resource_type": result.get("resource_type", resource_type),
        "media_type": media_type,
        "format": result.get("format"),
        "file_size_bytes": result.get("bytes"),
        "width": result.get("width"),
        "height": result.get("height"),
        "duration_seconds": int(result.get("duration", 0)) or None,
        "original_filename": file.filename,
    }


async def delete_file(public_id: str, resource_type: str = "image") -> None:
    _configure()
    cloudinary.uploader.destroy(public_id, resource_type=resource_type)


def get_optimized_url(public_id: str, width: int | None = None, format: str = "auto") -> str:
    _configure()
    transformations = [{"quality": "auto", "fetch_format": format}]
    if width:
        transformations[0]["width"] = width
        transformations[0]["crop"] = "limit"
    return cloudinary.CloudinaryImage(public_id).build_url(transformation=transformations)
