#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
APP_DIR="$REPO_ROOT/apps/learn-card-app"
BAKE_FILE="$REPO_ROOT/scripts/e2e-hosted/docker-bake.hcl"
: "${E2E_ARTIFACT_DIR:?E2E_ARTIFACT_DIR must be set}"
E2E_TEST_FILES="${E2E_TEST_FILES:-consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts}"
BROWSER_BUILD_BACKEND_PID=""
BROWSER_BUILD_HOST_PID=""
BROWSER_RUNTIME_CONTEXT=""

source "$REPO_ROOT/scripts/e2e-hosted/metrics.sh"
e2e_metrics_init browser

collect_browser_artifacts() {
    local status=$?
    set +e
    cleanup_browser_build
    cd "$APP_DIR"
    docker compose logs --no-color > "$E2E_ARTIFACT_DIR/docker-compose.log" 2>&1
    for path in playwright-report test-results playwright-report-a11y test-results-a11y; do
        [[ ! -e "$path" ]] || cp -R "$path" "$E2E_ARTIFACT_DIR/"
    done
    e2e_snapshot before-cleanup
    e2e_timed stack_teardown docker compose down --remove-orphans -v
    e2e_snapshot after-cleanup
    e2e_render_summary
    exit "$status"
}
trap collect_browser_artifacts EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

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

build_images() {
    cd "$REPO_ROOT"
    docker buildx bake --file "$BAKE_FILE" browser --load --progress=plain \
        2>&1 | tee "$E2E_ARTIFACT_DIR/docker-buildx-bake.log"
}

# BEGIN hosted browser build helpers
stop_browser_build() {
    local pid="${1:?build PID required}" child
    # e2e_timed runs in a subshell; stop its Docker/Bun descendants as well.
    while read -r child; do
        [[ -z "$child" ]] || stop_browser_build "$child"
    done < <(pgrep -P "$pid" || true)
    kill -TERM "$pid" 2>/dev/null || true
}

cleanup_browser_build() {
    local pid
    for pid in "${BROWSER_BUILD_HOST_PID:-}" "${BROWSER_BUILD_BACKEND_PID:-}"; do
        if [[ -n "$pid" ]]; then
            stop_browser_build "$pid"
            wait "$pid" 2>/dev/null || true
        fi
    done
    BROWSER_BUILD_HOST_PID="" BROWSER_BUILD_BACKEND_PID=""
    if [[ -n "${BROWSER_RUNTIME_CONTEXT:-}" ]]; then
        rm -rf "$BROWSER_RUNTIME_CONTEXT"
        BROWSER_RUNTIME_CONTEXT=""
    fi
}

build_host_browser() {
    cd "$REPO_ROOT" || return
    # The app's ^build graph includes all three SDK roots used by Playwright.
    # Use the tested checkout for Vite provenance, including manual dispatches.
    GITHUB_SHA=$(git rev-parse HEAD) SKIP_DIDKIT_NAPI=1 NX_DAEMON=false \
        bunx nx run learn-card-app:docker-build --verbose --skip-nx-cache || return
    [[ -s "$APP_DIR/build/index.html" ]] || return 1
    local output
    for output in packages/learn-card-types/dist packages/learn-card-init/dist packages/plugins/lca-api-plugin/dist; do
        [[ -d "$REPO_ROOT/$output" ]] || { echo "Missing fixture build: $output" >&2; return 1; }
    done
    mkdir -p "$E2E_BROWSER_RUNTIME_CONTEXT" || return
    cp -R "$APP_DIR/build" "$E2E_BROWSER_RUNTIME_CONTEXT/build" || return
    cp "$APP_DIR/nginx.conf" "$E2E_BROWSER_RUNTIME_CONTEXT/nginx.conf" || return
    cp "$REPO_ROOT/scripts/e2e-hosted/Dockerfile.browser-runtime" "$E2E_BROWSER_RUNTIME_CONTEXT/Dockerfile" || return
}

build_host_browser_images() {
    cd "$REPO_ROOT" || return
    mkdir -p "$REPO_ROOT/node_modules/.cache" || return
    BROWSER_RUNTIME_CONTEXT=$(mktemp -d "$REPO_ROOT/node_modules/.cache/e2e-browser-runtime.XXXXXX") || return
    E2E_BROWSER_RUNTIME_CONTEXT="$BROWSER_RUNTIME_CONTEXT"
    export E2E_BROWSER_RUNTIME_CONTEXT
    # Reap both jobs even when one fails: e2e_timed disables errexit.
    e2e_timed backend_image_build docker buildx bake --file "$BAKE_FILE" hosted-browser-backend \
        --load --progress=plain > "$E2E_ARTIFACT_DIR/docker-buildx-bake.log" 2>&1 &
    BROWSER_BUILD_BACKEND_PID=$!
    local status=0
    # Waiting on background jobs lets INT/TERM reach the EXIT cleanup promptly.
    e2e_timed host_browser_build build_host_browser &
    BROWSER_BUILD_HOST_PID=$!
    wait "$BROWSER_BUILD_HOST_PID" || status=1
    BROWSER_BUILD_HOST_PID=""
    if ! wait "$BROWSER_BUILD_BACKEND_PID"; then
        status=1
        echo 'Backend image build failed; last 100 log lines:' >&2
        tail -n 100 "$E2E_ARTIFACT_DIR/docker-buildx-bake.log" >&2
    fi
    BROWSER_BUILD_BACKEND_PID=""
    if [[ "$status" -eq 0 ]]; then
        e2e_timed browser_runtime_image docker buildx bake --file "$BAKE_FILE" hosted-browser-app \
            --load --progress=plain &
        BROWSER_BUILD_HOST_PID=$!
        wait "$BROWSER_BUILD_HOST_PID" || status=1
        BROWSER_BUILD_HOST_PID=""
    fi
    cleanup_browser_build
    return "$status"
}
# END hosted browser build helpers

start_compose() {
    cd "$APP_DIR"
    docker compose down --remove-orphans -v 2>/dev/null || true
    docker compose up -d --no-build
}

build_test_dependencies() {
    cd "$REPO_ROOT"
    NX_DAEMON=false bunx nx run-many -t build -p types,init,lca-api-plugin --verbose
}

prepare_browser_runner() {
    cd "$REPO_ROOT"
    local version
    version=$(node -p 'require("playwright/package.json").version')
    PLAYWRIGHT_RUNNER_IMAGE="mcr.microsoft.com/playwright:v${version}-noble"
    PLAYWRIGHT_CLI=$(node -p 'require("path").join(require("path").dirname(require.resolve("playwright/package.json")), "cli.js")')
    echo "Using preinstalled browsers from $PLAYWRIGHT_RUNNER_IMAGE"
    docker pull "$PLAYWRIGHT_RUNNER_IMAGE"
}

playwright_command() {
    # Same absolute workspace path preserves Bun's workspace links. Host networking
    # keeps localhost URLs working for browser requests and SDK/global setup calls.
    docker run --rm --init --network host --ipc host \
        --user "$(id -u):$(id -g)" --env HOME=/tmp \
        --env CI --env GITHUB_ACTIONS --env GITHUB_WORKSPACE \
        --env E2E_EXTERNAL_STACK=true \
        --volume "$REPO_ROOT:$REPO_ROOT" --workdir "$APP_DIR" \
        "$PLAYWRIGHT_RUNNER_IMAGE" node "$PLAYWRIGHT_CLI" "$@"
}

wait_for_stack() {
    wait_for_url app http://localhost:3000 300 & local app_pid=$!
    wait_for_url brain http://localhost:4000/api/health-check 300 & local brain_pid=$!
    wait_for_url cloud http://localhost:4100/api/health-check 300 & local cloud_pid=$!
    # e2e_timed disables errexit: explicitly retain failure while reaping every child.
    local status=0
    wait "$app_pid" || status=1
    wait "$brain_pid" || status=1
    wait "$cloud_pid" || status=1
    return "$status"
}

run_playwright() {
    local -a test_files
    read -r -a test_files <<< "$E2E_TEST_FILES"
    cd "$APP_DIR"
    # Legacy specs still reset the whole database. Only the audited isolated
    # suites may use parallel workers; a mixed/manual selection stays serial.
    local config=playwright.parallel.config.ts
    local file
    for file in "${test_files[@]}"; do
        case "$file" in
            consent-flow-race.spec.ts|app-store.spec.ts|wallet-credentials.spec.ts) ;;
            *) config=playwright.config.ts ;;
        esac
    done
    echo "Running browser suites with $config"
    playwright_command test "${test_files[@]}" --config="$config"
}

run_accessibility() {
    cd "$APP_DIR"
    playwright_command test accessibility.spec.ts --config=playwright.a11y.config.ts
}

e2e_snapshot startup
if [[ "${E2E_HOST_BROWSER_BUILD:-false}" == true ]]; then
    e2e_timed image_preparation build_host_browser_images
else
    e2e_timed docker_buildx_bake build_images
fi
e2e_snapshot after-image-build
e2e_timed compose_start start_compose
if [[ "${E2E_HOST_BROWSER_BUILD:-false}" != true ]]; then
    e2e_timed host_dependency_build build_test_dependencies
fi
e2e_timed playwright_runner_prepare prepare_browser_runner
e2e_snapshot stack-running
e2e_timed service_readiness wait_for_stack
e2e_timed cloud_did_resolution bash -c \
    'cd "$1/apps/learn-card-app" && bash "$1/scripts/e2e-hosted/verify-service-did-resolution.sh"' \
    _ "$REPO_ROOT"
e2e_timed playwright run_playwright
e2e_timed accessibility run_accessibility
