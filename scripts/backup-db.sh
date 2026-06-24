#!/bin/bash
set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/cmms_backup_${TIMESTAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U cmms_user cmms_db | gzip > "$BACKUP_FILE"

echo "Backup completed successfully! Saved to: ${BACKUP_FILE}"
