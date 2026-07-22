#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/aldapan-gora}"
mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/team-$(date +%Y-%m-%d_%H-%M-%S).tar.gz"

docker compose exec -T web tar -czf - /app/data > "$BACKUP_FILE"
find "$BACKUP_DIR" -type f -name 'team-*.tar.gz' -mtime +14 -delete
echo "Copia creada: $BACKUP_FILE"
