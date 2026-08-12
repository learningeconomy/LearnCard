#!/usr/bin/env bash
# =============================================================================
# Cleanup idle preview stacks and auto-stop EC2 when no previews remain
#
# Installed as an hourly cron job by the deploy script.
# =============================================================================
set -euo pipefail

IDLE_THRESHOLD=$((4 * 3600))
NOW=$(date +%s)
REPO_DIR="$HOME/preview-workspace/LearnCard"
COMPOSE_FILE="$REPO_DIR/preview/docker-compose.preview.yaml"
TORN_DOWN=false

for PROJECT in $(docker compose ls --format json 2>/dev/null | jq -r '.[].Name' | grep '^pr-'); do
    PR_NUM="${PROJECT#pr-}"
    APP_CONTAINER="${PROJECT}-app-1"

    STARTED_AT=$(docker inspect --format='{{.State.StartedAt}}' "$APP_CONTAINER" 2>/dev/null || echo "")
    if [ -z "$STARTED_AT" ]; then
        continue
    fi

    STARTED_EPOCH=$(date -d "$STARTED_AT" +%s 2>/dev/null || echo "")
    if [ -z "$STARTED_EPOCH" ] || [ "$STARTED_EPOCH" -eq 0 ]; then
        continue
    fi

    AGE_SECONDS=$((NOW - STARTED_EPOCH))

    if [ "$AGE_SECONDS" -gt "$IDLE_THRESHOLD" ]; then
        echo "Tearing down idle preview: $PROJECT (age ${AGE_SECONDS}s)"
        docker compose -p "$PROJECT" -f "$COMPOSE_FILE" down -v --remove-orphans
        rm -f "$HOME/preview-workspace/preview-${PR_NUM}.env"
        TORN_DOWN=true
    fi
done

# Regenerate Caddyfile if we tore anything down
if [ "$TORN_DOWN" = "true" ]; then
    chmod +x "$REPO_DIR/preview/scripts/regenerate-caddyfile.sh"
    "$REPO_DIR/preview/scripts/regenerate-caddyfile.sh"
fi

# Prune dangling images older than 24h
docker image prune -f --filter "until=24h" > /dev/null 2>&1

# --- Auto-stop EC2 if no preview stacks remain ---
ACTIVE_PREVIEWS=$(docker compose ls --format json 2>/dev/null | jq -r '.[].Name' | grep -c '^pr-' || true)
if [ "$ACTIVE_PREVIEWS" -eq 0 ]; then
    echo "$(date): No active previews — shutting down EC2 to save costs."
    # Stop the edge proxy too (will be restarted on next deploy)
    docker compose -p preview-edge -f "$REPO_DIR/preview/docker-compose.edge.yaml" down 2>/dev/null || true
    sudo shutdown -h now
fi
