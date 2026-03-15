#!/usr/bin/env bash
# =============================================================================
# Tear down a PR preview environment
#
# Usage:
#   ./teardown-preview.sh <PR_NUMBER> [BASE_DOMAIN]
# =============================================================================
set -euo pipefail

PR_NUMBER="${1:?Usage: teardown-preview.sh <PR_NUMBER> [BASE_DOMAIN]}"
BASE_DOMAIN="${2:-preview.learncard.com}"

PROJECT_NAME="pr-${PR_NUMBER}"
WORKSPACE_DIR="$HOME/preview-workspace"
REPO_DIR="$WORKSPACE_DIR/LearnCard"
COMPOSE_FILE="$REPO_DIR/preview/docker-compose.preview.yaml"
SCRIPT_DIR="$REPO_DIR/preview/scripts"

echo "=== Tearing down preview: ${PROJECT_NAME} ==="

# Stop and remove all containers, networks, and volumes for this PR
docker compose \
    -p "$PROJECT_NAME" \
    -f "$COMPOSE_FILE" \
    down -v --remove-orphans 2>/dev/null || true

# Clean up the env file
rm -f "$WORKSPACE_DIR/preview-${PR_NUMBER}.env"

# Regenerate Caddyfile to remove the route for this PR
echo "Regenerating Caddy routes..."
chmod +x "$SCRIPT_DIR/regenerate-caddyfile.sh"
"$SCRIPT_DIR/regenerate-caddyfile.sh" "$BASE_DOMAIN"

# Prune dangling images to reclaim space
docker image prune -f > /dev/null 2>&1

echo "Preview ${PROJECT_NAME} torn down."
