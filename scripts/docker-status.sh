#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/agrawalsubhash0222/zincy"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"

echo "========================================"
echo "Zincy Production Docker Status"
echo "========================================"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed or unavailable."
  exit 1
fi

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: Compose file not found:"
  echo "$COMPOSE_FILE"
  exit 1
fi

echo
echo "[1/4] Docker service status..."

if docker info >/dev/null 2>&1; then
  echo "Docker daemon: running"
else
  echo "ERROR: Docker daemon is unavailable."
  exit 1
fi

echo
echo "[2/4] Production containers..."

docker compose \
  -f "$COMPOSE_FILE" \
  ps

echo
echo "[3/4] Container health summary..."

for container in zincy-frontend zincy-backend zincy-mysql; do
  if ! docker inspect "$container" >/dev/null 2>&1; then
    echo "$container: NOT FOUND"
    continue
  fi

  running="$(docker inspect -f '{{.State.Running}}' "$container")"
  status="$(docker inspect -f '{{.State.Status}}' "$container")"
  health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}not configured{{end}}' "$container")"

  echo "$container:"
  echo "  running: $running"
  echo "  status:  $status"
  echo "  health:  $health"
done

echo
echo "[4/4] Disk usage..."

docker system df

echo
echo "========================================"
echo "Status check completed."
echo "========================================"
