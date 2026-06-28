import uuid
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.core.dependencies import TokenPayload, DBSession
from app.core.exceptions import (
    NotFoundException, ValidationException, PlanLimitReachedException,
)
from app.models.tenant_user import TenantUser, UserInvitation
from app.models.user import User
from app.models.enums import UserRole
from app.services.tenant_service import get_tenant, PLAN_LIMITS
from app.api.v1.tenants import _assert_role

router = APIRouter(prefix="/tenants/{tenant_id}/team", tags=["team"])


class InviteMemberRequest(BaseModel):
    email: EmailStr
    role: UserRole


class UpdateMemberRoleRequest(BaseModel):
    role: UserRole


class MemberResponse(BaseModel):
    id: str
    user_id: str
    email: str
    display_name: str | None
    avatar_url: str | None
    role: UserRole
    joined_at: datetime


class InvitationResponse(BaseModel):
    id: str
    email: str
    role: UserRole
    expires_at: datetime
    created_at: datetime


# ── GET /tenants/{tenant_id}/team ─────────────────────────────────

@router.get("", response_model=list[MemberResponse])
async def list_members(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.VIEWER)
    result = await db.execute(
        select(TenantUser, User)
        .join(User, User.id == TenantUser.user_id)
        .where(TenantUser.tenant_id == tenant_id)
        .order_by(TenantUser.joined_at)
    )
    return [
        MemberResponse(
            id=str(tu.id),
            user_id=str(u.id),
            email=u.email,
            display_name=u.display_name,
            avatar_url=u.avatar_url,
            role=tu.role,
            joined_at=tu.joined_at,
        )
        for tu, u in result.all()
    ]


# ── POST /tenants/{tenant_id}/team/invite ─────────────────────────

@router.post("/invite", response_model=InvitationResponse, status_code=201)
async def invite_member(
    tenant_id: uuid.UUID,
    body: InviteMemberRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)

    tenant = await get_tenant(db, tenant_id)
    authors_max = PLAN_LIMITS[tenant.plan].get("authors_max")
    if authors_max is not None and tenant.authors_count >= authors_max:
        raise PlanLimitReachedException("authors", authors_max)

    # Vérifier que l'email n'est pas déjà membre
    existing = await db.execute(select(User).where(User.email == body.email))
    user = existing.scalar_one_or_none()
    if user:
        already = await db.execute(
            select(TenantUser).where(
                TenantUser.tenant_id == tenant_id,
                TenantUser.user_id == user.id,
            )
        )
        if already.scalar_one_or_none():
            raise ValidationException(f"{body.email} est déjà membre de ce blog.")

    # Remplace une invitation en attente pour le même email
    old = await db.execute(
        select(UserInvitation).where(
            UserInvitation.tenant_id == tenant_id,
            UserInvitation.email == body.email,
            UserInvitation.accepted_at.is_(None),
        )
    )
    old_inv = old.scalar_one_or_none()
    if old_inv:
        await db.delete(old_inv)
        await db.flush()

    invitation = UserInvitation(
        tenant_id=tenant_id,
        email=body.email,
        role=body.role,
        token=secrets.token_urlsafe(32),
        invited_by=uuid.UUID(payload["sub"]),
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    # Envoi de l'email d'invitation
    try:
        inviter_result = await db.execute(select(User).where(User.id == uuid.UUID(payload["sub"])))
        inviter = inviter_result.scalar_one_or_none()
        inviter_name = inviter.display_name or inviter.email if inviter else "L'équipe"
        invite_url = f"https://{tenant.slug}.{settings.PLATFORM_DOMAIN}/accept-invite?token={invitation.token}"
        from app.services.email_service import send_team_invitation
        await send_team_invitation(
            to=body.email,
            tenant_name=tenant.name,
            inviter_name=inviter_name,
            role=body.role.value,
            invite_url=invite_url,
        )
    except Exception:
        pass  # Email non bloquant — l'invitation est créée même si Resend échoue

    return InvitationResponse(
        id=str(invitation.id),
        email=invitation.email,
        role=invitation.role,
        expires_at=invitation.expires_at,
        created_at=invitation.created_at,
    )


# ── POST /tenants/{tenant_id}/team/accept-invite ──────────────────

@router.post("/accept-invite")
async def accept_invite(
    tenant_id: uuid.UUID,
    token: str,
    payload: TokenPayload,
    db: DBSession,
):
    result = await db.execute(
        select(UserInvitation).where(
            UserInvitation.tenant_id == tenant_id,
            UserInvitation.token == token,
            UserInvitation.accepted_at.is_(None),
        )
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise NotFoundException("Invitation")
    if inv.expires_at < datetime.now(timezone.utc):
        raise ValidationException("Cette invitation a expiré.")

    db.add(TenantUser(
        tenant_id=tenant_id,
        user_id=uuid.UUID(payload["sub"]),
        role=inv.role,
        invited_by=inv.invited_by,
    ))
    inv.accepted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Invitation acceptée."}


# ── PATCH /tenants/{tenant_id}/team/{member_user_id} ─────────────

@router.patch("/{member_user_id}", response_model=MemberResponse)
async def update_member_role(
    tenant_id: uuid.UUID,
    member_user_id: uuid.UUID,
    body: UpdateMemberRoleRequest,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    if str(member_user_id) == payload["sub"]:
        raise ValidationException("Vous ne pouvez pas modifier votre propre rôle.")

    result = await db.execute(
        select(TenantUser, User)
        .join(User, User.id == TenantUser.user_id)
        .where(TenantUser.tenant_id == tenant_id, TenantUser.user_id == member_user_id)
    )
    row = result.first()
    if not row:
        raise NotFoundException("Membre")

    tu, user = row
    tu.role = body.role
    await db.commit()
    return MemberResponse(
        id=str(tu.id), user_id=str(user.id), email=user.email,
        display_name=user.display_name, avatar_url=user.avatar_url,
        role=tu.role, joined_at=tu.joined_at,
    )


# ── DELETE /tenants/{tenant_id}/team/{member_user_id} ────────────

@router.delete("/{member_user_id}", status_code=204)
async def remove_member(
    tenant_id: uuid.UUID,
    member_user_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    if str(member_user_id) == payload["sub"]:
        raise ValidationException("Vous ne pouvez pas vous retirer vous-même.")

    result = await db.execute(
        select(TenantUser).where(
            TenantUser.tenant_id == tenant_id,
            TenantUser.user_id == member_user_id,
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise NotFoundException("Membre")
    await db.delete(member)
    await db.commit()


# ── GET /tenants/{tenant_id}/team/invitations ─────────────────────

@router.get("/invitations", response_model=list[InvitationResponse])
async def list_invitations(
    tenant_id: uuid.UUID,
    payload: TokenPayload,
    db: DBSession,
):
    await _assert_role(db, tenant_id, uuid.UUID(payload["sub"]), payload, UserRole.TENANT_ADMIN)
    result = await db.execute(
        select(UserInvitation).where(
            UserInvitation.tenant_id == tenant_id,
            UserInvitation.accepted_at.is_(None),
            UserInvitation.expires_at > datetime.now(timezone.utc),
        ).order_by(UserInvitation.created_at.desc())
    )
    return [
        InvitationResponse(
            id=str(i.id), email=i.email, role=i.role,
            expires_at=i.expires_at, created_at=i.created_at,
        )
        for i in result.scalars().all()
    ]
