#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT

export E2E_ARTIFACT_DIR="$TEST_ROOT/artifacts"
export GITHUB_WORKSPACE="$TEST_ROOT/workspace"
mkdir -p "$GITHUB_WORKSPACE"

source "$REPO_ROOT/scripts/e2e-hosted/metrics.sh"

e2e_metrics_init test-job
e2e_timed passing-stage true

set +e
e2e_timed failing-stage false
failure_status=$?
set -e

[[ "$failure_status" -eq 1 ]] || { echo 'e2e_timed must preserve command failure' >&2; exit 1; }
grep -Fq $'passing-stage\tpassed' "$E2E_ARTIFACT_DIR/timings.tsv"
grep -Fq $'failing-stage\tfailed' "$E2E_ARTIFACT_DIR/timings.tsv"
awk -F '\t' 'NR == 1 { if (NF != 6) exit 1; next } NR == 2 { if (NF != 6 || $1 != "passing-stage" || $2 != "passed" || $3 !~ /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T/ || $4 !~ /^[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T/ || $5 !~ /^[0-9][0-9]*$/) exit 1 }' "$E2E_ARTIFACT_DIR/timings.tsv"

e2e_snapshot test-phase
[[ -s "$E2E_ARTIFACT_DIR/capacity-test-phase.txt" ]]
grep -Fq 'filesystem:' "$E2E_ARTIFACT_DIR/capacity-test-phase.txt"
grep -Fq 'memory:' "$E2E_ARTIFACT_DIR/capacity-test-phase.txt"
grep -Fq 'workspace:' "$E2E_ARTIFACT_DIR/capacity-test-phase.txt"
grep -Fq 'docker_system_df:' "$E2E_ARTIFACT_DIR/capacity-test-phase.txt"
grep -Fq 'docker_buildx_du:' "$E2E_ARTIFACT_DIR/capacity-test-phase.txt"

e2e_render_summary
grep -Fq '# Hosted E2E diagnostics' "$E2E_ARTIFACT_DIR/summary.md"
grep -Fq '| passing-stage | passed |' "$E2E_ARTIFACT_DIR/summary.md"
grep -Fq '| failing-stage | failed |' "$E2E_ARTIFACT_DIR/summary.md"

echo 'Hosted E2E metrics tests passed'
