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
expected_jobs = %w[eligibility playwright_e2e tests_e2e_1 tests_e2e_2 tests_e2e_3 sdk_cache_probe]
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

browser = jobs.fetch('playwright_e2e')
services = (1..3).map { |shard| jobs.fetch("tests_e2e_#{shard}") }
service = services.first
abort 'browser check name must be stable' unless browser.fetch('name') == 'Playwright E2E'
# Explicit jobs keep these names even when job-level eligibility skips execution.
services.each_with_index do |job, index|
  abort 'service check name changed' unless job.fetch('name') == "tests/e2e (#{index + 1})"
  abort 'service shard must not depend on a sibling' unless job.fetch('needs') == 'eligibility'
  abort 'service skip policy changed' unless job.fetch('if') == browser.fetch('if')
  abort 'service runner selection changed' unless job.fetch('runs-on') == browser.fetch('runs-on')
  abort 'service shard must keep its timeout' unless job.fetch('timeout-minutes') == 60
  abort 'direct checks must not allow failures' if job.fetch('continue-on-error', false)
  abort 'direct checks must not expand or disappear behind a matrix' if job.key?('strategy')
  abort 'shard index must reach the runner script' unless job.fetch('env').fetch('E2E_SHARD') == (index + 1).to_s
  abort 'shard total must match all concrete service jobs' unless job.fetch('env').fetch('E2E_SHARD_TOTAL') == services.length.to_s
  abort 'service job steps drifted' unless job.fetch('steps') == service.fetch('steps')
end
abort 'shard artifacts must not collide' unless service.fetch('steps').any? { |step|
  step.dig('with', 'name').to_s.include?('env.E2E_SHARD')
}
[browser, service].each do |job|
  buildx = job.fetch('steps').find { |step| step['name'] == 'Setup Docker Buildx' }
  abort 'Buildx cleanup must remain enabled for persistent runners' unless buildx.dig('with', 'cleanup') == "${{ runner.environment != 'github-hosted' }}"
end
browser_setup = browser.fetch('steps').find { |step| step['uses'] == './.github/actions/setup' }
service_setup = service.fetch('steps').find { |step| step['uses'] == './.github/actions/setup' }
abort 'browser must be a cache consumer' unless browser_setup.dig('with', 'save-cache') == 'false'
abort 'exactly the first service shard must write the cache' unless service_setup.dig('with', 'save-cache') == "${{ env.E2E_SHARD == '1' }}"
setup = YAML.load_file(File.join(File.dirname(ARGV[0]), '../actions/setup/action.yml'))
abort 'other setup consumers must retain cache saving by default' unless setup.dig('inputs', 'save-cache', 'default') == 'true'
restore = setup.fetch('runs').fetch('steps').find { |step| step['uses'] == 'actions/cache/restore@v6' }
save = setup.fetch('runs').fetch('steps').find { |step| step['uses'] == 'actions/cache@v6' }
abort 'cache reader/writer paths and keys must match' unless restore.fetch('with') == save.fetch('with')
abort 'cache modes must be mutually exclusive' unless restore.fetch('if') == "${{ inputs.save-cache != 'true' }}" && save.fetch('if') == "${{ inputs.save-cache == 'true' }}"
abort 'final aggregate must not request another runner' if jobs.key?('e2e')

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

policy = eligibility.fetch('steps').find { |step| step['id'] == 'policy' }
validation = eligibility.fetch('steps').find { |step| step['name'] == 'Validate E2E eligibility' }
abort 'eligibility output validation missing' unless validation
abort 'validation must follow policy evaluation' unless eligibility.fetch('steps').index(validation) > eligibility.fetch('steps').index(policy)
abort 'validation must not be conditional' if validation.key?('if')
abort 'eligibility must not allow failed decisions' if eligibility.fetch('continue-on-error', false)
abort 'validation must not allow failed decisions' if validation.fetch('continue-on-error', false)
abort 'validation must inspect actual decision outputs' unless validation.fetch('env').values.include?('${{ steps.policy.outputs.run_e2e }}') && validation.fetch('env').values.include?('${{ steps.policy.outputs.reason }}')

# Execute the workflow's real shell. Only the docs-only detector is stubbed here;
# that helper has its own Git diff regression suite.
Dir.mktmpdir('e2e-direct-policy') do |dir|
  detector = File.join(dir, 'scripts/e2e-hosted')
  FileUtils.mkdir_p(detector)
  File.write(File.join(detector, 'changes-are-docs-only.sh'), 'exit "${DOCS_ONLY_EXIT:-1}"')
  defaults = { 'EVENT_NAME' => 'pull_request', 'PR_DRAFT' => 'false', 'BASE_SHA' => 'base-fixture' }
  cases = [
    ['pull_request', 'true', '1', 'false', 'merge-queue-only'],
    ['pull_request', 'false', '1', 'false', 'merge-queue-only'],
    ['pull_request', 'false', '0', 'false', 'merge-queue-only'],
    ['pull_request', 'false', '2', 'false', 'merge-queue-only'],
    ['merge_group', 'false', '1', 'true', 'merge_group'],
    ['merge_group', 'false', '0', 'false', 'docs-only'],
    ['workflow_dispatch', 'false', '0', 'true', 'manual-dispatch'],
    ['workflow_dispatch', 'true', '0', 'true', 'manual-dispatch']
  ]
  cases.each_with_index do |(event, draft, docs, run, reason), index|
    output = File.join(dir, "decision-#{index}")
    env = defaults.merge('EVENT_NAME' => event, 'PR_DRAFT' => draft, 'DOCS_ONLY_EXIT' => docs, 'GITHUB_OUTPUT' => output)
    stdout, status = Open3.capture2e(env, 'bash', '-euo', 'pipefail', '-c', policy.fetch('run'), chdir: dir)
    abort "policy #{event}/#{draft}/#{docs}: #{stdout}" unless status.success?
    decision = File.readlines(output, chomp: true).to_h { |line| line.split('=', 2) }
    abort "policy decision changed: #{decision}" unless decision == { 'run_e2e' => run, 'reason' => reason }
    env.merge!('RUN_E2E' => decision.fetch('run_e2e'), 'REASON' => decision.fetch('reason'), 'GITHUB_STEP_SUMMARY' => File.join(dir, 'summary'))
    stdout, status = Open3.capture2e(env, 'bash', '-euo', 'pipefail', '-c', validation.fetch('run'), chdir: dir)
    abort "valid decision rejected: #{stdout}" unless status.success?
  end
  _, unsupported = Open3.capture2e(defaults.merge('EVENT_NAME' => 'push', 'GITHUB_OUTPUT' => File.join(dir, 'unsupported')), 'bash', '-euo', 'pipefail', '-c', policy.fetch('run'), chdir: dir)
  abort 'unsupported policy event must fail' if unsupported.success?
  accepted = [
    ['pull_request', 'false', 'false', 'merge-queue-only'],
    ['merge_group', 'false', 'true', 'merge_group'],
    ['merge_group', 'false', 'false', 'docs-only'],
    ['workflow_dispatch', 'false', 'true', 'manual-dispatch']
  ]
  # Missing/malformed outputs and cross-event skip reasons must fail eligibility,
  # which itself is required; skipped dependants cannot hide that failure.
  checked = 0
  %w[pull_request merge_group workflow_dispatch push].product(['true', 'false', ''], ['', 'draft-pr', 'docs-only', 'pull_request', 'merge_group', 'manual-dispatch', 'merge-queue-only', 'unknown']).each do |event, run, reason|
    env = defaults.merge('EVENT_NAME' => event, 'RUN_E2E' => run, 'REASON' => reason, 'GITHUB_STEP_SUMMARY' => File.join(dir, 'summary'))
    _, status = Open3.capture2e(env, 'bash', '-euo', 'pipefail', '-c', validation.fetch('run'), chdir: dir)
    expected = accepted.include?([event, 'false', run, reason])
    abort "eligibility validation #{event}/#{run}/#{reason}" unless status.success? == expected
    checked += 1
  end
  puts "Eligibility policy passed (#{cases.length} real decisions, #{checked} validation combinations)"
end
abort 'service storage preparation missing' unless service.fetch('steps').any? { |step| step['run'] == 'bash scripts/e2e-hosted/prepare-storage.sh' }

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
