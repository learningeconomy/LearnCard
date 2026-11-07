const assert = require('node:assert/strict');
const { test } = require('node:test');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../..');
const load = name =>
    yaml.load(readFileSync(path.join(root, `.github/workflows/${name}.yml`), 'utf8'));
const testWorkflow = load('test');
const deploy = load('deploy');
const queue = testWorkflow.jobs.Test;
const determine = deploy.jobs['determine-affected'];
const consumer = deploy.jobs['test-affected'];
const step = (job, name) => {
    const result = job.steps.find(s => s.name === name);
    assert.ok(result, name);
    return result;
};

test('queue proof binds the actual frozen range and publishes only after successful queue tests', () => {
    const freeze = step(queue, 'Freeze affected test range');
    assert.match(freeze.run, /base=\$\(git rev-parse origin\/main\)/);
    assert.match(freeze.run, /head=\$\(git rev-parse HEAD\)/);
    assert.match(freeze.run, /--target=test --base="\$base" --head="\$head"/);
    assert.match(freeze.run, /timeout --kill-after=5s 20s bunx/);
    const run = step(queue, 'Run tests');
    assert.equal(
        run.run.trim(),
        `if [ "$LC_NX_PILOT_ACTIVE" = 'true' ]; then
  node scripts/nx-artifact-cache/run.mjs consume
else
  bunx nx affected --target=test --base="$NX_BASE" --head="$NX_HEAD"
fi`
    );
    assert.equal(run.env.NX_BASE, '${{ steps.test-range.outputs.base }}');
    assert.equal(run.env.NX_HEAD, '${{ steps.test-range.outputs.head }}');
    const proof = step(queue, 'Record queue test proof');
    assert.equal(proof.if, "${{ success() && github.event_name == 'merge_group' }}");
    assert.equal(proof.env.NX_BASE, run.env.NX_BASE);
    assert.equal(proof.env.NX_HEAD, run.env.NX_HEAD);
    assert.ok(
        queue.steps.indexOf(proof) > queue.steps.indexOf(step(queue, 'Summarize test retries'))
    );
    const upload = step(queue, 'Publish queue test proof');
    assert.equal(
        upload.if,
        "${{ success() && github.event_name == 'merge_group' && steps.queue-proof.outputs.publish == 'true' }}"
    );
    assert.equal(upload.uses, 'actions/upload-artifact@v4');
    assert.equal(
        upload.with.name,
        'queue-test-proof-${{ github.run_id }}-${{ github.run_attempt }}'
    );
    assert.match(upload.with.path, /\/queue-test-proof\/queue-test-proof\.json$/);
    assert.equal(upload.with['overwrite'], undefined);
    for (const optional of [proof, upload]) assert.equal(optional['continue-on-error'], true);
});

test('proof lookup is read-only, bounded and cannot replace the default tests without an explicit true', () => {
    assert.deepEqual(determine.permissions, { contents: 'read', actions: 'read' });
    const lookup = step(determine, 'Check merge-queue test proof');
    assert.match(lookup.if, /github.event_name == 'push'/);
    assert.match(lookup.if, /is_release != 'true'/);
    assert.equal(lookup.with.retries, 0);
    assert.match(lookup.with.script, /reused: false/);
    assert.match(lookup.with.script, /timeout: 20000/);
    assert.match(lookup.with.script, /--target=test/);
    assert.equal(
        determine.outputs.tests_reused,
        "${{ steps.test-proof.outputs.reused || 'false' }}"
    );
    assert.equal(consumer.environment, queue.environment);
    assert.equal(consumer.environment, 'ci-tests');
    for (const name of ['SEED', 'LEARN_CLOUD_SEED']) {
        assert.equal(step(consumer, 'Run tests').env[name], step(queue, 'Run tests').env[name]);
    }
    for (const s of consumer.steps) {
        if (s.name === 'Record reused queue tests') {
            assert.equal(s.if, "needs.determine-affected.outputs.tests_reused == 'true'");
        } else if (s.name === 'Summarize test retries') {
            assert.equal(
                s.if,
                "${{ always() && needs.determine-affected.outputs.tests_reused != 'true' }}"
            );
        } else {
            assert.equal(s.if, "needs.determine-affected.outputs.tests_reused != 'true'", s.name);
        }
    }
    assert.equal(consumer['continue-on-error'], undefined);
    assert.ok(consumer.needs.includes('build-native-plugin'));
    assert.equal(
        deploy.jobs['build-native-plugin'].steps.some(s => s.name === 'Build native plugin'),
        true
    );
    for (const name of [
        'deploy-brain-service',
        'deploy-learn-cloud',
        'deploy-lca-api',
        'deploy-frontend',
    ]) {
        assert.ok(deploy.jobs[name].needs.includes('test-affected'));
        assert.match(deploy.jobs[name].if, /needs\.test-affected\.result == 'success'/);
        assert.doesNotMatch(deploy.jobs[name].if, /needs\.test-affected\.result == 'skipped'/);
    }
});
