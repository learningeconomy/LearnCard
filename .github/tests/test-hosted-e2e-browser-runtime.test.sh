#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT="$REPO_ROOT/scripts/e2e-hosted/run-browser.sh"
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT
# Exercise the real wrapper without downloading an image or running a stack.
eval "$(sed -n '/^prepare_browser_runner()/,/^wait_for_stack()/{ /^wait_for_stack()/d; p; }' "$SCRIPT")"
APP_DIR="$REPO_ROOT/apps/learn-card-app"
node() {
    case "$2" in
        *package.json*version*) echo 1.62.1 ;;
        *) echo "$REPO_ROOT/node_modules/playwright/cli.js" ;;
    esac
}
docker() { printf '%s\n' "$@" > "$TEST_ROOT/args"; }
prepare_browser_runner
grep -Fxq 'mcr.microsoft.com/playwright:v1.62.1-noble' "$TEST_ROOT/args"
playwright_command test wallet-credentials.spec.ts --config=playwright.parallel.config.ts
for arg in 'host' "$(id -u):$(id -g)" 'E2E_EXTERNAL_STACK=true' "$REPO_ROOT:$REPO_ROOT" "$APP_DIR" 'mcr.microsoft.com/playwright:v1.62.1-noble' "$REPO_ROOT/node_modules/playwright/cli.js" wallet-credentials.spec.ts; do
    grep -Fxq -- "$arg" "$TEST_ROOT/args"
done
! grep -q 'install --with-deps' "$SCRIPT"
echo 'Hosted browser runtime wrapper passed'
