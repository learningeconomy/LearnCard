#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ruby - "$REPO_ROOT/.github/workflows/test.yml" "$REPO_ROOT/.github/workflows/lint.yml" "$REPO_ROOT/scripts/lint-workspace.ts" "$REPO_ROOT/.github/workflows/deploy.yml" <<'RUBY'
require 'yaml'

workflow = YAML.load_file(ARGV.fetch(0), aliases: true)
steps = workflow.fetch('jobs').fetch('e2e-tests').fetch('steps')
run_ssh = steps.find { |step| step['name'] == 'Run E2E tests on EC2' }
abort 'Run E2E tests on EC2 step missing' unless run_ssh

script_lines = run_ssh.fetch('with').fetch('script').lines.map(&:strip).reject(&:empty?)
fetch_index = script_lines.index('git fetch --no-tags origin main')
reset_index = script_lines.index('git reset --hard FETCH_HEAD')
sync_index = script_lines.index do |line|
    line.start_with?('./scripts/sync-repo.sh ')
end

# Break caught: a persistent EC2 checkout remains on an experimental runner branch.
abort 'runner main fetch missing' unless fetch_index
abort 'runner checkout reset missing' unless reset_index
abort 'LearnCard sync command missing' unless sync_index
abort 'runner reset must follow fetch' unless fetch_index < reset_index
abort 'runner reset must precede LearnCard sync' unless reset_index < sync_index
abort 'stateful git pull must not select the runner revision' if script_lines.include?('git pull origin main')

lint_workflow = YAML.load_file(ARGV.fetch(1), aliases: true)
lint_jobs = lint_workflow.fetch('jobs')

workspace_lint_job = lint_jobs.fetch('WorkspaceLint')
workspace_lint_step = workspace_lint_job.fetch('steps').find do |step|
    step['run'] == 'bun run lint:workspace'
end
abort 'dedicated workspace lint CI step missing' unless workspace_lint_step

accessibility_job = lint_jobs.fetch('Accessibility')
accessibility_step = accessibility_job.fetch('steps').find do |step|
    step['run'] == 'bun run lint:a11y'
end
abort 'accessibility job must run only the accessibility lint' unless accessibility_step

lint_script = File.read(ARGV.fetch(2))
abort 'lint fingerprints must normalize the checkout path' unless lint_script.include?(
    "REPOSITORY_PATH_PLACEHOLDER"
)

contracts_job = lint_workflow.fetch('jobs').fetch('RepositoryContracts')
contract_step = contracts_job.fetch('steps').find do |step|
    step['name'] == 'Run repository shell contracts'
end
abort 'repository shell contract CI step missing' unless contract_step

contract_script = contract_step.fetch('run')
abort 'CI must discover every shell contract' unless contract_script.include?(
    'for contract in .github/tests/*.test.sh'
)
abort 'CI must execute each shell contract with Bash' unless contract_script.include?(
    'bash "$contract"'
)

deploy_workflow = YAML.load_file(ARGV.fetch(3), aliases: true)
deploy_jobs = deploy_workflow.fetch('jobs')

{
    'deploy-brain-service' => 'Deploy Brain Service Lambda',
    'deploy-learn-cloud' => 'Deploy LearnCloud Lambda',
    'deploy-lca-api' => 'Deploy LCA API Service Lambda',
}.each do |job_name, step_name|
    deploy_step = deploy_jobs.fetch(job_name).fetch('steps').find do |step|
        step['name'] == step_name
    end
    abort "#{step_name} step missing" unless deploy_step

    deploy_env = deploy_step.fetch('env')
    abort "#{step_name} must disable pnpm package-manager strictness" unless deploy_env[
        'COREPACK_ENABLE_STRICT'
    ] == '0'
    abort "#{step_name} uses an unsupported pnpm config environment variable" if deploy_env.key?(
        'PNPM_CONFIG_PACKAGE_MANAGER_STRICT'
    )
end
RUBY

echo 'LearnCard E2E workflow contract passed'
