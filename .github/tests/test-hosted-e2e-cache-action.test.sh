#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEST_ROOT=$(mktemp -d)
trap 'rm -rf "$TEST_ROOT"' EXIT

# Execute the actual composite action shell, including GitHub's errexit behavior.
ruby -ryaml - "$REPO_ROOT" "$TEST_ROOT" <<'RUBY'
root, temporary = ARGV
action = YAML.load_file("#{root}/.github/actions/e2e-build-cache/action.yml")
steps = action.fetch('runs').fetch('steps')
keys = steps.find { |step| step['id'] == 'keys' }
abort 'key errors must permit an ordinary build' unless keys['continue-on-error'] == true
File.write("#{temporary}/keys.sh", keys.fetch('run'))
fallback = steps.find { |step| step['if']&.include?("steps.keys.outcome == 'failure'") }
File.write("#{temporary}/fallback.sh", fallback.fetch('run'))
%w[sdk spa].each do |id|
  step = steps.find { |item| item['id'] == id }
  abort "#{id} restore must require complete keys" unless step.fetch('if').include?("steps.keys.outcome == 'success'")
end
workflow = YAML.load_file("#{root}/.github/workflows/e2e.yml")
saves = workflow.fetch('jobs').values.flat_map { |job| job.fetch('steps', []) }
                .select { |step| step['uses'] == 'actions/cache/save@v6' }
abort 'expected SDK and SPA writers' unless saves.length == 2
saves.each do |step|
  condition = step.fetch('if')
  abort 'cache writer must require enabled caching and a green run' unless
    condition.include?("env.E2E_SDK_BUILD_CACHE == 'true'") && condition.include?('success()')
end
RUBY

node() {
    local command="$2" spec="$3" kind=sdk
    [[ "$command" != key-spa ]] || kind=spa
    if [[ "$SCENARIO" == "$kind-failure" ]]; then
        echo 'simulated key-generation failure' >&2
        return 1
    fi
    printf '{}\n' > "$spec"
    if [[ "$SCENARIO" == malformed ]]; then
        echo 'unexpected stdout'
    else
        printf 'e2e-%s-outputs-v2-%064d\n' "$kind" 0
    fi
}
export -f node
for SCENARIO in service browser sdk-failure spa-failure malformed artifact-failure; do
    export SCENARIO
    export BUILD_TEMP="$TEST_ROOT/$SCENARIO"
    export E2E_ARTIFACT_DIR="$BUILD_TEMP/artifacts"
    export GITHUB_ENV="$BUILD_TEMP/env" GITHUB_OUTPUT="$BUILD_TEMP/output"
    export CACHE_BROWSER=true
    [[ "$SCENARIO" != service ]] || CACHE_BROWSER=false
    mkdir -p "$E2E_ARTIFACT_DIR"
    : > "$GITHUB_ENV"
    : > "$GITHUB_OUTPUT"
    if [[ "$SCENARIO" == artifact-failure ]]; then
        rmdir "$E2E_ARTIFACT_DIR"
        echo 'not a directory' > "$E2E_ARTIFACT_DIR"
    fi
    status=0
    bash -euo pipefail "$TEST_ROOT/keys.sh" > "$BUILD_TEMP/stdout" 2> "$BUILD_TEMP/stderr" || status=$?
    case "$SCENARIO" in
        service|browser)
            [[ "$status" == 0 ]]
            grep -Fxq 'E2E_SDK_BUILD_CACHE=true' "$GITHUB_ENV"
            grep -Eq '^sdk-key=e2e-sdk-outputs-v2-[a-f0-9]{64}$' "$GITHUB_OUTPUT"
            if [[ "$SCENARIO" == browser ]]; then
                grep -Eq '^spa-key=e2e-spa-outputs-v2-[a-f0-9]{64}$' "$GITHUB_OUTPUT"
            else
                [[ "$(wc -l < "$GITHUB_OUTPUT")" == 1 ]]
                ! grep -q E2E_SPA_SPEC "$GITHUB_ENV"
            fi
            ;;
        *)
            [[ "$status" != 0 && ! -s "$GITHUB_ENV" && ! -s "$GITHUB_OUTPUT" ]]
            bash -euo pipefail "$TEST_ROOT/fallback.sh"
            grep -Fxq 'E2E_SDK_BUILD_CACHE=false' "$GITHUB_ENV"
            ;;
    esac
done
echo 'Cache action key errors, partial setup, and writer gating passed'
