"""
Service IA — OpenAI GPT-4o, DeepL, ElevenLabs, DALL-E 3.
Toutes les fonctions retournent un dict avec le résultat et la consommation.
"""
import re
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
    "free":       {"tokens_per_month": 0,         "tts_chars_per_month": 0,       "images_per_month": 0},
    "starter":    {"tokens_per_month": 50_000,    "tts_chars_per_month": 10_000,  "images_per_month": 5},
    "pro":        {"tokens_per_month": 200_000,   "tts_chars_per_month": 50_000,  "images_per_month": 30},
    "business":   {"tokens_per_month": 1_000_000, "tts_chars_per_month": 200_000, "images_per_month": 100},
    "enterprise": {"tokens_per_month": None,       "tts_chars_per_month": None,    "images_per_month": None},
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


# ─── Traduction de messages (support tickets) ────────────────────

async def translate_text(text: str, target_lang: str) -> str:
    """
    Translates `text` to `target_lang` using DeepL (primary) or falls back
    to the original text if DeepL is not configured or fails.
    Never raises — callers always succeed regardless of translation status.
    """
    if not text.strip():
        return text
    try:
        result = await translate(text, target_lang)
        return result["result"]
    except Exception:
        # DeepL not configured, quota exceeded, network error — return original
        return text


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
        raise ValidationException("DeepL is not configured.")

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
        raise ValidationException("ElevenLabs is not configured.")

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
            raise ValidationException(f"ElevenLabs error: {resp.status_code}")
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


# ─── AI Blog Builder ──────────────────────────────────────────────

async def generate_blog_config(
    niche: str,
    audience: str,
    tone: str,
    language: str,
    brand_name: str,
    color_preference: str | None = None,
) -> dict:
    """Generate a complete blog configuration (all studio sections) using GPT-4o."""
    lang_label = "French" if language == "fr" else "English"
    color_hint = f"\n- Preferred color palette: {color_preference}" if color_preference else ""

    system = (
        f"You are an expert blog content strategist. Generate a complete blog configuration "
        f"in {lang_label}. All text fields MUST be in {lang_label}. "
        "Return ONLY valid JSON matching the exact structure requested. No markdown, no explanation."
    )

    user = f"""Create a complete blog configuration for:
- Blog niche / topic: {niche}
- Target audience: {audience}
- Writing tone: {tone}
- Brand / blog name: {brand_name}{color_hint}

Return this exact JSON structure (fill every field with relevant content):
{{
  "general": {{
    "name": "compelling blog name",
    "description": "catchy tagline under 200 chars",
    "primary_color": "#hex (choose a color fitting the brand and niche)"
  }},
  "seo": {{
    "seo_title_template": "{{{{title}}}} | {{{{blog_name}}}}",
    "seo_meta_description": "engaging meta description, max 155 chars"
  }},
  "header": {{
    "topBar": {{ "enabled": true, "showDate": true, "showSocial": true, "showNewsletter": true, "showRss": true }},
    "subscribe": {{ "enabled": true, "label": "subscribe button text" }},
    "nav": {{ "links": [
      {{ "label": "home link label", "url": "/" }},
      {{ "label": "about link label", "url": "/about" }},
      {{ "label": "contact link label", "url": "/contact" }}
    ]}}
  }},
  "footer": {{
    "description": "short footer tagline",
    "showCategories": true,
    "navLinks": [
      {{ "label": "home link label", "url": "/" }},
      {{ "label": "about link label", "url": "/about" }},
      {{ "label": "contact link label", "url": "/contact" }}
    ],
    "showSocialLinks": true,
    "showNewsletterMini": true,
    "newsletterMiniText": "newsletter mini teaser",
    "copyrightText": "© 2025 {brand_name}. All rights reserved.",
    "showPoweredBy": true
  }},
  "home": {{
    "hero": {{ "enabled": true, "sectionTitle": "hero section title" }},
    "categoriesStrip": {{ "enabled": true, "label": "browse categories label" }},
    "newsletter": {{
      "enabled": true,
      "title": "newsletter section title",
      "description": "newsletter section description",
      "buttonLabel": "subscribe button",
      "placeholder": "email placeholder",
      "disclaimer": "no spam disclaimer"
    }},
    "latest": {{ "enabled": true, "sectionTitle": "latest articles section title", "postsPerPage": 12 }},
    "sidebar": {{
      "popularArticles": true, "popularTitle": "popular articles title",
      "categories": true, "categoriesTitle": "categories title",
      "tags": true, "tagsTitle": "tags title",
      "newsletterMini": true
    }}
  }},
  "about": {{
    "hero": {{ "enabled": true, "subtitle": "eyebrow text", "title": "about page title", "description": "2-3 sentence intro", "cover_image_url": "" }},
    "stats": {{ "enabled": true, "items": [
      {{ "value": "50+", "label": "articles stat label" }},
      {{ "value": "1K+", "label": "readers stat label" }},
      {{ "value": "10+", "label": "topics stat label" }}
    ]}},
    "mission": {{ "enabled": true, "title": "mission section title", "description": "2-3 sentence mission statement", "image_url": "" }},
    "values": {{ "enabled": true, "title": "values section title", "items": [
      {{ "icon": "🎯", "title": "value 1 title", "description": "value 1 description" }},
      {{ "icon": "✨", "title": "value 2 title", "description": "value 2 description" }},
      {{ "icon": "🤝", "title": "value 3 title", "description": "value 3 description" }}
    ]}},
    "team": {{ "enabled": false, "title": "", "members": [] }},
    "cta": {{ "enabled": true, "title": "cta title", "description": "cta description", "primaryLabel": "primary cta button", "secondaryLabel": "secondary cta button" }}
  }},
  "contact": {{
    "hero": {{ "enabled": true, "subtitle": "eyebrow text", "title": "contact page title", "description": "1-2 sentence contact intro", "cover_image_url": "" }},
    "form": {{
      "enabled": true,
      "title": "form section title",
      "namePlaceholder": "name placeholder",
      "emailPlaceholder": "email placeholder",
      "subjectPlaceholder": "subject placeholder",
      "messagePlaceholder": "message placeholder",
      "submitLabel": "send button",
      "successMessage": "success message after submit"
    }},
    "info": {{
      "enabled": true,
      "title": "contact info section title",
      "email": "contact@{brand_name.lower().replace(' ', '')}.com",
      "responseTime": "response time message",
      "showAddress": false,
      "address": "",
      "phone": ""
    }}
  }}
}}"""

    resp = await _oai().chat.completions.create(
        model=settings.OPENAI_STRONG_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=0.75,
        max_tokens=4000,
    )

    import json
    config = json.loads(resp.choices[0].message.content)
    tokens_used = resp.usage.total_tokens

    return {"result": config, "tokens_used": tokens_used}


# ─── Modération automatique du contenu publicitaire ───────────────

_AD_MODERATION_SYSTEM_PROMPT = """You are the automated content moderator for SmarterBloggers' advertising \
marketplace. You review a submitted ad (title, description, target link, and optionally an image) BEFORE \
it goes live and BEFORE real money is paid out to the publisher and affiliates. Be strict: this decision is \
final and unsupervised, nothing else reviews the ad if you approve it.

Reject (flagged) any ad that:
- promotes illegal goods/services, weapons, drugs (recreational or unlicensed pharma), counterfeit goods
- contains adult/explicit sexual content, gambling aimed at minors, or extreme violence
- is a scam, phishing attempt, fake giveaway, or makes deceptive/unverifiable claims (e.g. guaranteed returns)
- promotes hateful, discriminatory, or harassing content
- has an image that is misleading relative to the stated product/service, or contains explicit/violent imagery
- is clearly spam or has no coherent commercial purpose

Approve everything else, including ordinary product, service, blog, app, or brand advertising, even if the \
copy is unpolished — polish is not a rejection criterion, policy violations are.

Return ONLY a JSON object: {"verdict": "approve"|"flagged", "reason": "one sentence explaining the decision", \
"concerns": ["short tag", ...]} — concerns is an empty list when approved."""


async def moderate_ad_content(
    title: str,
    description: str | None,
    click_url: str,
    image_url: str | None = None,
) -> dict:
    """
    Vérifie le contenu d'une pub avant publication automatique (voir
    ads.py::_run_ai_moderation_and_maybe_autopublish). Ne lève JAMAIS —
    toute erreur (quota, réseau, réponse invalide) doit être traitée par
    l'appelant comme "pas d'auto-publication, revue manuelle requise",
    jamais comme une approbation par défaut.
    """
    user_content: list[dict] = [{
        "type": "text",
        "text": (
            f"Title: {title}\n"
            f"Description: {description or '(none)'}\n"
            f"Target link: {click_url}"
        ),
    }]
    if image_url:
        user_content.append({"type": "image_url", "image_url": {"url": image_url}})

    try:
        resp = await _oai().chat.completions.create(
            model=settings.OPENAI_STRONG_MODEL,
            messages=[
                {"role": "system", "content": _AD_MODERATION_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ],
            response_format={"type": "json_object"},
            temperature=0,
        )
        import json
        result = json.loads(resp.choices[0].message.content)
        verdict = result.get("verdict")
        if verdict not in ("approve", "flagged"):
            return {"verdict": "flagged", "reason": "Unrecognized moderation response.", "concerns": ["moderation_error"]}
        return result
    except Exception as exc:
        return {"verdict": "flagged", "reason": f"Moderation check failed: {exc}", "concerns": ["moderation_error"]}


# ─── Remplissage IA des pages CMS plateforme (super admin) ────────

# Même heuristique que PlatformPageJsonEditor.tsx côté frontend : une clé
# correspondant à ce motif est un champ image, jamais généré/modifié par l'IA.
_IMAGE_KEY_RE = re.compile(r"image|photo|logo|avatar|cover|background", re.IGNORECASE)


def _is_image_key(key: str) -> bool:
    return bool(_IMAGE_KEY_RE.search(key))


def _strip_images_for_prompt(node):
    """Copie profonde de `node` où les valeurs des champs image sont
    remplacées par un marqueur — préserve la forme JSON pour que le modèle
    la reproduise, sans jamais exposer/generer de vraies URLs d'image."""
    if isinstance(node, dict):
        return {
            k: ("<KEEP_UNCHANGED>" if _is_image_key(k) and isinstance(v, str) else _strip_images_for_prompt(v))
            for k, v in node.items()
        }
    if isinstance(node, list):
        return [_strip_images_for_prompt(v) for v in node]
    return node


def _merge_preserving_images(original, generated):
    """Ne retient de `generated` que les clés déjà présentes dans `original`
    (ignore toute clé hallucinée en plus) et ne touche jamais aux champs
    image — sécurité en plus du prompt, au cas où le modèle ne le respecte pas."""
    if isinstance(original, dict) and isinstance(generated, dict):
        result = {}
        for k, v in original.items():
            if _is_image_key(k) and isinstance(v, str):
                result[k] = v
            elif k in generated:
                result[k] = _merge_preserving_images(v, generated[k])
            else:
                result[k] = v
        return result
    if isinstance(original, list) and isinstance(generated, list):
        return [
            _merge_preserving_images(orig_item, generated[i]) if i < len(generated) else orig_item
            for i, orig_item in enumerate(original)
        ]
    if isinstance(generated, type(original)) or (isinstance(original, (int, float)) and isinstance(generated, (int, float))):
        return generated
    return original


async def generate_platform_page_content(content: dict, answers: dict[str, str], language: str = "en") -> dict:
    """Régénère le texte d'une page CMS plateforme (home/about/careers/...) en
    préservant exactement sa structure JSON actuelle — n'importe quelle page,
    sans schéma dédié, contrairement à generate_blog_config(). Les champs
    image (détectés par nom de clé) ne sont jamais générés ni modifiés."""
    import json

    lang_label = "French" if language == "fr" else "English"
    template_for_prompt = _strip_images_for_prompt(content)
    answers_lines = "\n".join(f"- {k}: {v}" for k, v in answers.items() if v)

    system = (
        f"You are an expert marketing copywriter. Rewrite the text content of a website page "
        f"in {lang_label}. You MUST return a JSON object with EXACTLY the same keys and nesting "
        f'as the JSON template provided — do not add, remove, or rename any key. Any string value '
        f'equal to "<KEEP_UNCHANGED>" is an image reference: copy it back verbatim, never replace '
        f"it with a real value. Return ONLY valid JSON, no markdown, no explanation."
    )
    user = f"""Page content template (JSON — values are placeholders to replace with real copy):
{json.dumps(template_for_prompt, indent=2)}

Context provided by the site admin:
{answers_lines or '(no additional context provided)'}

Rewrite every text value into engaging, on-brand marketing copy consistent with this context. Keep the exact same JSON structure and key names."""

    resp = await _oai().chat.completions.create(
        model=settings.OPENAI_STRONG_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=4000,
    )

    generated = json.loads(resp.choices[0].message.content)
    merged = _merge_preserving_images(content, generated)
    tokens_used = resp.usage.total_tokens

    return {"result": merged, "tokens_used": tokens_used}
