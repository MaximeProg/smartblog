"""One-off script: auto-translate the frontend's next-intl UI messages
(frontend/src/messages/en.json) into every language already supported for
blog content (frontend/src/config/cms.ts CMS_SUPPORTED_LANGS), via DeepL —
same provider/account already used for CMS/article content translation.

en.json and fr.json are the source of truth and are never overwritten here.

ICU placeholders ({name}, {n}, and plural/select blocks like
{count, plural, one {# item} other {# items}}) are protected from DeepL by
wrapping each balanced top-level {...} span in an <x> tag and using DeepL's
XML tag_handling with ignore_tags=x, so DeepL passes them through untouched.
One side effect: any literal words *inside* a plural/select block (e.g.
"item"/"items") are not translated either, since the whole block is opaque —
a small, bounded gap (only 2 such messages in this file today).

Run from backend/: python -m scripts.generate_ui_translations
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.services.translation_service import _collect_leaves, _set_path, _deep_copy

MESSAGES_DIR = Path(__file__).resolve().parent.parent.parent / "frontend" / "src" / "messages"
EN_JSON = MESSAGES_DIR / "en.json"

# CMS_SUPPORTED_LANGS (frontend/src/config/cms.ts) minus en/fr, which are
# already maintained by hand and must never be overwritten by this script.
TARGET_LANGS = [
    "es", "de", "pt", "it", "nl", "pl", "ru", "ja", "zh", "ko", "tr",
    "sv", "da", "nb", "fi", "cs", "sk", "ro", "hu", "bg", "el", "uk",
    "id", "lt", "lv", "et", "sl",
]

# DeepL requires a region variant for a few target languages.
DEEPL_TARGET_OVERRIDES = {"pt": "PT-PT"}

BATCH_SIZE = 50


def _deepl_endpoint() -> str:
    if settings.DEEPL_API_KEY.endswith(":fx"):
        return "https://api-free.deepl.com/v2/translate"
    return "https://api.deepl.com/v2/translate"


def _xml_escape(text: str) -> str:
    # Some source strings contain literal '&'/'<'/'>' (e.g. "Theme & colors",
    # or raw HTML in a newsletter placeholder) — DeepL's tag_handling=xml
    # requires well-formed XML, so these must be entity-escaped first.
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _xml_unescape(text: str) -> str:
    return text.replace("&lt;", "<").replace("&gt;", ">").replace("&amp;", "&")


def _protect_placeholders(text: str) -> str:
    """Escapes XML-special characters, then wraps every balanced top-level
    {...} span (handles nested braces, e.g. ICU plural blocks) in <x>...</x>
    so DeepL's tag_handling=xml with ignore_tags=x leaves it untouched."""
    text = _xml_escape(text)
    out: list[str] = []
    i, n = 0, len(text)
    while i < n:
        if text[i] == "{":
            depth = 1
            j = i + 1
            while j < n and depth > 0:
                if text[j] == "{":
                    depth += 1
                elif text[j] == "}":
                    depth -= 1
                j += 1
            out.append(f"<x>{text[i:j]}</x>")
            i = j
        else:
            out.append(text[i])
            i += 1
    return "".join(out)


def _unprotect(text: str) -> str:
    unwrapped = text.replace("<x>", "").replace("</x>", "")
    return _xml_unescape(unwrapped)


async def _deepl_batch(client: httpx.AsyncClient, texts: list[str], target_lang: str) -> list[str]:
    protected = [_protect_placeholders(t) for t in texts]
    resp = await client.post(
        _deepl_endpoint(),
        headers={"Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}"},
        data={
            "text": protected,
            "target_lang": target_lang,
            "source_lang": "EN",
            "tag_handling": "xml",
            "ignore_tags": "x",
        },
    )
    if resp.status_code != 200:
        raise RuntimeError(f"DeepL error {resp.status_code}: {resp.text[:300]}")
    payload = resp.json()
    return [_unprotect(t["text"]) for t in payload["translations"]]


async def translate_one_language(en_content: dict, lang: str) -> None:
    target = DEEPL_TARGET_OVERRIDES.get(lang, lang.upper())
    out_path = MESSAGES_DIR / f"{lang}.json"
    print(f"[{lang}] starting -> {out_path.name} (DeepL target={target})", flush=True)

    result = _deep_copy(en_content)
    leaves: list[tuple[tuple, str]] = []
    _collect_leaves(result, (), leaves)

    async with httpx.AsyncClient(timeout=30.0) as client:
        for start in range(0, len(leaves), BATCH_SIZE):
            chunk = leaves[start:start + BATCH_SIZE]
            texts = [s for _, s in chunk]
            translated = await _deepl_batch(client, texts, target)
            if len(translated) != len(chunk):
                raise RuntimeError(f"[{lang}] batch size mismatch at offset {start}")
            for (path, _original), new_value in zip(chunk, translated):
                _set_path(result, path, new_value)
            print(f"[{lang}] {min(start + BATCH_SIZE, len(leaves))}/{len(leaves)}", flush=True)

    out_path.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[{lang}] DONE -> {out_path}", flush=True)


async def main() -> None:
    if not settings.DEEPL_API_KEY:
        print("DEEPL_API_KEY not configured — aborting.", flush=True)
        return

    en_content = json.loads(EN_JSON.read_text(encoding="utf-8"))

    for lang in TARGET_LANGS:
        try:
            await translate_one_language(en_content, lang)
        except Exception as exc:
            print(f"[{lang}] FAILED: {exc} — skipping, other languages continue.", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
