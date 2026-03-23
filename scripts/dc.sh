#!/usr/bin/env bash
#
# dc.sh — Docker Compose wrapper with automatic port namespacing.
#
# By default (PORT_OFFSET=0), behavior is identical to running docker compose directly.
# Set PORT_OFFSET to shift ALL host port bindings, allowing multiple stacks simultaneously.
#
# Usage:
#   ./scripts/dc.sh -f apps/learn-card-app/compose-local.yaml up --build
#   PORT_OFFSET=100 ./scripts/dc.sh -f tests/e2e/compose.yaml up -d --build
#
# The wrapper automatically:
#   1. Derives a compose project name from the current git branch (override with LC_PROJECT)
#   2. Computes per-service host ports from PORT_OFFSET (default 0)
#   3. Exports them so compose files can use ${VAR:-default} substitution
#   4. Passes all arguments through to `docker compose`
#
# Environment variables:
#   PORT_OFFSET   — integer added to every base port (default: 0)
#   LC_PROJECT    — explicit compose project name (default: derived from git branch)
#

set -euo pipefail

OFFSET="${PORT_OFFSET:-0}"

# --- Project name -----------------------------------------------------------

if [[ -n "${LC_PROJECT:-}" ]]; then
    PROJECT="$LC_PROJECT"
else
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "default")
    # Sanitize: lowercase, replace non-alphanumeric with dash, trim dashes
    PROJECT=$(echo "lc-$BRANCH" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
fi

# --- Port computation -------------------------------------------------------

export APP_HOST_PORT=$((3000 + OFFSET))
export DELETE_SERVICE_HOST_PORT=$((3100 + OFFSET))
export BRAIN_HOST_PORT=$((4000 + OFFSET))
export CLOUD_HOST_PORT=$((4100 + OFFSET))
export SIGNING_HOST_PORT=$((4200 + OFFSET))
export API_HOST_PORT=$((5100 + OFFSET))
export LCA_API_HOST_PORT=$((5200 + OFFSET))
export NEO4J_BOLT_HOST_PORT=$((7687 + OFFSET))
export NEO4J_HTTP_HOST_PORT=$((7474 + OFFSET))
export REDIS1_HOST_PORT=$((6379 + OFFSET))
export REDIS2_HOST_PORT=$((6380 + OFFSET))
export REDIS3_HOST_PORT=$((6381 + OFFSET))
export MONGO_HOST_PORT=$((27017 + OFFSET))
export ELASTICMQ_HOST_PORT=$((9324 + OFFSET))
export POSTGRES_HOST_PORT=$((5432 + OFFSET))
export LRS_HOST_PORT=$((8080 + OFFSET))

# Also export PORT_OFFSET itself so compose env blocks can reference it
export PORT_OFFSET="$OFFSET"

# --- Info --------------------------------------------------------------------

if [[ "$OFFSET" -ne 0 ]]; then
    echo "┌─────────────────────────────────────────────┐"
    echo "│  dc.sh — PORT_OFFSET=$OFFSET"
    echo "│  Project: $PROJECT"
    echo "│"
    echo "│  brain:    localhost:$BRAIN_HOST_PORT"
    echo "│  cloud:    localhost:$CLOUD_HOST_PORT"
    echo "│  signing:  localhost:$SIGNING_HOST_PORT"
    echo "│  api:      localhost:$API_HOST_PORT"
    echo "│  lca-api:  localhost:$LCA_API_HOST_PORT"
    echo "│  app:      localhost:$APP_HOST_PORT"
    echo "│  neo4j:    localhost:$NEO4J_BOLT_HOST_PORT (bolt) / localhost:$NEO4J_HTTP_HOST_PORT (http)"
    echo "│  mongo:    localhost:$MONGO_HOST_PORT"
    echo "│  postgres: localhost:$POSTGRES_HOST_PORT"
    echo "└─────────────────────────────────────────────┘"
fi

# --- Exec --------------------------------------------------------------------

exec docker compose -p "$PROJECT" "$@"
