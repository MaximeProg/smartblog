"""
Service de scanning de liens publicitaires.
Consulte 4 sources : Google Safe Browsing, VirusTotal, URLhaus, PhishTank.
Retourne un statut consolidé : SAFE | SUSPECT | DANGEROUS.
"""
import httpx
import base64
import json
from datetime import datetime, timezone

from app.core.config import settings
from app.models.enums import LinkSafetyStatus


async def scan_url(url: str) -> dict:
    """
    Scan une URL sur les 4 sources.
    Retourne un dict avec les résultats bruts + statut consolidé.
    """
    results = {}

    async with httpx.AsyncClient(timeout=10.0) as client:
        gsb, vt, uh, pt = await _run_all(client, url)

    results["google_safe_browsing"] = gsb
    results["virustotal"] = vt
    results["urlhaus"] = uh
    results["phishtank"] = pt

    status = _consolidate(gsb, vt, uh, pt)
    results["status"] = status
    results["scanned_at"] = datetime.now(timezone.utc).isoformat()
    return results


async def _run_all(client: httpx.AsyncClient, url: str) -> tuple:
    import asyncio
    gsb, vt, uh, pt = await asyncio.gather(
        _google_safe_browsing(client, url),
        _virustotal(client, url),
        _urlhaus(client, url),
        _phishtank(client, url),
        return_exceptions=True,
    )

    def safe(r):
        return r if not isinstance(r, Exception) else {"error": str(r)}

    return safe(gsb), safe(vt), safe(uh), safe(pt)


# ─── Google Safe Browsing ─────────────────────────────────────────

async def _google_safe_browsing(client: httpx.AsyncClient, url: str) -> dict:
    if not settings.GOOGLE_SAFE_BROWSING_API_KEY:
        return {"skipped": True}
    payload = {
        "client": {"clientId": "nexusblog", "clientVersion": "1.0"},
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}],
        },
    }
    resp = await client.post(
        f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={settings.GOOGLE_SAFE_BROWSING_API_KEY}",
        json=payload,
    )
    data = resp.json()
    return {"matches": data.get("matches", []), "is_dangerous": bool(data.get("matches"))}


# ─── VirusTotal ───────────────────────────────────────────────────

async def _virustotal(client: httpx.AsyncClient, url: str) -> dict:
    if not settings.VIRUSTOTAL_API_KEY:
        return {"skipped": True}
    url_id = base64.urlsafe_b64encode(url.encode()).rstrip(b"=").decode()
    resp = await client.get(
        f"https://www.virustotal.com/api/v3/urls/{url_id}",
        headers={"x-apikey": settings.VIRUSTOTAL_API_KEY},
    )
    if resp.status_code == 404:
        # URL inconnue de VT — soumettre pour analyse asynchrone
        await client.post(
            "https://www.virustotal.com/api/v3/urls",
            headers={"x-apikey": settings.VIRUSTOTAL_API_KEY},
            data={"url": url},
        )
        return {"submitted": True, "is_dangerous": False}

    data = resp.json()
    stats = data.get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
    malicious = stats.get("malicious", 0)
    suspicious = stats.get("suspicious", 0)
    return {
        "malicious": malicious,
        "suspicious": suspicious,
        "total": sum(stats.values()),
        "is_dangerous": malicious >= 2 or suspicious >= 5,
        "is_suspect": malicious == 1 or suspicious >= 2,
    }


# ─── URLhaus ─────────────────────────────────────────────────────

async def _urlhaus(client: httpx.AsyncClient, url: str) -> dict:
    resp = await client.post(
        "https://urlhaus-api.abuse.ch/v1/url/",
        data={"url": url},
    )
    data = resp.json()
    query_status = data.get("query_status", "")
    return {
        "query_status": query_status,
        "threat": data.get("threat"),
        "is_dangerous": query_status in ("is_hosting_url", "available"),
    }


# ─── PhishTank ────────────────────────────────────────────────────

async def _phishtank(client: httpx.AsyncClient, url: str) -> dict:
    resp = await client.post(
        "https://checkurl.phishtank.com/checkurl/",
        data={"url": url, "format": "json"},
        headers={"User-Agent": "nexusblog-safescan/1.0"},
    )
    data = resp.json()
    results = data.get("results", {})
    return {
        "in_database": results.get("in_database", False),
        "valid": results.get("valid", False),
        "is_dangerous": results.get("in_database", False) and results.get("valid", False),
    }


# ─── Consolidation ───────────────────────────────────────────────

def _consolidate(gsb: dict, vt: dict, uh: dict, pt: dict) -> LinkSafetyStatus:
    dangerous = any([
        gsb.get("is_dangerous"),
        vt.get("is_dangerous"),
        uh.get("is_dangerous"),
        pt.get("is_dangerous"),
    ])
    if dangerous:
        return LinkSafetyStatus.DANGEROUS

    suspect = any([
        vt.get("is_suspect"),
    ])
    if suspect:
        return LinkSafetyStatus.SUSPECT

    return LinkSafetyStatus.SAFE
