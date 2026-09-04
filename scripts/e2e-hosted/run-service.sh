#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVICE_DIR="$REPO_ROOT/tests/e2e"
: "${E2E_ARTIFACT_DIR:?E2E_ARTIFACT_DIR must be set}"

source "$REPO_ROOT/scripts/e2e-hosted/metrics.sh"
e2e_metrics_init service

collect_service_artifacts() {
    local status=$?
    set +e
    cd "$SERVICE_DIR"
    docker compose logs --no-color > "$E2E_ARTIFACT_DIR/docker-compose.log" 2>&1
    e2e_snapshot before-cleanup
    docker compose down --remove-orphans -v
    e2e_snapshot after-cleanup
    e2e_render_summary
    exit "$status"
}
trap collect_service_artifacts EXIT

run_service_suite() {
    cd "$REPO_ROOT"
    E2E_MANAGE_DOCKER=false NX_DAEMON=false bunx nx run e2e:test:e2e --verbose \
        2>&1 | tee "$E2E_ARTIFACT_DIR/vitest.log"
}

start_service_stack() {
    cd "$SERVICE_DIR"
    BUILDKIT_PROGRESS=plain docker compose up -d --build \
        2>&1 | tee "$E2E_ARTIFACT_DIR/docker-compose-build-start.log"
}

e2e_snapshot startup
e2e_timed service_compose_build_start start_service_stack
e2e_snapshot service-stack-running
e2e_timed service_e2e run_service_suite
e2e_snapshot after-service-suite
