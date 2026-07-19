"""Abstraction registrar de domaines — aucun code appelant (routes, jobs ARQ)
ne doit importer un provider concret directement, toujours via registry.get_registrar().
Permet d'ajouter ResellerClub/OpenSRS/Enom plus tard sans toucher au reste
de l'application."""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


class RegistrarError(Exception):
    """Erreur générique remontée par un provider registrar — les appelants ne
    doivent jamais dépendre d'une exception spécifique à un provider."""


@dataclass
class DomainAvailability:
    domain: str            # nom complet, ex: "monblog.com"
    tld: str                # ex: "com"
    available: bool
    is_premium: bool
    price: float | None     # prix d'enregistrement (coût registrar, sans marge), None si indisponible
    renewal_price: float | None
    currency: str


@dataclass
class DomainRegistrationResult:
    registrar_domain_id: str
    registrar_order_id: str | None
    expires_at: str  # ISO 8601 — parsé en datetime par l'appelant


@dataclass
class DomainInfo:
    registrar_domain_id: str
    status: str
    expires_at: str | None
    auto_renew: bool | None


class DomainRegistrarProvider(ABC):
    """Interface qu'un registrar concret (OpenProvider, ResellerClub, ...) doit
    implémenter. Toutes les méthodes sont async et lèvent RegistrarError en
    cas d'échec — jamais l'exception native du SDK/HTTP du provider."""

    name: str

    @abstractmethod
    async def check_availability(self, domains: list[str]) -> list[DomainAvailability]:
        """`domains` = noms complets avec extension, ex: ["monblog.com", "monblog.net"]."""

    @abstractmethod
    async def register_domain(
        self,
        *,
        domain: str,
        years: int,
        registrant_info: dict,
        ns_override: list[str] | None = None,
    ) -> DomainRegistrationResult:
        """Enregistre le domaine. `registrant_info` contient les coordonnées
        WHOIS obligatoires (name, email, phone, address, city, country, zipcode)."""

    @abstractmethod
    async def renew_domain(self, *, registrar_domain_id: str, years: int) -> DomainRegistrationResult:
        ...

    @abstractmethod
    async def get_domain_info(self, registrar_domain_id: str) -> DomainInfo:
        ...

    @abstractmethod
    async def get_renewal_price(self, *, domain: str, years: int) -> tuple[float, str]:
        """Retourne (prix, devise) pour un renouvellement — appel dédié car les
        registrars ne renvoient généralement pas ce prix dans l'appel de
        disponibilité en masse (coût registrar, sans marge)."""

    @abstractmethod
    async def configure_dns(self, *, domain: str, records: list[dict]) -> None:
        """`records` = [{"type": "CNAME", "name": "@", "value": "cname.vercel-dns.com"}, ...]."""
