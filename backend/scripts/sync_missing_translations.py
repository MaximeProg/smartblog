"""Incremental follow-up to generate_ui_translations.py: finds any leaf key
present in en.json but missing from an already-generated locale file (e.g.
new UI strings added after the initial 27-language generation) and
translates just those, merging them into the existing file in place.

Much cheaper than re-running the full generation for every future addition.

Run from backend/: python -m scripts.sync_missing_translations
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from scripts.generate_ui_translations import (
    TARGET_LANGS, DEEPL_TARGET_OVERRIDES, MESSAGES_DIR, BATCH_SIZE,
    _deepl_endpoint, _protect_placeholders, _unprotect,
)


def _get_path(root: dict, path: tuple):
    cur = root
    for key in path:
        cur = cur[key]
    return cur


def _set_path(root: dict, path: tuple, value) -> None:
    cur = root
    for key in path[:-1]:
        cur = cur.setdefault(key, {})
    cur[path[-1]] = value


def _collect_leaves(node, path=()):
    if isinstance(node, dict):
        for k, v in node.items():
            yield from _collect_leaves(v, path + (k,))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            yield from _collect_leaves(v, path + (i,))
    elif isinstance(node, str) and node.strip():
        yield path, node


def _find_missing(en_content: dict, existing: dict) -> list[tuple[tuple, str]]:
    missing = []
    for path, text in _collect_leaves(en_content):
        cur = existing
        found = True
        for key in path:
            if isinstance(cur, dict) and key in cur:
                cur = cur[key]
            else:
                found = False
                break
        if not found:
            missing.append((path, text))
    return missing


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
    return [_unprotect(t["text"]) for t in resp.json()["translations"]]


async def sync_language(en_content: dict, lang: str) -> None:
    out_path = MESSAGES_DIR / f"{lang}.json"
    existing = json.loads(out_path.read_text(encoding="utf-8"))

    missing = _find_missing(en_content, existing)
    if not missing:
        print(f"[{lang}] up to date", flush=True)
        return

    target = DEEPL_TARGET_OVERRIDES.get(lang, lang.upper())
    print(f"[{lang}] {len(missing)} new string(s) to translate", flush=True)

    async with httpx.AsyncClient(timeout=30.0) as client:
        for start in range(0, len(missing), BATCH_SIZE):
            chunk = missing[start:start + BATCH_SIZE]
            texts = [s for _, s in chunk]
            translated = await _deepl_batch(client, texts, target)
            for (path, _original), new_value in zip(chunk, translated):
                _set_path(existing, path, new_value)

    out_path.write_text(json.dumps(existing, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[{lang}] synced", flush=True)


async def main() -> None:
    en_content = json.loads((MESSAGES_DIR / "en.json").read_text(encoding="utf-8"))
    for lang in TARGET_LANGS:
        try:
            await sync_language(en_content, lang)
        except Exception as exc:
            print(f"[{lang}] FAILED: {exc}", flush=True)


if __name__ == "__main__":
    asyncio.run(main())
