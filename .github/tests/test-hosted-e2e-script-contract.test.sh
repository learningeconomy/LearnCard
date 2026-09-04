#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLAYWRIGHT_CONFIG="$REPO_ROOT/apps/learn-card-app/playwright.config.ts"

grep -Fq "process.env.E2E_EXTERNAL_STACK === 'true'" "$PLAYWRIGHT_CONFIG" \
    || { echo 'explicit Playwright external-stack flag missing' >&2; exit 1; }
perl -0ne 'exit !/(?m)^\s*webServer:\s*useExternalE2EStack\s*\?\s*undefined\s*:/s' "$PLAYWRIGHT_CONFIG" \
    || { echo 'Playwright must disable its webServer only for external-stack mode' >&2; exit 1; }

BROWSER_SCRIPT="$REPO_ROOT/scripts/e2e-hosted/run-browser.sh"
[[ -f "$BROWSER_SCRIPT" ]] || { echo 'hosted browser runner missing' >&2; exit 1; }
DEFAULT_BROWSER_SPECS='consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts'
grep -Fq "E2E_TEST_FILES=\"\${E2E_TEST_FILES:-$DEFAULT_BROWSER_SPECS}\"" "$BROWSER_SCRIPT" \
    || { echo 'hosted browser defaults changed from the EC2 runner set' >&2; exit 1; }
grep -Fq 'docker compose build --parallel' "$BROWSER_SCRIPT"
grep -Fq 'docker compose up -d --no-build' "$BROWSER_SCRIPT"
grep -Fq 'E2E_EXTERNAL_STACK=true' "$BROWSER_SCRIPT"
[[ "$(grep -Ec '^[[:space:]]*E2E_EXTERNAL_STACK=true[[:space:]]+bunx playwright test' "$BROWSER_SCRIPT")" -eq 1 ]] \
    || { echo 'browser runner must invoke Playwright exactly once' >&2; exit 1; }
perl -0ne 'exit !/run_playwright\(\).*?read -r -a test_files <<< "\$E2E_TEST_FILES".*?bunx playwright test "\$\{test_files\[@\]\}"/s' "$BROWSER_SCRIPT" \
    || { echo 'Playwright must run only the selected browser specs' >&2; exit 1; }
perl -0ne 'exit !/run_accessibility\(\).*?bun run test:a11y/s' "$BROWSER_SCRIPT" \
    || { echo 'accessibility suite invocation missing' >&2; exit 1; }
grep -Fq 'docker compose down --remove-orphans -v' "$BROWSER_SCRIPT"

[[ ! -e "$REPO_ROOT/scripts/e2e-hosted/run-service.sh" ]] \
    || { echo 'hosted shadow must not contain a service-suite runner' >&2; exit 1; }

echo 'Hosted E2E script contracts passed'
