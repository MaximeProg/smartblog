"""Provider OpenProvider — API REST v1beta (https://developers.openprovider.com/).

Auth par token Bearer obtenu via POST /v1beta/auth/login (username+password),
mis en cache en mémoire process avec sa date d'expiration, ré-authentification
automatique sur expiration ou 401.

NOTE IMPORTANTE : les endpoints check/auth sont documentés et stables. Les
endpoints register/renew/dns-zone/get-info REST exacts (noms de champs,
structure de la charge utile registrant) doivent être re-vérifiés contre le
sandbox OpenProvider une fois un compte reseller créé (voir plan — aucun
compte disponible au moment de l'écriture de ce code). Les chemins ci-dessous
suivent la convention REST documentée par OpenProvider mais n'ont pas encore
été exécutés contre une vraie réponse serveur.
"""
from __future__ import annotations

import asyncio
import time

import httpx

from app.core.config import settings
from app.services.registrars.base import (
    DomainAvailability,
    DomainInfo,
    DomainRegistrarProvider,
    DomainRegistrationResult,
    RegistrarError,
)

_PROD_BASE = "https://api.openprovider.eu/v1beta"
_SANDBOX_BASE = "http://api.sandbox.openprovider.nl:8480/v1beta"

# Cache de token en mémoire process — un seul reseller account, pas besoin de
# le partager entre workers via Redis pour la V1.
_token_cache: dict[str, float | str | None] = {"token": None, "expires_at": 0.0}
_token_lock = asyncio.Lock()


class OpenProviderRegistrar(DomainRegistrarProvider):
    name = "openprovider"

    def __init__(self) -> None:
        self._base = _SANDBOX_BASE if settings.OPENPROVIDER_SANDBOX else _PROD_BASE

    # ── Auth ────────────────────────────────────────────────────────

    async def _login(self) -> str:
        if not settings.OPENPROVIDER_USERNAME or not settings.OPENPROVIDER_PASSWORD:
            raise RegistrarError("OpenProvider non configuré (username/password manquants).")
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{self._base}/auth/login",
                json={
                    "username": settings.OPENPROVIDER_USERNAME,
                    "password": settings.OPENPROVIDER_PASSWORD,
                },
            )
        if resp.status_code != 200:
            raise RegistrarError(f"OpenProvider login échoué ({resp.status_code}): {resp.text[:200]}")
        data = resp.json()
        token = data.get("data", {}).get("token") or data.get("token")
        if not token:
            raise RegistrarError("OpenProvider login: token absent de la réponse.")
        return token

    async def _get_token(self) -> str:
        async with _token_lock:
            if _token_cache["token"] and time.time() < float(_token_cache["expires_at"] or 0):
                return str(_token_cache["token"])
            token = await self._login()
            # Pas de durée d'expiration exploitable retournée de façon fiable
            # par tous les endpoints — on force un relogin toutes les 50 min
            # par prudence (tokens OpenProvider valables ~1h en pratique).
            _token_cache["token"] = token
            _token_cache["expires_at"] = time.time() + 50 * 60
            return token

    async def _request(self, method: str, path: str, **kwargs) -> dict:
        token = await self._get_token()
        headers = {"Authorization": f"Bearer {token}"}
        async with httpx.AsyncClient(timeout=20.0) as client:
            resp = await client.request(method, f"{self._base}{path}", headers=headers, **kwargs)

        if resp.status_code == 401:
            # Token expiré/invalide côté serveur malgré notre cache — relogin unique puis retry.
            async with _token_lock:
                _token_cache["token"] = None
            token = await self._get_token()
            async with httpx.AsyncClient(timeout=20.0) as client:
                resp = await client.request(
                    method, f"{self._base}{path}",
                    headers={"Authorization": f"Bearer {token}"}, **kwargs,
                )

        if resp.status_code >= 400:
            raise RegistrarError(f"OpenProvider {method} {path} -> {resp.status_code}: {resp.text[:300]}")
        return resp.json()

    # ── Disponibilité + prix ──────────────────────────────────────────

    async def check_availability(self, domains: list[str]) -> list[DomainAvailability]:
        """Vérifié contre l'API réelle le 2026-07-19 : `data.results[].domain` est
        une chaîne complète ("nom.tld"), pas un objet {name, extension} — la
        doc REST publique ne le précise pas clairement. `with_price: true` est
        requis pour obtenir le prix ; sans lui, aucune clé `price` n'est
        renvoyée. Le prix de renouvellement n'est PAS inclus dans cette
        réponse (nécessiterait un second appel à /domains/prices?operation=renew
        par domaine — pas fait ici pour ne pas doubler la latence d'une
        recherche live ; renewal_price reste None pour l'instant)."""
        parsed = [d.split(".", 1) for d in domains]
        body = {
            "with_price": True,
            "domains": [{"name": name, "extension": ext} for name, ext in parsed],
        }
        data = await self._request("POST", "/domains/check", json=body)
        results = data.get("data", {}).get("results", [])

        out: list[DomainAvailability] = []
        for r in results:
            full_domain = r.get("domain", "")
            name, _, ext = full_domain.partition(".")
            status = (r.get("status") or "").lower()
            available = status == "free"
            price_info = r.get("price") or {}
            reseller = price_info.get("reseller") or price_info.get("product") or {}
            out.append(DomainAvailability(
                domain=full_domain,
                tld=ext,
                available=available,
                is_premium=bool(price_info.get("is_premium") or price_info.get("isPremium")),
                price=float(reseller["price"]) if reseller.get("price") is not None else None,
                renewal_price=None,
                currency=reseller.get("currency", "USD"),
            ))
        return out

    # ── Contact / customer handle ──────────────────────────────────
    #
    # OpenProvider n'accepte pas les infos de registrant directement inline
    # dans la création de domaine (contrairement à ce qu'on supposait) : il
    # faut d'abord créer un "customer handle" via POST /customers (structure
    # imbriquée : name.first_name/last_name, phone.country_code/area_code/
    # subscriber_number, address.street/number/...), puis référencer ce
    # handle en owner_handle/admin_handle/tech_handle sur /domains. Sans ça,
    # /domains renvoie "Invalid owner handle!" (code 331) — confirmé en
    # direct le 2026-07-22.

    @staticmethod
    def _split_phone(raw: str) -> dict:
        """'+2290190037993' -> {country_code: '+229', area_code: '', subscriber_number: '0190037993'}
        Le country_code OpenProvider inclut le signe '+' (confirmé sur leur
        doc officielle /customers, ex: "country_code": "+04"). Heuristique
        simple pour le split pays/reste : 3 chiffres après le +. À affiner si
        rejeté pour un pays donné (les indicatifs ne font pas tous 3 chiffres)."""
        digits = raw.strip().lstrip("+")
        country_code, rest = digits[:3], digits[3:]
        return {"country_code": f"+{country_code}", "area_code": "0", "subscriber_number": rest}

    @staticmethod
    def _split_name(full_name: str) -> dict:
        parts = full_name.strip().split(None, 1)
        if len(parts) == 2:
            last_name, first_name = parts[0], parts[1]
        else:
            last_name = first_name = full_name.strip()
        return {"first_name": first_name, "last_name": last_name, "full_name": full_name.strip()}

    async def _create_customer_handle(self, registrant_info: dict) -> str:
        street_and_number = str(registrant_info.get("street_number") or registrant_info.get("address") or "").strip()
        street, _, number = street_and_number.rpartition(" ")
        body = {
            "name": self._split_name(registrant_info.get("name", "")),
            "address": {
                "street": street or street_and_number,
                "number": number or "1",
                "city": registrant_info.get("city", ""),
                "zipcode": registrant_info.get("zipcode", ""),
                "state": registrant_info.get("state", ""),
                "country": registrant_info.get("country", ""),
            },
            "phone": self._split_phone(registrant_info.get("phone", "")),
            "email": registrant_info.get("email", ""),
        }
        data = await self._request("POST", "/customers", json=body)
        result = data.get("data", {})
        handle = result.get("handle")
        if not handle:
            raise RegistrarError("OpenProvider /customers: handle absent de la réponse.")
        return str(handle)

    # ── Enregistrement ─────────────────────────────────────────────

    # Nameservers par défaut OpenProvider — confirmé le 2026-07-23 : sans ce
    # champ, un domaine s'enregistre "ACT" (actif) côté registry mais sans
    # AUCUNE délégation DNS (ns_template_id: 0, aucun name_servers renvoyé),
    # ce qui cause un NXDOMAIN total — la zone DNS créée via configure_dns
    # n'a alors jamais aucune chance d'être interrogée par qui que ce soit.
    _DEFAULT_NAMESERVERS = ["ns1.openprovider.nl", "ns2.openprovider.be", "ns3.openprovider.eu"]

    async def register_domain(
        self, *, domain: str, years: int, registrant_info: dict, ns_override: list[str] | None = None,
    ) -> DomainRegistrationResult:
        name, ext = domain.split(".", 1)
        handle = await self._create_customer_handle(registrant_info)
        body = {
            "domain": {"name": name, "extension": ext},
            "period": years,
            "owner_handle": handle,
            "admin_handle": handle,
            "tech_handle": handle,
            "is_private_whois_enabled": settings.OPENPROVIDER_PRIVATE_WHOIS_ENABLED,
            "name_servers": [{"name": ns} for ns in (ns_override or self._DEFAULT_NAMESERVERS)],
        }

        data = await self._request("POST", "/domains", json=body)
        result = data.get("data", {})
        return DomainRegistrationResult(
            registrar_domain_id=str(result.get("id") or result.get("handle")),
            registrar_order_id=str(result.get("order_id")) if result.get("order_id") else None,
            expires_at=result.get("expiration_date", ""),
        )

    async def update_nameservers(self, *, registrar_domain_id: str, nameservers: list[str] | None = None) -> None:
        """Corrige un domaine déjà enregistré sans délégation DNS (voir note
        sur _DEFAULT_NAMESERVERS) — pas utilisé par le flux normal, seulement
        pour rattraper un domaine existant."""
        await self._request(
            "PUT", f"/domains/{registrar_domain_id}",
            json={"name_servers": [{"name": ns} for ns in (nameservers or self._DEFAULT_NAMESERVERS)]},
        )

    async def renew_domain(self, *, registrar_domain_id: str, years: int) -> DomainRegistrationResult:
        data = await self._request(
            "POST", f"/domains/{registrar_domain_id}/renew", json={"period": years},
        )
        result = data.get("data", {})
        return DomainRegistrationResult(
            registrar_domain_id=registrar_domain_id,
            registrar_order_id=str(result.get("order_id")) if result.get("order_id") else None,
            expires_at=result.get("expiration_date", ""),
        )

    async def get_domain_info(self, registrar_domain_id: str) -> DomainInfo:
        data = await self._request("GET", f"/domains/{registrar_domain_id}")
        result = data.get("data", {})
        return DomainInfo(
            registrar_domain_id=registrar_domain_id,
            status=result.get("status", "unknown"),
            expires_at=result.get("expiration_date"),
            auto_renew=result.get("is_auto_renew"),
        )

    async def configure_dns(self, *, domain: str, records: list[dict] | None = None, template_name: str | None = None) -> None:
        """Chemin réel confirmé le 2026-07-23 : /dns/zones/{domain} (avec un
        slash, pas /dns-zones/ — la version hyphénée renvoie 501 "Method is
        not implemented"). Une zone n'est PAS créée automatiquement à
        l'enregistrement du domaine (confirmé : GET renvoie "Zone specified
        is not found", code 872) — il faut donc la créer (POST /dns/zones,
        records à plat) plutôt que la modifier (PUT, records.add) si elle
        n'existe pas encore.

        `template_name` (ex: settings.OPENPROVIDER_DNS_TEMPLATE_NAME) évite de
        renvoyer les mêmes enregistrements à chaque nouveau domaine — un
        template DNS réutilisable, créé une fois sur le compte (POST
        /dns/templates), est référencé à la création de zone. N'a d'effet
        que sur la CRÉATION d'une nouvelle zone, pas sa modification."""
        name, _, extension = domain.partition(".")
        try:
            existing = await self._request("GET", f"/dns/zones/{domain}")
            zone_id = existing.get("data", {}).get("id")
        except RegistrarError:
            zone_id = None

        if zone_id is not None:
            # OpenProvider crée parfois la zone tout seul dès l'enregistrement
            # du domaine (constaté le 2026-07-27, contrairement à l'hypothèse
            # du 2026-07-23 selon laquelle elle n'existait jamais avant) — dans
            # ce cas `template_name` (qui ne s'applique qu'à la CRÉATION d'une
            # zone) est inopérant, donc `records` doit être fourni explicitement
            # par l'appelant pour ne pas se retrouver avec une zone vide (bug
            # réel trouvé le 2026-07-27 : digitalshoppingmall.blog enregistré
            # sans aucun enregistrement A/CNAME car l'appelant ne passait que
            # template_name, jamais records).
            flat_records = [
                # OpenProvider attend une chaîne vide "" pour l'enregistrement
                # racine — "@" (convention courante ailleurs, ex: Cloudflare)
                # est rejeté avec "Invalid A record" (confirmé le 2026-07-23).
                {"name": "" if r.get("name") in (None, "@") else r["name"], "ttl": str(r.get("ttl", 3600)), "type": r["type"], "value": r["value"]}
                for r in (records or [])
            ]
            await self._request(
                "PUT", f"/dns/zones/{domain}",
                json={
                    "id": zone_id,
                    "name": domain,
                    "records": {"add": flat_records},
                },
            )
        elif records:
            flat_records = [
                {"name": "" if r.get("name") in (None, "@") else r["name"], "ttl": str(r.get("ttl", 3600)), "type": r["type"], "value": r["value"]}
                for r in records
            ]
            await self._request(
                "POST", "/dns/zones",
                json={
                    "domain": {"name": name, "extension": extension},
                    "type": "master",
                    "records": flat_records,
                },
            )
        elif template_name:
            await self._request(
                "POST", "/dns/zones",
                json={
                    "domain": {"name": name, "extension": extension},
                    "type": "master",
                    "template_name": template_name,
                },
            )
        else:
            flat_records = [
                {"name": "" if r.get("name") in (None, "@") else r["name"], "ttl": str(r.get("ttl", 3600)), "type": r["type"], "value": r["value"]}
                for r in (records or [])
            ]
            await self._request(
                "POST", "/dns/zones",
                json={
                    "domain": {"name": name, "extension": extension},
                    "type": "master",
                    "records": flat_records,
                },
            )

    async def get_renewal_price(self, *, domain: str, years: int) -> tuple[float, str]:
        """Vérifié contre l'API réelle le 2026-07-19 : GET /domains/prices
        avec operation=renew — endpoint séparé de /domains/check, jamais
        renvoyé en masse (une requête par domaine, appelée seulement au
        moment du checkout, jamais pendant la recherche live)."""
        name, _, ext = domain.partition(".")
        data = await self._request(
            "GET", "/domains/prices",
            params={"domain.name": name, "domain.extension": ext, "operation": "renew", "period": years},
        )
        price_info = data.get("data", {}).get("price", {})
        reseller = price_info.get("reseller") or price_info.get("product") or {}
        if reseller.get("price") is None:
            raise RegistrarError(f"Prix de renouvellement indisponible pour {domain}.")
        return float(reseller["price"]), reseller.get("currency", "USD")
