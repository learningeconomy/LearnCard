#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="$REPO_ROOT/apps/learn-card-app"
: "${E2E_ARTIFACT_DIR:?E2E_ARTIFACT_DIR must be set}"
E2E_TEST_FILES="${E2E_TEST_FILES:-consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts}"

source "$REPO_ROOT/scripts/e2e-hosted/metrics.sh"
e2e_metrics_init browser

collect_browser_artifacts() {
    local status=$?
    set +e
    cd "$APP_DIR"
    docker compose logs --no-color > "$E2E_ARTIFACT_DIR/docker-compose.log" 2>&1
    for path in playwright-report test-results playwright-report-a11y test-results-a11y; do
        [[ ! -e "$path" ]] || cp -R "$path" "$E2E_ARTIFACT_DIR/"
    done
    e2e_snapshot before-cleanup
    docker compose down --remove-orphans -v
    e2e_snapshot after-cleanup
    e2e_render_summary
    exit "$status"
}
trap collect_browser_artifacts EXIT

wait_for_url() {
    local name="${1:?name required}" url="${2:?url required}" timeout="${3:-300}" start=$SECONDS
    local remaining request_timeout sleep_time
    while (( (remaining = timeout - (SECONDS - start)) > 0 )); do
        request_timeout=$((remaining < 10 ? remaining : 10))
        if curl --silent --show-error --fail --connect-timeout 5 --max-time "$request_timeout" \
            "$url" >/dev/null 2>&1; then
            return 0
        fi
        remaining=$((timeout - (SECONDS - start)))
        (( remaining > 0 )) || break
        sleep_time=$((remaining < 2 ? remaining : 2))
        sleep "$sleep_time"
    done
    echo "$name did not become ready within ${timeout}s" >&2
    return 1
}

build_base() {
    cd "$REPO_ROOT"
    docker build --progress=plain -t learncard-monorepo-local -f Dockerfile.monorepo . \
        2>&1 | tee "$E2E_ARTIFACT_DIR/docker-base-build.log"
}

build_compose() {
    cd "$APP_DIR"
    BUILDKIT_PROGRESS=plain docker compose build --parallel \
        2>&1 | tee "$E2E_ARTIFACT_DIR/docker-compose-build.log"
}

start_compose() {
    cd "$APP_DIR"
    docker compose down --remove-orphans -v 2>/dev/null || true
    docker compose up -d --no-build
}

build_test_dependencies() {
    cd "$REPO_ROOT"
    NX_DAEMON=false bunx nx run-many -t build -p types,init,lca-api-plugin --verbose
}

install_firefox() {
    cd "$REPO_ROOT"
    bunx playwright install --with-deps firefox
}

wait_for_stack() {
    wait_for_url app http://localhost:3000 300 & local app_pid=$!
    wait_for_url brain http://localhost:4000/api/health-check 300 & local brain_pid=$!
    wait_for_url cloud http://localhost:4100/api/health-check 300 & local cloud_pid=$!
    # e2e_timed disables errexit: explicitly retain failure while reaping every child.
    local status=0
    wait "$app_pid" || status=$?
    wait "$brain_pid" || status=$?
    wait "$cloud_pid" || status=$?
    return "$status"
}

run_playwright() {
    local -a test_files
    read -r -a test_files <<< "$E2E_TEST_FILES"
    cd "$APP_DIR"
    E2E_EXTERNAL_STACK=true bunx playwright test "${test_files[@]}"
}

run_accessibility() {
    cd "$APP_DIR"
    E2E_EXTERNAL_STACK=true bun run test:a11y
}

e2e_snapshot startup
e2e_timed docker_base_build build_base
e2e_snapshot after-base-build
e2e_timed docker_compose_build build_compose
e2e_snapshot after-compose-build
e2e_timed compose_start start_compose
e2e_timed host_dependency_build build_test_dependencies
e2e_timed playwright_firefox_install install_firefox
e2e_snapshot stack-running
e2e_timed service_readiness wait_for_stack
e2e_timed playwright run_playwright
e2e_timed accessibility run_accessibility
