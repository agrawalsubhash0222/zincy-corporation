#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/agrawalsubhash0222/zincy"
BACKUP_DIR="$APP_DIR/backups"
CONTAINER="zincy-mysql"
PROD_DATABASE="zincy_corporation"
TEST_DATABASE="zincy_restore_test"

usage() {
  echo "Usage:"
  echo "  $0 <backup-file.sql.gz>"
  echo
  echo "Example:"
  echo "  $0 zincy_corporation_20260725_220211.sql.gz"
}

if [ "$#" -ne 1 ]; then
  usage
  exit 1
fi

BACKUP_NAME="$1"

if [ "$BACKUP_NAME" != "$(basename "$BACKUP_NAME")" ]; then
  echo "ERROR: Provide only the backup filename, not a path."
  exit 1
fi

case "$BACKUP_NAME" in
  *.sql.gz)
    ;;
  *)
    echo "ERROR: Backup file must end with .sql.gz"
    exit 1
    ;;
esac

BACKUP_FILE="$BACKUP_DIR/$BACKUP_NAME"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found:"
  echo "$BACKUP_FILE"
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed or is unavailable."
  exit 1
fi

if [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || true)" != "true" ]; then
  echo "ERROR: MySQL container is not running: $CONTAINER"
  exit 1
fi

echo "========================================"
echo "Zincy Database Restore Test"
echo "Backup: $BACKUP_FILE"
echo "Container: $CONTAINER"
echo "Production database: $PROD_DATABASE"
echo "Target database: $TEST_DATABASE"
echo "========================================"

echo
echo "[1/5] Verifying compressed backup..."

gzip -t "$BACKUP_FILE"

echo "Backup compression is valid."

echo
echo "[2/5] Creating clean test database..."

docker exec \
  -e TEST_DATABASE="$TEST_DATABASE" \
  "$CONTAINER" \
  sh -c '
    mysql -uroot -p"$MYSQL_ROOT_PASSWORD" \
      -e "DROP DATABASE IF EXISTS \`$TEST_DATABASE\`;
          CREATE DATABASE \`$TEST_DATABASE\`
          CHARACTER SET utf8mb4
          COLLATE utf8mb4_unicode_ci;"
  '

echo
echo "[3/5] Restoring backup into the test database..."

gunzip -c "$BACKUP_FILE" \
  | sed "s/\`$PROD_DATABASE\`/\`$TEST_DATABASE\`/g" \
  | docker exec -i \
      -e TEST_DATABASE="$TEST_DATABASE" \
      "$CONTAINER" \
      sh -c '
        mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$TEST_DATABASE"
      '

echo
echo "[4/5] Verifying restored tables..."

TABLE_COUNT="$(
  docker exec \
    -e TEST_DATABASE="$TEST_DATABASE" \
    "$CONTAINER" \
    sh -c '
      mysql -N -uroot -p"$MYSQL_ROOT_PASSWORD" \
        -e "SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = '\''$TEST_DATABASE'\'';"
    '
)"

if ! [[ "$TABLE_COUNT" =~ ^[0-9]+$ ]]; then
  echo "ERROR: Could not determine restored table count."
  exit 1
fi

if [ "$TABLE_COUNT" -eq 0 ]; then
  echo "ERROR: Restore completed but no tables were found."
  exit 1
fi

echo "Restored table count: $TABLE_COUNT"

echo
echo "[5/5] Showing restored tables..."

docker exec \
  -e TEST_DATABASE="$TEST_DATABASE" \
  "$CONTAINER" \
  sh -c '
    mysql -uroot -p"$MYSQL_ROOT_PASSWORD" \
      -e "SHOW TABLES FROM \`$TEST_DATABASE\`;"
  '

echo
echo "========================================"
echo "Restore test completed successfully."
echo
echo "Production database was not modified."
echo "Temporary test database: $TEST_DATABASE"
echo
echo "Remove it later with:"
printf 'docker exec -e TEST_DATABASE="%s" "%s" sh -c '\''mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "DROP DATABASE \`$TEST_DATABASE\`;"'\''\n' \
  "$TEST_DATABASE" "$CONTAINER"
echo "========================================"
