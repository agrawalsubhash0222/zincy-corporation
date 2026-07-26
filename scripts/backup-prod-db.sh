#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/agrawalsubhash0222/zincy"
BACKUP_DIR="$APP_DIR/backups"
CONTAINER="zincy-mysql"
DATABASE="zincy_corporation"
RETENTION_DAYS=14

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_NAME="${DATABASE}_${TIMESTAMP}.sql.gz"
BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME"
TEMP_FILE="${BACKUP_FILE}.tmp"

cleanup() {
  rm -f "$TEMP_FILE"
}

trap cleanup EXIT

echo "========================================"
echo "Zincy Production Database Backup"
echo "Container: $CONTAINER"
echo "Database: $DATABASE"
echo "Destination: $BACKUP_FILE"
echo "========================================"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed or is unavailable."
  exit 1
fi

if ! command -v gzip >/dev/null 2>&1; then
  echo "ERROR: gzip is not installed or is unavailable."
  exit 1
fi

if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || true)" != "true" ]; then
  echo "ERROR: MySQL container is not running: $CONTAINER"
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo
echo "[1/5] Checking database connectivity..."

docker exec "$CONTAINER" sh -c \
  'mysqladmin ping -uroot -p"$MYSQL_ROOT_PASSWORD" --silent'

echo "Database connection is healthy."

echo
echo "[2/5] Creating compressed database backup..."

docker exec \
  -e DATABASE="$DATABASE" \
  "$CONTAINER" \
  sh -c '
    exec mysqldump \
      -uroot \
      -p"$MYSQL_ROOT_PASSWORD" \
      --single-transaction \
      --quick \
      --routines \
      --triggers \
      --events \
      --hex-blob \
      --set-gtid-purged=OFF \
      --databases "$DATABASE"
  ' \
  | gzip -9 > "$TEMP_FILE"

echo
echo "[3/5] Verifying backup file..."

if [ ! -s "$TEMP_FILE" ]; then
  echo "ERROR: Backup file is empty."
  exit 1
fi

gzip -t "$TEMP_FILE"

if ! gunzip -c "$TEMP_FILE" | grep -q "CREATE DATABASE"; then
  echo "ERROR: Backup does not contain a CREATE DATABASE statement."
  exit 1
fi

if ! gunzip -c "$TEMP_FILE" | grep -q "USE \`$DATABASE\`"; then
  echo "ERROR: Backup does not reference the expected database."
  exit 1
fi

mv "$TEMP_FILE" "$BACKUP_FILE"

BACKUP_SIZE="$(du -h "$BACKUP_FILE" | awk '{print $1}')"

echo "Backup compression is valid."
echo "Backup size: $BACKUP_SIZE"

echo
echo "[4/5] Removing backups older than $RETENTION_DAYS days..."

find "$BACKUP_DIR" \
  -maxdepth 1 \
  -type f \
  -name "${DATABASE}_*.sql.gz" \
  -mtime "+$RETENTION_DAYS" \
  -print \
  -delete

echo
echo "[5/5] Showing available backups..."

find "$BACKUP_DIR" \
  -maxdepth 1 \
  -type f \
  -name "${DATABASE}_*.sql.gz" \
  -printf '%TY-%Tm-%Td %TH:%TM  %10s bytes  %f\n' \
  | sort -r

echo
echo "========================================"
echo "Backup completed successfully."
echo "File: $BACKUP_FILE"
echo "Size: $BACKUP_SIZE"
echo
echo "Recommended restore test:"
echo "./scripts/restore-prod-db.sh \"$BACKUP_NAME\""
echo "========================================"
