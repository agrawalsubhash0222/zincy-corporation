#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/agrawalsubhash0222/zincy-dev"
BASE_COMPOSE_FILE="$APP_DIR/compose.yml"
DEV_COMPOSE_FILE="$APP_DIR/docker-compose.dev.yml"
ENV_FILE="$APP_DIR/.env.dev"

SERVICE="${1:-}"
LINES="${2:-200}"

compose() {
  docker compose \
    --env-file "$ENV_FILE" \
    -f "$BASE_COMPOSE_FILE" \
    -f "$DEV_COMPOSE_FILE" \
    "$@"
}

usage() {
  echo "Usage:"
  echo "  ./scripts/docker-logs-dev.sh <service> [lines]"
  echo
  echo "Services:"
  echo "  backend"
  echo "  frontend"
  echo "  mysql"
  echo "  all"
  echo
  echo "Examples:"
  echo "  ./scripts/docker-logs-dev.sh backend"
  echo "  ./scripts/docker-logs-dev.sh frontend 100"
  echo "  ./scripts/docker-logs-dev.sh all 50"
}

if [ -z "$SERVICE" ]; then
  usage
  exit 1
fi

if ! [[ "$LINES" =~ ^[0-9]+$ ]] || [ "$LINES" -le 0 ]; then
  echo "ERROR: lines must be a positive number."
  exit 1
fi

cd "$APP_DIR"

echo "========================================"
echo "Zincy Development Logs"
echo "Service: $SERVICE"
echo "Lines:   $LINES"
echo "========================================"
echo

case "$SERVICE" in
  backend|frontend|mysql)
    compose logs --tail "$LINES" "$SERVICE"
    ;;
  all)
    compose logs --tail "$LINES"
    ;;
  *)
    echo "ERROR: Unknown service '$SERVICE'."
    echo
    usage
    exit 1
    ;;
esac
