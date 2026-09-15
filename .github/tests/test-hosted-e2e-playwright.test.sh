#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
node "$REPO_ROOT/.github/tests/test-hosted-e2e-playwright.test.cjs"
