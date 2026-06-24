#!/bin/bash
# =========================================================================
# Parksons CMMS — Nightly Backup Automation Script
# =========================================================================
set -e

# Resolve script directory to execute backup-db.sh correctly from any path
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${ROOT_DIR}/backups"

echo "=== [$(date)] Starting Nightly Backup Job ==="

# 1. Trigger the standard database backup script (Reusing logic, avoiding duplication)
if [ -f "${SCRIPT_DIR}/backup-db.sh" ]; then
    bash "${SCRIPT_DIR}/backup-db.sh"
else
    echo "Error: Base backup script backup-db.sh not found at ${SCRIPT_DIR}/backup-db.sh"
    exit 1
fi

# 2. Prune backups older than 7 days
echo "Cleaning up backups older than 7 days..."
if [ -d "$BACKUP_DIR" ]; then
    # Find files ending in .sql.gz created more than 7 days ago and delete them
    find "$BACKUP_DIR" -type f -name "cmms_backup_*.sql.gz" -mtime +7 -exec rm {} \;
    echo "Old backups cleaned up successfully."
else
    echo "Backup directory $BACKUP_DIR does not exist."
fi

# 3. Optional AWS S3 Upload Hook
# To enable: Set S3_BUCKET env variable or configure awscli
if [ ! -z "$S3_BUCKET" ]; then
    echo "S3_BUCKET is configured. Uploading latest backup to S3..."
    LATEST_BACKUP=$(ls -t "${BACKUP_DIR}"/cmms_backup_*.sql.gz | head -n 1)
    if [ -f "$LATEST_BACKUP" ]; then
        aws s3 cp "$LATEST_BACKUP" "s3://${S3_BUCKET}/database/$(basename "$LATEST_BACKUP")"
        echo "Uploaded $(basename "$LATEST_BACKUP") to s3://${S3_BUCKET} successfully."
    else
        echo "Warning: No backup file found to upload."
    fi
else
    echo "S3_BUCKET is not set. Skipping S3 upload hook. (Define S3_BUCKET environment variable to enable)"
fi

echo "=== [$(date)] Nightly Backup Job Finished ==="
