#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ruby - "$REPO_ROOT/.github/workflows/e2e.yml" "$REPO_ROOT/.github/workflows/test.yml" <<'RUBY'
require 'yaml'
require 'tempfile'
require 'tmpdir'
require 'open3'
require 'fileutils'

e2e_path, legacy_path = ARGV
abort 'E2E workflow missing' unless File.file?(e2e_path)

source = File.read(e2e_path)
abort 'pull_request_target must not execute PR code' if source.include?('pull_request_target')
abort 'cutover workflow must not retain shadow naming' if source.downcase.include?('shadow')

workflow = YAML.load_file(e2e_path, aliases: true)
abort 'workflow name must be E2E' unless workflow.fetch('name') == 'E2E'
triggers = workflow['on'] || workflow[true]
pull_request = triggers.fetch('pull_request')
expected_types = %w[opened synchronize reopened ready_for_review converted_to_draft]
abort 'hosted E2E PR activity types changed' unless pull_request.fetch('types') == expected_types
abort 'manual dispatch missing' unless triggers.key?('workflow_dispatch')
abort 'merge queue trigger missing' unless triggers.fetch('merge_group').fetch('types') == %w[checks_requested]

concurrency = workflow.fetch('concurrency')
group = concurrency.fetch('group')
abort 'concurrency must be workflow-scoped' unless group.include?('github.workflow')
abort 'concurrency must be PR-scoped' unless group.include?('github.event.pull_request.number')
abort 'concurrency must not collapse distinct merge-queue batches' unless group.include?('github.event.merge_group.head_ref')
abort 'manual concurrency fallback missing' unless group.include?('github.run_id')
abort 'stale same-PR runs must cancel' unless concurrency.fetch('cancel-in-progress') == true

permissions = workflow.fetch('permissions')
abort 'workflow must use read-only contents permission' unless permissions == { 'contents' => 'read' }

jobs = workflow.fetch('jobs')
expected_jobs = %w[eligibility playwright_e2e tests_e2e e2e sdk_cache_probe]
abort 'E2E workflow job set changed' unless jobs.keys.sort == expected_jobs.sort
probe = jobs.fetch('sdk_cache_probe')
abort 'producer probe must require explicit manual opt-in' unless probe.fetch('if') == "${{ github.event_name == 'workflow_dispatch' && inputs.verify_sdk_producer }}"
abort 'producer probe must use the same-revision reusable workflow' unless probe.fetch('uses') == './.github/workflows/sdk-build-cache.yml'
probe_input = triggers.fetch('workflow_dispatch').fetch('inputs').fetch('verify_sdk_producer')
abort 'producer probe must default off' unless probe_input.fetch('type') == 'boolean' && probe_input.fetch('default') == false

eligibility = jobs.fetch('eligibility')
abort 'eligibility name must not retain hosted shadow terminology' unless eligibility.fetch('name') == 'Determine E2E eligibility'
outputs = eligibility.fetch('outputs')
abort 'run_e2e output missing' unless outputs.key?('run_e2e')
abort 'eligibility reason output missing' unless outputs.key?('reason')

eligibility_steps = eligibility.fetch('steps')
policy_checkout = eligibility_steps.find { |step| step['uses']&.start_with?('actions/checkout@') }
abort 'PR deferral must not require a checkout' unless policy_checkout.fetch('if') == "${{ github.event_name == 'merge_group' }}"
policy = eligibility_steps.find { |step| step['id'] == 'policy' }
abort 'policy must receive the event name' unless policy.dig('env', 'EVENT_NAME') == '${{ github.event_name }}'
abort 'queue change detection must use the merge-group base' unless policy.dig('env', 'BASE_SHA') == '${{ github.event.merge_group.base_sha }}'

# Execute the actual inline policy, stubbing only documentation classification.
# PR and manual decisions must work without touching the repository at all.
[
  ['pull_request', 0, 'false', 'merge-queue-only', true],
  ['pull_request', 1, 'false', 'merge-queue-only', true],
  ['merge_group', 0, 'false', 'docs-only', true],
  ['merge_group', 1, 'true', 'merge_group', true],
  ['merge_group', 2, 'true', 'merge_group', true],
  ['workflow_dispatch', 0, 'true', 'manual-dispatch', true],
  ['workflow_dispatch', 1, 'true', 'manual-dispatch', true],
  ['push', 0, nil, nil, false]
].each do |event, docs_exit, run_e2e, reason, expected_success|
  Dir.mktmpdir('e2e-policy') do |dir|
    if event == 'merge_group'
      scripts = File.join(dir, 'scripts', 'e2e-hosted')
      FileUtils.mkdir_p(scripts)
      File.write(File.join(scripts, 'changes-are-docs-only.sh'),
        "[[ \"$1\" == queue-base && \"$2\" == HEAD ]] || exit 99\necho called > docs-called\nexit #{docs_exit}\n")
    end
    output = File.join(dir, 'output')
    File.write(output, '')
    stdout, status = Open3.capture2e({
      'EVENT_NAME' => event, 'BASE_SHA' => 'queue-base', 'GITHUB_OUTPUT' => output
    }, 'bash', '-euo', 'pipefail', '-c', policy.fetch('run'), chdir: dir)
    abort "policy failed for #{event}/#{docs_exit}: #{stdout}" unless status.success? == expected_success
    expected = expected_success ? ["run_e2e=#{run_e2e}", "reason=#{reason}"] : []
    abort "unexpected policy output for #{event}/#{docs_exit}" unless File.readlines(output, chomp: true) == expected
    abort 'queue policy must inspect the combined diff' if event == 'merge_group' && !File.exist?(File.join(dir, 'docs-called'))
    abort 'PR/manual policy must not attempt change detection' if event != 'merge_group' && stdout.include?('changes-are-docs-only')
  end
end
puts 'E2E event policy passed (PR deferral, queue changes, manual override, unsupported event)'

browser = jobs.fetch('playwright_e2e')
service = jobs.fetch('tests_e2e')
aggregate = jobs.fetch('e2e')
abort 'browser check name must be stable' unless browser.fetch('name') == 'Playwright E2E'
abort 'service check name must match its suite' unless service.fetch('name') == 'tests/e2e'

# The service suite is sharded across runners. Every spec file wipes the databases in
# its beforeAll, so files carry no cross-file ordering dependency; each shard owns a
# separate stack. The job `name` stays literally 'tests/e2e' -- GitHub appends the
# matrix value to the rendered check name -- so the assertion above still holds.
service_matrix = service.fetch('strategy').fetch('matrix').fetch('shard')
abort 'service suite must stay sharded' unless service_matrix.length > 1
abort 'a red shard must not cancel its siblings' unless service.fetch('strategy').fetch('fail-fast') == false
service_env = service.fetch('env')
abort 'shard index must reach the runner script' unless service_env.fetch('E2E_SHARD') == '${{ matrix.shard }}'
abort 'shard total must derive from the matrix, not a hardcoded literal' unless service_env.fetch('E2E_SHARD_TOTAL') == '${{ strategy.job-total }}'
abort 'shard artifacts must not collide' unless service.fetch('steps').any? { |step|
  step.dig('with', 'name').to_s.include?('matrix.shard')
}
[browser, service].each do |job|
  buildx = job.fetch('steps').find { |step| step['name'] == 'Setup Docker Buildx' }
  abort 'Buildx cleanup must remain enabled for persistent runners' unless buildx.dig('with', 'cleanup') == "${{ runner.environment != 'github-hosted' }}"
end
browser_setup = browser.fetch('steps').find { |step| step['uses'] == './.github/actions/setup' }
service_setup = service.fetch('steps').find { |step| step['uses'] == './.github/actions/setup' }
abort 'browser must be a cache consumer' unless browser_setup.dig('with', 'save-cache') == 'false'
abort 'exactly the first service shard must write the cache' unless service_setup.dig('with', 'save-cache') == '${{ matrix.shard == 1 }}'
setup = YAML.load_file(File.join(File.dirname(ARGV[0]), '../actions/setup/action.yml'))
abort 'other setup consumers must retain cache saving by default' unless setup.dig('inputs', 'save-cache', 'default') == 'true'
restore = setup.fetch('runs').fetch('steps').find { |step| step['uses'] == 'actions/cache/restore@v6' }
save = setup.fetch('runs').fetch('steps').find { |step| step['uses'] == 'actions/cache@v6' }
abort 'cache reader/writer paths and keys must match' unless restore.fetch('with') == save.fetch('with')
abort 'cache modes must be mutually exclusive' unless restore.fetch('if') == "${{ inputs.save-cache != 'true' }}" && save.fetch('if') == "${{ inputs.save-cache == 'true' }}"
abort 'aggregate required-gate name must be stable' unless aggregate.fetch('name') == 'E2E'

expected_browser_specs = 'consent-flow-race.spec.ts app-store.spec.ts wallet-credentials.spec.ts'
dispatch_default = triggers.fetch('workflow_dispatch').fetch('inputs').fetch('test_files').fetch('default')
abort 'manual browser spec default changed from the EC2 runner set' unless dispatch_default == expected_browser_specs
expected_browser_env = "${{ github.event.inputs.test_files || '#{expected_browser_specs}' }}"
abort 'browser job must use the selected specs with the EC2 defaults' unless browser.fetch('env').fetch(
  'E2E_TEST_FILES'
) == expected_browser_env

abort 'browser job must depend on eligibility' unless browser.fetch('needs') == 'eligibility'
abort 'browser job must honor eligibility output' unless browser.fetch('if').include?(
  "needs.eligibility.outputs.run_e2e == 'true'"
)
abort 'runner label must remain configurable' unless browser.fetch('runs-on').include?(
  'vars.E2E_HOSTED_RUNNER'
)

abort 'aggregate must inspect all required suite results' unless aggregate.fetch('needs') == [
  'eligibility', 'playwright_e2e', 'tests_e2e'
]
abort 'aggregate must run after failures/skips' unless aggregate.fetch('if').include?('always()')
abort 'aggregate must have a bounded timeout' unless aggregate.fetch('timeout-minutes') == 5

browser_steps = browser.fetch('steps')
abort 'browser runner invocation missing' unless browser_steps.any? do |step|
  step['run'] == 'bash scripts/e2e-hosted/run-browser.sh'
end

preflight_index = browser_steps.index { |step| step['name'] == 'Capture runner preflight' }
storage_index = browser_steps.index { |step| step['name'] == 'Prepare runner storage' }
setup_index = browser_steps.index { |step| step['name'] == 'Setup Node' }
abort 'runner storage preparation missing' unless storage_index
abort 'runner storage preparation must follow preflight' unless storage_index > preflight_index
abort 'runner storage preparation must precede dependency and Docker work' unless storage_index < setup_index
abort 'runner storage preparation must execute the tested script' unless browser_steps.fetch(storage_index).fetch(
  'run'
) == 'bash scripts/e2e-hosted/prepare-storage.sh'

[browser_steps, service.fetch('steps')].each do |steps|
  buildx = steps.find { |step| step['uses'] == 'docker/setup-buildx-action@v3' }
  abort 'Buildx setup missing before cached Docker build' unless buildx
  runtime = steps.find { |step| step['uses'] == 'crazy-max/ghaction-github-runtime@v3' }
  abort 'GitHub Actions cache runtime exposure missing' unless runtime
  runner = steps.find { |step| step['run']&.start_with?('bash scripts/e2e-hosted/run-') }
  abort 'Buildx setup must precede the suite runner' unless steps.index(buildx) < steps.index(runner)
  abort 'cache runtime exposure must follow Buildx setup' unless steps.index(runtime) > steps.index(buildx)
  abort 'cache runtime exposure must precede the suite runner' unless steps.index(runtime) < steps.index(runner)

  checkout = steps.find { |step| step['id'] == 'checkout' }
  abort 'checkout must expose its outcome to diagnostics' unless checkout

  preflight = steps.find { |step| step['name'] == 'Capture runner preflight' }
  abort 'runner preflight missing' unless preflight
  abort 'preflight must run after checkout failure' unless preflight.fetch('if').include?('always()')
  abort 'preflight must not depend on repository checkout' unless preflight.fetch('working-directory') == '${{ runner.temp }}'
  abort 'preflight must preserve checkout outcome' unless preflight.fetch('env').fetch('CHECKOUT_OUTCOME') == '${{ steps.checkout.outcome }}'
  abort 'preflight must preserve checkout failure artifact' unless preflight.fetch('run').include?('checkout-status.txt')
end

aggregate_step = aggregate.fetch('steps').fetch(0)
aggregate_env = aggregate_step.fetch('env')
abort 'aggregate must inspect eligibility job result' unless aggregate_env.fetch('ELIGIBILITY_RESULT') == '${{ needs.eligibility.result }}'
abort 'aggregate must validate skip reasons against the event' unless aggregate_env.fetch('EVENT_NAME') == '${{ github.event_name }}'
aggregate_run = aggregate_step.fetch('run')

def aggregate_succeeds?(run, env)
  Tempfile.create(['hosted-e2e-aggregate', '.sh']) do |script|
    script.write("#!/usr/bin/env bash\nset -euo pipefail\n#{run}\n")
    script.flush
    Tempfile.create('e2e-summary') do |summary|
      system(env.merge('GITHUB_STEP_SUMMARY' => summary.path), 'bash', script.path, out: File::NULL, err: File::NULL)
    end
  end
end

aggregate_defaults = {
  'EVENT_NAME' => 'merge_group',
  'ELIGIBILITY_RESULT' => 'success',
  'ELIGIBLE' => 'true',
  'ELIGIBILITY_REASON' => 'merge_group',
  'BROWSER_RESULT' => 'success',
  'SERVICE_RESULT' => 'success'
}

[
  ['success', true],
  ['failure', false], ['cancelled', false], ['skipped', false]
].each do |browser_result, expected|
  actual = aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
    'BROWSER_RESULT' => browser_result
  ))
  abort "aggregate browser outcome #{browser_result}: expected #{expected}" unless actual == expected
end
%w[merge_group workflow_dispatch].product(%w[success failure cancelled skipped], %w[success failure cancelled skipped]).each do |event, browser_result, service_result|
  expected = browser_result == 'success' && service_result == 'success'
  actual = aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
    'EVENT_NAME' => event, 'BROWSER_RESULT' => browser_result, 'SERVICE_RESULT' => service_result
  ))
  abort "aggregate outcomes #{browser_result}/#{service_result}" unless actual == expected
end
abort 'service must run independently after eligibility' unless service.fetch('needs') == 'eligibility'
abort 'service must honor E2E eligibility' unless service.fetch('if') == browser.fetch('if')
abort 'service storage preparation missing' unless service.fetch('steps').any? { |step| step['run'] == 'bash scripts/e2e-hosted/prepare-storage.sh' }
puts 'Aggregate child outcome table passed (32 queue/manual combinations)'

abort 'explicit PR deferral must succeed' unless aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
  'EVENT_NAME' => 'pull_request',
  'ELIGIBLE' => 'false',
  'ELIGIBILITY_REASON' => 'merge-queue-only',
  'BROWSER_RESULT' => 'skipped',
  'SERVICE_RESULT' => 'skipped'
))
%w[merge_group workflow_dispatch].each do |event|
  %w[merge-queue-only draft-pr unknown].each do |reason|
    abort "#{event} must reject #{reason} exemption" if aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
      'EVENT_NAME' => event, 'ELIGIBLE' => 'false', 'ELIGIBILITY_REASON' => reason,
      'BROWSER_RESULT' => 'skipped', 'SERVICE_RESULT' => 'skipped'
    ))
  end
end
abort 'manual run must not accept docs-only exemption' if aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
  'EVENT_NAME' => 'workflow_dispatch', 'ELIGIBLE' => 'false', 'ELIGIBILITY_REASON' => 'docs-only',
  'BROWSER_RESULT' => 'skipped', 'SERVICE_RESULT' => 'skipped'
))
abort 'absent eligibility output must fail aggregate result' if aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
  'ELIGIBLE' => '',
  'ELIGIBILITY_REASON' => ''
))
abort 'docs-only skip must pass aggregate result' unless aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
  'ELIGIBLE' => 'false',
  'ELIGIBILITY_REASON' => 'docs-only',
  'BROWSER_RESULT' => 'skipped',
  'SERVICE_RESULT' => 'skipped'
))
abort 'malformed ineligible output must fail aggregate result' if aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
  'ELIGIBLE' => 'false',
  'ELIGIBILITY_REASON' => 'manual-dispatch'
))
%w[failure cancelled skipped].each do |result|
  abort "#{result} eligibility must fail aggregate result" if aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
    'ELIGIBILITY_RESULT' => result,
    'ELIGIBLE' => '',
    'ELIGIBILITY_REASON' => ''
  ))
end

legacy = YAML.load_file(legacy_path, aliases: true)
legacy_jobs = legacy.fetch('jobs')
legacy_e2e = legacy_jobs.fetch('e2e-tests')
abort 'legacy EC2 job must be labeled manual fallback' unless legacy_e2e.fetch('name') == 'EC2 E2E fallback (manual)'
abort 'legacy EC2 job must not run for PR events' unless legacy_e2e.fetch('if') == "github.event_name == 'workflow_dispatch'"

[browser_steps, service.fetch('steps')].each do |steps|
  preflight = steps.find { |step| step['name'] == 'Capture runner preflight' }
  upload = steps.find { |step| step['uses'] == 'actions/upload-artifact@v4' }
  abort 'artifact upload must remain unconditional' unless upload.fetch('if').include?('always()')

  %w[success failure].each do |checkout_outcome|
    Dir.mktmpdir('hosted-preflight') do |dir|
      # Stub Docker and Linux-only memory diagnostics; run the actual workflow shell and git lookup.
      File.write(File.join(dir, 'docker'), "#!/bin/sh\nexit 0\n")
      File.chmod(0755, File.join(dir, 'docker'))
      File.write(File.join(dir, 'head'), "#!/bin/sh\nif [ \"$2\" = /proc/meminfo ]; then echo 'MemTotal: fixture'; else exec /usr/bin/head \"$@\"; fi\n")
      File.chmod(0755, File.join(dir, 'head'))
      artifacts = File.join(dir, 'artifacts')
      workspace = checkout_outcome == 'success' ? File.expand_path('../..', File.dirname(e2e_path)) : File.join(dir, 'missing-checkout')
      env = {
        'PATH' => "#{dir}:#{ENV.fetch('PATH')}", 'E2E_ARTIFACT_DIR' => artifacts,
        'GITHUB_WORKSPACE' => workspace, 'CHECKOUT_OUTCOME' => checkout_outcome,
        'CHECKOUT_CONCLUSION' => checkout_outcome, 'GITHUB_EVENT_NAME' => 'workflow_dispatch',
        'GITHUB_SHA' => 'event-sha-fixture', 'GITHUB_REF' => 'refs/heads/main',
        'GITHUB_RUN_ID' => '12345', 'GITHUB_RUN_ATTEMPT' => '2',
        'GITHUB_REPOSITORY' => 'example/LearnCard', 'GITHUB_WORKFLOW' => 'E2E',
        'TESTED_REF' => 'selected-manual-ref'
      }
      stdout, status = Open3.capture2e(env, 'bash', '-euo', 'pipefail', '-c', preflight.fetch('run'), chdir: dir)
      abort "preflight failed without checkout dependency: #{stdout}" unless status.success?
      provenance_path = File.join(artifacts, 'revision-provenance.txt')
      abort 'revision provenance artifact missing' unless File.file?(provenance_path)
      provenance = File.read(provenance_path)
      %w[event_name=workflow_dispatch event_sha=event-sha-fixture event_ref=refs/heads/main run_id=12345 run_attempt=2 repository=example/LearnCard tested_ref=selected-manual-ref].each do |expected|
        abort "missing provenance #{expected}" unless provenance.lines.map(&:chomp).include?(expected)
      end
      checkout_sha = checkout_outcome == 'success' ? Open3.capture2('git', '-C', workspace, 'rev-parse', 'HEAD').first.strip : 'unavailable'
      abort 'actual checkout SHA must be distinct from event SHA' unless provenance.include?("checkout_sha=#{checkout_sha}\n")
      abort 'checkout status missing after failed checkout' unless File.read(File.join(artifacts, 'checkout-status.txt')).include?("checkout_outcome=#{checkout_outcome}")
    end
  end
  abort 'requested ref must match checkout selection' unless preflight.fetch('env')['TESTED_REF'] == '${{ env.E2E_TESTED_REF }}'
  tested_ref = workflow.fetch('env').fetch('E2E_TESTED_REF')
  abort 'tested ref must prefer the PR head' unless tested_ref.include?('github.event.pull_request.head.sha')
  abort 'tested ref must resolve merge-queue batches' unless tested_ref.include?('github.event.merge_group.head_sha')
  abort 'tested ref must honour manual dispatch' unless tested_ref.include?('github.event.inputs.ref')
end
puts 'Browser job preserves event/run provenance with and without checkout'
RUBY

grep -Fq 'E2E_ARTIFACT_DIR: /tmp/learncard-e2e-artifacts/browser' "$REPO_ROOT/.github/workflows/e2e.yml" \
    || { echo 'browser artifacts must live outside the Docker context' >&2; exit 1; }
grep -Fq 'E2E_ARTIFACT_DIR: /tmp/learncard-e2e-artifacts/service' "$REPO_ROOT/.github/workflows/e2e.yml" \
    || { echo 'service artifacts must live outside the Docker context' >&2; exit 1; }
grep -Fxq 'e2e-artifacts/' "$REPO_ROOT/.dockerignore" \
    || { echo 'Docker context must exclude local E2E artifacts' >&2; exit 1; }
grep -Fxq 'e2e-artifacts/' "$REPO_ROOT/.gitignore" \
    || { echo 'local E2E artifacts must be ignored by Git' >&2; exit 1; }
grep -Fq 'for contract in .github/tests/*.test.cjs' "$REPO_ROOT/.github/workflows/lint.yml" \
    || { echo 'CJS repository contracts are not executed in CI' >&2; exit 1; }

echo 'Hosted E2E workflow contract passed'
