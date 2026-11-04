const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { readFileSync } = require('node:fs');

const root = path.resolve(__dirname, '../..');
const workflowPath = path.join(root, '.github/workflows/verification.yml');

const result = spawnSync(
    'ruby',
    ['-rjson', '-ryaml', '-e', 'puts JSON.generate(YAML.load_file(ARGV.fetch(0)))', workflowPath],
    { encoding: 'utf8' }
);
assert.equal(result.status, 0, result.stderr);

const workflow = JSON.parse(result.stdout);
const enabled =
    "${{ github.event_name == 'workflow_dispatch' || !github.event.pull_request.draft }}";
const branches = ['source-checks', 'production-bundle', 'runtime'];
assert.deepEqual(Object.keys(workflow.jobs), [...branches, 'verification']);
for (const name of branches) {
    const job = workflow.jobs[name];
    assert.equal(job.if, enabled, `${name} must preserve draft/manual eligibility`);
    assert.equal(job['runs-on'], 'ubuntu-24.04');
    assert.equal(job.needs, undefined, `${name} must start independently`);
    assert.equal(job['continue-on-error'], undefined);
    const checkout = job.steps.find(step => step.uses?.startsWith('actions/checkout@'));
    assert.equal(checkout.with['persist-credentials'], false);
    assert.equal(checkout.with.ref, undefined, 'every branch tests the workflow revision');
    const setup = job.steps.find(step => step.uses === './.github/actions/setup');
    assert.equal(setup.with['save-cache'], 'false');
    assert.ok(job.steps.every(step => !step.uses?.startsWith('actions/download-artifact@')));
}
const source = workflow.jobs['source-checks'].steps;
const bundle = workflow.jobs['production-bundle'].steps;
const steps = workflow.jobs.runtime.steps;
const named = (list, name) => {
    const step = list.find(item => item.name === name);
    assert.ok(step, `missing check: ${name}`);
    assert.equal(step.if, undefined, `${name} must not acquire a skip condition`);
    assert.equal(step['continue-on-error'], undefined, `${name} must fail the job`);
    return step;
};
for (const name of [
    'Build and test message schemas',
    'Test shared messages and modal ownership',
    'Test message authoring and analytics',
    'Typecheck hosted iframe example test',
    'Lint and format message sources',
    'Check catalog documentation contract',
    'Prepare clean checkout',
    'Build service declaration prerequisites',
    'Typecheck verification source',
    'Check lifecycle, resolver and persistence boundaries',
    'Check sanitized timing summaries',
])
    named(source, name);
assert.ok(
    source.findIndex(step => step.name === 'Prepare clean checkout') <
        source.findIndex(step => step.name === 'Typecheck verification source')
);
assert.ok(
    source.findIndex(step => step.name === 'Build service declaration prerequisites') <
        source.findIndex(step => step.name === 'Typecheck verification source')
);
assert.match(
    named(source, 'Build service declaration prerequisites').run,
    /--projects=network-brain-service,learn-cloud-service,lca-api-service --parallel=1 --skip-nx-cache/
);
assert.match(
    named(source, 'Typecheck verification source').run,
    /tsc -p apps\/learn-card-app\/scripts\/verification\/tsconfig.json/
);
named(bundle, 'Install Chromium and Linux libraries');
assert.match(
    named(bundle, 'Verify production SQLite browser bundle').run,
    /node scripts\/verify-web-sqlite-build.mjs --output/
);
named(steps, 'Install Chromium and Linux libraries');
named(steps, 'Prepare clean checkout');
named(steps, 'Check local prerequisites');
const storageStep = named(steps, 'Prepare catalog runner disk space');
const recheckStep = named(steps, 'Recheck catalog runner disk space');
named(steps, 'Measure disk after dependencies');
assert.match(storageStep.run, /verification-runner-storage\.sh before-setup 20971520/);
assert.match(recheckStep.run, /verification-runner-storage\.sh before-preflight 10485760/);
const position = name => steps.findIndex(step => step.name === name);
assert.ok(position('Prepare catalog runner disk space') < position('Setup Bun and dependencies'));
assert.ok(position('Setup Bun and dependencies') < position('Measure disk after dependencies'));
assert.ok(position('Install Chromium and Linux libraries') < position('Recheck catalog runner disk space'));
assert.ok(position('Prepare clean checkout') < position('Recheck catalog runner disk space'));
assert.ok(position('Recheck catalog runner disk space') < position('Check local prerequisites'));
assert.match(named(source, 'Check sanitized timing summaries').run, /test-verification-runner-storage\.test\.sh/);
assert.ok((workflow.on ?? workflow.true).pull_request.paths.includes('scripts/verification-runner-storage.sh'));
assert.ok(!source.some(step => /playwright install|lc verify up/.test(step.run ?? '')));
assert.ok(!steps.some(step => /nx run-many -t build|tsc -p/.test(step.run ?? '')));
assert.ok(!bundle.some(step => /lc verify/.test(step.run ?? '')));

// Execute the actual final gate for all GitHub job-result combinations.
const gate = workflow.jobs.verification;
assert.deepEqual(gate.needs, branches);
assert.equal(
    gate.if,
    "${{ always() && (github.event_name == 'workflow_dispatch' || !github.event.pull_request.draft) }}"
);
assert.equal(gate['continue-on-error'], undefined);
const evaluate = gate.steps.find(
    step => step.name === 'Require all verification jobs and complete proof'
);
assert.equal(evaluate.if, '${{ always() }}');
assert.equal(evaluate.env.MERGE_RESULT, '${{ steps.merge.outcome }}');
assert.deepEqual(gate.env, {
    PR_HEAD_SHA: '${{ github.event.pull_request.head.sha || github.sha }}',
    SOURCE_RESULT: '${{ needs.source-checks.result }}',
    BUNDLE_RESULT: '${{ needs.production-bundle.result }}',
    RUNTIME_RESULT: '${{ needs.runtime.result }}',
});
const resultValues = ['success', 'failure', 'cancelled', 'skipped'];
const proofSuccess = {
    MERGE_RESULT: 'success',
    MEDIA_RESULT: 'success',
    SUMMARY_RESULT: 'success',
};
const runGate = env =>
    spawnSync('bash', ['-e', '-c', evaluate.run], {
        encoding: 'utf8',
        env: { ...process.env, ...proofSuccess, ...env },
    }).status;
for (const a of resultValues)
    for (const b of resultValues)
        for (const c of resultValues)
            assert.equal(
                runGate({ SOURCE_RESULT: a, BUNDLE_RESULT: b, RUNTIME_RESULT: c }),
                a === 'success' && b === 'success' && c === 'success' ? 0 : 1
            );
for (const key of Object.keys(proofSuccess))
    for (const value of resultValues.slice(1))
        assert.equal(
            runGate({
                SOURCE_RESULT: 'success',
                BUNDLE_RESULT: 'success',
                RUNTIME_RESULT: 'success',
                [key]: value,
            }),
            1
        );
assert.equal(workflow.jobs.runtime.strategy['fail-fast'], false);
assert.deepEqual(workflow.jobs.runtime.strategy.matrix.shard, ['1', '2', '3']);
assert.deepEqual(
    workflow.jobs.runtime.strategy.matrix.shard,
    JSON.parse(
        readFileSync(path.join(root, 'scripts/verification-shards.json'), 'utf8')
    ).shards.map(shard => shard.id),
    'Workflow matrix and partition plan must describe the same workers'
);
assert.match(
    source.find(step => step.name === 'Check sanitized timing summaries').run,
    /verification-shards\.test\.mjs/
);
assert.ok(
    (workflow.on ?? workflow.true).pull_request.paths.includes('scripts/verification-shards*')
);
const merge = gate.steps.find(step => step.id === 'merge');
assert.equal(merge.if, '${{ always() }}');
assert.equal(merge['continue-on-error'], true);
assert.match(merge.run, /verification-shards.mjs merge/);
assert.ok(gate.steps.some(step => step.uses?.startsWith('actions/download-artifact@')));
assert.deepEqual(workflow.permissions, { contents: 'read' });
const stackIndex = steps.findIndex(step => step.id === 'stack');
const navigationIndex = steps.findIndex(step => step.id === 'navigation');
const catalogIndex = steps.findIndex(step => step.id === 'catalog');
const campaignsIndex = steps.findIndex(
    step => step.name === 'Verify campaign SDK authorization boundaries'
);
const teardownIndex = steps.findIndex(step => step.name === 'Always tear down owned resources');
const summaryIndex = steps.findIndex(step => step.name === 'Write sanitized status summary');

assert.ok(stackIndex >= 0, 'stack startup step must exist');
assert.ok(navigationIndex > stackIndex, 'navigation proof must follow stack startup');
assert.ok(catalogIndex > navigationIndex, 'catalog proof must follow navigation proof');
assert.ok(campaignsIndex > catalogIndex, 'campaign proof must follow the catalog');
assert.ok(teardownIndex > campaignsIndex, 'owned resources must be torn down after campaign proof');
assert.ok(summaryIndex > teardownIndex, 'sanitized summary must follow teardown');

const stack = steps[stackIndex];
assert.match(stack.run, /verify_args=\(up --json --dir "\$STACK_DIR"\)/);

const navigation = steps[navigationIndex];
assert.equal(navigation.if, "${{ matrix.shard == '1' }}");
assert.match(navigation.run, /lc verify script .*verify-navigation\.mjs.*--dir "\$STACK_DIR"/);

const catalog = steps[catalogIndex];
assert.match(catalog.run, /lc verify run "\$\{features\[@\]\}" --json --dir "\$STACK_DIR"/);

const campaigns = steps[campaignsIndex];
assert.equal(campaigns.id, 'campaigns');
assert.equal(campaigns.if, "${{ matrix.shard == '2' }}");
assert.match(campaigns.run, /lc verify script/);
assert.match(campaigns.run, /--dir "\$STACK_DIR"/);

const teardown = steps[teardownIndex];
assert.equal(teardown.if, '${{ always() }}');
assert.match(teardown.run, /lc verify down --force --dir "\$STACK_DIR"/);

const summary = steps[summaryIndex];
assert.equal(summary.env.STARTUP_OUTCOME, '${{ steps.stack.outcome }}');
assert.equal(
    summary.env.SCRIPT_OUTCOME,
    "${{ matrix.shard == '1' && steps.navigation.outcome || steps.campaigns.outcome }}"
);
assert.equal(summary.env.VERIFICATION_OUTCOME, '${{ steps.catalog.outcome }}');
assert.ok(summary.run.includes(`if [[ "$SHARD_ID" == '3' ]]; then unset SCRIPT_OUTCOME; fi`));

assert.equal(summary.env.TEARDOWN_OUTCOME, '${{ steps.teardown.outcome }}');
const artifacts = steps.filter(step => step.uses === 'actions/upload-artifact@v4');
assert.equal(artifacts.length, 2, 'retain only the existing media and sanitized summary');
assert.ok(artifacts.every(step => step.if === '${{ always() }}'));
assert.ok(source.every(step => !step.uses?.startsWith('actions/upload-artifact@')));
assert.ok(bundle.every(step => !step.uses?.startsWith('actions/upload-artifact@')));
console.log('verification lifecycle, isolated shards and fail-closed aggregate outcomes passed');

const profileIndex = steps.findIndex(step => step.name === 'Profile retained browser calls');
assert.ok(profileIndex > teardownIndex && profileIndex < summaryIndex);
const profile = steps[profileIndex];
assert.equal(profile.if, '${{ always() }}');
assert.equal(profile['timeout-minutes'], 2, 'diagnostics must have a short wall-time bound');
assert.equal(profile['continue-on-error'], true, 'diagnostics cannot change verification success');
assert.match(
    profile.run,
    /python3 -B scripts\/profile-verification-traces.py "\$STACK_DIR" "\$SUMMARY_DIR"/
);
const upload = steps.find(step => step.name === 'Retain sanitized summary only');
assert.match(upload.with.path, /browser-profile\.json/);
assert.match(upload.with.path, /browser-profile\.md/);
assert.doesNotMatch(upload.with.path, /trace|session|\*\*/);
console.log('verification lifecycle and sanitized browser profiling contract passed');

for (const name of ['Retain combined proof media', 'Retain combined sanitized summary'])
    assert.equal(gate.steps.find(step => step.name === name).with.overwrite, true);

assert.equal(
    gate.steps.find(step => step.name === 'Retain combined proof media').if,
    '${{ always() }}'
);

const shardPlan = require('../../scripts/verification-shards.json');
assert.deepEqual(
    shardPlan.shards.map(shard => [shard.id, shard.scripts]),
    [
        ['1', ['navigation']],
        ['2', ['campaigns']],
        ['3', []],
    ]
);

// Execute the actual dependency-free fallback, including preserving legitimate partial proof.
const fs = require('node:fs');
const os = require('node:os');
// Execute the real summary step: shard 3 has no script requirement, but startup/catalog still fail closed.
const summaryTemporary = fs.mkdtempSync(path.join(os.tmpdir(), 'verification-summary-'));
try {
    fs.mkdirSync(path.join(summaryTemporary, 'stack/runs/catalog'), { recursive: true });
    fs.writeFileSync(
        path.join(summaryTemporary, 'stack/runs/catalog/report.json'),
        JSON.stringify({
            status: 'passed',
            results: [],
        })
    );
    for (const [shard, failed] of [
        ['3', null],
        ['3', 'STARTUP_OUTCOME'],
        ['3', 'VERIFICATION_OUTCOME'],
        ['1', 'SCRIPT_OUTCOME'],
        ['2', 'SCRIPT_OUTCOME'],
    ]) {
        const environment = {
            ...process.env,
            SHARD_ID: shard,
            STACK_DIR: path.join(summaryTemporary, 'stack'),
            SUMMARY_DIR: path.join(summaryTemporary, 'summary'),
            GITHUB_STEP_SUMMARY: path.join(summaryTemporary, 'step.md'),
            STARTUP_OUTCOME: 'success',
            SCRIPT_OUTCOME: 'skipped',
            VERIFICATION_OUTCOME: 'success',
            TEARDOWN_OUTCOME: 'success',
            ...(failed ? { [failed]: 'failure' } : {}),
        };
        assert.equal(
            spawnSync('bash', ['-e', '-c', summary.run], { cwd: root, env: environment }).status,
            0
        );
        const report = JSON.parse(
            fs.readFileSync(path.join(environment.SUMMARY_DIR, 'summary.json'), 'utf8')
        );
        assert.equal(report.run, failed ? 'failure' : 'success');
        assert.equal(report.commandOutcomes.script, shard === '3' ? 'unknown' : 'failure');
        assert.equal(report.reports[0].status, 'passed');
    }
} finally {
    fs.rmSync(summaryTemporary, { recursive: true, force: true });
}
const fallback = gate.steps.find(
    step => step.name === 'Preserve current failure proof if aggregation cannot run'
);
assert.equal(fallback.if, '${{ always() }}');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'verification-fallback-'));
try {
    const environment = {
        ...process.env,
        RUNNER_TEMP: temporary,
        GITHUB_STEP_SUMMARY: path.join(temporary, 'step.md'),
    };
    assert.equal(spawnSync('bash', ['-e', '-c', fallback.run], { env: environment }).status, 0);
    const reportPath = path.join(temporary, 'lc-shard-merged/media/report.json');
    assert.equal(JSON.parse(fs.readFileSync(reportPath, 'utf8')).status, 'failed');
    const partial = '{"status":"failed","results":[{"feature":"partial"}]}';
    fs.writeFileSync(reportPath, partial);
    assert.equal(spawnSync('bash', ['-e', '-c', fallback.run], { env: environment }).status, 0);
    assert.equal(fs.readFileSync(reportPath, 'utf8'), partial);
} finally {
    fs.rmSync(temporary, { recursive: true, force: true });
}
