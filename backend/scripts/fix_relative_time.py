"""Second follow-up fix: notifications.minutesAgo/hoursAgo/daysAgo ("{m}m
ago" etc.) came out grammatically wrong in languages that reorder "ago"
before the number (e.g. German "vor 5 Minuten", not "5 vor Minuten") —
DeepL's tag_handling freezes the placeholder's POSITION, not just its
content, so it cannot move it where correct grammar requires.

Fix: translate a version of each string with a literal sentinel digit
instead of the {m}/{h}/{d} placeholder (so DeepL is free to reorder the
whole phrase), then substitute the digit back for the placeholder in the
result.

Run from backend/: python -m scripts.fix_relative_time
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from scripts.generate_ui_translations import TARGET_LANGS, DEEPL_TARGET_OVERRIDES, MESSAGES_DIR, _deepl_endpoint

# key -> (sentinel-substituted English source, sentinel digit, placeholder)
SENTINEL_STRINGS: dict[str, tuple[str, str, str]] = {
    "minutesAgo": ("5m ago", "5", "{m}"),
    "hoursAgo": ("3h ago", "3", "{h}"),
    "daysAgo": ("2d ago", "2", "{d}"),
}


async def _deepl_plain(client: httpx.AsyncClient, texts: list[str], target_lang: str) -> list[str]:
    resp = await client.post(
        _deepl_endpoint(),
        headers={"Authorization": f"DeepL-Auth-Key {settings.DEEPL_API_KEY}"},
        data={"text": texts, "target_lang": target_lang, "source_lang": "EN"},
    )
    if resp.status_code != 200:
        raise RuntimeError(f"DeepL error {resp.status_code}: {resp.text[:300]}")
    return [t["text"] for t in resp.json()["translations"]]


async def fix_language(lang: str) -> None:
    target = DEEPL_TARGET_OVERRIDES.get(lang, lang.upper())
    out_path = MESSAGES_DIR / f"{lang}.json"
    data = json.loads(out_path.read_text(encoding="utf-8"))

    keys = list(SENTINEL_STRINGS.keys())
    sources = [SENTINEL_STRINGS[k][0] for k in keys]

    async with httpx.AsyncClient(timeout=30.0) as client:
        translated = await _deepl_plain(client, sources, target)

    for key, result in zip(keys, translated):
        _, sentinel, placeholder = SENTINEL_STRINGS[key]
        if sentinel not in result:
            print(f"[{lang}] WARNING: sentinel '{sentinel}' not found in '{result}' for {key} — left unchanged", flush=True)
            continue
        data["notifications"][key] = result.replace(sentinel, placeholder, 1)

    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[{lang}] relative-time strings fixed", flush=True)


async def main() -> None:
    for lang in TARGET_LANGS:
        try:
            await fix_language(lang)
        except Exception as exc:
            print(f"[{lang}] FAILED: {exc}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
