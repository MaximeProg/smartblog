"""
Service IA — OpenAI GPT-4o, DeepL, ElevenLabs, DALL-E 3.
Toutes les fonctions retournent un dict avec le résultat et la consommation.
"""
import httpx
from openai import AsyncOpenAI
from app.core.config import settings
from app.core.exceptions import AIQuotaExceededException, ValidationException

_openai: AsyncOpenAI | None = None


def _oai() -> AsyncOpenAI:
    global _openai
    if not _openai:
        _openai = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    return _openai


# ─── Limites quotas par plan ──────────────────────────────────────

AI_PLAN_LIMITS = {
    "starter":    {"tokens_per_month": 50_000,   "tts_chars_per_month": 10_000,  "images_per_month": 5},
    "pro":        {"tokens_per_month": 200_000,  "tts_chars_per_month": 50_000,  "images_per_month": 30},
    "business":   {"tokens_per_month": 1_000_000,"tts_chars_per_month": 200_000, "images_per_month": 100},
    "enterprise": {"tokens_per_month": None,      "tts_chars_per_month": None,    "images_per_month": None},
}


# ─── Génération article ───────────────────────────────────────────

async def generate_article(
    prompt: str,
    tone: str = "professional",
    language: str = "fr",
    target_words: int = 800,
) -> dict:
    system = (
        f"Tu es un rédacteur expert. Écris en {language}, ton {tone}. "
        f"Cible : environ {target_words} mots. "
        "Retourne un JSON avec les clés: title, excerpt (max 160 chars), content (markdown), tags (list)."
    )
    resp = await _oai().chat.completions.create(
        model=settings.OPENAI_STRONG_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    import json
    usage = resp.usage
    content = json.loads(resp.choices[0].message.content)
    return {
        "result": content,
        "tokens_used": usage.total_tokens,
        "model": settings.OPENAI_STRONG_MODEL,
    }


# ─── Amélioration contenu ─────────────────────────────────────────

async def improve_content(
    content: str,
    instruction: str = "Améliore la lisibilité, la grammaire et le style.",
    language: str = "fr",
) -> dict:
    resp = await _oai().chat.completions.create(
        model=settings.OPENAI_DEFAULT_MODEL,
        messages=[
            {"role": "system", "content": f"Tu es un éditeur expert. Langue : {language}. Retourne uniquement le contenu amélioré en markdown, sans commentaire."},
            {"role": "user", "content": f"Instruction : {instruction}\n\nContenu :\n{content[:8000]}"},
        ],
        temperature=0.5,
    )
    return {
        "result": resp.choices[0].message.content,
        "tokens_used": resp.usage.total_tokens,
    }


# ─── Résumé / extrait ─────────────────────────────────────────────

async def summarize(content: str, max_chars: int = 160, language: str = "fr") -> dict:
    resp = await _oai().chat.completions.create(
        model=settings.OPENAI_DEFAULT_MODEL,
        messages=[
            {"role": "system", "content": f"Génère un résumé accrocheur de {max_chars} caractères max en {language}. Retourne uniquement le résumé."},
            {"role": "user", "content": content[:5000]},
        ],
        temperature=0.6,
    )
    return {
        "result": resp.choices[0].message.content.strip(),
        "tokens_used": resp.usage.total_tokens,
    }


# ─── SEO ─────────────────────────────────────────────────────────

async def generate_seo(title: str, content: str, language: str = "fr") -> dict:
    resp = await _oai().chat.completions.create(
        model=settings.OPENAI_DEFAULT_MODEL,
        messages=[
            {"role": "system", "content": f"Tu es un expert SEO. Langue : {language}. Retourne JSON avec: seo_title (max 60 chars), seo_description (max 155 chars), keywords (list[str] 5-10 mots-clés)."},
            {"role": "user", "content": f"Titre : {title}\n\nContenu (extrait) :\n{content[:3000]}"},
        ],
        response_format={"type": "json_object"},
        temperature=0.4,
    )
    import json
    return {
        "result": json.loads(resp.choices[0].message.content),
        "tokens_used": resp.usage.total_tokens,
    }


# ─── Traduction DeepL ─────────────────────────────────────────────

async def translate(
    text: str,
    target_lang: str,
    source_lang: str | None = None,
) -> dict:
    if not settings.DEEPL_API_KEY:
        raise ValidationException("DeepL non configuré.")

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            "https://api-free.deepl.com/v2/translate",
            headers={"Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}"},
            data={
                "text": text[:5000],
                "target_lang": target_lang.upper(),
                **({"source_lang": source_lang.upper()} if source_lang else {}),
            },
        )
        data = resp.json()

    translated = data["translations"][0]["text"]
    detected = data["translations"][0].get("detected_source_language")
    return {
        "result": translated,
        "detected_source_language": detected,
        "chars_translated": len(text),
    }


# ─── Text-to-Speech ElevenLabs ───────────────────────────────────

async def text_to_speech(
    text: str,
    voice_id: str = "21m00Tcm4TlvDq8ikWAM",  # Rachel (voix par défaut)
    model_id: str = "eleven_multilingual_v2",
) -> dict:
    if not settings.ELEVENLABS_API_KEY:
        raise ValidationException("ElevenLabs non configuré.")

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": settings.ELEVENLABS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "text": text[:5000],
                "model_id": model_id,
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
            },
        )
        if resp.status_code != 200:
            raise ValidationException(f"ElevenLabs erreur : {resp.status_code}")
        audio_bytes = resp.content

    return {
        "audio_bytes": audio_bytes,
        "chars_used": len(text),
        "voice_id": voice_id,
        "content_type": "audio/mpeg",
    }


# ─── Génération image DALL-E 3 ────────────────────────────────────

async def generate_cover_image(
    prompt: str,
    size: str = "1792x1024",
    quality: str = "standard",
) -> dict:
    resp = await _oai().images.generate(
        model="dall-e-3",
        prompt=f"Blog cover image, professional, high quality. {prompt}",
        size=size,
        quality=quality,
        n=1,
    )
    image_url = resp.data[0].url
    revised_prompt = resp.data[0].revised_prompt
    return {
        "image_url": image_url,
        "revised_prompt": revised_prompt,
        "size": size,
    }
