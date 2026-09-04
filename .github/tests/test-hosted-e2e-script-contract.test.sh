#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PLAYWRIGHT_CONFIG="$REPO_ROOT/apps/learn-card-app/playwright.config.ts"

grep -Fq "process.env.E2E_EXTERNAL_STACK === 'true'" "$PLAYWRIGHT_CONFIG" \
    || { echo 'explicit Playwright external-stack flag missing' >&2; exit 1; }
perl -0ne 'exit !/(?m)^\s*webServer:\s*useExternalE2EStack\s*\?\s*undefined\s*:/s' "$PLAYWRIGHT_CONFIG" \
    || { echo 'Playwright must disable its webServer only for external-stack mode' >&2; exit 1; }

echo 'Hosted E2E script contracts passed'
