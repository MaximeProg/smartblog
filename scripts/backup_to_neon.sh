#!/bin/bash
# Sauvegarde périodique du Postgres local du VPS (source de vérité) vers
# Neon (base de secours) — appelé par cron (root, toutes les 2h, voir
# /etc/cron.d/smarterbloggers-backup sur le VPS).
#
# Recrée le script perdu le 2026-08-01 : jamais commité dans le dépôt à
# l'origine (créé à la main directement sur le VPS pendant la migration
# initiale), il a été silencieusement supprimé le jour même quand le
# déploiement est passé au clone git propre (tout fichier non suivi par
# git a disparu avec l'ancien répertoire). Le cron a continué de pointer
# vers ce fichier absent pendant 5 jours sans qu'aucune sauvegarde ne
# tourne, sans erreur visible ailleurs que dans son propre log — découvert
# le 2026-08-06. Vivre dans le dépôt cette fois : un `git pull` (déjà fait
# à chaque déploiement) le garde en place pour de bon.
#
# NEON_BACKUP_DATABASE_URL doit être définie dans backend/.env.production
# sur le VPS (jamais commitée) — connexion à la base "smarterbloggers" sur
# Neon, voir project_neon_db pour le contexte de cette base.
set -euo pipefail

LOG=/var/log/smarterbloggers-backup.log
COMPOSE_DIR=/opt/smarterbloggers
ENV_FILE=/opt/smarterbloggers/backend/.env.production

log() { echo "[$(date -u '+%Y-%m-%d %H:%M:%S UTC')] $1" >> "$LOG"; }

log "Backup starting"

NEON_BACKUP_DATABASE_URL=$(grep -m1 '^NEON_BACKUP_DATABASE_URL=' "$ENV_FILE" | cut -d= -f2-)
if [ -z "$NEON_BACKUP_DATABASE_URL" ]; then
    log "ERROR: NEON_BACKUP_DATABASE_URL not set in $ENV_FILE"
    exit 1
fi

# pg_dump + pg_restore dans le même exec du conteneur postgres : binaires
# alignés exactement sur la version du serveur local, accès réseau sortant
# déjà disponible (comme les autres conteneurs de la stack qui appellent
# des API externes), et le dump ne touche jamais le disque de l'hôte.
if docker compose -f "$COMPOSE_DIR/docker-compose.prod.yml" exec -T postgres sh -c "
    set -e
    pg_dump -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -F c -f /tmp/backup.dump
    pg_restore --clean --if-exists --no-owner --no-privileges \
        -d '$NEON_BACKUP_DATABASE_URL' /tmp/backup.dump
    rm -f /tmp/backup.dump
" >> "$LOG" 2>&1; then
    log "pg_dump OK"
    log "Backup finished"
else
    log "Backup FAILED — see output above"
    exit 1
fi
