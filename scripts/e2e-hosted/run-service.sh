#!/usr/bin/env bash
set -Eeuo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SERVICE_DIR="$REPO_ROOT/tests/e2e"
BAKE_FILE="$REPO_ROOT/scripts/e2e-hosted/docker-bake.hcl"
: "${E2E_ARTIFACT_DIR:?E2E_ARTIFACT_DIR must be set}"

source "$REPO_ROOT/scripts/e2e-hosted/metrics.sh"
source "$REPO_ROOT/scripts/e2e-hosted/compose-pull.sh"
source "$REPO_ROOT/scripts/e2e-hosted/prepare-sdk-build.sh"
e2e_metrics_init service

stop_sdk_preparation_tree() {
    local pid="${1:?SDK preparation PID required}" child
    # Same shape as run-browser.sh: freeze each parent before enumerating its
    # children so Bun/Nx/tsc cannot fork replacements, then TERM the whole tree.
    kill -STOP "$pid" 2>/dev/null || return 0
    while read -r child; do
        [[ -z "$child" ]] || stop_sdk_preparation_tree "$child"
    done < <(pgrep -P "$pid" || true)
    kill -TERM "$pid" 2>/dev/null || true
    kill -CONT "$pid" 2>/dev/null || true
}

cleanup_sdk_preparation() {
    if [[ -n "${E2E_SDK_PREP_PID:-}" ]]; then
        stop_sdk_preparation_tree "$E2E_SDK_PREP_PID"
        wait "$E2E_SDK_PREP_PID" 2>/dev/null || true
    fi
    E2E_SDK_PREP_PID=''
}

collect_service_artifacts() {
    local status=$?
    set +e
    cleanup_sdk_preparation
    cd "$SERVICE_DIR"
    docker compose logs --no-color > "$E2E_ARTIFACT_DIR/docker-compose.log" 2>&1
    e2e_snapshot before-cleanup
    # A GitHub-hosted VM is discarded after the job, so tearing the stack down
    # (and re-measuring disk) only delayed the result by ~30s.
    if [[ "${RUNNER_ENVIRONMENT:-}" == github-hosted ]]; then
        echo 'Skipping stack teardown on an ephemeral GitHub-hosted runner.'
    else
        e2e_timed stack_teardown docker compose down --remove-orphans -v
        e2e_snapshot after-cleanup
    fi
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
    # These host SDK prerequisites use the same Sentry plugins as the browser.
    export SENTRY_BUILD_TELEMETRY=false
    if [[ -n "${E2E_SDK_PREP_PID:-}" ]]; then
        local prep_status=0
        wait "$E2E_SDK_PREP_PID" || prep_status=$?
        E2E_SDK_PREP_PID=''
        cat "$E2E_SDK_PREP_LOG"
        (( prep_status == 0 )) || return "$prep_status"
        E2E_SDK_PREPARED="$(<"$E2E_SDK_PREP_STATE")"
    else
        prepare_shared_sdk service || return
    fi
    local dependency_args=()
    [[ "$E2E_SDK_PREPARED" != true ]] || dependency_args=(--excludeTaskDependencies)
    local vitest_args=''
    if [[ -n "${E2E_SHARD:-}" && -n "${E2E_SHARD_TOTAL:-}" ]]; then
        vitest_args="--shard=${E2E_SHARD}/${E2E_SHARD_TOTAL}"
        echo "Running vitest shard ${E2E_SHARD}/${E2E_SHARD_TOTAL}"
    fi
    E2E_VITEST_ARGS="$vitest_args" \
        E2E_MANAGE_DOCKER=false NX_DAEMON=false bunx nx run e2e:test:e2e --verbose --skip-nx-cache ${dependency_args[@]+"${dependency_args[@]}"} \
        2>&1 | tee "$E2E_ARTIFACT_DIR/vitest.log"
}

# The host SDK build only writes packages/*/dist and generated/swagger-ui, which
# neither the (already built) images nor Compose's src/ bind mounts read, so it
# overlaps stack startup instead of running after it (~1.5 min per shard).
# It must start after the bake: the backend build context includes generated/.
start_shared_sdk_preparation() {
    E2E_SDK_PREP_STATE="$E2E_ARTIFACT_DIR/sdk-prepared.state"
    E2E_SDK_PREP_LOG="$E2E_ARTIFACT_DIR/sdk-build.log"
    (
        cd "$REPO_ROOT"
        export SENTRY_BUILD_TELEMETRY=false
        prepare_shared_sdk service || exit
        printf '%s\n' "$E2E_SDK_PREPARED" > "$E2E_SDK_PREP_STATE"
    ) > "$E2E_SDK_PREP_LOG" 2>&1 &
    E2E_SDK_PREP_PID=$!
}

build_service_images() {
    cd "$REPO_ROOT"
    docker buildx bake --file "$BAKE_FILE" service --load --progress=plain \
        2>&1 | tee "$E2E_ARTIFACT_DIR/docker-buildx-bake.log"
}

start_service_stack() {
    cd "$SERVICE_DIR"
    e2e_pull_compose_images || return 1
    docker compose up -d --no-build \
        2>&1 | tee "$E2E_ARTIFACT_DIR/docker-compose-start.log"
}

e2e_snapshot startup
e2e_timed docker_buildx_bake build_service_images
e2e_snapshot after-image-build
start_shared_sdk_preparation
e2e_timed service_compose_start start_service_stack
e2e_snapshot service-stack-running
# Bound startup for every tested service before entering Vitest.
wait_for_service() {
    local name="$1" url="$2" timeout="${3:-300}"
    local deadline=$((SECONDS + timeout))
    while (( SECONDS < deadline )); do
        local remaining=$((deadline - SECONDS))
        local request_timeout=$((remaining < 10 ? remaining : 10))
        local connect_timeout=$((remaining < 5 ? remaining : 5))
        if curl --silent --fail --connect-timeout "$connect_timeout" --max-time "$request_timeout" \
            "$url" >/dev/null; then
            return 0
        fi
        remaining=$((deadline - SECONDS))
        (( remaining > 0 )) || break
        sleep "$((remaining < 2 ? remaining : 2))"
    done
    echo "$name did not become ready within $timeout seconds ($url)" >&2
    return 1
}
wait_for_service_stack() {
    wait_for_service brain http://localhost:4000/api/health-check & local brain_pid=$!
    wait_for_service cloud http://localhost:4100/.well-known/openid-configuration & local cloud_pid=$!
    wait_for_service lrs http://localhost:8080/admin/env & local lrs_pid=$!
    # e2e_timed disables errexit: retain failure while reaping every readiness check.
    local status=0
    wait "$brain_pid" || status=1
    wait "$cloud_pid" || status=1
    wait "$lrs_pid" || status=1
    return "$status"
}
e2e_timed service_readiness wait_for_service_stack
e2e_timed cloud_did_resolution bash -c \
    'cd "$1/tests/e2e" && bash "$1/scripts/e2e-hosted/verify-service-did-resolution.sh"' \
    _ "$REPO_ROOT"
e2e_timed service_e2e run_service_suite
e2e_snapshot after-service-suite
