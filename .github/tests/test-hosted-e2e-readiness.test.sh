#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT
source "$REPO_ROOT/scripts/e2e-hosted/metrics.sh"
# Load real functions without launching Docker or installing dependencies.
eval "$(sed -n '/^wait_for_url()/,/^e2e_snapshot startup/{ /^e2e_snapshot startup/d; p; }' "$REPO_ROOT/scripts/e2e-hosted/run-browser.sh")"
failures=0
fail() { echo "FAIL: $*" >&2; failures=$((failures + 1)); }

for failed_child in none app brain cloud; do
    export E2E_ARTIFACT_DIR="$TEST_ROOT/$failed_child"
    e2e_metrics_init readiness-test
    (
        wait_for_url() {
            printf '%s %s\n' "$1" "$2" >> "$E2E_ARTIFACT_DIR/endpoints"
            [[ "$1" != "$failed_child" ]]
        }
        wait() {
            local status=0
            builtin wait "$@" || status=$?
            echo "$status" >> "$E2E_ARTIFACT_DIR/reaped"
            return "$status"
        }
        e2e_timed readiness wait_for_stack
    ) && status=0 || status=$?
    if [[ "$failed_child" == none ]]; then
        [[ "$status" -eq 0 ]] || fail 'healthy stack rejected'
    else
        [[ "$status" -ne 0 ]] || fail "$failed_child readiness failure swallowed"
        grep -q $'readiness\tfailed' "$E2E_ARTIFACT_DIR/timings.tsv" || fail "$failed_child failure not recorded"
    fi
    [[ "$(wc -l < "$E2E_ARTIFACT_DIR/reaped" | tr -d ' ')" == 3 ]] || fail 'not all children reaped'
    grep -Fxq 'app http://localhost:3000' "$E2E_ARTIFACT_DIR/endpoints" || fail 'app endpoint'
    grep -Fxq 'brain http://localhost:4000/api/health-check' "$E2E_ARTIFACT_DIR/endpoints" || fail 'brain health endpoint'
    grep -Fxq 'cloud http://localhost:4100/api/health-check' "$E2E_ARTIFACT_DIR/endpoints" || fail 'cloud health endpoint'
done

# Real polling must retry transient failures, then accept a healthy response.
(
    attempts=0
    curl() {
        attempts=$((attempts + 1))
        printf '%s\n' "$@" > "$TEST_ROOT/retry-curl-args"
        [[ "$attempts" -eq 2 ]]
    }
    sleep() { SECONDS=$((SECONDS + $1)); }
    wait_for_url healthy http://localhost:3000 300
) || fail 'transient readiness failure did not recover'
grep -Fxq 'http://localhost:3000' "$TEST_ROOT/retry-curl-args" || fail 'polling URL not forwarded'
[[ "$(awk '/^--max-time$/ {getline; print}' "$TEST_ROOT/retry-curl-args")" == 10 ]] || fail 'normal requests must be capped at ten seconds'

# Exercise real polling with a simulated failed request and clock: no network or wall-time delay.
(
    curl() {
        printf '%s\n' "$@" > "$TEST_ROOT/curl-args"
        SECONDS=$((SECONDS + 4))
        return 22
    }
    sleep() { echo "$1" >> "$TEST_ROOT/sleeps"; SECONDS=$((SECONDS + $1)); }
    wait_for_url unhealthy http://localhost:4000/api/health-check 4
) && fail 'deadline did not fail' || true
max_time=$(awk '/^--max-time$/ {getline; print}' "$TEST_ROOT/curl-args")
connect_time=$(awk '/^--connect-timeout$/ {getline; print}' "$TEST_ROOT/curl-args")
[[ "$max_time" =~ ^[1-4]$ ]] || fail 'curl request must fit remaining polling deadline'
[[ "$connect_time" =~ ^[1-5]$ ]] || fail 'curl connection must be bounded'
[[ ! -e "$TEST_ROOT/sleeps" ]] || fail 'polling slept after deadline'
[[ "$failures" -eq 0 ]] || exit 1
echo 'Hosted E2E readiness tests passed (endpoints, 4 child outcomes, request/deadline bounds)'
