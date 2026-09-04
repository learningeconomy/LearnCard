#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ruby - "$REPO_ROOT/.github/workflows/e2e-hosted-shadow.yml" "$REPO_ROOT/.github/workflows/test.yml" <<'RUBY'
require 'yaml'
require 'tempfile'
require 'tmpdir'
require 'open3'

hosted_path, legacy_path = ARGV
abort 'hosted E2E workflow missing' unless File.file?(hosted_path)

source = File.read(hosted_path)
abort 'pull_request_target must not execute PR code' if source.include?('pull_request_target')

workflow = YAML.load_file(hosted_path, aliases: true)
triggers = workflow['on'] || workflow[true]
pull_request = triggers.fetch('pull_request')
expected_types = %w[opened synchronize reopened ready_for_review converted_to_draft]
abort 'hosted E2E PR activity types changed' unless pull_request.fetch('types') == expected_types
abort 'manual dispatch missing' unless triggers.key?('workflow_dispatch')

concurrency = workflow.fetch('concurrency')
group = concurrency.fetch('group')
abort 'concurrency must be workflow-scoped' unless group.include?('github.workflow')
abort 'concurrency must be PR-scoped' unless group.include?('github.event.pull_request.number')
abort 'manual concurrency fallback missing' unless group.include?('github.run_id')
abort 'stale same-PR runs must cancel' unless concurrency.fetch('cancel-in-progress') == true

permissions = workflow.fetch('permissions')
abort 'workflow must use read-only contents permission' unless permissions == { 'contents' => 'read' }

jobs = workflow.fetch('jobs')
expected_jobs = %w[eligibility browser_e2e hosted_e2e_shadow]
abort 'hosted shadow workflow job set changed' unless jobs.keys.sort == expected_jobs.sort

eligibility = jobs.fetch('eligibility')
outputs = eligibility.fetch('outputs')
abort 'run_e2e output missing' unless outputs.key?('run_e2e')
abort 'eligibility reason output missing' unless outputs.key?('reason')

browser = jobs.fetch('browser_e2e')
aggregate = jobs.fetch('hosted_e2e_shadow')

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

abort 'aggregate must inspect all job results' unless aggregate.fetch('needs') == [
  'eligibility', 'browser_e2e'
]
abort 'aggregate must run after failures/skips' unless aggregate.fetch('if').include?('always()')

browser_steps = browser.fetch('steps')
abort 'browser runner invocation missing' unless browser_steps.any? do |step|
  step['run'] == 'bash scripts/e2e-hosted/run-browser.sh'
end

[browser_steps].each do |steps|
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
aggregate_run = aggregate_step.fetch('run')

def aggregate_succeeds?(run, env)
  Tempfile.create(['hosted-e2e-aggregate', '.sh']) do |script|
    script.write("#!/usr/bin/env bash\nset -euo pipefail\n#{run}\n")
    script.flush
    system(env, 'bash', script.path, out: File::NULL, err: File::NULL)
  end
end

aggregate_defaults = {
  'ELIGIBILITY_RESULT' => 'success',
  'ELIGIBLE' => 'true',
  'ELIGIBILITY_REASON' => 'non-draft-pr',
  'BROWSER_RESULT' => 'success'
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
puts 'Aggregate browser outcome table passed (4 combinations)'

abort 'explicit draft skip must succeed' unless aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
  'ELIGIBLE' => 'false',
  'ELIGIBILITY_REASON' => 'draft-pr',
  'BROWSER_RESULT' => 'skipped'
))
abort 'absent eligibility output must fail shadow result' if aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
  'ELIGIBLE' => '',
  'ELIGIBILITY_REASON' => ''
))
abort 'malformed ineligible output must fail shadow result' if aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
  'ELIGIBLE' => 'false',
  'ELIGIBILITY_REASON' => 'manual-dispatch'
))
%w[failure cancelled].each do |result|
  abort "#{result} eligibility must fail shadow result" if aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
    'ELIGIBILITY_RESULT' => result,
    'ELIGIBLE' => '',
    'ELIGIBILITY_REASON' => ''
  ))
end

legacy = YAML.load_file(legacy_path, aliases: true)
legacy_jobs = legacy.fetch('jobs')
abort 'legacy EC2 gate must remain during shadow phase' unless legacy_jobs.key?('e2e-tests')

[browser_steps].each do |steps|
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
      workspace = checkout_outcome == 'success' ? File.expand_path('../..', File.dirname(hosted_path)) : File.join(dir, 'missing-checkout')
      env = {
        'PATH' => "#{dir}:#{ENV.fetch('PATH')}", 'E2E_ARTIFACT_DIR' => artifacts,
        'GITHUB_WORKSPACE' => workspace, 'CHECKOUT_OUTCOME' => checkout_outcome,
        'CHECKOUT_CONCLUSION' => checkout_outcome, 'GITHUB_EVENT_NAME' => 'workflow_dispatch',
        'GITHUB_SHA' => 'event-sha-fixture', 'GITHUB_REF' => 'refs/heads/main',
        'GITHUB_RUN_ID' => '12345', 'GITHUB_RUN_ATTEMPT' => '2',
        'GITHUB_REPOSITORY' => 'example/LearnCard', 'GITHUB_WORKFLOW' => 'Hosted E2E Shadow',
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
  abort 'requested ref must match checkout selection' unless preflight.fetch('env')['TESTED_REF'] ==
    '${{ github.event.pull_request.head.sha || github.event.inputs.ref || github.sha }}'
end
puts 'Browser job preserves event/run provenance with and without checkout'
RUBY

echo 'Hosted E2E workflow contract passed'
