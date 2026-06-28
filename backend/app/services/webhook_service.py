"""
Service webhooks — envoi signé HMAC-SHA256, retry 3x avec backoff.
"""
import hashlib
import hmac
import json
import time
import uuid
import httpx
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.webhook import WebhookEndpoint, WebhookDelivery

# Événements supportés
SUPPORTED_EVENTS = [
    "article.published",
    "article.unpublished",
    "article.deleted",
    "comment.created",
    "comment.approved",
    "newsletter.subscribed",
    "newsletter.unsubscribed",
    "payment.completed",
    "payment.refunded",
    "member.invited",
    "member.joined",
]


def _sign_payload(secret: str, payload_bytes: bytes) -> str:
    return "sha256=" + hmac.new(
        secret.encode(), payload_bytes, hashlib.sha256
    ).hexdigest()


async def dispatch_event(
    db: AsyncSession,
    tenant_id: uuid.UUID,
    event: str,
    data: dict,
) -> None:
    """Envoie l'événement à tous les endpoints actifs du tenant abonnés à cet event."""
    result = await db.execute(
        select(WebhookEndpoint).where(
            WebhookEndpoint.tenant_id == tenant_id,
            WebhookEndpoint.is_active == True,
        )
    )
    endpoints = [ep for ep in result.scalars().all() if event in ep.events]
    if not endpoints:
        return

    payload = {
        "id": str(uuid.uuid4()),
        "event": event,
        "tenant_id": str(tenant_id),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": data,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode()

    for ep in endpoints:
        await _deliver(db, ep, event, payload, payload_bytes)


async def _deliver(
    db: AsyncSession,
    ep: WebhookEndpoint,
    event: str,
    payload: dict,
    payload_bytes: bytes,
) -> None:
    signature = _sign_payload(ep.secret, payload_bytes)
    headers = {
        "Content-Type": "application/json",
        "X-NexusBlog-Event": event,
        "X-NexusBlog-Signature": signature,
        "X-NexusBlog-Delivery": str(uuid.uuid4()),
        "User-Agent": "NexusBlog-Webhooks/1.0",
    }

    success = False
    status_code = None
    response_body = None
    duration_ms = None

    for attempt in range(1, 4):
        start = time.monotonic()
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(ep.url, content=payload_bytes, headers=headers)
            duration_ms = int((time.monotonic() - start) * 1000)
            status_code = resp.status_code
            response_body = resp.text[:500]
            success = 200 <= resp.status_code < 300
            if success:
                break
        except Exception as e:
            duration_ms = int((time.monotonic() - start) * 1000)
            response_body = str(e)[:500]

        if attempt < 3:
            import asyncio
            await asyncio.sleep(2 ** attempt)  # backoff : 2s, 4s

    delivery = WebhookDelivery(
        endpoint_id=ep.id,
        event=event,
        payload=payload,
        status_code=status_code,
        response_body=response_body,
        duration_ms=duration_ms,
        success=success,
        attempt=attempt,
    )
    db.add(delivery)
    await db.commit()
