import uuid
from datetime import datetime
from fastapi import APIRouter
from sqlalchemy import select
from pydantic import BaseModel

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import NotFoundException, ValidationException
from app.models.push import PushToken, PushNotification
from app.models.enums import UserRole
from app.api.v1.tenants import _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/push", tags=["push"])


class RegisterTokenRequest(BaseModel):
    token: str
    platform: str = "web"  # web | ios | android


class SendNotificationRequest(BaseModel):
    title: str
    body: str
    icon_url: str | None = None
    click_url: str | None = None
    image_url: str | None = None
    article_id: str | None = None
    data: dict | None = None


class NotificationResponse(BaseModel):
    id: str
    title: str
    body: str
    sent_count: int
    failed_count: int
    clicked_count: int
    created_at: datetime


# ── Enregistrement token (depuis le navigateur/app) ───────────────

@router.post("/register", status_code=201)
async def register_token(
    tenant_id: uuid.UUID,
    body: RegisterTokenRequest,
    payload: TokenPayload,
    db: DBSession,
):
    user_id = uuid.UUID(payload["sub"])

    # Upsert : un même token ne doit pas être dupliqué
    existing = await db.execute(
        select(PushToken).where(
            PushToken.tenant_id == tenant_id,
            PushToken.token == body.token,
        )
    )
    pt = existing.scalar_one_or_none()
    if pt:
        pt.is_active = True
        pt.user_id = user_id
        pt.last_used_at = datetime.utcnow()
    else:
        pt = PushToken(
            tenant_id=tenant_id,
            user_id=user_id,
            token=body.token,
            platform=body.platform,
        )
        db.add(pt)

    await db.commit()
    return {"message": "Token enregistré."}


@router.delete("/unregister", status_code=204)
async def unregister_token(
    tenant_id: uuid.UUID,
    token: str,
    payload: TokenPayload,
    db: DBSession,
):
    result = await db.execute(
        select(PushToken).where(
            PushToken.tenant_id == tenant_id,
            PushToken.token == token,
            PushToken.user_id == uuid.UUID(payload["sub"]),
        )
    )
    pt = result.scalar_one_or_none()
    if pt:
        pt.is_active = False
        await db.commit()


# ── Envoi d'une notification ──────────────────────────────────────

@router.post("/send", response_model=NotificationResponse, status_code=201)
async def send_notification(
    tenant_id: uuid.UUID,
    body: SendNotificationRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)

    # Récupérer tous les tokens actifs du tenant
    tokens_result = await db.execute(
        select(PushToken).where(
            PushToken.tenant_id == tenant_id,
            PushToken.is_active == True,
        )
    )
    tokens = [pt.token for pt in tokens_result.scalars().all()]

    notif = PushNotification(
        tenant_id=tenant_id,
        created_by=uuid.UUID(payload["sub"]),
        title=body.title,
        body=body.body,
        icon_url=body.icon_url,
        click_url=body.click_url,
        image_url=body.image_url,
        article_id=uuid.UUID(body.article_id) if body.article_id else None,
        data=body.data,
    )
    db.add(notif)
    await db.flush()

    sent, failed = await _send_fcm(tokens, body, str(notif.id))
    notif.sent_count = sent
    notif.failed_count = failed
    await db.commit()
    await db.refresh(notif)

    return _notif_response(notif)


@router.get("", response_model=list[NotificationResponse])
async def list_notifications(
    tenant_id: uuid.UUID, payload: TokenPayload, db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.EDITOR)
    result = await db.execute(
        select(PushNotification)
        .where(PushNotification.tenant_id == tenant_id)
        .order_by(PushNotification.created_at.desc())
        .limit(50)
    )
    return [_notif_response(n) for n in result.scalars().all()]


# ── Firebase FCM ─────────────────────────────────────────────────

async def _send_fcm(tokens: list[str], body: SendNotificationRequest, notif_id: str) -> tuple[int, int]:
    """Envoi via Firebase Admin SDK — batch de 500 tokens max par appel."""
    if not tokens:
        return 0, 0

    try:
        from firebase_admin import messaging
        from app.services.firebase_service import get_firebase_app
        get_firebase_app()

        message_data = {k: str(v) for k, v in (body.data or {}).items()}
        message_data["notification_id"] = notif_id
        if body.click_url:
            message_data["click_url"] = body.click_url

        sent_total, failed_total = 0, 0
        for i in range(0, len(tokens), 500):
            batch = tokens[i:i+500]
            multicast = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=body.title,
                    body=body.body,
                    image=body.image_url,
                ),
                data=message_data,
                tokens=batch,
                webpush=messaging.WebpushConfig(
                    fcm_options=messaging.WebpushFCMOptions(
                        link=body.click_url or "",
                    )
                ) if body.click_url else None,
            )
            response = messaging.send_each_for_multicast(multicast)
            sent_total += response.success_count
            failed_total += response.failure_count

        return sent_total, failed_total
    except Exception:
        return 0, len(tokens)


def _notif_response(n: PushNotification) -> NotificationResponse:
    return NotificationResponse(
        id=str(n.id),
        title=n.title,
        body=n.body,
        sent_count=n.sent_count,
        failed_count=n.failed_count,
        clicked_count=n.clicked_count,
        created_at=n.created_at,
    )
