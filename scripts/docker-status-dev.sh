#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/agrawalsubhash0222/zincy-dev"
BASE_COMPOSE_FILE="$APP_DIR/compose.yml"
DEV_COMPOSE_FILE="$APP_DIR/docker-compose.dev.yml"
ENV_FILE="$APP_DIR/.env.dev"

compose() {
  docker compose \
    --env-file "$ENV_FILE" \
    -f "$BASE_COMPOSE_FILE" \
    -f "$DEV_COMPOSE_FILE" \
    "$@"
}

echo "========================================"
echo "Zincy Development Docker Status"
echo "========================================"

echo
echo "[1/4] Docker service status..."

if docker info >/dev/null 2>&1; then
  echo "Docker daemon: running"
else
  echo "Docker daemon: unavailable"
  exit 1
fi

echo
echo "[2/4] Development containers..."

cd "$APP_DIR"
compose ps

echo
echo "[3/4] Container health summary..."

for container in zincy-dev-frontend zincy-dev-backend zincy-dev-mysql; do
  RUNNING="$(
    docker inspect \
      -f '{{.State.Running}}' \
      "$container" 2>/dev/null || echo "not-found"
  )"

  STATUS="$(
    docker inspect \
      -f '{{.State.Status}}' \
      "$container" 2>/dev/null || echo "not-found"
  )"

  HEALTH="$(
    docker inspect \
      -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}not configured{{end}}' \
      "$container" 2>/dev/null || echo "not-found"
  )"

  echo "$container:"
  echo "  running: $RUNNING"
  echo "  status:  $STATUS"
  echo "  health:  $HEALTH"
done

echo
echo "[4/4] Docker disk usage..."

docker system df

echo
echo "========================================"
echo "Development status check completed."
echo "========================================"
