const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

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
const evaluate = gate.steps[0];
assert.deepEqual(evaluate.env, {
    SOURCE_RESULT: '${{ needs.source-checks.result }}',
    BUNDLE_RESULT: '${{ needs.production-bundle.result }}',
    RUNTIME_RESULT: '${{ needs.runtime.result }}',
});
for (const a of ['success', 'failure', 'cancelled', 'skipped']) {
    for (const b of ['success', 'failure', 'cancelled', 'skipped']) {
        for (const c of ['success', 'failure', 'cancelled', 'skipped']) {
            const result = spawnSync('bash', ['-e', '-c', evaluate.run], {
                encoding: 'utf8',
                env: { ...process.env, SOURCE_RESULT: a, BUNDLE_RESULT: b, RUNTIME_RESULT: c },
            });
            assert.equal(
                result.status,
                a === 'success' && b === 'success' && c === 'success' ? 0 : 1,
                `aggregate must fail closed: ${a}/${b}/${c}`
            );
        }
    }
}
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
assert.match(navigation.run, /lc verify script .*verify-navigation\.mjs.*--dir "\$STACK_DIR"/);

const catalog = steps[catalogIndex];
assert.match(catalog.run, /lc verify run all --json --dir "\$STACK_DIR"/);

const campaigns = steps[campaignsIndex];
assert.equal(campaigns.id, 'campaigns');
assert.match(campaigns.run, /lc verify script/);
assert.match(campaigns.run, /--dir "\$STACK_DIR"/);

const teardown = steps[teardownIndex];
assert.equal(teardown.if, '${{ always() }}');
assert.match(teardown.run, /lc verify down --force --dir "\$STACK_DIR"/);

const summary = steps[summaryIndex];
assert.equal(summary.env.STARTUP_OUTCOME, '${{ steps.stack.outcome }}');
assert.equal(
    summary.env.SCRIPT_OUTCOME,
    "${{ steps.navigation.outcome == 'success' && steps.campaigns.outcome || steps.navigation.outcome }}"
);
assert.equal(summary.env.VERIFICATION_OUTCOME, '${{ steps.catalog.outcome }}');

assert.equal(summary.env.TEARDOWN_OUTCOME, '${{ steps.teardown.outcome }}');
const artifacts = steps.filter(step => step.uses === 'actions/upload-artifact@v4');
assert.equal(artifacts.length, 2, 'retain only the existing media and sanitized summary');
assert.ok(artifacts.every(step => step.if === '${{ always() }}'));
assert.ok(source.every(step => !step.uses?.startsWith('actions/upload-artifact@')));
assert.ok(bundle.every(step => !step.uses?.startsWith('actions/upload-artifact@')));
console.log('verification lifecycle, independent jobs and all 64 aggregate outcomes passed');

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
