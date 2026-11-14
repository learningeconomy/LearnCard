const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');
const vm = require('node:vm');

const directory = path.resolve(__dirname, '../workflows');
const notifierFile = 'failure-notification.yml';
const files = fs.readdirSync(directory).filter(file => /\.ya?ml$/.test(file));
// Use the same Ruby YAML parser as the neighboring repository contracts.
const parsed = spawnSync(
    'ruby',
    [
        '-rjson',
        '-ryaml',
        '-e',
        'puts JSON.generate(ARGV.to_h { |p| [File.basename(p), YAML.load_file(p, aliases: true)] })',
        ...files.map(file => path.join(directory, file)),
    ],
    { encoding: 'utf8' }
);
assert.equal(parsed.status, 0, parsed.stderr);
const workflows = JSON.parse(parsed.stdout);
// Ruby's YAML 1.1 parser treats the unquoted `on` key as boolean true.
const triggers = workflow => workflow.on ?? workflow.true;
const notifier = workflows[notifierFile];
const subscription = triggers(notifier).workflow_run;
const job = notifier.jobs.notify_on_failure;

const expectedNames = inventory => {
    // These cannot create an independent main-branch run. A reusable-only
    // workflow's failures are reported through its top-level caller.
    const excludedEvents = new Set(['pull_request', 'merge_group', 'workflow_call']);
    return Object.entries(inventory)
        .filter(([file, workflow]) => {
            if (file === notifierFile) return false;
            const on = triggers(workflow);
            const events = typeof on === 'string' ? [on] : Array.isArray(on) ? on : Object.keys(on);
            // Retain unknown/new event types conservatively rather than silence alerts.
            return events.some(event => !excludedEvents.has(event));
        })
        .map(([, workflow]) => workflow.name)
        .sort();
};
const checkInventory = inventory => {
    assert.deepEqual(
        [...subscription.workflows].sort(),
        expectedNames(inventory),
        'Update the notification workflow list when adding/renaming a main-capable workflow'
    );
};

test('native trigger filters source main runs and excludes notifier recursion', () => {
    assert.deepEqual(Object.keys(triggers(notifier)), ['workflow_run']);
    assert.deepEqual(subscription.branches, ['main']);
    assert.equal(subscription['branches-ignore'], undefined);
    assert.deepEqual(subscription.types, ['completed']);
    assert.ok(!subscription.workflows.includes('*'));
    assert.ok(!subscription.workflows.includes(notifier.name));
    assert.equal(new Set(subscription.workflows).size, subscription.workflows.length);
    checkInventory(workflows);
});

test('inventory guard catches new main workflows, renames, and new manual entry points', () => {
    const changed = () => structuredClone(workflows);
    let inventory = changed();
    inventory['new.yml'] = { name: 'New main check', on: { push: { branches: ['main'] } } };
    assert.throws(() => checkInventory(inventory), /Update the notification workflow list/);
    inventory = changed();
    inventory['deploy.yml'].name = 'Renamed Deploy';
    assert.throws(() => checkInventory(inventory), /Update the notification workflow list/);
    inventory = changed();
    triggers(inventory['lint.yml']).workflow_dispatch = null;
    assert.throws(() => checkInventory(inventory), /Update the notification workflow list/);
    inventory = changed();
    inventory['new.yml'] = { name: 'New PR check', on: ['pull_request', 'merge_group'] };
    checkInventory(inventory);
    inventory['reusable.yml'] = { name: 'Reusable helper', on: 'workflow_call' };
    checkInventory(inventory);
});

test('only failed or timed-out main runs notify; no checkout or extra token access', () => {
    for (const branch of ['main', 'feature/example', 'gh-readonly-queue/main/pr-123']) {
        for (const conclusion of [
            'failure',
            'timed_out',
            'success',
            'cancelled',
            'skipped',
            'neutral',
            null,
        ]) {
            const result = vm.runInNewContext(job.if, {
                github: { event: { workflow_run: { head_branch: branch, conclusion } } },
            });
            assert.equal(
                result,
                branch === 'main' && ['failure', 'timed_out'].includes(conclusion)
            );
        }
    }
    assert.deepEqual(notifier.permissions, { contents: 'read' });
    assert.equal(job.steps.length, 1);
    assert.equal(job.steps[0].uses, 'rtCamp/action-slack-notify@v2');
    assert.equal(job.steps[0].env.SLACK_WEBHOOK, '${{ secrets.SLACK_WEBHOOK_DEPLOY_ERRORS_URL }}');
});

test('real workflow examples preserve main alerts without creating PR/queue notification runs', () => {
    const createsRun = (name, branch) =>
        subscription.workflows.includes(name) && subscription.branches.includes(branch);
    for (const file of [
        'deploy.yml',
        'capgo-recovery.yml',
        'codeql.yml',
        'test.yml',
        'e2e.yml',
        'keycloak-drift.yml',
    ]) {
        const name = workflows[file].name;
        assert.equal(createsRun(name, 'main'), true, file);
        assert.equal(createsRun(name, 'feature/example'), false, file);
        assert.equal(createsRun(name, 'gh-readonly-queue/main/pr-123'), false, file);
    }
    for (const file of ['lint.yml', 'typecheck.yml', 'capgo-upload.yml', notifierFile]) {
        assert.equal(createsRun(workflows[file].name, 'main'), false, file);
    }
});
