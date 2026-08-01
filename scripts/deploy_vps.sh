#!/bin/bash
# Déploie les derniers changements poussés sur GitHub (branche main) vers le
# VPS de production. À lancer depuis la machine locale, APRÈS avoir commité
# et pushé (git push smarterbloggers main).
#
# Usage : ./scripts/deploy_vps.sh
set -euo pipefail

VPS_HOST="deploy@191.215.35.51"
SSH_KEY="$HOME/.ssh/id_ed25519_vps"

echo "==> Déploiement sur le VPS..."
ssh -i "$SSH_KEY" -o BatchMode=yes "$VPS_HOST" bash -s << 'REMOTE'
set -euo pipefail
cd /opt/smarterbloggers
echo "--- git pull ---"
git pull origin main
echo "--- rebuild (cache Docker, rapide si peu de changements) ---"
sudo docker compose -f docker-compose.prod.yml build
echo "--- migrations Alembic ---"
sudo docker compose -f docker-compose.prod.yml run --rm api alembic upgrade head
echo "--- redémarrage ---"
# --force-recreate est indispensable : sans lui, `up -d` ne recrée pas un
# conteneur déjà démarré juste parce que l'image sous-jacente a été
# reconstruite (le tag ":latest" ne change pas, donc Compose ne voit "rien
# de nouveau" et laisse tourner l'ancien conteneur avec l'ancien code).
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate
echo "--- état des conteneurs ---"
sudo docker compose -f docker-compose.prod.yml ps
REMOTE
echo "==> Terminé."
