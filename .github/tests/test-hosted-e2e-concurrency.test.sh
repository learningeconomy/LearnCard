#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT
# Exercise the actual launcher selection without starting Docker or browsers.
eval "$(sed -n '/^run_playwright()/,/^run_accessibility()/{ /^run_accessibility()/d; p; }' "$REPO_ROOT/scripts/e2e-hosted/run-browser.sh")"
APP_DIR="$TEST_ROOT"
bunx() {
    [[ "$E2E_EXTERNAL_STACK" == true ]]
    printf '%s\n' "$@" > "$TEST_ROOT/args"
}
for selection in 'app-store.spec.ts wallet-credentials.spec.ts consent-flow-race.spec.ts' 'wallet-credentials.spec.ts'; do
    E2E_TEST_FILES="$selection"
    run_playwright
    grep -Fxq -- '--config=playwright.parallel.config.ts' "$TEST_ROOT/args"
done
for selection in 'credentials.spec.ts' 'app-store.spec.ts accessibility.spec.ts' 'tests/wallet-credentials.spec.ts'; do
    E2E_TEST_FILES="$selection"
    run_playwright
    grep -Fxq -- '--config=playwright.config.ts' "$TEST_ROOT/args"
    for file in $selection; do
        grep -Fxq -- "$file" "$TEST_ROOT/args"
    done
done
echo 'Hosted E2E concurrency selection passed'
