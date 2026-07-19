"""Factory registrar — point d'entrée unique pour tout le reste de
l'application. N'importer OpenProviderRegistrar (ou un futur provider)
nulle part ailleurs que dans ce fichier."""
from __future__ import annotations

from app.core.config import settings
from app.services.registrars.base import DomainRegistrarProvider

_PROVIDERS: dict[str, type[DomainRegistrarProvider]] = {}


def _load_providers() -> None:
    if _PROVIDERS:
        return
    from app.services.registrars.openprovider import OpenProviderRegistrar
    _PROVIDERS["openprovider"] = OpenProviderRegistrar


def get_registrar(name: str | None = None) -> DomainRegistrarProvider:
    _load_providers()
    key = (name or settings.DEFAULT_DOMAIN_REGISTRAR).lower()
    provider_cls = _PROVIDERS.get(key)
    if not provider_cls:
        raise ValueError(f"Registrar inconnu: {key}")
    return provider_cls()
