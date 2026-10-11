#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"
cache_script="$REPO_ROOT/scripts/e2e-hosted/sdk-build-cache.mjs"
test_args=(affected --target=test "--base=${NX_TEST_BASE:-origin/main}" --head=HEAD --skip-nx-cache --output-style=stream)
dependency_args=()

if [[ "${NX_TEST_BUILD_CACHE:-false}" == true ]]; then
    : "${NX_TEST_BUILD_SPEC:?spec required}"
    : "${NX_TEST_BUILD_CACHE_DIR:?cache directory required}"
    restored=false
    # A freshly built snapshot can also serve retry attempts within this job.
    if [[ "${NX_TEST_BUILD_CACHE_HIT:-false}" == true || -f "$NX_TEST_BUILD_CACHE_DIR/ready" ]]; then
        if node "$cache_script" restore "$NX_TEST_BUILD_SPEC" "$NX_TEST_BUILD_CACHE_DIR"; then
            restored=true
        else
            echo '::warning::Build snapshot failed verification; running the ordinary Nx dependency graph.'
            rm -f "$NX_TEST_BUILD_CACHE_DIR/ready"
            exec bunx nx "${test_args[@]}"
        fi
    fi
    # This explicit release identity makes cached service bundle provenance
    # stable across frontend-only commits, as in the hosted E2E SDK cache.
    export SENTRY_RELEASE
    SENTRY_RELEASE=$(node "$cache_script" release "$NX_TEST_BUILD_SPEC")
    export SENTRY_BUILD_TELEMETRY=false
    if [[ "$restored" != true ]]; then
        projects=$(node "$cache_script" projects "$NX_TEST_BUILD_SPEC")
        node "$cache_script" clean "$NX_TEST_BUILD_SPEC"
        bunx nx run-many -t build -p "$projects" --skip-nx-cache --output-style=stream
        # Snapshot before tests can alter outputs. Cache failures never hide a
        # test failure, and publication remains gated on the whole suite passing.
        if node "$cache_script" snapshot "$NX_TEST_BUILD_SPEC" "$NX_TEST_BUILD_CACHE_DIR"; then
            touch "$NX_TEST_BUILD_CACHE_DIR/ready"
        else
            echo '::warning::Could not snapshot build outputs; running the ordinary Nx dependency graph.'
            exec bunx nx "${test_args[@]}"
        fi
    fi
    preflights=$(node "$cache_script" preflights "$NX_TEST_BUILD_SPEC")
    while IFS= read -r preflight; do
        [[ -z "$preflight" ]] || bunx nx run "$preflight" --excludeTaskDependencies --skip-nx-cache --output-style=stream
    done <<< "$preflights"
    dependency_args=(--excludeTaskDependencies)
fi

# --skip-nx-cache deliberately prevents test-result reuse, even during retries.
bunx nx "${test_args[@]}" ${dependency_args[@]+"${dependency_args[@]}"}
