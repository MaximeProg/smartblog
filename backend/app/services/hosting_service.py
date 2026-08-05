"""Provisioning automatique de l'hébergement d'un domaine client acheté —
vhost Apache + certificat SSL sur le VPS.

Contexte : register_purchased_domain (worker ARQ) gérait déjà l'enregistrement
du domaine chez le registrar (OpenProvider) et la config DNS côté registrar,
mais rien ne créait le vhost Apache ni le certificat SSL sur le VPS lui-même —
bug réel découvert le 2026-08-05 (businessfolio.blog enregistré et vérifié en
base, mais affichait le JSON brut de l'API en visitant le domaine, faute de
vhost dédié : Apache retombait sur son vhost par défaut). Les deux domaines
précédents fonctionnaient parce que leur vhost avait été créé manuellement.

Le worker tourne dans un conteneur Docker ; Apache/certbot tournent sur
l'hôte VPS. Le worker SSH vers l'hôte avec une clé dédiée, restreinte par
forced command dans authorized_keys (~/.ssh/authorized_keys sur le VPS) —
peu importe la commande envoyée par le client SSH, seul
scripts/ssh_provision_wrapper.sh tourne côté hôte, qui valide strictement le
nom de domaine (regex) avant d'appeler scripts/provision_domain_vhost.sh.
Jamais de shell arbitraire, même si la clé fuit."""

import asyncio
import re

import structlog

from app.core.config import settings

logger = structlog.get_logger()

_DOMAIN_RE = re.compile(r"^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$")


class HostingProvisioningError(Exception):
    pass


async def provision_domain_hosting(domain: str) -> str:
    """Crée le vhost Apache + certificat SSL pour `domain` sur le VPS
    (idempotent — sûr à rappeler pour un domaine déjà provisionné, ex. lors
    d'un retry ou d'une régénération de certificat).

    Ne lève JAMAIS silencieusement — l'appelant (register_purchased_domain)
    décide comment traiter l'échec (notification, log, statut de la
    commande), la même discipline que les autres effets secondaires non
    bloquants de ce worker (facture, notification)."""
    if not _DOMAIN_RE.match(domain):
        raise HostingProvisioningError(f"Invalid domain format: {domain!r}")

    proc = await asyncio.create_subprocess_exec(
        "ssh",
        "-i", settings.DOMAIN_PROVISIONING_SSH_KEY_PATH,
        "-o", "BatchMode=yes",
        "-o", "StrictHostKeyChecking=accept-new",
        "-o", "ConnectTimeout=15",
        f"{settings.DOMAIN_PROVISIONING_SSH_USER}@{settings.VPS_HOST_IP}",
        domain,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=120)
    output = stdout.decode(errors="replace")
    error_output = stderr.decode(errors="replace")

    if proc.returncode != 0 or "PROVISIONED:" not in output:
        logger.error("provision_domain_hosting failed", domain=domain, returncode=proc.returncode,
                     stdout=output[-2000:], stderr=error_output[-2000:])
        raise HostingProvisioningError(
            f"Hosting provisioning failed for {domain} (exit {proc.returncode}): {error_output[-500:] or output[-500:]}"
        )

    logger.info("provision_domain_hosting succeeded", domain=domain)
    return output
