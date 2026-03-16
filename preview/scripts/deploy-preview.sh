#!/usr/bin/env bash
# =============================================================================
# Deploy a PR preview environment on the EC2 preview server
#
# Architecture:
#   - Shared Caddy edge proxy (docker-compose.edge.yaml) on "preview-net" network
#   - Per-PR Docker Compose stacks (docker-compose.preview.yaml) joined to "preview-net"
#   - Dynamic Caddyfile regenerated after each deploy/teardown
#
# Usage:
#   ./deploy-preview.sh <PR_NUMBER> <BRANCH_NAME> [BASE_DOMAIN]
#
# Example:
#   ./deploy-preview.sh 456 feature/my-feature preview.learncard.com
# =============================================================================
set -euo pipefail

PR_NUMBER="${1:?Usage: deploy-preview.sh <PR_NUMBER> <BRANCH_NAME> [BASE_DOMAIN]}"
BRANCH_NAME="${2:?Usage: deploy-preview.sh <PR_NUMBER> <BRANCH_NAME> [BASE_DOMAIN]}"
BASE_DOMAIN="${3:-preview.learncard.ai}"

PREVIEW_DOMAIN="pr-${PR_NUMBER}.${BASE_DOMAIN}"
PROJECT_NAME="pr-${PR_NUMBER}"
WORKSPACE_DIR="$HOME/preview-workspace"
REPO_DIR="$WORKSPACE_DIR/LearnCard"
COMPOSE_FILE="$REPO_DIR/preview/docker-compose.preview.yaml"
EDGE_COMPOSE_FILE="$REPO_DIR/preview/docker-compose.edge.yaml"
SCRIPT_DIR="$REPO_DIR/preview/scripts"

echo "=== Deploying Preview: ${PREVIEW_DOMAIN} ==="
echo "  PR:     #${PR_NUMBER}"
echo "  Branch: ${BRANCH_NAME}"
echo "  Domain: ${PREVIEW_DOMAIN}"

# --- Ensure shared infrastructure exists (outside the lock) ---
echo "Ensuring shared preview network and edge proxy..."

# Create the shared Docker network (idempotent)
docker network create preview-net 2>/dev/null || true

# --- Generate Dozzle users.yml for log viewer auth ---
DOZZLE_USERS_FILE="$REPO_DIR/preview/dozzle-users.yml"
if [ -n "${DOZZLE_USERNAME:-}" ] && [ -n "${DOZZLE_PASSWORD:-}" ]; then
    PASS_HASH=$(echo -n "$DOZZLE_PASSWORD" | sha256sum | awk '{print $1}')
    cat > "$DOZZLE_USERS_FILE" << USERS_EOF
users:
  ${DOZZLE_USERNAME}:
    name: "${DOZZLE_USERNAME}"
    password: "${PASS_HASH}"
USERS_EOF
    echo "  Dozzle auth configured for user: ${DOZZLE_USERNAME}"
elif [ ! -f "$DOZZLE_USERS_FILE" ]; then
    # Fallback: create a default user so Dozzle can start
    DEFAULT_HASH=$(echo -n "previewlogs" | sha256sum | awk '{print $1}')
    cat > "$DOZZLE_USERS_FILE" << USERS_EOF
users:
  admin:
    name: "admin"
    password: "${DEFAULT_HASH}"
USERS_EOF
    echo "  Dozzle auth: using default credentials (set DOZZLE_USERNAME/DOZZLE_PASSWORD to override)"
fi

# Start the edge proxy (Caddy + Dozzle) if not running
EDGE_NEEDS_RESTART=false
if ! docker inspect preview-caddy &>/dev/null || \
   [ "$(docker inspect --format='{{.State.Status}}' preview-caddy 2>/dev/null)" != "running" ]; then
    EDGE_NEEDS_RESTART=true
fi
if ! docker inspect preview-dozzle &>/dev/null || \
   [ "$(docker inspect --format='{{.State.Status}}' preview-dozzle 2>/dev/null)" != "running" ]; then
    EDGE_NEEDS_RESTART=true
fi

if [ "$EDGE_NEEDS_RESTART" = "true" ]; then
    echo "  Starting edge proxy (Caddy + Dozzle)..."
    # Create a placeholder Caddyfile if it doesn't exist
    DYNAMIC_CADDYFILE="$REPO_DIR/preview/dynamic-caddyfile"
    if [ ! -f "$DYNAMIC_CADDYFILE" ]; then
        echo ':80 { respond "No active previews" 200 }' > "$DYNAMIC_CADDYFILE"
    fi
    docker compose -p preview-edge -f "$EDGE_COMPOSE_FILE" up -d
fi

# --- Acquire a lock for checkout + build ---
# Multiple PRs can deploy concurrently but they share one git repo,
# so we serialize the checkout → build phase with flock.
LOCKFILE="$WORKSPACE_DIR/.deploy.lock"
echo "Acquiring deploy lock..."
exec 200>"$LOCKFILE"
flock 200
echo "  Lock acquired."

# --- Update repo and checkout branch ---
cd "$REPO_DIR"
git fetch --all --prune

# --- Install/update cleanup cron from main (before switching to PR branch) ---
CRON_SCRIPT="$WORKSPACE_DIR/cleanup-idle-previews.sh"
git show origin/main:preview/scripts/cleanup-idle-previews.sh > "$CRON_SCRIPT" 2>/dev/null || true
chmod +x "$CRON_SCRIPT"
CRON_LINE="0 * * * * $CRON_SCRIPT >> $WORKSPACE_DIR/cleanup.log 2>&1"
( crontab -l 2>/dev/null | grep -v "cleanup-idle-previews" ; echo "$CRON_LINE" ) | crontab -

git checkout "$BRANCH_NAME" || git checkout "origin/$BRANCH_NAME" --detach
git pull origin "$BRANCH_NAME" 2>/dev/null || true

# --- Generate compose override for DID resolution ---
# The PR branch may not have the DOMAIN_NAME fix, so we generate an
# override file that ensures did:web identifiers resolve through Caddy.
OVERRIDE_FILE="$WORKSPACE_DIR/docker-compose.preview.override.yaml"
cat > "$OVERRIDE_FILE" <<YAML
services:
  brain:
    environment:
      DOMAIN_NAME: ${PREVIEW_DOMAIN}:brain
  signing:
    environment:
      AUTHORIZED_DIDS: did:web:${PREVIEW_DOMAIN}:brain
  api:
    environment:
      AUTHORIZED_DIDS: did:web:${PREVIEW_DOMAIN}:brain
YAML

# --- Tear down existing preview for this PR (if any) ---
echo "Stopping existing preview (if running)..."
PREVIEW_DOMAIN="$PREVIEW_DOMAIN" docker compose \
    -p "$PROJECT_NAME" \
    -f "$COMPOSE_FILE" \
    -f "$OVERRIDE_FILE" \
    down --remove-orphans 2>/dev/null || true

# --- Build and start the PR stack ---
echo "Building and starting preview stack..."
PREVIEW_DOMAIN="$PREVIEW_DOMAIN" \
docker compose \
    -p "$PROJECT_NAME" \
    -f "$COMPOSE_FILE" \
    -f "$OVERRIDE_FILE" \
    up --build -d

# --- Regenerate Caddyfile and reload ---
echo "Regenerating Caddy routes..."
chmod +x "$SCRIPT_DIR/regenerate-caddyfile.sh"
"$SCRIPT_DIR/regenerate-caddyfile.sh" "$BASE_DOMAIN"

# --- Release the lock (after Caddyfile regeneration completes) ---
flock -u 200
echo "Deploy lock released."

# --- Wait for services to be healthy ---
echo "Waiting for services to come up..."
MAX_WAIT=300
ELAPSED=0
INTERVAL=10

while [ $ELAPSED -lt $MAX_WAIT ]; do
    APP_STATUS=$(docker inspect --format='{{.State.Status}}' "${PROJECT_NAME}-app-1" 2>/dev/null || echo "missing")

    if [ "$APP_STATUS" = "running" ]; then
        # Try the health endpoint through the shared Caddy
        HEALTH=$(curl -sk --max-time 5 "https://${PREVIEW_DOMAIN}/preview-health" 2>/dev/null || echo "")
        if [ "$HEALTH" = "OK" ]; then
            echo "Preview is healthy!"
            break
        fi
    fi

    echo "  Waiting... (${ELAPSED}s / ${MAX_WAIT}s) app=${APP_STATUS}"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $MAX_WAIT ]; then
    echo "ERROR: Preview health check failed after ${MAX_WAIT}s"
    echo "Check logs: docker compose -p ${PROJECT_NAME} -f ${COMPOSE_FILE} logs"
    exit 1
fi

# --- Output summary ---
echo ""
echo "=== Preview Deployed ==="
echo "  URL:    https://${PREVIEW_DOMAIN}"
echo "  Status: $(docker compose -p "$PROJECT_NAME" -f "$COMPOSE_FILE" ps --format 'table {{.Name}}\t{{.Status}}' 2>/dev/null || echo 'unknown')"
echo ""

# Output machine-readable info for GitHub Actions
echo "PREVIEW_URL=https://${PREVIEW_DOMAIN}" > "$WORKSPACE_DIR/preview-${PR_NUMBER}.env"
echo "PREVIEW_DOMAIN=${PREVIEW_DOMAIN}" >> "$WORKSPACE_DIR/preview-${PR_NUMBER}.env"
