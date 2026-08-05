#!/bin/bash
# Forced command invoqué par la clé SSH dédiée au provisioning de domaine
# (voir /home/deploy/.ssh/authorized_keys sur le VPS) — le client SSH ne peut
# JAMAIS exécuter de commande arbitraire : seul ce wrapper tourne, quel que
# soit ce que le client tente d'envoyer, et il ne fait qu'extraire+valider un
# nom de domaine avant de lancer le vrai script de provisioning.
#
# Vit sur le VPS dans /opt/smarterbloggers/scripts/ (déployé par
# scripts/deploy_vps.sh comme le reste du repo).
set -euo pipefail

DOMAIN="${SSH_ORIGINAL_COMMAND:-}"

if [[ -z "$DOMAIN" ]]; then
    echo "ERROR: no domain provided" >&2
    exit 1
fi

exec /opt/smarterbloggers/scripts/provision_domain_vhost.sh "$DOMAIN"
