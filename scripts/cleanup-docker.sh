#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/agrawalsubhash0222/zincy"
BASE_COMPOSE_FILE="$APP_DIR/compose.yml"
PROD_COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
ENV_FILE="$APP_DIR/.env.prod"

compose() {
  docker compose \
    --env-file "$ENV_FILE" \
    -f "$BASE_COMPOSE_FILE" \
    -f "$PROD_COMPOSE_FILE" \
    "$@"
}

echo "========================================"
echo "Zincy Production Docker Cleanup"
echo "========================================"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed or unavailable."
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "ERROR: Docker daemon is unavailable."
  exit 1
fi

echo
echo "[1/5] Current Docker disk usage..."

docker system df

echo
echo "[2/5] Checking production containers..."

if [ -f "$BASE_COMPOSE_FILE" ] &&
   [ -f "$PROD_COMPOSE_FILE" ] &&
   [ -f "$ENV_FILE" ]; then
  compose ps
else
  echo "WARNING: One or more production Compose files are missing."
fi

echo
echo "[3/5] Removing stopped containers..."

docker container prune -f

echo
echo "[4/5] Removing dangling images and unused build cache..."

docker image prune -f
docker builder prune -f

echo
echo "[5/5] Docker disk usage after cleanup..."

docker system df

echo
echo "========================================"
echo "Docker cleanup completed successfully."
echo
echo "Docker volumes were not removed."
echo "Running containers were not removed."
echo "========================================"
