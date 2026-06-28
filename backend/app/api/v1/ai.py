import uuid
from fastapi import APIRouter
from fastapi.responses import Response
from sqlalchemy import select, text
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import AIQuotaExceededException, ValidationException
from app.models.tenant import Tenant
from app.models.enums import UserRole
from app.services.ai_service import (
    generate_article, improve_content, summarize,
    generate_seo, translate, text_to_speech, generate_cover_image,
    AI_PLAN_LIMITS,
)
from app.api.v1.tenants import _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/ai", tags=["ai"])


# ── Helpers quota ─────────────────────────────────────────────────

async def _check_and_consume_tokens(db, tenant_id: uuid.UUID, tokens: int) -> None:
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    limits = AI_PLAN_LIMITS.get(tenant.plan.value if tenant else "starter", {})
    max_tokens = limits.get("tokens_per_month")

    if max_tokens is not None and (tenant.ai_tokens_used or 0) + tokens > max_tokens:
        raise AIQuotaExceededException("tokens", max_tokens)

    await db.execute(
        text("UPDATE tenants SET ai_tokens_used = COALESCE(ai_tokens_used, 0) + :t WHERE id = :id"),
        {"t": tokens, "id": str(tenant_id)},
    )
    await db.commit()


async def _check_images(db, tenant_id: uuid.UUID) -> None:
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    limits = AI_PLAN_LIMITS.get(tenant.plan.value if tenant else "starter", {})
    max_img = limits.get("images_per_month")

    if max_img is not None and (tenant.ai_images_generated or 0) >= max_img:
        raise AIQuotaExceededException("images", max_img)

    await db.execute(
        text("UPDATE tenants SET ai_images_generated = COALESCE(ai_images_generated, 0) + 1 WHERE id = :id"),
        {"id": str(tenant_id)},
    )
    await db.commit()


# ── Schemas ───────────────────────────────────────────────────────

class GenerateArticleRequest(BaseModel):
    prompt: str
    tone: str = "professional"
    language: str = "fr"
    target_words: int = 800


class ImproveRequest(BaseModel):
    content: str
    instruction: str = "Améliore la lisibilité, la grammaire et le style."
    language: str = "fr"


class SummarizeRequest(BaseModel):
    content: str
    max_chars: int = 160
    language: str = "fr"


class SeoRequest(BaseModel):
    title: str
    content: str
    language: str = "fr"


class TranslateRequest(BaseModel):
    text: str
    target_lang: str
    source_lang: str | None = None


class TtsRequest(BaseModel):
    text: str
    voice_id: str = "21m00Tcm4TlvDq8ikWAM"
    model_id: str = "eleven_multilingual_v2"
    article_id: str | None = None


class CoverImageRequest(BaseModel):
    prompt: str
    size: str = "1792x1024"
    quality: str = "standard"


# ── Endpoints ─────────────────────────────────────────────────────

@router.post("/generate")
async def ai_generate(
    tenant_id: uuid.UUID, body: GenerateArticleRequest,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    result = await generate_article(body.prompt, body.tone, body.language, body.target_words)
    await _check_and_consume_tokens(db, tenant_id, result["tokens_used"])
    return result["result"]


@router.post("/improve")
async def ai_improve(
    tenant_id: uuid.UUID, body: ImproveRequest,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    result = await improve_content(body.content, body.instruction, body.language)
    await _check_and_consume_tokens(db, tenant_id, result["tokens_used"])
    return {"content": result["result"]}


@router.post("/summarize")
async def ai_summarize(
    tenant_id: uuid.UUID, body: SummarizeRequest,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    result = await summarize(body.content, body.max_chars, body.language)
    await _check_and_consume_tokens(db, tenant_id, result["tokens_used"])
    return {"excerpt": result["result"]}


@router.post("/seo")
async def ai_seo(
    tenant_id: uuid.UUID, body: SeoRequest,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    result = await generate_seo(body.title, body.content, body.language)
    await _check_and_consume_tokens(db, tenant_id, result["tokens_used"])
    return result["result"]


@router.post("/translate")
async def ai_translate(
    tenant_id: uuid.UUID, body: TranslateRequest,
    payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    result = await translate(body.text, body.target_lang, body.source_lang)
    return result


@router.post("/tts")
async def ai_tts(
    tenant_id: uuid.UUID, body: TtsRequest,
    payload: TokenPayload, db: DBSession,
):
    """Génère un fichier audio MP3 depuis un texte (ElevenLabs)."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)

    # Vérifier quota TTS
    t_result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = t_result.scalar_one_or_none()
    limits = AI_PLAN_LIMITS.get(tenant.plan.value if tenant else "starter", {})
    max_chars = limits.get("tts_chars_per_month")
    if max_chars is not None and (tenant.ai_tts_chars_used or 0) + len(body.text) > max_chars:
        raise AIQuotaExceededException("tts_chars", max_chars)

    result = await text_to_speech(body.text, body.voice_id, body.model_id)

    await db.execute(
        text("UPDATE tenants SET ai_tts_chars_used = COALESCE(ai_tts_chars_used, 0) + :c WHERE id = :id"),
        {"c": len(body.text), "id": str(tenant_id)},
    )

    # Si article_id fourni → stocker l'URL audio (nécessite upload Cloudinary)
    if body.article_id:
        audio_bytes = result["audio_bytes"]
        try:
            import cloudinary.uploader
            from app.services.cloudinary_service import _configure
            _configure()
            upload_result = cloudinary.uploader.upload(
                audio_bytes,
                folder=f"nexusblog/{tenant_id}/audio",
                resource_type="video",
                format="mp3",
            )
            audio_url = upload_result["secure_url"]
            await db.execute(
                text("UPDATE articles SET audio_url = :url WHERE id = :aid AND tenant_id = :tid"),
                {"url": audio_url, "aid": body.article_id, "tid": str(tenant_id)},
            )
        except Exception:
            pass

    await db.commit()
    return Response(
        content=result["audio_bytes"],
        media_type="audio/mpeg",
        headers={"Content-Disposition": "attachment; filename=article_audio.mp3"},
    )


@router.post("/cover")
async def ai_cover(
    tenant_id: uuid.UUID, body: CoverImageRequest,
    payload: TokenPayload, db: DBSession,
):
    """Génère une image de couverture via DALL-E 3."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.AUTHOR)
    await _check_images(db, tenant_id)
    result = await generate_cover_image(body.prompt, body.size, body.quality)
    return result


@router.get("/usage")
async def ai_usage(
    tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    """Consommation IA du mois en cours."""
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    limits = AI_PLAN_LIMITS.get(tenant.plan.value if tenant else "starter", {})
    return {
        "plan": tenant.plan.value if tenant else "starter",
        "tokens_used": tenant.ai_tokens_used or 0,
        "tokens_limit": limits.get("tokens_per_month"),
        "tts_chars_used": tenant.ai_tts_chars_used or 0,
        "tts_chars_limit": limits.get("tts_chars_per_month"),
        "images_generated": tenant.ai_images_generated or 0,
        "images_limit": limits.get("images_per_month"),
    }
