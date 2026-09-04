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
grep -Fq 'docker compose build --parallel' "$BROWSER_SCRIPT"
grep -Fq 'docker compose up -d --no-build' "$BROWSER_SCRIPT"
grep -Fq 'E2E_EXTERNAL_STACK=true' "$BROWSER_SCRIPT"
grep -Fq 'bun run test:a11y' "$BROWSER_SCRIPT"
grep -Fq 'docker compose down --remove-orphans -v' "$BROWSER_SCRIPT"

SERVICE_SCRIPT="$REPO_ROOT/scripts/e2e-hosted/run-service.sh"
[[ -f "$SERVICE_SCRIPT" ]] || { echo 'hosted service runner missing' >&2; exit 1; }
grep -Fq 'docker compose up -d --build' "$SERVICE_SCRIPT"
grep -Fq 'E2E_MANAGE_DOCKER=false' "$SERVICE_SCRIPT"
grep -Fq 'bunx nx run e2e:test:e2e --verbose' "$SERVICE_SCRIPT"
grep -Fq 'docker compose down --remove-orphans -v' "$SERVICE_SCRIPT"

echo 'Hosted E2E script contracts passed'
