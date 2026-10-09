#!/usr/bin/env bash

prepare_sdk_build() {
    : "${E2E_SDK_SPEC:?E2E_SDK_SPEC required}"
    : "${E2E_SDK_CACHE_DIR:?E2E_SDK_CACHE_DIR required}"
    cd "$REPO_ROOT" || return
    local cache_script="$REPO_ROOT/scripts/e2e-hosted/sdk-build-cache.mjs" projects release
    if [[ "${E2E_SDK_CACHE_HIT:-false}" == true ]]; then
        if e2e_timed sdk_output_restore node "$cache_script" restore "$E2E_SDK_SPEC" "$E2E_SDK_CACHE_DIR"; then
            return 0
        fi
        echo 'SDK cache failed verification; rebuilding every SDK prerequisite.' >&2
    fi
    projects=$(node "$cache_script" projects "$E2E_SDK_SPEC") || return
    release=$(node "$cache_script" release "$E2E_SDK_SPEC") || return
    node "$cache_script" clean "$E2E_SDK_SPEC" || return
    e2e_timed sdk_dependency_build env SENTRY_RELEASE="$release" SKIP_DIDKIT_NAPI=1 NX_DAEMON=false \
        bunx nx run-many -t build -p "$projects" --verbose --skip-nx-cache || return
    if [[ "${E2E_SDK_CACHE_WRITER:-false}" == true ]]; then
        e2e_timed sdk_output_snapshot node "$cache_script" snapshot "$E2E_SDK_SPEC" "$E2E_SDK_CACHE_DIR" || return
    fi
}
