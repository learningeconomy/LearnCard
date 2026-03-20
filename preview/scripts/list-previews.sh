#!/usr/bin/env bash
# =============================================================================
# List all running PR preview environments
#
# Usage:
#   ./list-previews.sh
# =============================================================================
set -euo pipefail

echo "=== Active PR Previews ==="
echo ""

FOUND=false

for PROJECT in $(docker compose ls --format json 2>/dev/null | jq -r '.[].Name' | grep '^pr-' | sort); do
    FOUND=true
    PR_NUM="${PROJECT#pr-}"
    WORKSPACE_DIR="$HOME/preview-workspace"
    ENV_FILE="$WORKSPACE_DIR/preview-${PR_NUM}.env"

    URL="unknown"
    if [ -f "$ENV_FILE" ]; then
        URL=$(grep "^PREVIEW_URL=" "$ENV_FILE" | cut -d= -f2-)
    fi

    RUNNING=$(docker compose -p "$PROJECT" ps --format json 2>/dev/null | jq -r '.State' | grep -c "running" || echo "0")
    TOTAL=$(docker compose -p "$PROJECT" ps --format json 2>/dev/null | jq -r '.State' | wc -l | tr -d ' ')

    echo "  PR #${PR_NUM}"
    echo "    URL:        ${URL}"
    echo "    Containers: ${RUNNING}/${TOTAL} running"
    echo ""
done

if [ "$FOUND" = "false" ]; then
    echo "  No active previews."
fi
