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
const catalogIndex = steps.findIndex(step => step.name === 'Run fresh serial catalog');
const campaignsIndex = steps.findIndex(
    step => step.name === 'Verify campaign SDK authorization boundaries'
);
const teardownIndex = steps.findIndex(step => step.name === 'Always tear down owned resources');

assert.ok(catalogIndex >= 0, 'catalog step must exist');
assert.ok(campaignsIndex > catalogIndex, 'campaign proof must follow the catalog');
assert.ok(teardownIndex > campaignsIndex, 'owned resources must be torn down after campaign proof');

const catalog = steps[catalogIndex];
assert.match(catalog.run, /verify_args=\(run all --fresh --keep --json --dir "\$STACK_DIR"\)/);

const campaigns = steps[campaignsIndex];
assert.match(campaigns.run, /lc verify script/);
assert.match(campaigns.run, /--dir "\$STACK_DIR"/);

const teardown = steps[teardownIndex];
assert.equal(teardown.if, '${{ always() }}');
assert.match(teardown.run, /lc verify down --force --dir "\$STACK_DIR"/);

console.log('verification workflow lifecycle contract passed');
