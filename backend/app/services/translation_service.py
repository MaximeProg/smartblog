"""Generic structured-content translation via DeepL.

Used for CMS content (platform_pages) — separate from ai_service.py (OpenAI/
ElevenLabs) since this is a distinct concern and the future extension point
for article translation. translate_json() never raises: any DeepL failure
(quota, rate limit, network) falls back to the original (English) content,
so a translated page is either fully translated or fully English — never
half-translated.
"""
from __future__ import annotations

import logging

import httpx
from bs4 import BeautifulSoup, NavigableString

from app.core.config import settings

logger = logging.getLogger(__name__)

# Tags whose text content must never be sent to DeepL (code samples, not prose).
_NO_TRANSLATE_TAGS = frozenset({"code", "pre", "script", "style"})

# Keys whose string value must never be sent to DeepL (emails, URLs, technical
# identifiers) even when nested arbitrarily deep in a content tree.
_EXCLUDED_KEYS = frozenset({
    "value", "email", "phone", "key", "icon", "id",
    "photo_url", "image_url", "cover_image_url", "avatar_url", "url",
})


class TranslationQuotaExceededError(Exception):
    """Raised internally when DeepL returns 429/456 — always caught, never
    propagated to callers."""


async def _deepl_call(texts: list[str], target_lang: str, source_lang: str | None = None) -> list[str]:
    if not settings.DEEPL_API_KEY:
        raise RuntimeError("DeepL not configured")
    if not texts:
        return []

    data = [("text", t[:5000]) for t in texts]
    data.append(("target_lang", target_lang.upper()))
    if source_lang:
        data.append(("source_lang", source_lang.upper()))

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.post(
            settings.DEEPL_API_URL,
            headers={"Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}"},
            data=data,
        )

    if resp.status_code in (429, 456):
        raise TranslationQuotaExceededError(f"DeepL quota/rate limit: {resp.status_code}")
    if resp.status_code != 200:
        raise RuntimeError(f"DeepL error {resp.status_code}: {resp.text[:200]}")

    payload = resp.json()
    return [t["text"] for t in payload["translations"]]


def _collect_leaves(node: object, path: tuple, out: list[tuple[tuple, str]], parent_key: str | None = None) -> None:
    """Walks node, appending (path, string) for every translatable string leaf."""
    if isinstance(node, dict):
        for k, v in node.items():
            _collect_leaves(v, path + (k,), out, parent_key=k)
    elif isinstance(node, list):
        for i, v in enumerate(node):
            _collect_leaves(v, path + (i,), out, parent_key=parent_key)
    elif isinstance(node, str) and node.strip() and parent_key not in _EXCLUDED_KEYS:
        out.append((path, node))


def _set_path(root: dict | list, path: tuple, value: str) -> None:
    cur = root
    for key in path[:-1]:
        cur = cur[key]
    cur[path[-1]] = value


def _deep_copy(node):
    if isinstance(node, dict):
        return {k: _deep_copy(v) for k, v in node.items()}
    if isinstance(node, list):
        return [_deep_copy(v) for v in node]
    return node


async def translate_json(content: dict, target_lang: str, source_lang: str = "en") -> dict:
    """Translates every string leaf of `content` to target_lang, preserving
    structure. Falls back to the original content (unchanged) on any error —
    callers can always persist/serve the result safely."""
    if target_lang.lower() == source_lang.lower():
        return content

    result = _deep_copy(content)
    leaves: list[tuple[tuple, str]] = []
    _collect_leaves(result, (), leaves)
    if not leaves:
        return result

    try:
        translated = await _deepl_call([text for _, text in leaves], target_lang, source_lang)
    except TranslationQuotaExceededError:
        logger.warning("DeepL quota/rate limit exceeded — serving source content for lang=%s", target_lang)
        return content
    except Exception:
        logger.exception("DeepL translation failed — serving source content for lang=%s", target_lang)
        return content

    if len(translated) != len(leaves):
        logger.error("DeepL returned %d translations for %d leaves — serving source content", len(translated), len(leaves))
        return content

    for (path, _original), new_value in zip(leaves, translated):
        _set_path(result, path, new_value)

    return result


async def translate_html(html: str, target_lang: str, source_lang: str = "en") -> str:
    """Translates the text nodes of an HTML fragment (article body), leaving
    tags/attributes and <code>/<pre> blocks untouched. Falls back to the
    original HTML on any error — same contract as translate_json()."""
    if not html or not html.strip():
        return html
    if target_lang.lower() == source_lang.lower():
        return html

    soup = BeautifulSoup(html, "html.parser")
    text_nodes: list[NavigableString] = [
        node for node in soup.find_all(string=True)
        if node.strip() and not node.find_parent(_NO_TRANSLATE_TAGS)
    ]
    if not text_nodes:
        return html

    try:
        translated = await _deepl_call([str(n) for n in text_nodes], target_lang, source_lang)
    except TranslationQuotaExceededError:
        logger.warning("DeepL quota/rate limit exceeded — serving source HTML for lang=%s", target_lang)
        return html
    except Exception:
        logger.exception("DeepL HTML translation failed — serving source HTML for lang=%s", target_lang)
        return html

    if len(translated) != len(text_nodes):
        logger.error("DeepL returned %d translations for %d HTML text nodes — serving source HTML", len(translated), len(text_nodes))
        return html

    for node, new_text in zip(text_nodes, translated):
        node.replace_with(new_text)

    return str(soup)


async def translate_article(article, target_lang: str, source_lang: str = "en") -> dict:
    """Translates the reader-facing fields of an Article (title/excerpt/SEO/
    content). Never raises — falls back to source values on failure. Does
    NOT translate content_json: a translation is a generated read-only view,
    never re-edited directly in Tiptap (the author always edits the source
    language; re-translating regenerates the view)."""
    flat = {
        "title": article.title,
        "excerpt": article.excerpt or "",
        "seo_title": article.seo_title or "",
        "seo_description": article.seo_description or "",
    }
    translated_flat = await translate_json(flat, target_lang, source_lang)
    translated_content = await translate_html(article.content or "", target_lang, source_lang)

    return {
        "title": translated_flat["title"],
        "excerpt": translated_flat["excerpt"] or None,
        "seo_title": translated_flat["seo_title"] or None,
        "seo_description": translated_flat["seo_description"] or None,
        "content": translated_content,
    }
