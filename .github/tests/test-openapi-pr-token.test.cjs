const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');

const root = path.resolve(__dirname, '../..');
const read = file => yaml.load(fs.readFileSync(path.join(root, '.github/workflows', file), 'utf8'));
const generator = read('open-api-generator.yml');
const deploy = read('deploy.yml');
const caller = deploy.jobs['generate-sdk'];
const steps = generator.jobs['generate-clients'].steps;
const tokenIndex = steps.findIndex(step => step.id === 'app-token');
const token = steps[tokenIndex];
const writerIndex = steps.findIndex(step => step.uses === 'peter-evans/create-pull-request@v7');
const writer = steps[writerIndex];

test('the reusable workflow requires only the existing two App credentials and the caller passes both', () => {
    const names = ['E2E_RUNNER_APP_ID', 'E2E_RUNNER_PRIVATE_KEY'];
    assert.deepEqual(Object.keys(generator.on.workflow_call.secrets).sort(), names);
    assert.deepEqual(Object.keys(caller.secrets).sort(), names);
    assert.equal(caller.uses, './.github/workflows/open-api-generator.yml');
    for (const name of names) {
        assert.equal(generator.on.workflow_call.secrets[name].required, true);
        assert.equal(caller.secrets[name], '${{ secrets.' + name + ' }}');
    }
    assert.equal(
        caller.environment,
        undefined,
        'CI credentials must not select a service environment'
    );
});

test('the App token is scoped to this repository and only the PR-writing permissions', () => {
    assert.deepEqual(generator.permissions, { contents: 'read' });
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
});

test('generation and checkout do not receive the write token; mint it immediately before PR creation', () => {
    const generation = steps.findIndex(
        step => step.name === 'Export local schema and regenerate with pinned tools'
    );
    assert.ok(generation >= 0 && generation < tokenIndex);
    assert.equal(writerIndex, tokenIndex + 1);
    const checkout = steps.find(step => step.uses === 'actions/checkout@v7');
    assert.equal(checkout.with['persist-credentials'], false);
    assert.equal(checkout.with.token, undefined);
    for (const step of steps.slice(0, tokenIndex)) {
        assert.doesNotMatch(
            JSON.stringify(step),
            /app-token\.outputs\.token|E2E_RUNNER_PRIVATE_KEY/
        );
    }
});

test('PR creation and updates use the App token without default-token fallback', () => {
    assert.equal(writer.with.token, '${{ steps.app-token.outputs.token }}');
    assert.equal(
        writer.with['branch-token'],
        undefined,
        'branch writes must use the same App token'
    );
    assert.equal(writer.with.branch, 'open-api-generator');
    assert.equal(writer.with.base, 'main');
    assert.doesNotMatch(JSON.stringify(writer), /github\.token|GITHUB_TOKEN|secrets\./);
});
