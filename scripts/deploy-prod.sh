#!/usr/bin/env bash
set -Eeuo pipefail

APP_DIR="/home/agrawalsubhash0222/zincy"
BASE_COMPOSE_FILE="$APP_DIR/compose.yml"
PROD_COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"
ENV_FILE="$APP_DIR/.env.prod"
BRANCH="main"

compose() {
  docker compose \
    --env-file "$ENV_FILE" \
    -f "$BASE_COMPOSE_FILE" \
    -f "$PROD_COMPOSE_FILE" \
    "$@"
}

fail() {
  echo
  echo "ERROR: $1"
  exit 1
}

echo "========================================"
echo "Zincy Production Deployment"
echo "Directory: $APP_DIR"
echo "Branch: $BRANCH"
echo "========================================"

if [ "$(id -u)" -eq 0 ]; then
  fail "Do not run this deployment script as root."
fi

if ! command -v git >/dev/null 2>&1; then
  fail "Git is not installed or unavailable."
fi

if ! command -v docker >/dev/null 2>&1; then
  fail "Docker is not installed or unavailable."
fi

if ! command -v curl >/dev/null 2>&1; then
  fail "curl is not installed or unavailable."
fi

if [ ! -d "$APP_DIR/.git" ]; then
  fail "Git repository not found at $APP_DIR."
fi

for file in "$BASE_COMPOSE_FILE" "$PROD_COMPOSE_FILE" "$ENV_FILE"; do
  if [ ! -f "$file" ]; then
    fail "Required production file not found: $file"
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
  fail "Production repository has uncommitted changes."
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
  fail "Local production branch has commits not contained in origin/$BRANCH."
fi

git pull --ff-only origin "$BRANCH"

DEPLOY_COMMIT="$(git rev-parse HEAD)"

echo "Deploying commit: $DEPLOY_COMMIT"

echo
echo "[3/8] Validating production Compose configuration..."

compose config --quiet

echo "Compose configuration is valid."

echo
echo "[4/8] Creating pre-deployment database backup..."

if [ ! -x "$APP_DIR/scripts/backup-prod-db.sh" ]; then
  fail "Backup script is missing or not executable."
fi

"$APP_DIR/scripts/backup-prod-db.sh"

echo
echo "[5/8] Building production images..."

compose build --pull

echo
echo "[6/8] Starting production services..."

compose up -d --remove-orphans

echo
echo "[7/8] Waiting for containers..."

for attempt in {1..30}; do
  MYSQL_RUNNING="$(
    docker inspect -f '{{.State.Running}}' zincy-mysql 2>/dev/null || true
  )"

  BACKEND_RUNNING="$(
    docker inspect -f '{{.State.Running}}' zincy-backend 2>/dev/null || true
  )"

  FRONTEND_RUNNING="$(
    docker inspect -f '{{.State.Running}}' zincy-frontend 2>/dev/null || true
  )"

  MYSQL_HEALTH="$(
    docker inspect \
      -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
      zincy-mysql 2>/dev/null || true
  )"

  if [ "$MYSQL_RUNNING" = "true" ] &&
     [ "$BACKEND_RUNNING" = "true" ] &&
     [ "$FRONTEND_RUNNING" = "true" ] &&
     { [ "$MYSQL_HEALTH" = "healthy" ] || [ "$MYSQL_HEALTH" = "none" ]; }; then
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    compose ps
    fail "Production containers did not become ready."
  fi

  sleep 5
done

compose ps

echo
echo "[8/8] Verifying production HTTP response..."

HTTP_STATUS="$(
  curl \
    --silent \
    --show-error \
    --output /dev/null \
    --write-out '%{http_code}' \
    --max-time 15 \
    http://localhost/
)"

case "$HTTP_STATUS" in
  200|301|302)
    echo "Frontend HTTP check passed with status: $HTTP_STATUS"
    ;;
  *)
    compose logs --tail 100 frontend backend
    fail "Frontend HTTP check failed with status: $HTTP_STATUS"
    ;;
esac

echo
echo "========================================"
echo "Production deployment completed."
echo "Commit: $DEPLOY_COMMIT"
echo
echo "Useful commands:"
echo "  ./scripts/docker-status.sh"
echo "  ./scripts/docker-logs.sh backend 200"
echo "========================================"
