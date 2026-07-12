"""
Service NowPayments — Crypto USDT TRC20
Docs : https://documenter.getpostman.com/view/7907941/2s93JtP3F6
"""
import hashlib
import hmac
import json
import uuid
from typing import Any

import httpx

from app.core.config import settings

_BASE = "https://api-sandbox.nowpayments.io/v1" if settings.NOWPAYMENTS_SANDBOX else "https://api.nowpayments.io/v1"
_PAYOUT_BASE = "https://api-sandbox.nowpayments.io/v1" if settings.NOWPAYMENTS_SANDBOX else "https://api.nowpayments.io/v1"


def _headers(api_key: str) -> dict:
    return {"x-api-key": api_key, "Content-Type": "application/json"}


# ── Invoice (paiement entrant) ────────────────────────────────────

async def create_invoice(
    *,
    price_amount: float,
    price_currency: str = "usd",
    order_id: str,
    order_description: str,
    success_url: str,
    cancel_url: str,
    ipn_callback_url: str,
) -> dict:
    """
    Crée une invoice NowPayments. L'utilisateur est redirigé vers invoice_url
    pour payer en USDT (ou autre crypto). Les fonds arrivent dans le wallet
    NOWPAYMENTS_WALLET_USDT de la plateforme.
    Retourne : { invoice_url, id, order_id, ... }
    """
    if not settings.NOWPAYMENTS_API_KEY:
        raise RuntimeError("NOWPAYMENTS_API_KEY non configuré.")

    payload = {
        "price_amount": price_amount,
        "price_currency": price_currency,
        "pay_currency": "usdttrc20",
        "order_id": order_id,
        "order_description": order_description,
        "success_url": success_url,
        "cancel_url": cancel_url,
        "ipn_callback_url": ipn_callback_url,
        "is_fixed_rate": True,
        "is_fee_paid_by_user": False,
    }

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"{_BASE}/invoice",
            headers=_headers(settings.NOWPAYMENTS_API_KEY),
            json=payload,
        )
        resp.raise_for_status()
        return resp.json()


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
