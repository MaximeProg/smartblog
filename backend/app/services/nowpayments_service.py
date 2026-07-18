"""
Service NowPayments — Crypto USDT TRC20
Docs : https://documenter.getpostman.com/view/7907941/2s93JtP3F6
"""
import base64
import hashlib
import hmac
import io
import json
import uuid
from typing import Any

import httpx
import qrcode

from app.core.config import settings

_BASE = "https://api-sandbox.nowpayments.io/v1" if settings.NOWPAYMENTS_SANDBOX else "https://api.nowpayments.io/v1"
_PAYOUT_BASE = "https://api-sandbox.nowpayments.io/v1" if settings.NOWPAYMENTS_SANDBOX else "https://api.nowpayments.io/v1"


def _headers(api_key: str) -> dict:
    return {"x-api-key": api_key, "Content-Type": "application/json"}


# ── Payment (paiement intégré, sans redirection) ──────────────────

async def create_payment(
    *,
    price_amount: float,
    price_currency: str = "usd",
    order_id: str,
    order_description: str,
    ipn_callback_url: str,
) -> dict:
    """
    Crée un paiement NowPayments direct (API "Payment", pas "Invoice") :
    retourne l'adresse de dépôt et le montant à envoyer, sans jamais rediriger
    l'utilisateur hors de la plateforme.
    Retourne notamment : { payment_id, pay_address, pay_amount, pay_currency,
    payment_status, expiration_estimate_date, ... }
    """
    if not settings.NOWPAYMENTS_API_KEY:
        raise RuntimeError("NOWPAYMENTS_API_KEY non configuré.")

    payload = {
        "price_amount": price_amount,
        "price_currency": price_currency,
        "pay_currency": "usdttrc20",
        "order_id": order_id,
        "order_description": order_description,
        "ipn_callback_url": ipn_callback_url,
        "is_fixed_rate": True,
        "is_fee_paid_by_user": False,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{_BASE}/payment",
            headers=_headers(settings.NOWPAYMENTS_API_KEY),
            json=payload,
        )
        resp.raise_for_status()
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
        resp.raise_for_status()
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
    withdrawals: list[dict],  # [{"address": "TXxx...", "amount": 10.50, "currency": "usdttrc20", "ipn_callback_url": "..."}]
    batch_withdrawal_id: str | None = None,
) -> dict:
    """
    Envoie des USDT à plusieurs wallets en un appel.
    Nécessite NOWPAYMENTS_PAYOUT_API_KEY (clé dédiée payouts).
    Retourne : { id, batch_withdrawal_id, withdrawals: [...] }
    """
    if not settings.NOWPAYMENTS_PAYOUT_API_KEY:
        raise RuntimeError("NOWPAYMENTS_PAYOUT_API_KEY non configuré.")

    payload: dict[str, Any] = {"withdrawals": withdrawals}
    if batch_withdrawal_id:
        payload["ipn_callback_url"] = f"{settings.FRONTEND_URL.rstrip('/')}/api/nowpayments/payout-ipn"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{_PAYOUT_BASE}/payout",
            headers=_headers(settings.NOWPAYMENTS_PAYOUT_API_KEY),
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


async def send_single_payout(
    *,
    wallet_address: str,
    amount_usd: float,
    extra_id: str | None = None,
) -> dict:
    """
    Envoie un paiement USDT TRC20 à un seul wallet.
    extra_id peut être l'ID du cashout pour tracking.
    """
    withdrawal = {
        "address": wallet_address,
        "amount": round(amount_usd, 2),
        "currency": "usdttrc20",
    }
    if extra_id:
        withdrawal["extra_id"] = extra_id

    return await send_payout(
        withdrawals=[withdrawal],
        batch_withdrawal_id=str(uuid.uuid4()),
    )


# ── Prix abonnements ─────────────────────────────────────────────

PLAN_PRICES_USD: dict[str, float] = {
    "starter_monthly": 19.00,
    "starter_annual":  190.00,   # ~2 mois offerts
    "pro_monthly":     49.00,
    "pro_annual":      490.00,
    "business_monthly": 99.00,
    "business_annual":  990.00,
}


def get_plan_price(plan: str, billing: str) -> float:
    key = f"{plan.lower()}_{billing.lower()}"
    price = PLAN_PRICES_USD.get(key)
    if price is None:
        raise ValueError(f"Plan inconnu : {key}")
    return price
