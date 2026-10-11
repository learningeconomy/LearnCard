#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT
ruby -ryaml - "$REPO_ROOT" "$TEST_ROOT" <<'RUBY'
root, temporary = ARGV
steps = YAML.load_file("#{root}/.github/actions/nx-test-build-cache/action.yml").fetch('runs').fetch('steps')
key = steps.find { |step| step['id'] == 'key' }
abort 'key failure must allow ordinary tests' unless key['continue-on-error'] == true
File.write("#{temporary}/key.sh", key.fetch('run'))
fallback = steps.find { |step| step['if']&.include?("steps.key.outcome == 'failure'") }
File.write("#{temporary}/fallback.sh", fallback.fetch('run'))
restore = steps.find { |step| step['id'] == 'restore' }
abort 'restore needs valid keys' unless restore.fetch('if').include?("steps.key.outcome == 'success'")
abort 'restore failure must allow tests' unless restore['continue-on-error'] == true
job = YAML.load_file("#{root}/.github/workflows/test.yml").fetch('jobs').fetch('Test')
tests = job.fetch('steps').find { |step| step['name'] == 'Run tests' }
abort 'keep existing retry budget' unless tests.fetch('with').values_at('timeout_minutes', 'max_attempts') == [10, 3]
abort 'retry must run the actual cache-aware test runner' unless tests.fetch('with').fetch('command') == 'bash scripts/run-nx-tests-with-build-cache.sh'
publisher = job.fetch('steps').find { |step| step['uses'] == 'actions/cache/save@v6' }
abort 'publish only a verified snapshot after tests pass' unless publisher.fetch('if').include?('success()') && publisher.fetch('if').include?("steps.snapshot.outputs.ready == 'true'")
ready = job.fetch('steps').find { |step| step['id'] == 'snapshot' }
abort 'publication must require enabled caching and a miss' unless ready.fetch('if').include?("env.NX_TEST_BUILD_CACHE == 'true'") && ready.fetch('if').include?("steps.build-cache.outputs.hit != 'true'")
abort 'publication must require a built snapshot marker' unless ready.fetch('run').include?('$NX_TEST_BUILD_CACHE_DIR/ready')
RUBY
node() {
    [[ "$SCENARIO" != failure ]] || return 1
    echo '{}' > "$3"
    if [[ "$SCENARIO" == malformed ]]; then echo malformed; else printf 'nx-test-builds-v1-%064d\n' 0; fi
}
export -f node
for SCENARIO in success failure malformed; do
    export SCENARIO CACHE_TEMP="$TEST_ROOT/$SCENARIO"
    mkdir -p "$CACHE_TEMP"
    export GITHUB_ENV="$CACHE_TEMP/env" GITHUB_OUTPUT="$CACHE_TEMP/output"
    : > "$GITHUB_ENV"
    : > "$GITHUB_OUTPUT"
    status=0
    bash -euo pipefail "$TEST_ROOT/key.sh" || status=$?
    if [[ "$SCENARIO" == success ]]; then
        [[ "$status" == 0 ]]
        grep -Fxq 'NX_TEST_BUILD_CACHE=true' "$GITHUB_ENV"
        grep -Eq '^key=nx-test-builds-v1-[a-f0-9]{64}$' "$GITHUB_OUTPUT"
    else
        [[ "$status" != 0 && ! -s "$GITHUB_ENV" && ! -s "$GITHUB_OUTPUT" ]]
        bash -euo pipefail "$TEST_ROOT/fallback.sh"
        grep -Fxq 'NX_TEST_BUILD_CACHE=false' "$GITHUB_ENV"
    fi
done
echo 'Nx Test Runner key failures, restore gating, retries, and publication gates passed'
