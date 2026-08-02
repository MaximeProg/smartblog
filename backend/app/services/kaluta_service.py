"""
Service Kaluta KYC — vérification d'identité (document + visage + liveness),
condition d'accès au programme d'affiliation (décision PDG 2026-08-01).
Docs : https://kalutakyc.com/docs

Auth serveur-à-serveur uniquement (X-API-Key) — jamais exposée au frontend.
"""
import hashlib
import hmac
import time

import httpx

from app.core.config import settings

_WEBHOOK_MAX_AGE_SECONDS = 300  # 5 min — rejette un webhook trop ancien (rejeu)


def _headers() -> dict:
    return {"X-API-Key": settings.KALUTA_API_KEY, "Content-Type": "application/json"}


def kaluta_webhook_url() -> str:
    """URL fixe à enregistrer côté dashboard Kaluta — jamais fournie par
    l'appelant (même précédent que payments.py::_ipn_callback_url pour
    NowPayments)."""
    base = settings.PLATFORM_API_DOMAIN or settings.FRONTEND_URL
    if not base.startswith("http"):
        base = f"https://{base}"
    return f"{base.rstrip('/')}/api/v1/platform/kyc/webhook/kaluta"


async def create_kaluta_session(
    *,
    external_id: str,
    redirect_url: str | None = None,
    document_type: str | None = None,
    metadata: dict | None = None,
) -> dict:
    """
    Crée une session de vérification Kaluta pour un utilisateur.
    Retourne {session_id, verification_url, expires_at}.
    Le webhook_url pointe toujours vers notre endpoint fixe — jamais fourni
    par l'appelant, pour éviter qu'un client détourne les notifications de
    résultat vers une autre URL.
    """
    if not settings.KALUTA_API_KEY:
        raise RuntimeError("KALUTA_API_KEY non configuré.")

    body: dict = {
        "external_id": external_id,
        "webhook_url": kaluta_webhook_url(),
    }
    if document_type:
        body["document_type"] = document_type
    if redirect_url:
        body["redirect_url"] = redirect_url
    if metadata:
        body["metadata"] = metadata

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(f"{settings.KALUTA_BASE_URL}/sessions", headers=_headers(), json=body)
        if resp.status_code >= 400:
            raise RuntimeError(f"Kaluta POST /sessions -> {resp.status_code}: {resp.text[:300]}")
        return resp.json()


def verify_kaluta_signature(raw_body: bytes, signature_header: str) -> bool:
    """
    Vérifie la signature HMAC-SHA256 du webhook Kaluta.
    Header : X-Kaluta-Signature: t=<timestamp>,v1=<hex>
    Recalcule HMAC-SHA256(secret, f"{t}.{raw_body}") et compare en temps
    constant à v1 ; rejette si le timestamp a plus de 5 minutes (anti-rejeu).
    Ne lève jamais — retourne False sur toute erreur (même contrat que
    verify_ipn_signature côté NowPayments).
    """
    if not settings.KALUTA_WEBHOOK_SECRET or not signature_header:
        return False
    try:
        parts = dict(p.split("=", 1) for p in signature_header.split(","))
        t = parts["t"]
        v1 = parts["v1"]

        if abs(time.time() - int(t)) > _WEBHOOK_MAX_AGE_SECONDS:
            return False

        signed_payload = f"{t}.{raw_body.decode()}"
        expected = hmac.new(
            settings.KALUTA_WEBHOOK_SECRET.encode(),
            signed_payload.encode(),
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, v1)
    except Exception:
        return False
