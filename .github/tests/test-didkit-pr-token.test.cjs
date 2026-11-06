const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../..');
const workflow = yaml.load(
    fs.readFileSync(path.join(root, '.github/workflows/update-didkit-wasm.yml'), 'utf8')
);
const publish = workflow.jobs.update;
const steps = publish.steps;
const tokenIndex = steps.findIndex(step => step.id === 'app-token');
const token = steps[tokenIndex];
const writerIndex = steps.findIndex(step => step.uses === 'peter-evans/create-pull-request@v7');
const writer = steps[writerIndex];

test('PR validation cannot enter the protected publisher or mint the App token', () => {
    assert.equal(publish.environment, 'didkit-wasm-publish');
    for (const event of ['pull_request', 'repository_dispatch', 'workflow_dispatch']) {
        assert.equal(
            vm.runInNewContext(publish.if, { github: { event_name: event } }),
            event !== 'pull_request'
        );
    }
    assert.ok(!JSON.stringify(workflow.jobs.validate).includes('E2E_RUNNER_PRIVATE_KEY'));
    assert.deepEqual(workflow.permissions, { contents: 'read' });
    assert.deepEqual(publish.permissions, { contents: 'read', 'id-token': 'write' });
});

test('build checkout does not persist a write credential or depend on the old bot secret', () => {
    const checkout = steps.find(step => step.name === 'Checkout LearnCard source');
    assert.equal(checkout.with['persist-credentials'], false);
    assert.equal(checkout.with.token, undefined);
    assert.equal(checkout.with.submodules, 'recursive');
    assert.equal(checkout.with['fetch-depth'], 0);
    assert.doesNotMatch(JSON.stringify(workflow), /LEARNCARD_BOT_TOKEN/);
    for (const step of steps.slice(0, tokenIndex)) {
        assert.doesNotMatch(
            JSON.stringify(step),
            /app-token\.outputs\.token|E2E_RUNNER_PRIVATE_KEY/
        );
    }
});

test('mint a fresh repository-scoped token after publication and immediately before writing the PR', () => {
    assert.equal(token.uses, 'actions/create-github-app-token@v3');
    assert.deepEqual(token.with, {
        'app-id': '${{ secrets.E2E_RUNNER_APP_ID }}',
        'private-key': '${{ secrets.E2E_RUNNER_PRIVATE_KEY }}',
        owner: '${{ github.repository_owner }}',
        repositories: '${{ github.event.repository.name }}',
        'permission-contents': 'write',
        'permission-pull-requests': 'write',
        'skip-token-revoke': 'false',
    });
    assert.equal(writerIndex, tokenIndex + 1);
    for (const name of ['Build DIDKit WASM', 'Test DIDKit plugin']) {
        const index = steps.findIndex(step => step.name === name);
        assert.ok(index >= 0 && index < tokenIndex, `${name} must finish before token creation`);
    }
    // The last publication/CloudFront verification step must finish first.
    assert.match(steps[tokenIndex - 1].run, /CloudFront served the generated WASM/);
    assert.equal(token['continue-on-error'], undefined);
    assert.equal(token.if, "steps.changes.outputs.has_changes == 'true'");
    assert.equal(writer.if, token.if);
    for (const hasChanges of ['true', 'false', '']) {
        const context = { steps: { changes: { outputs: { has_changes: hasChanges } } } };
        assert.equal(vm.runInNewContext(token.if, context), hasChanges === 'true');
    }
});

test('both generated branch pushes and PR writes use only the App token', () => {
    assert.equal(writer.with.token, '${{ steps.app-token.outputs.token }}');
    assert.equal(writer.with['branch-token'], undefined);
    assert.equal(writer.with.branch, 'automation/update-didkit-wasm');
    assert.equal(writer.with['delete-branch'], true);
    assert.equal(writer['continue-on-error'], undefined);
    assert.doesNotMatch(JSON.stringify(writer), /github\.token|GITHUB_TOKEN|secrets\./);
    assert.equal(writer.with.labels.trim(), 'automated pr');
    assert.equal(writer.with.reviewers, 'TaylorBeeston');
    assert.ok(writer.with['add-paths'].includes('packages/plugins/didkit/src/didkit/pkg'));
});
