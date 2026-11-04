const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const yaml = require('js-yaml');

const workflow = yaml.load(fs.readFileSync(path.join(__dirname, '../workflows/lint.yml'), 'utf8'));
const { SourceLint, StaticChecks, WorkspaceLint, RepositoryContracts } = workflow.jobs;
const checks = job => job.steps.filter(step => step.if);
// Keep fixture paths from looking like a runtime call to the repository text guard.
const noJestScript = ['scripts/check-no', 'jest'].join('-');

test('four independent jobs retain every source/static guard and the separate expensive gates', () => {
    assert.deepEqual(Object.keys(workflow.jobs).sort(), [
        'RepositoryContracts',
        'SourceLint',
        'StaticChecks',
        'WorkspaceLint',
    ]);
    for (const job of Object.values(workflow.jobs)) {
        assert.equal(job.needs, undefined);
        assert.equal(job['continue-on-error'], undefined);
    }
    const source = SourceLint.steps.map(step => step.run ?? '').join('\n');
    const statics = StaticChecks.steps.map(step => step.run ?? '').join('\n');
    for (const command of [
        'bun run lint:ox',
        'bunx prettier --check --',
        'bun run lint:a11y',
        'bun run i18n:check-memos',
        'bun run i18n:check-ast',
        'bun run test:i18n',
    ])
        assert.ok(source.includes(command), `missing source guard: ${command}`);
    for (const command of [
        `node --test ${noJestScript}.test.mjs`,
        `node ${noJestScript}.mjs`,
        'node apps/learn-card-app/scripts/check-i18n-keys.mjs',
        'node apps/scouts/scripts/check-i18n-keys.mjs',
        'node apps/scouts/scripts/check-i18n-imports.mjs',
        'node apps/scouts/scripts/check-i18n-parity.mjs',
        'node apps/learn-card-app/scripts/check-i18n-markers.mjs --strict',
        'node apps/scouts/scripts/check-i18n-markers.mjs --strict',
        'node apps/learn-card-app/scripts/check-i18n-untranslated.mjs --strict',
        'node apps/scouts/scripts/check-i18n-untranslated.mjs --strict',
        'node packages/plugins/didkit/scripts/check-wasm-numeric-status.mjs',
        'node packages/plugins/didkit/scripts/check-wasm-url.mjs',
        'node scripts/check-safe-area.mjs',
    ])
        assert.ok(statics.includes(command), `missing static guard: ${command}`);
    assert.equal(
        SourceLint.steps.filter(step => step.uses === './.github/actions/setup').length,
        1
    );
    assert.equal(
        StaticChecks.steps.filter(step => step.uses && !step.uses.startsWith('actions/checkout@'))
            .length,
        0,
        'static guards must not pay for installation'
    );
    assert.ok(WorkspaceLint.steps.some(step => step.run === 'bun run lint:workspace'));
    assert.ok(WorkspaceLint.steps.some(step => step.with?.path === '.nx-cache/eslint'));
    assert.ok(
        RepositoryContracts.steps.some(step =>
            step.run?.includes('for contract in .github/tests/*.test.cjs')
        )
    );
});

test('later guards still run after an earlier check fails, but not after setup failure or cancellation', () => {
    for (const [job, prerequisite] of [
        [SourceLint, 'setup'],
        [StaticChecks, 'checkout'],
    ]) {
        assert.ok(checks(job).length >= 5);
        for (const step of checks(job)) {
            assert.equal(step['continue-on-error'], undefined);
            for (const outcome of ['success', 'failure', 'skipped']) {
                for (const cancelled of [false, true]) {
                    const expression = step.if.replace(/^\$\{\{\s*|\s*\}\}$/g, '');
                    const result = vm.runInNewContext(expression, {
                        cancelled: () => cancelled,
                        steps: { [prerequisite]: { outcome } },
                    });
                    assert.equal(result, outcome === 'success' && !cancelled, step.name);
                }
            }
        }
    }
});

test('actual Prettier shell treats unusual filenames as data and propagates diff failures', t => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'lc-lint-paths-'));
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
    const capture = path.join(directory, 'args.json');
    fs.writeFileSync(
        path.join(directory, 'git'),
        `#!/usr/bin/env node\nif (process.env.LINT_DIFF_FAILURE) process.exit(19); process.stdout.write(JSON.parse(process.env.LINT_TEST_FILES).join('\\0')+'\\0');\n`,
        { mode: 0o700 }
    );
    fs.writeFileSync(
        path.join(directory, 'bunx'),
        `#!/usr/bin/env node\nrequire('node:fs').writeFileSync(process.env.LINT_CAPTURE, JSON.stringify(process.argv.slice(2)));\n`,
        { mode: 0o700 }
    );
    const files = [
        'ordinary.ts',
        'with spaces.json',
        'quote".md',
        'line\nbreak.yml',
        '$(touch PWNED).md',
        '--config=evil.md',
        'ignored.png',
    ];
    const step = SourceLint.steps.find(step => step.name === 'Prettier check (changed files only)');
    assert.ok(!step.run.includes('${{'), 'filenames must not be interpolated into shell source');
    const run = (selected, extra = {}) =>
        spawnSync('bash', ['-e', '-o', 'pipefail', '-c', step.run], {
            cwd: directory,
            encoding: 'utf8',
            env: {
                ...process.env,
                PATH: `${directory}:${process.env.PATH}`,
                RUNNER_TEMP: directory,
                LINT_CAPTURE: capture,
                LINT_TEST_FILES: JSON.stringify(selected),
                ...extra,
            },
        });
    assert.equal(run(files).status, 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(capture)), [
        'prettier',
        '--check',
        '--',
        ...files.slice(0, -1),
    ]);
    assert.equal(fs.existsSync(path.join(directory, 'PWNED')), false);
    fs.unlinkSync(capture);
    assert.equal(run(['ignored.png']).status, 0);
    assert.equal(fs.existsSync(capture), false);
    assert.equal(run(files, { LINT_DIFF_FAILURE: '1' }).status, 19);
});
