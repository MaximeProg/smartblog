"""Configuration ARQ Worker — fonctions et cron jobs."""
from arq import cron
from arq.connections import RedisSettings

from app.core.config import settings
from app.workers.tasks import (
    send_newsletter_campaign, auto_publish_scheduled,
    publish_to_social, auto_send_scheduled_newsletters,
    health_check_ping,
)


class WorkerSettings:
    functions = [send_newsletter_campaign, publish_to_social]
    cron_jobs = [
        cron(auto_publish_scheduled, second=0),              # toutes les 60 secondes
        cron(auto_send_scheduled_newsletters, second=30),    # décalé de 30s
        cron(health_check_ping, minute=set(range(0, 60, 5))),  # toutes les 5 minutes
    ]
    redis_settings = RedisSettings.from_dsn(settings.REDIS_URL)
    max_jobs = 10
    job_timeout = 300  # 5 min max par job
