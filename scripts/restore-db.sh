#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Error: Please specify the backup file path to restore."
  echo "Usage: ./restore-db.sh ./backups/cmms_backup_YYYYMMDD_HHMMSS.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

echo "Warning: This will drop current public schema and restore the database to the state in ${BACKUP_FILE}."
read -p "Are you sure you want to proceed? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled."
    exit 0
fi

echo "Cleaning up current public database schema..."
docker compose -f docker-compose.prod.yml exec -T postgres psql -U cmms_user -d cmms_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "Restoring database..."
gunzip -c "$BACKUP_FILE" | docker compose -f docker-compose.prod.yml exec -T postgres psql -U cmms_user -d cmms_db

echo "Database restore completed successfully!"
