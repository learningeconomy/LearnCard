#!/usr/bin/env bash
set -euo pipefail
SOURCE_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT
REPO_ROOT="$TEST_ROOT/repo"
E2E_ARTIFACT_DIR="$TEST_ROOT/artifacts"
mkdir -p "$REPO_ROOT" "$E2E_ARTIFACT_DIR"
source "$SOURCE_ROOT/scripts/e2e-hosted/prepare-sdk-build.sh"
# Load only the real suite entrypoint; the test never starts or stops a stack.
eval "$(sed -n '/^run_service_suite() {$/,/^}$/p' "$SOURCE_ROOT/scripts/e2e-hosted/run-service.sh")"
e2e_timed() { shift; "$@"; }
node() {
    echo "$2" >> "$TEST_ROOT/prepare"
    case "$2" in
        restore) [[ "$RESTORE_OK" == true ]] ;;
        build) [[ "$BUILD_OK" == true && "$5" == service ]] ;;
        *) return 99 ;;
    esac
}
bunx() {
    [[ "$*" == "nx run e2e:test:e2e --verbose --skip-nx-cache$EXPECTED_SKIP" ]] || return 98
    [[ "$E2E_VITEST_ARGS" == --shard=2/3 && "$E2E_MANAGE_DOCKER" == false && "$NX_DAEMON" == false ]] || return 99
    echo fresh-test-execution >> "$TEST_ROOT/tests"
    return "$TEST_STATUS"
}
E2E_SDK_SPEC="$TEST_ROOT/spec" E2E_SDK_CACHE_DIR="$TEST_ROOT/cache"
E2E_SHARD=2 E2E_SHARD_TOTAL=3
for scenario in disabled miss baseline hit corrupt build-failed test-failed; do
    : > "$TEST_ROOT/prepare"
    : > "$TEST_ROOT/tests"
    E2E_SDK_CACHE_ENABLED=true E2E_SDK_CACHE_HIT=false
    RESTORE_OK=true BUILD_OK=true TEST_STATUS=0
    EXPECTED_SKIP=' --excludeTaskDependencies'
    case "$scenario" in
        disabled) E2E_SDK_CACHE_ENABLED=false; EXPECTED_SKIP='' ;;
        hit) E2E_SDK_CACHE_HIT=true ;;
        corrupt) E2E_SDK_CACHE_HIT=true; RESTORE_OK=false ;;
        build-failed) BUILD_OK=false ;;
        test-failed) TEST_STATUS=7 ;;
    esac
    status=0
    run_service_suite || status=$?
    if [[ "$scenario" == build-failed ]]; then
        [[ "$status" != 0 && "$E2E_SDK_PREPARED" == false && ! -s "$TEST_ROOT/tests" ]]
    else
        [[ $(wc -l < "$TEST_ROOT/tests") == 1 ]]
        if [[ "$scenario" == test-failed ]]; then [[ "$status" == 7 ]]; else [[ "$status" == 0 ]]; fi
    fi
    case "$scenario" in
        disabled) [[ ! -s "$TEST_ROOT/prepare" ]] ;;
        hit) [[ $(cat "$TEST_ROOT/prepare") == restore ]] ;;
        corrupt) [[ $(cat "$TEST_ROOT/prepare") == $'restore\nbuild' ]] ;;
        *) [[ $(cat "$TEST_ROOT/prepare") == build ]] ;;
    esac
done
echo 'SDK miss/hit/corruption/disabled paths, fresh sharded test execution and failure propagation passed'
