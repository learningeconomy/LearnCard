#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ruby - "$REPO_ROOT/.github/workflows/e2e-hosted-shadow.yml" "$REPO_ROOT/.github/workflows/test.yml" <<'RUBY'
require 'yaml'
require 'tempfile'

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
eligibility = jobs.fetch('eligibility')
outputs = eligibility.fetch('outputs')
abort 'run_e2e output missing' unless outputs.key?('run_e2e')
abort 'eligibility reason output missing' unless outputs.key?('reason')

browser = jobs.fetch('browser_e2e')
service = jobs.fetch('service_e2e')
aggregate = jobs.fetch('hosted_e2e_shadow')

[browser, service].each do |job|
  abort 'heavy job must depend on eligibility' unless job.fetch('needs') == 'eligibility'
  abort 'heavy job must honor eligibility output' unless job.fetch('if').include?(
    "needs.eligibility.outputs.run_e2e == 'true'"
  )
  abort 'runner label must remain configurable' unless job.fetch('runs-on').include?(
    'vars.E2E_HOSTED_RUNNER'
  )
end

abort 'aggregate must inspect all job results' unless aggregate.fetch('needs') == [
  'eligibility', 'browser_e2e', 'service_e2e'
]
abort 'aggregate must run after failures/skips' unless aggregate.fetch('if').include?('always()')

browser_steps = browser.fetch('steps')
service_steps = service.fetch('steps')
abort 'browser runner invocation missing' unless browser_steps.any? do |step|
  step['run'] == 'bash scripts/e2e-hosted/run-browser.sh'
end
abort 'service runner invocation missing' unless service_steps.any? do |step|
  step['run'] == 'bash scripts/e2e-hosted/run-service.sh'
end

[browser_steps, service_steps].each do |steps|
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
  'BROWSER_RESULT' => 'success',
  'SERVICE_RESULT' => 'success'
}

abort 'explicit draft skip must succeed' unless aggregate_succeeds?(aggregate_run, aggregate_defaults.merge(
  'ELIGIBLE' => 'false',
  'ELIGIBILITY_REASON' => 'draft-pr',
  'BROWSER_RESULT' => 'skipped',
  'SERVICE_RESULT' => 'skipped'
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
RUBY

echo 'Hosted E2E workflow contract passed'
