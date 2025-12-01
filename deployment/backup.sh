#!/usr/bin/env bash
set -euo pipefail

# Simple database backup script for Coupon Commerce
# Usage: sudo ./deployment/backup.sh

DB_NAME=${POSTGRES_DB:-coupon_commerce}
DB_USER=${POSTGRES_USER:-coupon_user}
BACKUP_DIR=${BACKUP_DIR:-/var/backups/coupon-commerce}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"
FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "Creating backup for $DB_NAME ..."
pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$FILE"
echo "Backup saved to $FILE"

# Keep last 14 backups
cd "$BACKUP_DIR"
ls -t | tail -n +15 | xargs -r rm

echo "Done."
