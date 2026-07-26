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

fail() {
  echo
  echo "ERROR: $1"
  exit 1
}

echo "========================================"
echo "Zincy Development Docker Cleanup"
echo "========================================"

if ! docker info >/dev/null 2>&1; then
  fail "Docker daemon is unavailable."
fi

cd "$APP_DIR"

echo
echo "[1/5] Current Docker disk usage..."

docker system df

echo
echo "[2/5] Verifying Dev containers..."

for container in zincy-dev-mysql zincy-dev-backend zincy-dev-frontend; do
  RUNNING="$(
    docker inspect \
      -f '{{.State.Running}}' \
      "$container" 2>/dev/null || echo "false"
  )"

  if [ "$RUNNING" != "true" ]; then
    compose ps
    fail "Required Dev container is not running: $container"
  fi
done

echo "All required Dev containers are running."

echo
echo "[3/5] Removing stopped containers..."

docker container prune --force

echo
echo "[4/5] Removing dangling images..."

docker image prune --force

echo
echo "[5/5] Removing unused build cache..."

docker builder prune --force

echo
echo "Docker disk usage after cleanup:"

docker system df

echo
echo "Dev containers after cleanup:"

compose ps

echo
echo "========================================"
echo "Development Docker cleanup completed."
echo "Running containers and volumes were preserved."
echo "========================================"
