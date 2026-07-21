"""Follow-up to generate_ui_translations.py: the 4 ICU plural/select strings
in en.json were deliberately left untouched by the main script (their whole
{...} block is protected from DeepL to avoid corrupting the ICU syntax) —
this means the inner English words ("item"/"items", "unread", etc.) stayed
in English in all 27 generated locale files. This script translates just
those inner phrases and reconstructs the ICU string, closing that gap.

Run from backend/: python -m scripts.fix_plural_translations
"""
from __future__ import annotations

import asyncio
import json
import re
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from scripts.generate_ui_translations import TARGET_LANGS, DEEPL_TARGET_OVERRIDES, MESSAGES_DIR, _deepl_endpoint

# (namespace, key) -> path in the JSON tree
PLURAL_PATHS: list[tuple[str, str]] = [
    ("menus", "itemCount"),
    ("media", "itemCount"),
    ("dashboardPage", "supportAlertTitle"),
    ("notifications", "unreadCount"),
]

_CLAUSE_RE = re.compile(r"([=\w]+\s+\{)([^{}]*)(\})")


async def _deepl_plain(client: httpx.AsyncClient, texts: list[str], target_lang: str) -> list[str]:
    resp = await client.post(
        _deepl_endpoint(),
        headers={"Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}"},
        data={"text": texts, "target_lang": target_lang, "source_lang": "EN"},
    )
    if resp.status_code != 200:
        raise RuntimeError(f"DeepL error {resp.status_code}: {resp.text[:300]}")
    return [t["text"] for t in resp.json()["translations"]]


async def fix_language(en_content: dict, lang: str) -> None:
    target = DEEPL_TARGET_OVERRIDES.get(lang, lang.upper())
    out_path = MESSAGES_DIR / f"{lang}.json"
    data = json.loads(out_path.read_text(encoding="utf-8"))

    # Collect every inner clause phrase across all 4 strings in one batch.
    originals: list[str] = []
    for ns, key in PLURAL_PATHS:
        src = en_content[ns][key]
        for m in _CLAUSE_RE.finditer(src):
            originals.append(m.group(2))

    if not originals:
        return

    async with httpx.AsyncClient(timeout=30.0) as client:
        translated = await _deepl_plain(client, originals, target)

    idx = 0
    for ns, key in PLURAL_PATHS:
        src = en_content[ns][key]

        def _replace(m: re.Match) -> str:
            nonlocal idx
            new_inner = translated[idx]
            idx += 1
            return f"{m.group(1)}{new_inner}{m.group(3)}"

        data[ns][key] = _CLAUSE_RE.sub(_replace, src)

    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[{lang}] plural strings fixed", flush=True)


async def main() -> None:
    en_content = json.loads((MESSAGES_DIR / "en.json").read_text(encoding="utf-8"))
    for lang in TARGET_LANGS:
        try:
            await fix_language(en_content, lang)
        except Exception as exc:
            print(f"[{lang}] FAILED: {exc}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
