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
workflow = YAML.load_file("#{root}/.github/workflows/test.yml")
inputs = workflow.fetch('on', workflow[true]).fetch('workflow_dispatch').fetch('inputs')
abort 'manual measurements default to caching' unless inputs.fetch('use_build_cache').values_at('type', 'default') == ['boolean', true]
job = workflow.fetch('jobs').fetch('Test')
abort 'cache-disabled runs must execute ordinary dependencies' unless job.fetch('env').fetch('NX_TEST_BUILD_CACHE') == 'false'
prepare = job.fetch('steps').find { |step| step['id'] == 'build-cache' }
abort 'only manual dispatch may disable caching' unless prepare.fetch('if') == "${{ github.event_name != 'workflow_dispatch' || inputs.use_build_cache }}"
tests = job.fetch('steps').find { |step| step['name'] == 'Run tests' }
timeout = inputs.fetch('test_timeout_minutes')
attempts = inputs.fetch('test_attempts')
abort 'manual timeout must default to ten and only allow ten or twenty minutes' unless timeout.values_at('type', 'default', 'options') == ['choice', '10', ['10', '20']]
abort 'manual retries must default to three and allow one clean attempt' unless attempts.values_at('type', 'default', 'options') == ['choice', '3', ['1', '3']]
abort 'only manual dispatch may override the ten-minute limit' unless tests.fetch('with').fetch('timeout_minutes') == "${{ github.event_name == 'workflow_dispatch' && inputs.test_timeout_minutes || '10' }}"
abort 'only manual dispatch may override three attempts' unless tests.fetch('with').fetch('max_attempts') == "${{ github.event_name == 'workflow_dispatch' && inputs.test_attempts || '3' }}"
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
