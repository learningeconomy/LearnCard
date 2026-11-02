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
const steps = workflow.jobs.verification.steps;
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

const profileIndex = steps.findIndex(step => step.name === 'Profile retained browser calls');
assert.ok(profileIndex > teardownIndex && profileIndex < summaryIndex);
const profile = steps[profileIndex];
assert.equal(profile.if, '${{ always() }}');
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
