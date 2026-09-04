#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

ruby - "$REPO_ROOT/.github/workflows/e2e-hosted-shadow.yml" "$REPO_ROOT/.github/workflows/test.yml" <<'RUBY'
require 'yaml'

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

legacy = YAML.load_file(legacy_path, aliases: true)
legacy_jobs = legacy.fetch('jobs')
abort 'legacy EC2 gate must remain during shadow phase' unless legacy_jobs.key?('e2e-tests')
RUBY

echo 'Hosted E2E workflow contract passed'
