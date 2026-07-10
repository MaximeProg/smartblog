"""Point d'entrée du worker ARQ NexusBlog.

Lancer avec :
    arq backend.worker.WorkerSettings

En développement :
    cd backend && arq worker.WorkerSettings
"""
from app.workers.settings import WorkerSettings

__all__ = ["WorkerSettings"]
