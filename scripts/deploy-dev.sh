#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/agrawalsubhash0222/zincy-dev"
BASE_COMPOSE_FILE="$APP_DIR/compose.yml"
DEV_COMPOSE_FILE="$APP_DIR/docker-compose.dev.yml"
ENV_FILE="$APP_DIR/.env.dev"
BRANCH="develop"

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
echo "Zincy Development Deployment"
echo "Directory: $APP_DIR"
echo "Branch: $BRANCH"
echo "========================================"

if [ "$(id -u)" -eq 0 ]; then
  fail "Do not run this deployment script as root."
fi

for command in git docker curl; do
  if ! command -v "$command" >/dev/null 2>&1; then
    fail "$command is not installed or unavailable."
  fi
done

if [ ! -d "$APP_DIR/.git" ]; then
  fail "Git repository not found at $APP_DIR."
fi

for file in "$BASE_COMPOSE_FILE" "$DEV_COMPOSE_FILE" "$ENV_FILE"; do
  if [ ! -f "$file" ]; then
    fail "Required Dev file not found: $file"
  fi
done

cd "$APP_DIR"

echo
echo "[1/8] Checking repository state..."

CURRENT_BRANCH="$(git branch --show-current)"

if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
  fail "Expected branch '$BRANCH', but current branch is '$CURRENT_BRANCH'."
fi

if [ -n "$(git status --porcelain)" ]; then
  echo "Uncommitted changes:"
  git status --short
  fail "Dev repository has uncommitted changes."
fi

echo "Repository is clean and on branch $BRANCH."

echo
echo "[2/8] Fetching latest changes..."

git fetch origin "$BRANCH"

LOCAL_COMMIT="$(git rev-parse HEAD)"
REMOTE_COMMIT="$(git rev-parse "origin/$BRANCH")"

echo "Current commit: $LOCAL_COMMIT"
echo "Remote commit:  $REMOTE_COMMIT"

if ! git merge-base --is-ancestor "$LOCAL_COMMIT" "$REMOTE_COMMIT"; then
  fail "Local Dev branch has commits not contained in origin/$BRANCH."
fi

git pull --ff-only origin "$BRANCH"

DEPLOY_COMMIT="$(git rev-parse HEAD)"

echo "Deploying commit: $DEPLOY_COMMIT"

echo
echo "[3/8] Validating Dev Compose configuration..."

compose config --quiet

echo "Compose configuration is valid."

echo
echo "[4/8] Building Dev images..."

compose build --pull

echo
echo "[5/8] Starting Dev services..."

compose up -d --remove-orphans

echo
echo "[6/8] Waiting for Dev containers..."

for attempt in {1..30}; do
  MYSQL_RUNNING="$(
    docker inspect -f '{{.State.Running}}' zincy-dev-mysql 2>/dev/null || true
  )"

  BACKEND_RUNNING="$(
    docker inspect -f '{{.State.Running}}' zincy-dev-backend 2>/dev/null || true
  )"

  FRONTEND_RUNNING="$(
    docker inspect -f '{{.State.Running}}' zincy-dev-frontend 2>/dev/null || true
  )"

  MYSQL_HEALTH="$(
    docker inspect \
      -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
      zincy-dev-mysql 2>/dev/null || true
  )"

  FRONTEND_HEALTH="$(
    docker inspect \
      -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
      zincy-dev-frontend 2>/dev/null || true
  )"

  if [ "$MYSQL_RUNNING" = "true" ] &&
     [ "$BACKEND_RUNNING" = "true" ] &&
     [ "$FRONTEND_RUNNING" = "true" ] &&
     [ "$MYSQL_HEALTH" = "healthy" ] &&
     [ "$FRONTEND_HEALTH" = "healthy" ]; then
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    compose ps
    compose logs --tail 100 backend frontend mysql
    fail "Dev containers did not become ready."
  fi

  sleep 5
done

compose ps

echo
echo "[7/8] Verifying internal Dev health endpoint..."

HEALTH_RESPONSE="$(
  curl \
    --silent \
    --show-error \
    --fail \
    --max-time 15 \
    http://localhost:8082/health
)"

if [ "$HEALTH_RESPONSE" != "healthy" ]; then
  compose logs --tail 100 frontend backend
  fail "Dev health endpoint returned unexpected response: $HEALTH_RESPONSE"
fi

echo "Internal Dev health check passed."

echo
echo "[8/8] Verifying public Dev HTTPS response..."

HTTP_STATUS="$(
  curl \
    --silent \
    --show-error \
    --output /dev/null \
    --write-out '%{http_code}' \
    --max-time 20 \
    https://dev.zincycorp.in/
)"

case "$HTTP_STATUS" in
  200|301|302)
    echo "Public Dev HTTPS check passed with status: $HTTP_STATUS"
    ;;
  *)
    compose logs --tail 100 frontend backend
    fail "Public Dev HTTPS check failed with status: $HTTP_STATUS"
    ;;
esac

echo
echo "========================================"
echo "Development deployment completed."
echo "Commit: $DEPLOY_COMMIT"
echo
echo "Useful commands:"
echo "  ./scripts/docker-status-dev.sh"
echo "  ./scripts/docker-logs-dev.sh backend 200"
echo "========================================"
