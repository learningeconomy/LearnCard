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

# --- Stack suffix (derived from compose file) --------------------------------
# Prevents project-name collisions when running dev + e2e simultaneously.

STACK=""
COMPOSE_FILE_ARG=""
prev_was_f=0
for arg in "$@"; do
    if [[ "$prev_was_f" == "1" ]]; then
        COMPOSE_FILE_ARG="$arg"
        case "$arg" in
            *e2e*proxy*)     STACK="e2e-proxy" ;;
            *e2e*)           STACK="e2e" ;;
            *local*proxy*)   STACK="dev-proxy" ;;
            *local*)         STACK="dev" ;;
            *preview*)       STACK="preview" ;;
            *proxy*)         STACK="proxy" ;;
        esac
        break
    fi
    [[ "$arg" == "-f" || "$arg" == "--file" ]] && prev_was_f=1 || prev_was_f=0
done

COMPOSE_DIR=""
[[ -n "$COMPOSE_FILE_ARG" ]] && COMPOSE_DIR=$(dirname "$COMPOSE_FILE_ARG")

# --- Project name -----------------------------------------------------------

if [[ -n "${LC_PROJECT:-}" ]]; then
    PROJECT="$LC_PROJECT"
else
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "default")
    # Sanitize: lowercase, replace non-alphanumeric with dash, trim dashes
    PROJECT=$(echo "lc-$BRANCH" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
    [[ -n "$STACK" ]] && PROJECT="${PROJECT}-${STACK}"
fi

# --- Port computation -------------------------------------------------------
# NOTE: Base ports are also defined in:
#   - tests/e2e/tests/helpers/ports.ts   (TypeScript, for test code)
#   - compose files via ${VAR:-default}  (YAML fallbacks)
# If you add or change a base port here, update those files too.

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

# --- Port-in-use helper (reused by auto-detect and conflict check) ----------

port_in_use() {
    local port=$1
    if command -v lsof >/dev/null 2>&1; then
        lsof -iTCP:"$port" -sTCP:LISTEN -t >/dev/null 2>&1 && return 0
    elif command -v ss >/dev/null 2>&1; then
        ss -tlnH "sport = :$port" 2>/dev/null | grep -q . && return 0
    fi
    return 1
}

# --- Auto-detect proxy port (for proxy compose files) -----------------------
# When running a *-proxy compose without an explicit PROXY_PORT, scan for a
# free port starting at 8080. Writes the chosen port to .proxy-port so other
# tools (e.g. the test runner via ports.ts) can discover it.

if [[ "$STACK" == *proxy* ]] && [[ -z "${PROXY_PORT:-}" ]]; then
    PROXY_PORT=8080
    while port_in_use "$PROXY_PORT"; do
        PROXY_PORT=$((PROXY_PORT + 1))
        if [[ "$PROXY_PORT" -gt 8099 ]]; then
            echo "ERROR: No free proxy port found in range 8080-8099" >&2
            exit 1
        fi
    done
fi

if [[ -n "${PROXY_PORT:-}" ]]; then
    export PROXY_PORT
    # Write to .proxy-port so the test runner can discover the chosen port
    [[ -n "$COMPOSE_DIR" ]] && echo "$PROXY_PORT" > "$COMPOSE_DIR/.proxy-port"
fi

# --- Info --------------------------------------------------------------------

if [[ -n "${PROXY_PORT:-}" ]]; then
    echo "┌─────────────────────────────────────────────┐"
    echo "│  dc.sh — PROXY MODE (port $PROXY_PORT)"
    echo "│  Project: $PROJECT"
    echo "│"
    echo "│  All HTTP services: localhost:$PROXY_PORT"
    echo "│    /brain/*   → brain:4000"
    echo "│    /cloud/*   → cloud:4100"
    echo "│    /signing/* → signing:4200"
    echo "│    /api/*     → api:5100"
    echo "│    /lca-api/* → lca-api:5200"
    echo "│    /*         → app:3000"
    echo "└─────────────────────────────────────────────┘"
elif [[ "$OFFSET" -ne 0 ]]; then
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
    echo "│  lrs:      localhost:$LRS_HOST_PORT"
    echo "└─────────────────────────────────────────────┘"
fi

# --- Detect 'up' and 'down' commands ----------------------------------------

IS_UP=0; IS_DOWN=0
for arg in "$@"; do
    [[ "$arg" == "up" ]]   && IS_UP=1   && break
    [[ "$arg" == "down" ]] && IS_DOWN=1 && break
done

# --- Clean up .proxy-port on 'down' -----------------------------------------

if [[ "$IS_DOWN" -eq 1 && -n "$COMPOSE_DIR" && -f "$COMPOSE_DIR/.proxy-port" ]]; then
    rm -f "$COMPOSE_DIR/.proxy-port"
fi

# --- Port conflict check (only on 'up') -------------------------------------

if [[ "$IS_UP" -eq 1 ]]; then
    CONFLICTS=0
    for pair in \
        "$BRAIN_HOST_PORT:brain" \
        "$CLOUD_HOST_PORT:cloud" \
        "$SIGNING_HOST_PORT:signing" \
        "$LCA_API_HOST_PORT:lca-api" \
        "$NEO4J_BOLT_HOST_PORT:neo4j-bolt" \
        "$MONGO_HOST_PORT:mongo" \
        "$POSTGRES_HOST_PORT:postgres" \
        "$REDIS1_HOST_PORT:redis1" \
        "$REDIS2_HOST_PORT:redis2" \
        "$REDIS3_HOST_PORT:redis3"; do
        port="${pair%%:*}"; name="${pair#*:}"
        if port_in_use "$port"; then
            echo "⚠  Port $port ($name) is already in use" >&2
            CONFLICTS=1
        fi
    done

    if [[ "$CONFLICTS" -eq 1 ]]; then
        echo "Hint: set PORT_OFFSET to avoid collisions (e.g. PORT_OFFSET=100)" >&2
    fi
fi

# --- Exec --------------------------------------------------------------------

exec docker compose -p "$PROJECT" "$@"
