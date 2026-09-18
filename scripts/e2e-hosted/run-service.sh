#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVICE_DIR="$REPO_ROOT/tests/e2e"
BAKE_FILE="$REPO_ROOT/scripts/e2e-hosted/docker-bake.hcl"
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

# Vitest's --shard is CLI-only, and `nx:run-script` argument forwarding is fiddly,
# so the shard is handed to the npm script through E2E_VITEST_ARGS instead. Every
# spec file calls clearDatabases() in beforeAll, so files carry no cross-file
# ordering dependency and can be split across runners with separate stacks.
run_service_suite() {
    cd "$REPO_ROOT"
    local vitest_args=''
    if [[ -n "${E2E_SHARD:-}" && -n "${E2E_SHARD_TOTAL:-}" ]]; then
        vitest_args="--shard=${E2E_SHARD}/${E2E_SHARD_TOTAL}"
        echo "Running vitest shard ${E2E_SHARD}/${E2E_SHARD_TOTAL}"
    fi
    E2E_VITEST_ARGS="$vitest_args" \
        E2E_MANAGE_DOCKER=false NX_DAEMON=false bunx nx run e2e:test:e2e --verbose --skip-nx-cache \
        2>&1 | tee "$E2E_ARTIFACT_DIR/vitest.log"
}

build_service_images() {
    cd "$REPO_ROOT"
    docker buildx bake --file "$BAKE_FILE" service --load --progress=plain \
        2>&1 | tee "$E2E_ARTIFACT_DIR/docker-buildx-bake.log"
}

start_service_stack() {
    cd "$SERVICE_DIR"
    docker compose up -d --no-build \
        2>&1 | tee "$E2E_ARTIFACT_DIR/docker-compose-start.log"
}

e2e_snapshot startup
e2e_timed docker_buildx_bake build_service_images
e2e_snapshot after-image-build
e2e_timed service_compose_start start_service_stack
e2e_snapshot service-stack-running
# Bound startup before entering Vitest's global setup health-check loop.
wait_for_service() {
    local deadline=$((SECONDS + 300))
    while (( SECONDS < deadline )); do
        if curl --silent --fail --connect-timeout 5 --max-time 10 \
            http://localhost:4000/api/health-check >/dev/null; then
            return 0
        fi
        sleep 2
    done
    echo 'Brain service did not become ready within 300 seconds' >&2
    return 1
}
e2e_timed service_readiness wait_for_service
e2e_timed service_e2e run_service_suite
e2e_snapshot after-service-suite
