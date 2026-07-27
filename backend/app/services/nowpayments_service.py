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
from app.core.redis_client import redis, key_payout_currencies, key_payment_currencies

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
    pay_currency: str = "usdtbsc",
) -> dict:
    """
    Crée un paiement NowPayments direct (API "Payment", pas "Invoice") :
    retourne l'adresse de dépôt et le montant à envoyer, sans jamais rediriger
    l'utilisateur hors de la plateforme.

    `price_currency` reste TOUJOURS "usdtbsc" (jamais "usd" fiat) : coter en
    fiat impose un plancher NowPayments d'environ 18$ (vérifié empiriquement
    sur /v1/min-amount), alors que USDT ≈ USD (stablecoin) rend cette
    conversion fiat inutile. `pay_currency` en revanche est paramétrable
    depuis le 2026-07-27 : le client peut payer dans n'importe quelle devise
    NowPayments (voir `get_payment_currencies`), NowPayments convertit
    automatiquement vers `price_currency`. is_fixed_rate=False car sinon le
    plancher remonte (confirmé : un paiement de 1$ usdtbsc→usdtbsc est alors
    rejeté avec "amountFrom is too small").

    ATTENTION plancher variable selon `pay_currency` : usdtbsc→usdtbsc tombe
    à ~0.05$, mais usdtbsc→btc a un vrai plancher ~4$ (confirmé en direct le
    2026-07-27, `AMOUNT_MINIMAL_ERROR` sur un test à 1$) — TOUJOURS vérifier
    `get_min_amount(pay_currency)` côté appelant avant de proposer un montant,
    ne jamais supposer que le plancher bas de usdtbsc s'applique à tout.
    """
    if not settings.NOWPAYMENTS_API_KEY:
        raise RuntimeError("NOWPAYMENTS_API_KEY non configuré.")

    payload = {
        "price_amount": price_amount,
        "price_currency": "usdtbsc",
        "pay_currency": pay_currency,
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


# ── Devises disponibles pour le cashout membres ───────────────────

_PAYOUT_CURRENCIES_TTL = 6 * 3600  # 6h — la liste de devises NowPayments ne change pas souvent


async def get_payout_currencies() -> list[dict]:
    """
    Liste des devises/réseaux réellement utilisables pour un virement
    NowPayments, récupérée en direct depuis /v1/full-currencies (pas une
    liste maintenue à la main côté plateforme — pour ne jamais diverger de
    ce que NowPayments accepte vraiment), mise en cache Redis 6h pour éviter
    de retélécharger ~240 Ko à chaque affichage de la page profil.

    Chaque entrée : {code, name, network, wallet_regex, extra_id_exists,
    extra_id_regex, extra_id_optional, logo_url}.
    """
    cached = await redis.get(key_payout_currencies())
    if cached:
        return json.loads(cached)

    if not settings.NOWPAYMENTS_API_KEY:
        return []

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            f"{_BASE}/full-currencies",
            headers=_headers(settings.NOWPAYMENTS_API_KEY),
        )
        if resp.status_code >= 400:
            raise RuntimeError(f"NowPayments GET /full-currencies -> {resp.status_code}: {resp.text[:300]}")
        raw = resp.json().get("currencies", [])

    out = [
        {
            "code": c["code"].lower(),
            "name": c.get("name") or c["code"],
            "network": c.get("network"),
            "wallet_regex": c.get("wallet_regex"),
            "extra_id_exists": bool(c.get("extra_id_exists")),
            "extra_id_regex": c.get("extra_id_regex"),
            "extra_id_optional": bool(c.get("extra_id_optional")),
            "logo_url": c.get("logo_url"),
        }
        for c in raw
        if c.get("available_for_payout") and c.get("enable")
    ]
    await redis.setex(key_payout_currencies(), _PAYOUT_CURRENCIES_TTL, json.dumps(out))
    return out


async def find_payout_currency(code: str) -> dict | None:
    """Retrouve une devise précise (par son code) dans la liste ci-dessus."""
    for c in await get_payout_currencies():
        if c["code"] == code.lower():
            return c
    return None


# ── Devises disponibles pour PAYER (côté client, achats) ───────────

_PAYMENT_CURRENCIES_TTL = 6 * 3600


async def get_payment_currencies() -> list[dict]:
    """
    Même principe que `get_payout_currencies` mais pour le sens inverse : les
    devises qu'un client peut utiliser pour PAYER (`available_for_payment`),
    pas celles utilisables pour un virement sortant. Liste réelle NowPayments,
    jamais maintenue à la main, mise en cache Redis 6h séparément.
    """
    cached = await redis.get(key_payment_currencies())
    if cached:
        return json.loads(cached)

    if not settings.NOWPAYMENTS_API_KEY:
        return []

    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get(
            f"{_BASE}/full-currencies",
            headers=_headers(settings.NOWPAYMENTS_API_KEY),
        )
        if resp.status_code >= 400:
            raise RuntimeError(f"NowPayments GET /full-currencies -> {resp.status_code}: {resp.text[:300]}")
        raw = resp.json().get("currencies", [])

    out = [
        {
            "code": c["code"].lower(),
            "name": c.get("name") or c["code"],
            "network": c.get("network"),
            "logo_url": c.get("logo_url"),
        }
        for c in raw
        if c.get("available_for_payment") and c.get("enable")
    ]
    await redis.setex(key_payment_currencies(), _PAYMENT_CURRENCIES_TTL, json.dumps(out))
    return out


async def get_min_amount(pay_currency: str) -> float:
    """
    Montant minimum réel (en équivalent usdtbsc, donc ~USD) pour qu'un
    paiement dans `pay_currency` soit accepté, sachant que `price_currency`
    reste toujours "usdtbsc" côté plateforme. Interrogé en direct (pas de
    cache — les taux/planchers peuvent varier), un seul appel par devise
    consultée par le client dans le sélecteur, pas un balayage de toutes les
    devises à chaque affichage (trop coûteux sur ~300 devises).
    """
    if not settings.NOWPAYMENTS_API_KEY:
        return 0.0
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(
            f"{_BASE}/min-amount",
            headers=_headers(settings.NOWPAYMENTS_API_KEY),
            params={"currency_from": "usdtbsc", "currency_to": pay_currency},
        )
        if resp.status_code >= 400:
            raise RuntimeError(f"NowPayments GET /min-amount -> {resp.status_code}: {resp.text[:300]}")
        return float(resp.json().get("min_amount", 0.0))


# ── Payout (versement sortant vers affiliés) ─────────────────────

async def send_payout(
    *,
    withdrawals: list[dict],  # [{"address": "0xabc...", "amount": 10.50, "currency": "usdtbsc", "ipn_callback_url": "...", "extra_id": "..."}]
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


async def get_payout_status(batch_withdrawal_id: str) -> dict:
    """
    Consulte l'état réel d'un batch de payout. Indispensable pour confirmer
    qu'un virement a vraiment abouti : `send_payout`/`verify_payout` ne
    renvoient qu'un HTTP 200 de confirmation de la demande, jamais une
    garantie que l'argent est parti — NowPayments peut encore rejeter le
    virement après coup (silencieusement, `error: null`) lors d'un contrôle
    asynchrone. Ne jamais marquer un paiement "payé" côté plateforme sans
    être passé par ce statut et avoir vu `status == "FINISHED"` avec un hash
    non nul (voir historique 2026-07-24).
    """
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(
            f"{_PAYOUT_BASE}/payout/{batch_withdrawal_id}",
            headers=await _payout_headers(),
        )
        if resp.status_code >= 400:
            raise RuntimeError(f"NowPayments GET /payout/{batch_withdrawal_id} -> {resp.status_code}: {resp.text[:300]}")
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
        # Contrairement aux autres endpoints, /verify répond en text/plain
        # ("OK") et non en JSON quand la confirmation est acceptée.
        try:
            return resp.json()
        except ValueError:
            return {"raw": resp.text}


async def send_single_payout(
    *,
    wallet_address: str,
    amount_usd: float,
    currency: str = "usdtbsc",
    extra_id: str | None = None,
) -> dict:
    """
    Envoie un paiement à un seul wallet sur la devise/réseau choisi par le
    membre (`currency`, code NowPayments), puis confirme immédiatement via
    le 2FA automatique (TOTP) — un seul appel de haut niveau qui couvre tout
    le cycle création + vérification.

    Ne JAMAIS envoyer `extra_id` pour un réseau qui n'en a pas besoin (ex:
    BEP20/USDT-BSC) : le renseigner fait échouer le virement en silence —
    NowPayments répond quand même HTTP 200 à la création et à la
    vérification 2FA, mais le withdrawal finit en status "REJECTED" sans
    aucun message d'erreur (`error: null`). Confirmé le 2026-07-24 : un appel
    identique sans extra_id passe en WAITING → SENDING normalement. C'est
    pourquoi `extra_id` n'est envoyé ici que s'il est explicitement fourni
    (l'appelant doit se baser sur `extra_id_exists` de `get_payout_currencies`
    pour décider de le passer ou non). Le tracking se fait via le
    batch_withdrawal_id stocké dans `payout_reference`, pas via extra_id.
    """
    withdrawal: dict[str, Any] = {
        "address": wallet_address,
        "amount": round(amount_usd, 2),
        "currency": currency,
    }
    if extra_id:
        withdrawal["extra_id"] = extra_id

    created = await send_payout(withdrawals=[withdrawal])
    batch_withdrawal_id = str(created.get("id") or created.get("batch_withdrawal_id") or "")
    if not batch_withdrawal_id:
        raise RuntimeError("NowPayments payout: id absent de la réponse de création.")

    await verify_payout(batch_withdrawal_id)
    return created
