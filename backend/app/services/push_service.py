"""
Service Web Push (VAPID) — notifications push navigateur.

pywebpush 2.x : vapid_private_key doit être un objet Vapid, pas une string.
On importe Vapid depuis py_vapid (dépendance de pywebpush). Si indisponible,
on passe par un fichier PEM temporaire (fallback).
"""
import json
import logging
import os
import tempfile
from typing import Union

from pywebpush import webpush, WebPushException
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    from py_vapid import Vapid as _Vapid
    def _get_vapid_key():
        return _Vapid.from_pem(settings.VAPID_PRIVATE_KEY.encode())
except ImportError:
    logger.warning("py_vapid non disponible, fallback via fichier PEM temporaire")
    def _get_vapid_key() -> str:  # type: ignore[misc]
        """Écrit le PEM dans un fichier temp et retourne le chemin."""
        fd, path = tempfile.mkstemp(suffix=".pem")
        try:
            with os.fdopen(fd, "w") as f:
                f.write(settings.VAPID_PRIVATE_KEY)
        except Exception:
            os.unlink(path)
            raise
        return path


async def send_push(
    subscription_info: dict,
    title: str,
    body: str,
    url: str = "/",
    icon: str = "/icon-192.png",
) -> bool:
    """
    Envoie une notification push à un abonnement.
    Retourne False si l'abonnement est expiré/invalide (à supprimer côté appelant).
    """
    if not settings.VAPID_PRIVATE_KEY:
        return True

    payload = json.dumps({"title": title, "body": body, "url": url, "icon": icon})
    vapid_key = _get_vapid_key()
    tmp_path  = vapid_key if isinstance(vapid_key, str) else None
    try:
        webpush(
            subscription_info=subscription_info,
            data=payload,
            vapid_private_key=vapid_key,
            vapid_claims={"sub": settings.VAPID_CLAIMS_EMAIL},
        )
        return True
    except WebPushException as e:
        if e.response and e.response.status_code in (404, 410):
            return False  # Abonnement expiré
        logger.warning("Push failed: %s", e)
        return True
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


async def send_push_to_user(db, user_id, title: str, body: str, url: str = "/") -> None:
    """Envoie une push à tous les abonnements actifs d'un utilisateur."""
    from sqlalchemy import select, delete
    from app.models.push_subscription import PushSubscription

    result = await db.execute(
        select(PushSubscription).where(PushSubscription.user_id == user_id)
    )
    subs = result.scalars().all()

    expired_ids = []
    for sub in subs:
        ok = await send_push(
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            title=title,
            body=body,
            url=url,
        )
        if not ok:
            expired_ids.append(sub.id)

    if expired_ids:
        await db.execute(
            delete(PushSubscription).where(PushSubscription.id.in_(expired_ids))
        )
        await db.commit()
