#!/bin/bash
# Provisionne un vhost Apache + certificat SSL pour un domaine client acheté
# via le flux d'achat de domaine (register_purchased_domain, worker ARQ).
# Idempotent : sûr à rejouer (skip la création du vhost s'il existe déjà,
# certbot --keep-until-expiring ne renouvelle pas un certificat encore valide).
#
# Usage: provision_domain_vhost.sh <domaine>
#
# Vit sur le VPS dans /opt/smarterbloggers/scripts/ (déployé par
# scripts/deploy_vps.sh comme le reste du repo) — invoqué uniquement via
# ssh_provision_wrapper.sh, jamais directement par le client SSH.
set -euo pipefail

DOMAIN="$1"

# Validation stricte du format — ce script est invoqué via une SSH forced
# command exposée à un conteneur ; ne jamais faire confiance à l'entrée sans
# validation (protection injection de commande).
if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$ ]]; then
    echo "ERROR: invalid domain format: ${DOMAIN}" >&2
    exit 1
fi

VHOST_FILE="/etc/apache2/sites-available/customer-${DOMAIN}.conf"

if [ ! -f "$VHOST_FILE" ]; then
    sudo tee "$VHOST_FILE" > /dev/null << VHOST
<VirtualHost *:80>
    ServerName ${DOMAIN}
    ServerAlias www.${DOMAIN}

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:3000/
    ProxyPassReverse / http://127.0.0.1:3000/

    ErrorLog \${APACHE_LOG_DIR}/customer-${DOMAIN}-error.log
    CustomLog \${APACHE_LOG_DIR}/customer-${DOMAIN}-access.log combined
</VirtualHost>
VHOST
    sudo a2ensite "customer-${DOMAIN}.conf"
    sudo apache2ctl configtest
    sudo systemctl reload apache2
    echo "VHOST_CREATED:${DOMAIN}"
else
    echo "VHOST_ALREADY_EXISTS:${DOMAIN}"
fi

sudo certbot --apache -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos --register-unsafely-without-email --keep-until-expiring

echo "PROVISIONED:${DOMAIN}"
