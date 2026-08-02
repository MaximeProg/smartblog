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
# -T (pas de pseudo-TTY) + stdin depuis /dev/null : `docker compose run`
# attache sinon son stdin de façon interactive, ce qui lui fait consommer le
# reste du heredoc SSH — les commandes suivantes (redémarrage, ps) ne sont
# alors jamais reçues par le bash distant, bien que le script se termine en
# exit 0 (bug réel constaté le 2026-08-02 : la migration tournait mais les
# conteneurs n'étaient jamais recréés).
sudo docker compose -f docker-compose.prod.yml run --rm -T api alembic upgrade head < /dev/null
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
