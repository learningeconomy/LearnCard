#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
source "$REPO_ROOT/scripts/e2e-hosted/prepare-sdk-build.sh"
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT
E2E_SDK_SPEC="$TEST_ROOT/spec" E2E_SDK_CACHE_DIR="$TEST_ROOT/cache"
E2E_SDK_CACHE_WRITER=true
node() {
    case "$2" in
        restore) return "$RESTORE_STATUS" ;;
        projects) echo types,init ;;
        clean) return 0 ;;
        snapshot) echo snapshot >> "$TEST_ROOT/calls" ;;
        *) return 1 ;;
    esac
}
bunx() {
    echo build >> "$TEST_ROOT/calls"
    [[ "$*" == 'nx run-many -t build -p types,init --verbose --skip-nx-cache' ]] || return 1
    return "$BUILD_STATUS"
}
env() { while [[ "$1" == *=* ]]; do shift; done; "$@"; }
e2e_timed() { shift; set +e; "$@"; }
for scenario in hit miss invalid failed-build; do
    E2E_SDK_CACHE_HIT=true RESTORE_STATUS=0 BUILD_STATUS=0
    case "$scenario" in
        miss) E2E_SDK_CACHE_HIT=false ;;
        invalid) RESTORE_STATUS=1 ;;
        failed-build) RESTORE_STATUS=1 BUILD_STATUS=1 ;;
    esac
    : > "$TEST_ROOT/calls"
    status=0
    prepare_sdk_build || status=$?
    set -e
    case "$scenario" in
        hit) [[ "$status" == 0 && ! -s "$TEST_ROOT/calls" ]] ;;
        miss|invalid) [[ "$status" == 0 && "$(cat "$TEST_ROOT/calls")" == $'build\nsnapshot' ]] ;;
        failed-build) [[ "$status" != 0 && "$(cat "$TEST_ROOT/calls")" == build ]] ;;
    esac
done
echo 'Exact cache hits, misses, invalid restores, and build failures passed'
