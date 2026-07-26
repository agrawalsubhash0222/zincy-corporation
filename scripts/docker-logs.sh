#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/agrawalsubhash0222/zincy"
BASE_COMPOSE_FILE="$APP_DIR/compose.yml"
PROD_COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
ENV_FILE="$APP_DIR/.env.prod"
DEFAULT_LINES=200

compose() {
  docker compose \
    --env-file "$ENV_FILE" \
    -f "$BASE_COMPOSE_FILE" \
    -f "$PROD_COMPOSE_FILE" \
    "$@"
}

usage() {
  echo "Usage:"
  echo "  $0 <service> [lines]"
  echo
  echo "Services:"
  echo "  frontend"
  echo "  backend"
  echo "  mysql"
  echo "  all"
}

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  usage
  exit 1
fi

SERVICE="$1"
LINES="${2:-$DEFAULT_LINES}"

case "$SERVICE" in
  frontend|backend|mysql|all)
    ;;
  *)
    echo "ERROR: Invalid service: $SERVICE"
    usage
    exit 1
    ;;
esac

if ! [[ "$LINES" =~ ^[1-9][0-9]*$ ]]; then
  echo "ERROR: Lines must be a positive whole number."
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: Docker is not installed or unavailable."
  exit 1
fi

for file in "$BASE_COMPOSE_FILE" "$PROD_COMPOSE_FILE" "$ENV_FILE"; do
  if [ ! -f "$file" ]; then
    echo "ERROR: Required production file not found:"
    echo "$file"
    exit 1
  fi
done

echo "========================================"
echo "Zincy Production Docker Logs"
echo "Service: $SERVICE"
echo "Lines: $LINES"
echo "========================================"

if [ "$SERVICE" = "all" ]; then
  compose logs --tail "$LINES" --timestamps
else
  compose logs --tail "$LINES" --timestamps "$SERVICE"
fi
