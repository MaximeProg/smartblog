"""
Service NowPayments — Crypto USDT BSC (BEP20 / BNB Smart Chain)
Docs : https://documenter.getpostman.com/view/7907941/2s93JtP3F6
"""
import asyncio
import base64
import hashlib
import hmac
import io
import json
import time
from typing import Any

import httpx
import pyotp
import qrcode

from app.core.config import settings

_BASE = "https://api-sandbox.nowpayments.io/v1" if settings.NOWPAYMENTS_SANDBOX else "https://api.nowpayments.io/v1"
_PAYOUT_BASE = "https://api-sandbox.nowpayments.io/v1" if settings.NOWPAYMENTS_SANDBOX else "https://api.nowpayments.io/v1"


def _headers(api_key: str) -> dict:
    return {"x-api-key": api_key, "Content-Type": "application/json"}


# ── Auth JWT (requis uniquement pour les endpoints Payout) ────────
#
# Contrairement à /v1/payment (simple x-api-key), /v1/payout exige en plus
# un token JWT obtenu via POST /v1/auth avec l'email/mot de passe du compte
# dashboard NowPayments. Le token est valable 5 min — mis en cache process
# et renouvelé avec une marge de sécurité (comme le pattern déjà utilisé
# pour OpenProvider, voir app/services/registrars/openprovider.py).

_jwt_cache: dict[str, float | str | None] = {"token": None, "expires_at": 0.0}
_jwt_lock = asyncio.Lock()


async def _get_payout_jwt() -> str:
    if not settings.NOWPAYMENTS_EMAIL or not settings.NOWPAYMENTS_PASSWORD:
        raise RuntimeError("NOWPAYMENTS_EMAIL/NOWPAYMENTS_PASSWORD non configurés (requis pour les payouts).")

    async with _jwt_lock:
        if _jwt_cache["token"] and time.time() < float(_jwt_cache["expires_at"] or 0):
            return str(_jwt_cache["token"])

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{_PAYOUT_BASE}/auth",
                json={"email": settings.NOWPAYMENTS_EMAIL, "password": settings.NOWPAYMENTS_PASSWORD},
            )
        if resp.status_code >= 400:
            raise RuntimeError(f"NowPayments POST /auth -> {resp.status_code}: {resp.text[:300]}")
        token = resp.json().get("token")
        if not token:
            raise RuntimeError("NowPayments /v1/auth: token absent de la réponse.")

        _jwt_cache["token"] = token
        # Valable 5 min d'après la doc — marge de sécurité de 30s.
        _jwt_cache["expires_at"] = time.time() + 4.5 * 60
        return str(token)


async def _payout_headers() -> dict:
    token = await _get_payout_jwt()
    return {
        "x-api-key": settings.NOWPAYMENTS_PAYOUT_API_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


# ── Payment (paiement intégré, sans redirection) ──────────────────

async def create_payment(
    *,
    price_amount: float,
    order_id: str,
    order_description: str,
    ipn_callback_url: str,
) -> dict:
    """
    Crée un paiement NowPayments direct (API "Payment", pas "Invoice") :
    retourne l'adresse de dépôt et le montant à envoyer, sans jamais rediriger
    l'utilisateur hors de la plateforme.

    Cote directement en USDT-BSC (price_currency = pay_currency), sans passer
    par un montant fiat ("usd") : coter en fiat impose un plancher NowPayments
    d'environ 18$ (vérifié empiriquement sur /v1/min-amount), quels que soient
    is_fixed_rate/is_fee_paid_by_user, alors que USDT ≈ USD (stablecoin) rend
    cette conversion fiat inutile. is_fixed_rate=False car il n'y a aucun taux
    à figer entre deux fois la même devise — le laisser à True remonte le
    plancher à ~7$ (confirmé : un paiement de 1$ est alors rejeté avec
    "amountFrom is too small"). Avec ces deux réglages, le plancher réel tombe
    à ~0.05$ (frais réseau BEP20), ce qui permet des paiements dès 1$.
    """
    if not settings.NOWPAYMENTS_API_KEY:
        raise RuntimeError("NOWPAYMENTS_API_KEY non configuré.")

    payload = {
        "price_amount": price_amount,
        "price_currency": "usdtbsc",
        "pay_currency": "usdtbsc",
        "order_id": order_id,
        "order_description": order_description,
        "ipn_callback_url": ipn_callback_url,
        "is_fixed_rate": False,
        "is_fee_paid_by_user": False,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{_BASE}/payment",
            headers=_headers(settings.NOWPAYMENTS_API_KEY),
            json=payload,
        )
        if resp.status_code >= 400:
            # resp.raise_for_status() seul ne logge que le code HTTP, jamais
            # le corps de la réponse — qui contient le vrai message NowPayments
            # (ex: AMOUNT_MINIMAL_ERROR). Sans ça, un échec en production ne
            # laisse dans les logs qu'un "400 Bad Request" inexploitable.
            raise RuntimeError(f"NowPayments POST /payment -> {resp.status_code}: {resp.text[:300]}")
        return resp.json()


async def get_payment_status(payment_id: str) -> dict:
    """
    Relit le statut d'un paiement directement depuis NowPayments (vérification
    "à la source", en complément — pas en remplacement — du webhook IPN).
    """
    if not settings.NOWPAYMENTS_API_KEY:
        raise RuntimeError("NOWPAYMENTS_API_KEY non configuré.")

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{_BASE}/payment/{payment_id}",
            headers=_headers(settings.NOWPAYMENTS_API_KEY),
        )
        if resp.status_code >= 400:
            raise RuntimeError(f"NowPayments GET /payment/{payment_id} -> {resp.status_code}: {resp.text[:300]}")
        return resp.json()


def generate_qr_data_uri(data: str) -> str:
    """Encode `data` (ex: adresse de paiement) en QR code PNG, renvoyé en
    data URI base64 — affichable directement dans un <img src=...>."""
    img = qrcode.make(data)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    encoded = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{encoded}"


# ── IPN Webhook verification ──────────────────────────────────────

def verify_ipn_signature(payload_bytes: bytes, received_sig: str) -> bool:
    """
    Vérifie la signature HMAC-SHA512 du webhook IPN NowPayments.
    Header : x-nowpayments-sig
    """
    if not settings.NOWPAYMENTS_IPN_SECRET:
        return False
    try:
        body = json.loads(payload_bytes)
        sorted_body = json.dumps(body, sort_keys=True, separators=(",", ":"))
        expected = hmac.new(
            settings.NOWPAYMENTS_IPN_SECRET.encode(),
            sorted_body.encode(),
            hashlib.sha512,
        ).hexdigest()
        return hmac.compare_digest(expected, received_sig.lower())
    except Exception:
        return False


# ── Payout (versement sortant vers affiliés) ─────────────────────

async def send_payout(
    *,
    withdrawals: list[dict],  # [{"address": "0xabc...", "amount": 10.50, "currency": "usdtbsc", "ipn_callback_url": "..."}]
) -> dict:
    """
    Envoie des USDT à plusieurs wallets en un appel.
    Nécessite NOWPAYMENTS_PAYOUT_API_KEY + NOWPAYMENTS_EMAIL/PASSWORD (JWT).
    Retourne : { id (= batch_withdrawal_id), status, withdrawals: [...] }
    Le payout reste en statut "creating" tant qu'il n'est pas confirmé via
    `verify_payout` — voir cette fonction pour la suite du flux.
    """
    if not settings.NOWPAYMENTS_PAYOUT_API_KEY:
        raise RuntimeError("NOWPAYMENTS_PAYOUT_API_KEY non configuré.")

    payload: dict[str, Any] = {"withdrawals": withdrawals}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{_PAYOUT_BASE}/payout",
            headers=await _payout_headers(),
            json=payload,
        )
        if resp.status_code >= 400:
            raise RuntimeError(f"NowPayments POST /payout -> {resp.status_code}: {resp.text[:300]}")
        return resp.json()


async def verify_payout(batch_withdrawal_id: str) -> dict:
    """
    Confirme un payout avec le code 2FA — obligatoire dans l'heure suivant sa
    création, sinon NowPayments le rejette automatiquement. Le code est ici
    généré automatiquement via TOTP (NOWPAYMENTS_PAYOUT_TOTP_SECRET), à
    condition que le 2FA "Authenticator app" (pas "Email") soit activé sur les
    payouts dans le dashboard NowPayments — c'est ce réglage qui permet de ne
    dépendre d'aucune boîte mail pour automatiser entièrement le versement.
    """
    if not settings.NOWPAYMENTS_PAYOUT_TOTP_SECRET:
        raise RuntimeError("NOWPAYMENTS_PAYOUT_TOTP_SECRET non configuré (2FA authenticator requis pour les payouts).")

    code = pyotp.TOTP(settings.NOWPAYMENTS_PAYOUT_TOTP_SECRET).now()

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{_PAYOUT_BASE}/payout/{batch_withdrawal_id}/verify",
            headers=await _payout_headers(),
            json={"verification_code": code},
        )
        if resp.status_code >= 400:
            raise RuntimeError(f"NowPayments POST /payout/{batch_withdrawal_id}/verify -> {resp.status_code}: {resp.text[:300]}")
        return resp.json()


async def send_single_payout(
    *,
    wallet_address: str,
    amount_usd: float,
    extra_id: str | None = None,
) -> dict:
    """
    Envoie un paiement USDT BSC (BEP20) à un seul wallet, puis confirme
    immédiatement via le 2FA automatique (TOTP) — un seul appel de haut
    niveau qui couvre tout le cycle création + vérification.
    extra_id peut être l'ID de la commission/cashout pour tracking.
    """
    withdrawal = {
        "address": wallet_address,
        "amount": round(amount_usd, 2),
        "currency": "usdtbsc",
    }
    if extra_id:
        withdrawal["extra_id"] = extra_id

    created = await send_payout(withdrawals=[withdrawal])
    batch_withdrawal_id = str(created.get("id") or created.get("batch_withdrawal_id") or "")
    if not batch_withdrawal_id:
        raise RuntimeError("NowPayments payout: id absent de la réponse de création.")

    await verify_payout(batch_withdrawal_id)
    return created
