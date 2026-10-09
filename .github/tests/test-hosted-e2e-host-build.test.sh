#!/usr/bin/env bash
set -euo pipefail
SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT
eval "$(sed -n '/^build_host_browser()/,/^start_compose()/{ /^start_compose()/d; p; }' "$SOURCE_ROOT/scripts/e2e-hosted/run-browser.sh")"
REPO_ROOT="$TEST_ROOT/repo"
APP_DIR="$REPO_ROOT/apps/learn-card-app"
BAKE_FILE="$SOURCE_ROOT/scripts/e2e-hosted/docker-bake.hcl"
E2E_ARTIFACT_DIR="$TEST_ROOT/artifacts"
docker buildx bake --file "$BAKE_FILE" --print hosted-browser-backend hosted-browser-app \
    | ruby -rjson -e '
        bake = JSON.parse(STDIN.read)
        abort "host build must exclude full build dependencies" unless bake.dig("group", "hosted-browser-backend", "targets") == %w[backend-dependency-cache browser-base browser-delete]
        app = bake.fetch("target").fetch("hosted-browser-app")
        abort "runtime must use the staged context" unless app.fetch("context") == "/tmp/learncard-browser-runtime"
        abort "runtime must not copy monorepo" if app.key?("contexts")
    '
mkdir -p "$APP_DIR" "$REPO_ROOT/scripts/e2e-hosted" "$E2E_ARTIFACT_DIR"
cp "$SOURCE_ROOT/scripts/e2e-hosted/Dockerfile.browser-runtime" "$REPO_ROOT/scripts/e2e-hosted/"
echo nginx > "$APP_DIR/nginx.conf"
git() { echo tested-checkout-sha; }
bunx() {
    [[ "$GITHUB_SHA" == tested-checkout-sha && "$SKIP_DIDKIT_NAPI" == 1 && "$NX_DAEMON" == false ]] || return 1
    [[ "$*" == 'nx run learn-card-app:docker-build --verbose --skip-nx-cache' ]] || return 1
    [[ "$FAIL_HOST" == false ]] || return 1
    mkdir -p "$APP_DIR/build" "$REPO_ROOT/packages/learn-card-types/dist" \
        "$REPO_ROOT/packages/learn-card-init/dist" "$REPO_ROOT/packages/plugins/lca-api-plugin/dist"
    echo compiled > "$APP_DIR/build/index.html"
}
e2e_timed() { shift; set +e; "$@"; }
docker() {
    if [[ "$*" == *hosted-browser-backend* ]]; then
        sleep 0.1
        echo reaped > "$TEST_ROOT/backend-finished"
        [[ "$FAIL_BACKEND" == false ]]
    else
        [[ -s "$E2E_BROWSER_RUNTIME_CONTEXT/build/index.html" ]] || return 1
        [[ -s "$E2E_BROWSER_RUNTIME_CONTEXT/nginx.conf" ]] || return 1
        echo runtime > "$TEST_ROOT/runtime-built"
    fi
}
for failure in none host backend; do
    FAIL_HOST=false FAIL_BACKEND=false
    [[ "$failure" != host ]] || FAIL_HOST=true
    [[ "$failure" != backend ]] || FAIL_BACKEND=true
    rm -f "$TEST_ROOT/backend-finished" "$TEST_ROOT/runtime-built"
    status=0
    build_host_browser_images || status=$?
    set -e
    [[ -f "$TEST_ROOT/backend-finished" ]] # Both failures still reap the backend.
    [[ ! -e "$E2E_BROWSER_RUNTIME_CONTEXT" ]] # Only the owned context is removed.
    if [[ "$failure" == none ]]; then
        [[ "$status" == 0 && -f "$TEST_ROOT/runtime-built" ]]
    else
        [[ "$status" != 0 && ! -e "$TEST_ROOT/runtime-built" ]]
    fi
done
echo 'Hosted browser build failure propagation and staging passed'
