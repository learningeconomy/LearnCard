#!/usr/bin/env bash
set -euo pipefail
SOURCE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT
helpers=$(sed -n '/^# BEGIN hosted browser build helpers$/,/^# END hosted browser build helpers$/p' "$SOURCE_ROOT/scripts/e2e-hosted/run-browser.sh")
[[ "$helpers" == *'# END hosted browser build helpers'* ]] || { echo 'Missing host build helper markers' >&2; exit 1; }
eval "$helpers"
declare -F build_host_browser_images cleanup_browser_build >/dev/null
REPO_ROOT="$TEST_ROOT/repo"
APP_DIR="$REPO_ROOT/apps/learn-card-app"
BAKE_FILE="$SOURCE_ROOT/scripts/e2e-hosted/docker-bake.hcl"
E2E_ARTIFACT_DIR="$TEST_ROOT/artifacts"
docker buildx bake --file "$BAKE_FILE" --print hosted-browser-backend hosted-browser-app \
    | ruby -rjson -e '
        bake = JSON.parse(STDIN.read)
        abort "host build must exclude full build dependencies" unless bake.dig("group", "hosted-browser-backend", "targets") == %w[backend-dependency-cache browser-base browser-delete]
        app = bake.fetch("target").fetch("hosted-browser-app")
        abort "runtime must use a workspace-local staged context" unless app.fetch("context") == "node_modules/.cache/e2e-browser-runtime"
        abort "runtime must not copy monorepo" if app.key?("contexts")
    '
mkdir -p "$APP_DIR" "$REPO_ROOT/scripts/e2e-hosted" "$E2E_ARTIFACT_DIR"
cp "$SOURCE_ROOT/scripts/e2e-hosted/Dockerfile.browser-runtime" "$REPO_ROOT/scripts/e2e-hosted/"
echo nginx > "$APP_DIR/nginx.conf"
git() { echo tested-checkout-sha; }
bunx() {
    [[ "$SENTRY_BUILD_TELEMETRY" == false ]] || return 1
    [[ "$GITHUB_SHA" == tested-checkout-sha && "$SKIP_DIDKIT_NAPI" == 1 && "$NX_DAEMON" == false ]] || return 1
    [[ "$*" == 'nx run learn-card-app:docker-build --verbose --skip-nx-cache' ]] || return 1
    [[ "$FAIL_HOST" == false ]] || return 1
    mkdir -p "$APP_DIR/build" "$REPO_ROOT/packages/learn-card-types/dist" \
        "$REPO_ROOT/packages/learn-card-init/dist" "$REPO_ROOT/packages/plugins/lca-api-plugin/dist"
    echo compiled > "$APP_DIR/build/index.html"
}
e2e_timed() { shift; "$@"; }
docker() {
    if [[ "$*" == *hosted-browser-backend* ]]; then
        sleep 0.1
        echo 'backend diagnostic marker'
        echo reaped > "$TEST_ROOT/backend-finished"
        [[ "$FAIL_BACKEND" == false ]]
    else
        echo 'runtime stdout diagnostic marker'
        echo 'runtime stderr diagnostic marker' >&2
        [[ "$FAIL_RUNTIME" == false ]] || return 1
        [[ -s "$E2E_BROWSER_RUNTIME_CONTEXT/build/index.html" ]] || return 1
        [[ -s "$E2E_BROWSER_RUNTIME_CONTEXT/nginx.conf" ]] || return 1
        echo runtime > "$TEST_ROOT/runtime-built"
    fi
}
for failure in none host backend runtime; do
    FAIL_HOST=false FAIL_BACKEND=false FAIL_RUNTIME=false
    [[ "$failure" != host ]] || FAIL_HOST=true
    [[ "$failure" != backend ]] || FAIL_BACKEND=true
    [[ "$failure" != runtime ]] || FAIL_RUNTIME=true
    rm -f "$TEST_ROOT/backend-finished" "$TEST_ROOT/runtime-built"
    rm -f "$E2E_ARTIFACT_DIR/docker-buildx-bake-runtime.log"
    status=0
    build_host_browser_images 2> "$TEST_ROOT/build-stderr" || status=$?
    [[ -f "$TEST_ROOT/backend-finished" ]] # Both failures still reap the backend.
    [[ ! -e "$E2E_BROWSER_RUNTIME_CONTEXT" ]] # Only the owned context is removed.
    if [[ "$failure" == none ]]; then
        [[ "$status" == 0 && -f "$TEST_ROOT/runtime-built" ]]
    else
        [[ "$status" != 0 && ! -e "$TEST_ROOT/runtime-built" ]]
    fi
    if [[ "$failure" == backend ]]; then
        grep -Fq 'backend diagnostic marker' "$TEST_ROOT/build-stderr"
    fi
    if [[ "$failure" == none || "$failure" == runtime ]]; then
        grep -Fq 'runtime stdout diagnostic marker' "$E2E_ARTIFACT_DIR/docker-buildx-bake-runtime.log"
        grep -Fq 'runtime stderr diagnostic marker' "$E2E_ARTIFACT_DIR/docker-buildx-bake-runtime.log"
    else
        [[ ! -e "$E2E_ARTIFACT_DIR/docker-buildx-bake-runtime.log" ]]
    fi
done

mkdir -p "$TEST_ROOT/unowned-context"
E2E_BROWSER_RUNTIME_CONTEXT="$TEST_ROOT/unowned-context"
cleanup_browser_build
[[ -d "$E2E_BROWSER_RUNTIME_CONTEXT" ]] # An externally supplied path is not ours.

# Exercise real metrics and signal handling while both builds own a long-lived
# command and grandchild. No Docker daemon or installed dependencies are needed.
printf '%s\n' "$helpers" > "$TEST_ROOT/cancel-build.sh"
cat >> "$TEST_ROOT/cancel-build.sh" <<'SH'
set -Eeuo pipefail
source "$SOURCE_ROOT/scripts/e2e-hosted/metrics.sh"
e2e_metrics_init cancellation
trap 'status=$?; cleanup_browser_build; exit "$status"' EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
git() { echo tested-checkout-sha; }
worker() {
    python3 - "$TEST_ROOT/$1-pids" <<'PY'
import json, os, pathlib, signal, subprocess, sys
child = subprocess.Popen(['sleep', '60'])
def respawn_child(_signal, _frame):
    replacement = subprocess.Popen(['sleep', '60'])
    pathlib.Path(sys.argv[1] + '.respawn').write_text(str(replacement.pid))
signal.signal(signal.SIGCHLD, respawn_child)
pathlib.Path(sys.argv[1]).write_text(json.dumps([os.getpid(), child.pid]))
while True:
    signal.pause()
PY
}
bunx() {
    printf '%s\n' "$E2E_BROWSER_RUNTIME_CONTEXT" > "$TEST_ROOT/context"
    worker host
}
docker() { worker backend; }
# Make the child-exit/parent-termination race deterministic: an unfrozen parent
# has time to react to SIGCHLD and spawn replacement work before it is stopped.
kill() {
    builtin kill "$@" || return
    [[ "$1" != -TERM ]] || sleep 0.1
}
# Test the actual outer timing wrapper, including its parent-shell cleanup state.
e2e_timed image_preparation build_host_browser_images
SH
export SOURCE_ROOT TEST_ROOT REPO_ROOT APP_DIR BAKE_FILE E2E_ARTIFACT_DIR
python3 - <<'PY'
import json, os, pathlib, signal, subprocess, time
root = pathlib.Path(os.environ['TEST_ROOT'])
def wait_for(condition):
    deadline = time.monotonic() + 5
    while not condition():
        assert time.monotonic() < deadline, 'Timed out waiting for cancellation fixture'
        time.sleep(0.02)
def stopped(pid):
    state = subprocess.run(['ps', '-o', 'stat=', '-p', str(pid)], capture_output=True, text=True).stdout.strip()
    return not state or state.startswith('Z')
for sig, code in [(signal.SIGTERM, 143), (signal.SIGINT, 130)]:
    for name in ['host-pids', 'backend-pids', 'context', 'host-pids.respawn', 'backend-pids.respawn']:
        (root / name).unlink(missing_ok=True)
    with (root / 'cancel.log').open('w') as output:
        job = subprocess.Popen(['bash', str(root / 'cancel-build.sh')], stdout=output, stderr=output, start_new_session=True)
        try:
            wait_for(lambda: all((root / name).exists() and (root / name).stat().st_size for name in ['host-pids', 'backend-pids', 'context']))
            pids = json.loads((root / 'host-pids').read_text()) + json.loads((root / 'backend-pids').read_text())
            context = pathlib.Path((root / 'context').read_text().strip())
            assert context.is_dir()
            job.send_signal(sig)
            assert job.wait(timeout=5) == code
            assert not context.exists(), 'Cancelled build left its staged context behind'
            wait_for(lambda: all(stopped(pid) for pid in pids))
            assert not (root / 'host-pids.respawn').exists(), 'Host parent forked replacement work during cleanup'
            assert not (root / 'backend-pids.respawn').exists(), 'Backend parent forked replacement work during cleanup'
        finally:
            # Fixture-only session: never leave a test process behind on failure.
            try:
                os.killpg(job.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            job.wait()
PY
echo 'Hosted browser build failure logs, staging, and cancellation passed'
