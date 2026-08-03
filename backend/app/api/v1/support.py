"""
Tenant-facing support ticket system.
Each tenant can open tickets, send messages, and close their tickets.
All tenant messages are auto-translated to English for the admin.
All admin replies are auto-translated to the tenant's language.
Push notifications are sent on every new message.
"""
import uuid
import asyncio
from datetime import datetime
from fastapi import APIRouter, Query, UploadFile, File
from pydantic import BaseModel
from sqlalchemy import select, func, desc, update

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.support_ticket import SupportTicket, SupportMessage, TicketStatus, TicketPriority
from app.models.tenant_user import TenantUser
from app.models.user import User
from app.models.enums import UserRole
from app.services.ai_service import translate_text
from app.services.push_service import send_push_to_user

router = APIRouter(prefix="/tenants/{tenant_id}/support", tags=["support"])


async def _require_tenant_access(payload: TokenPayload, db: DBSession, tenant_id: str) -> TenantUser:
    user_id = uuid.UUID(payload["sub"])
    tid = uuid.UUID(tenant_id)
    result = await db.execute(
        select(TenantUser).where(
            TenantUser.user_id == user_id,
            TenantUser.tenant_id == tid,
        )
    )
    tu = result.scalar_one_or_none()
    if not tu:
        raise ForbiddenException("Access denied.")
    return tu


def _ticket_dict(t: SupportTicket, last_message: str | None = None, unread: int = 0) -> dict:
    return {
        "id": str(t.id),
        "subject": t.subject,
        "status": t.status.value,
        "priority": t.priority.value,
        "tenant_language": t.tenant_language,
        "created_at": t.created_at.isoformat() if t.created_at else None,
        "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
        "last_message": last_message,
        "unread": unread,
    }


def _msg_dict(m: SupportMessage, sender_name: str | None = None) -> dict:
    return {
        "id": str(m.id),
        "ticket_id": str(m.ticket_id),
        "is_from_admin": m.is_from_admin,
        "body_original": m.body_original,
        "body_translated": m.body_translated,
        "sender_name": sender_name,
        "file_url": m.file_url,
        "file_name": m.file_name,
        "file_type": m.file_type,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


async def _push_super_admins(db: DBSession, title: str, body: str, url: str) -> None:
    """Send push notification to all super admins."""
    try:
        result = await db.execute(select(User).where(User.is_super_admin == True))
        admins = result.scalars().all()
        tasks = [send_push_to_user(db, admin.id, title, body, url) for admin in admins]
        await asyncio.gather(*tasks, return_exceptions=True)
    except Exception:
        pass


# ─── List tickets ─────────────────────────────────────────────────

@router.get("/tickets")
async def list_tickets(
    tenant_id: str,
    payload: TokenPayload,
    db: DBSession,
    status: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    await _require_tenant_access(payload, db, tenant_id)
    tid = uuid.UUID(tenant_id)

    q = select(SupportTicket).where(SupportTicket.tenant_id == tid)
    if status:
        q = q.where(SupportTicket.status == status)
    q = q.order_by(desc(SupportTicket.updated_at)).limit(limit).offset(offset)

    result = await db.execute(q)
    tickets = result.scalars().all()

    total_r = await db.execute(
        select(func.count()).select_from(SupportTicket).where(SupportTicket.tenant_id == tid)
    )
    total = total_r.scalar() or 0

    return {"tickets": [_ticket_dict(t) for t in tickets], "total": total}


# ─── Create ticket ────────────────────────────────────────────────

class CreateTicketBody(BaseModel):
    subject: str
    first_message: str
    priority: str = "normal"
    language: str = "en"


@router.post("/tickets", status_code=201)
async def create_ticket(
    tenant_id: str,
    body: CreateTicketBody,
    payload: TokenPayload,
    db: DBSession,
):
    tu = await _require_tenant_access(payload, db, tenant_id)
    tid = uuid.UUID(tenant_id)
    user_id = uuid.UUID(payload["sub"])

    try:
        priority = TicketPriority(body.priority)
    except ValueError:
        priority = TicketPriority.normal

    ticket = SupportTicket(
        tenant_id=tid,
        opened_by=user_id,
        subject=body.subject.strip()[:255],
        priority=priority,
        tenant_language=body.language or "en",
    )
    db.add(ticket)
    await db.flush()

    # First message
    translated = await translate_text(body.first_message, "en")
    msg = SupportMessage(
        ticket_id=ticket.id,
        sender_id=user_id,
        is_from_admin=False,
        body_original=body.first_message,
        body_translated=translated,
    )
    db.add(msg)
    await db.commit()

    # Push admins
    user_r = await db.execute(select(User).where(User.id == user_id))
    sender = user_r.scalar_one_or_none()
    sender_name = sender.display_name if sender else "A tenant"
    await _push_super_admins(
        db,
        title="🎫 New support ticket",
        body=f"{sender_name}: {body.subject}",
        url=f"/superadmin/support/{ticket.id}",
    )
    try:
        from app.services.notification_service import notify_super_admins
        await notify_super_admins(
            db, type="warning", category="support",
            title="New support ticket",
            body=f"{sender_name}: {body.subject}",
            action_url=f"/superadmin/support/{ticket.id}",
        )
        await db.commit()
    except Exception:
        pass

    return _ticket_dict(ticket)


# ─── Get ticket + messages ────────────────────────────────────────

@router.get("/tickets/{ticket_id}")
async def get_ticket(
    tenant_id: str,
    ticket_id: str,
    payload: TokenPayload,
    db: DBSession,
):
    await _require_tenant_access(payload, db, tenant_id)
    tid = uuid.UUID(tenant_id)
    tkid = uuid.UUID(ticket_id)

    result = await db.execute(
        select(SupportTicket).where(SupportTicket.id == tkid, SupportTicket.tenant_id == tid)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise NotFoundException("Ticket not found.")

    msgs_r = await db.execute(
        select(SupportMessage).where(SupportMessage.ticket_id == tkid)
        .order_by(SupportMessage.created_at.asc())
    )
    messages = msgs_r.scalars().all()

    return {
        "ticket": _ticket_dict(ticket),
        "messages": [_msg_dict(m) for m in messages],
    }


# ─── Send message ─────────────────────────────────────────────────

class SendMessageBody(BaseModel):
    body: str = ""
    file_url: str | None = None
    file_name: str | None = None
    file_type: str | None = None


# ─── Upload fichier support (tenant) ──────────────────────────────

@router.post("/upload")
async def upload_support_file(
    tenant_id: str,
    payload: TokenPayload,
    db: DBSession,
    file: UploadFile = File(...),
):
    await _require_tenant_access(payload, db, tenant_id)
    from app.services.cloudinary_service import upload_file as cld_upload
    result = await cld_upload(file, tenant_id, folder_prefix="smarterbloggers/support")
    return {
        "url": result["secure_url"],
        "name": result["original_filename"],
        "type": file.content_type,
    }


@router.post("/tickets/{ticket_id}/messages", status_code=201)
async def send_message(
    tenant_id: str,
    ticket_id: str,
    body: SendMessageBody,
    payload: TokenPayload,
    db: DBSession,
):
    from app.core.exceptions import ValidationException
    if not body.body.strip() and not body.file_url:
        raise ValidationException("A message or a file is required.")

    await _require_tenant_access(payload, db, tenant_id)
    tid = uuid.UUID(tenant_id)
    tkid = uuid.UUID(ticket_id)
    user_id = uuid.UUID(payload["sub"])

    result = await db.execute(
        select(SupportTicket).where(SupportTicket.id == tkid, SupportTicket.tenant_id == tid)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise NotFoundException("Ticket not found.")
    if ticket.status in (TicketStatus.resolved, TicketStatus.closed):
        ticket.status = TicketStatus.open

    text_body = body.body.strip()
    translated = await translate_text(text_body, "en") if text_body else ""
    msg = SupportMessage(
        ticket_id=tkid,
        sender_id=user_id,
        is_from_admin=False,
        body_original=text_body,
        body_translated=translated,
        file_url=body.file_url,
        file_name=body.file_name,
        file_type=body.file_type,
    )
    db.add(msg)
    ticket.updated_at = datetime.utcnow()
    await db.commit()

    push_body = text_body[:120] if text_body else f"📎 {body.file_name or 'File'}"
    await _push_super_admins(
        db,
        title=f"💬 Reply on: {ticket.subject}",
        body=push_body,
        url=f"/superadmin/support/{ticket_id}",
    )
    try:
        from app.services.notification_service import notify_super_admins
        await notify_super_admins(
            db, type="info", category="support",
            title=f"Reply on: {ticket.subject}",
            body=push_body,
            action_url=f"/superadmin/support/{ticket_id}",
        )
        await db.commit()
    except Exception:
        pass

    return _msg_dict(msg)


# ─── Close ticket ─────────────────────────────────────────────────

@router.patch("/tickets/{ticket_id}/close")
async def close_ticket(
    tenant_id: str,
    ticket_id: str,
    payload: TokenPayload,
    db: DBSession,
):
    await _require_tenant_access(payload, db, tenant_id)
    tid = uuid.UUID(tenant_id)
    tkid = uuid.UUID(ticket_id)

    result = await db.execute(
        select(SupportTicket).where(SupportTicket.id == tkid, SupportTicket.tenant_id == tid)
    )
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise NotFoundException("Ticket not found.")

    ticket.status = TicketStatus.closed
    ticket.resolved_at = datetime.utcnow()
    await db.commit()

    try:
        from app.services.notification_service import notify_super_admins
        await notify_super_admins(
            db, type="info", category="support",
            title="Support ticket closed by tenant",
            body=ticket.subject,
            action_url="/superadmin/support",
        )
        await db.commit()
    except Exception:
        pass

    return {"ok": True, "status": ticket.status.value}
