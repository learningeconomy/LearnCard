const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const test = require('node:test');
const yaml = require('js-yaml');
const { validate } = require('./check.cjs');
const root = path.resolve(__dirname, '../..');
const valid = `name: Fixture
on: push
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - run: echo pass
`;
const fixture = t => {
    const cwd = mkdtempSync(path.join(tmpdir(), 'learncard-workflow-validation-'));
    t.after(() => rmSync(cwd, { recursive: true, force: true }));
    execFileSync('git', ['init', '-q', cwd]);
    const write = (file, contents) => {
        const target = path.join(cwd, file);
        mkdirSync(path.dirname(target), { recursive: true });
        writeFileSync(target, contents);
    };
    write('.github/workflows/check.yml', valid);
    write('.github/actionlint.yaml', readFileSync(path.join(root, '.github/actionlint.yaml')));
    return { cwd, write };
};

test('valid workflow passes the actual pinned validator', t => {
    const f = fixture(t);
    const result = validate(f.cwd);
    assert.equal(result.status, 0, result.output);
});

for (const quoted of [false, true]) {
    test(`duplicate jobs key (${quoted ? 'quoted' : 'plain'}) cannot replace deployment configuration`, t => {
        const f = fixture(t);
        f.write(
            '.github/workflows/check.yml',
            `${valid}${quoted ? '"jobs"' : 'jobs'}:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo deploy\n`
        );
        const result = validate(f.cwd);
        assert.notEqual(result.status, 0);
        assert.match(result.output, /duplicated mapping key/);
    });
}

test('duplicate keys in composite-action YAML also fail', t => {
    const f = fixture(t);
    f.write(
        '.github/actions/example/action.yml',
        'name: Example\nruns:\n  using: composite\n  using: node24\n'
    );
    const result = validate(f.cwd);
    assert.notEqual(result.status, 0);
    assert.match(result.output, /duplicated mapping key/);
});

test('invalid matrix expression fails actionlint', t => {
    const f = fixture(t);
    f.write(
        '.github/workflows/check.yml',
        valid.replace(
            'runs-on: ubuntu-latest',
            'strategy:\n      matrix:\n        os: [ubuntu-latest]\n    runs-on: ${{ matrix.missing }}'
        )
    );
    const result = validate(f.cwd);
    assert.notEqual(result.status, 0);
    assert.match(result.output, /property "missing"/);
});

test('unknown action input fails actionlint', t => {
    const f = fixture(t);
    f.write(
        '.github/workflows/check.yml',
        valid.replace(
            'actions/checkout@v7',
            'actions/setup-node@v4\n        with:\n          misspelled-input: true'
        )
    );
    const result = validate(f.cwd);
    assert.notEqual(result.status, 0);
    assert.match(result.output, /input "misspelled-input"/);
});

test('wrong reusable-workflow input type fails actionlint', t => {
    const f = fixture(t);
    f.write(
        '.github/workflows/reusable.yml',
        `on:
  workflow_call:
    inputs:
      deploy:
        type: string
        required: true
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - run: echo pass
`
    );
    f.write(
        '.github/workflows/check.yml',
        `on: push
jobs:
  call:
    uses: ./.github/workflows/reusable.yml
    with:
      deploy: true
`
    );
    const result = validate(f.cwd);
    assert.notEqual(result.status, 0);
    assert.match(result.output, /typed as string/);
});

const appWorkflow = inputs =>
    valid.replace(
        '      - uses: actions/checkout@v7',
        `      - uses: actions/create-github-app-token@v3\n        with:\n${inputs.map(([key, value]) => `          ${key}: ${value}`).join('\n')}`
    );
const client = ['client-id', '${{ vars.CLAUDE_APP_CLIENT_ID }}'];
const key = ['private-key', '${{ secrets.CLAUDE_APP_PRIVATE_KEY }}'];

test('known client-id metadata drift is accepted only with required bot inputs', t => {
    const f = fixture(t);
    f.write('.github/workflows/claude.yml', appWorkflow([client, key]));
    const result = validate(f.cwd);
    assert.equal(result.status, 0, result.output);
});

for (const [name, inputs, expected] of [
    ['missing identifier', [key], /requires app-id or client-id/],
    ['missing private key', [client], /requires private-key/],
    ['empty identifier', [['client-id', "''"], key], /requires app-id or client-id/],
]) {
    test(`Claude exception cannot hide ${name}`, t => {
        const f = fixture(t);
        f.write('.github/workflows/claude.yml', appWorkflow(inputs));
        const result = validate(f.cwd);
        assert.notEqual(result.status, 0);
        assert.match(result.output, expected);
    });
}

test('Claude exceptions cannot hide other unknown inputs', t => {
    const f = fixture(t);
    f.write('.github/workflows/claude.yml', appWorkflow([client, key, ['clinet-id', 'typo']]));
    const result = validate(f.cwd);
    assert.notEqual(result.status, 0);
    assert.match(result.output, /input "clinet-id"/);
});

test('Claude metadata exceptions do not apply to another workflow', t => {
    const f = fixture(t);
    f.write('.github/workflows/other.yml', appWorkflow([client, key]));
    const result = validate(f.cwd);
    assert.notEqual(result.status, 0);
    assert.match(result.output, /input "client-id"/);
});

test('obsolete action runtime is not exempted', t => {
    const f = fixture(t);
    f.write(
        '.github/workflows/check.yml',
        valid.replace('actions/checkout@v7', 'actions/checkout@v3')
    );
    const result = validate(f.cwd);
    assert.notEqual(result.status, 0);
    assert.match(result.output, /runner.*too old/);
});

test('wrong/missing validator binary fails closed', t => {
    const f = fixture(t);
    assert.notEqual(validate(f.cwd, '/missing/actionlint').status, 0);
    assert.notEqual(validate(f.cwd, process.execPath).status, 0);
});

test('stable check is available on ordinary PRs and merge-queue entries', () => {
    const workflow = yaml.load(
        readFileSync(path.join(root, '.github/workflows/workflow-validation.yml'), 'utf8')
    );
    assert.ok(Object.hasOwn(workflow.on, 'pull_request'));
    assert.ok(Object.hasOwn(workflow.on, 'merge_group'));
    assert.equal(workflow.on.pull_request.paths, undefined);
    assert.equal(workflow.on.pull_request['paths-ignore'], undefined);
    assert.equal(workflow.on.pull_request.branches, undefined);
    assert.deepEqual(workflow.permissions, { contents: 'read' });
    const job = workflow.jobs.validate;
    assert.equal(job.name, 'Workflow validation');
    assert.equal(job.if, undefined);
    const checkout = job.steps.find(s => s.uses?.startsWith('actions/checkout@'));
    assert.equal(checkout.with.ref, undefined);
    assert.equal(checkout.with['persist-credentials'], false);
    assert.ok(job.steps.every(s => !s['continue-on-error']));
});

test('entire repository baseline passes without broad suppressions', () => {
    const result = validate(root);
    assert.equal(result.status, 0, result.output);
});
