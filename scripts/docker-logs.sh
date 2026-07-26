#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/agrawalsubhash0222/zincy"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"
DEFAULT_LINES=200

usage() {
  echo "Usage:"
  echo "  $0 <service> [lines]"
  echo
  echo "Services:"
  echo "  frontend"
  echo "  backend"
  echo "  mysql"
  echo "  all"
  echo
  echo "Examples:"
  echo "  $0 backend"
  echo "  $0 backend 500"
  echo "  $0 all 100"
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

if [ ! -f "$COMPOSE_FILE" ]; then
  echo "ERROR: Compose file not found:"
  echo "$COMPOSE_FILE"
  exit 1
fi

echo "========================================"
echo "Zincy Production Docker Logs"
echo "Service: $SERVICE"
echo "Lines: $LINES"
echo "========================================"

if [ "$SERVICE" = "all" ]; then
  docker compose \
    -f "$COMPOSE_FILE" \
    logs \
    --tail "$LINES" \
    --timestamps
else
  docker compose \
    -f "$COMPOSE_FILE" \
    logs \
    --tail "$LINES" \
    --timestamps \
    "$SERVICE"
fi
