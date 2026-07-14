"""
Service de journalisation d'activité.
log_event() est fire-and-forget : il ne lève jamais d'exception.
"""
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text


async def log_event(
    db: AsyncSession,
    action: str,
    *,
    actor_id: uuid.UUID | None = None,
    actor_email: str | None = None,
    level: str = "info",
    target_type: str | None = None,
    target_id: str | None = None,
    details: str | None = None,
    ip: str | None = None,
) -> None:
    """
    Écrit une entrée dans activity_logs.
    Silencieux en cas d'erreur — les échecs de log ne doivent jamais
    interrompre la logique métier.
    """
    try:
        await db.execute(
            text("""
                INSERT INTO activity_logs
                    (level, action, actor_id, actor_email,
                     target_type, target_id, details, ip)
                VALUES
                    (:level, :action, :actor_id, :actor_email,
                     :target_type, :target_id, :details, :ip)
            """),
            {
                "level":       level,
                "action":      action,
                "actor_id":    actor_id,
                "actor_email": actor_email,
                "target_type": target_type,
                "target_id":   str(target_id) if target_id else None,
                "details":     details,
                "ip":          ip,
            },
        )
        await db.commit()
    except Exception:
        pass
