#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
source "$ROOT/scripts/e2e-hosted/referral-test-tls.sh"

docker info --format '{{.ServerVersion}}' >/dev/null
trap cleanup_referral_test_tls EXIT
prepare_referral_test_tls "$ROOT/tests/e2e"
export E2E_MANAGE_DOCKER=true E2E_VITEST_ARGS=referral-org-readable.spec.ts NX_DAEMON=false
bunx nx run e2e:test:e2e --skip-nx-cache
