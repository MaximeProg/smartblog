"""
Centre de notifications persistant (2026-08-03) — une seule table sert les
utilisateurs et les super admins (un super admin est un `User` comme un
autre). Voir app/models/notification.py.

Contrat identique à _maybe_generate_invoice/_accrue_commission : n'échoue
jamais (try/except interne, log seulement) et ne fait qu'un `db.add(...)`
— jamais de commit, l'appelant commit avec le reste de sa transaction
métier. Une notification qui échoue à s'enregistrer ne doit jamais faire
échouer le paiement/l'action qui l'a déclenchée.
"""
from __future__ import annotations

import logging
import uuid

from sqlalchemy import select

from app.models.notification import Notification
from app.models.user import User

logger = logging.getLogger(__name__)


async def notify_user(
    db,
    user_id: uuid.UUID,
    *,
    type: str = "info",
    category: str,
    title: str,
    body: str,
    action_url: str | None = None,
) -> None:
    try:
        db.add(Notification(
            recipient_user_id=user_id,
            type=type,
            category=category,
            title=title,
            body=body,
            action_url=action_url,
        ))
    except Exception:
        logger.exception("notify_user failed: user_id=%s category=%s", user_id, category)


async def notify_super_admins(
    db,
    *,
    type: str = "info",
    category: str,
    title: str,
    body: str,
    action_url: str | None = None,
) -> None:
    """Fan-out à l'écriture : une ligne par super admin — même filtre que
    auth_service.py::_get_super_admin_emails."""
    try:
        result = await db.execute(select(User.id).where(User.is_super_admin == True))  # noqa: E712
        admin_ids = [row[0] for row in result.all()]
        for admin_id in admin_ids:
            db.add(Notification(
                recipient_user_id=admin_id,
                type=type,
                category=category,
                title=title,
                body=body,
                action_url=action_url,
            ))
    except Exception:
        logger.exception("notify_super_admins failed: category=%s", category)
