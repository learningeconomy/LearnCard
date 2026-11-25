#!/usr/bin/env bash

# One root per consumer waits for all its SDK prerequisites before it can run.
# Baseline, miss and hit use the same phase boundary, environment and concurrency.
prepare_shared_sdk() {
    local role="${1:?browser or service required}"
    E2E_SDK_PREPARED=false
    [[ "${E2E_SDK_CACHE_ENABLED:-false}" == true ]] || return 0
    local helper="$REPO_ROOT/scripts/e2e-hosted/sdk-build-cache.mjs"
    if [[ "${E2E_SDK_CACHE_HIT:-false}" == true ]]; then
        if e2e_timed sdk_output_restore node "$helper" restore "$E2E_SDK_SPEC" "$E2E_SDK_CACHE_DIR"; then
            E2E_SDK_PREPARED=true
            return 0
        fi
        echo '::warning::SDK snapshot rejected; rebuilding prerequisites before running the suite.'
    fi
    # A real compile failure fails the job; it is never converted into cache success.
    e2e_timed sdk_dependency_build node "$helper" build "$E2E_SDK_SPEC" unused "$role" || return
    E2E_SDK_PREPARED=true
}
