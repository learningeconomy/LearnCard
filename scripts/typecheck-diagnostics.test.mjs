import assert from 'node:assert/strict';
import {
    mkdtempSync,
    mkdirSync,
    writeFileSync,
    readFileSync,
    rmSync,
    symlinkSync,
    chmodSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import {
    addedDiagnostics,
    compareReports,
    formatComparison,
    parseDiagnostic,
} from './typecheck-diagnostics.mjs';
import { verdict } from './typecheck-ratchet.mjs';

const diagnostic = (line, message = 'Old problem', sourceLine) => ({
    file: 'src/a.ts',
    line,
    column: 1,
    code: 'TS2322',
    message,
    sourceLine,
});
const result = (diagnostics, overrides = {}) => ({
    name: 'example',
    count: diagnostics.length,
    diagnostics,
    raised: true,
    allowance: 1,
    incomplete: null,
    configErrors: 0,
    ...overrides,
});
const report = (...results) => ({ results });

test('position-only shifts are existing errors, not new errors', () => {
    assert.deepEqual(addedDiagnostics([diagnostic(90)], [diagnostic(2)]), []);
});

test('new errors beyond the old first-30 sample are found', () => {
    const base = Array.from({ length: 40 }, (_, i) => diagnostic(i + 1, `Legacy ${i}`));
    const added = diagnostic(99, 'New problem');
    assert.deepEqual(addedDiagnostics([...base, added], base), [added]);
});

test('repeated identical messages preserve multiplicity and prefer unchanged source statements', () => {
    const old = diagnostic(1, 'Type mismatch', 'const existing: number = "x";');
    const added = diagnostic(1, 'Type mismatch', 'const added: number = "y";');
    const shifted = { ...old, line: 20 };
    assert.deepEqual(addedDiagnostics([added, shifted], [old]), [added]);
    assert.equal(addedDiagnostics([diagnostic(1), diagnostic(3)], [diagnostic(1)]).length, 1);
});

test('diagnostics resolved in the branch are not listed as added', () => {
    assert.deepEqual(addedDiagnostics([], [diagnostic(1)]), []);
});

test('paths embedded in messages are normalized across independent checkouts', () => {
    const base = parseDiagnostic(
        '/base/src/a.ts(2,3): error TS2322: import("/base/src/b").B is incompatible',
        '/base'
    );
    const head = parseDiagnostic(
        '/head/src/a.ts(8,3): error TS2322: import("/head/src/b").B is incompatible',
        '/head'
    );
    assert.deepEqual(addedDiagnostics([head], [base]), []);
});

test('a pre-existing allowance violation is distinguished from an added diagnostic', () => {
    const errors = [diagnostic(1), diagnostic(2, 'Other')];
    const compared = compareReports(report(result(errors)), report(result(errors)));
    assert.equal(compared[0].added.length, 0);
    assert.match(formatComparison(compared).markdown, /base already exceeds/);
    assert.equal(
        verdict([{ name: 'example', count: 2, incomplete: null }], { example: 1 }).pass,
        false
    );
});

for (const [label, base] of [
    ['missing report', undefined],
    ['missing base project', report()],
    ['base interrupted', report(result([], { incomplete: 'killed by SIGKILL' }))],
    ['base configuration errors', report(result([], { configErrors: 1 }))],
])
    test(`comparison is unavailable when ${label}, never a claim of zero new errors`, () => {
        const compared = compareReports(report(result([diagnostic(1)])), base);
        assert.equal(compared[0].added, null);
        const formatted = formatComparison(compared);
        assert.match(formatted.markdown, /Comparison unavailable/);
        assert.doesNotMatch(formatted.markdown, /0 added/);
        assert.deepEqual(formatted.annotations, []);
    });

test('only added errors get source annotations, and workflow-command fields are escaped', () => {
    const added = { ...diagnostic(3, 'message\n::notice::injected'), file: 'src/a,b.ts' };
    const formatted = formatComparison([
        {
            name: 'example',
            count: 1,
            allowance: 0,
            baseCount: 0,
            added: [added],
            unavailable: null,
        },
    ]);
    assert.equal(formatted.annotations.length, 1);
    assert.match(formatted.annotations[0], /file=src\/a%2Cb.ts,line=3,col=1/);
    assert.match(formatted.annotations[0], /%0A::notice::injected/);
    assert.equal(formatted.annotations[0].split('\n').length, 1);
});

test('an added configuration error is shown without a misleading source annotation', () => {
    const d = parseDiagnostic('error TS6053: File missing', '/repo');
    const formatted = formatComparison([
        { name: 'example', count: 1, allowance: 0, baseCount: 0, added: [d], unavailable: null },
    ]);
    assert.match(formatted.markdown, /TS6053/);
    assert.deepEqual(formatted.annotations, []);
});

test('CLI compares a failing head against a prepared base using real TypeScript, retaining failure and reports', () => {
    const directory = mkdtempSync(join(tmpdir(), 'typecheck-diagnostic-integration-'));
    try {
        for (const revision of ['base', 'head']) {
            const root = join(directory, revision);
            mkdirSync(join(root, 'app/src'), { recursive: true });
            mkdirSync(join(root, 'scripts'), { recursive: true });
            mkdirSync(join(root, 'node_modules/.bin'), { recursive: true });
            symlinkSync(
                resolve('node_modules/typescript'),
                join(root, 'node_modules/typescript'),
                'dir'
            );
            symlinkSync(
                resolve('node_modules/typescript/bin/tsc'),
                join(root, 'node_modules/.bin/tsc')
            );
            const nx = join(root, 'node_modules/.bin/nx');
            writeFileSync(
                nx,
                `#!${process.execPath}
const fs = require('node:fs'); const file = process.argv.find(a => a.startsWith('--file=')).slice(7); fs.writeFileSync(file, JSON.stringify({graph:{nodes:{example:{name:'example',data:{root:'app'}}}}}));`
            );
            chmodSync(nx, 0o755);
            writeFileSync(
                join(root, 'app/tsconfig.json'),
                JSON.stringify({
                    compilerOptions: { strict: true, types: [], skipLibCheck: true },
                    include: ['src'],
                })
            );
            writeFileSync(
                join(root, 'scripts/typecheck-baseline.json'),
                JSON.stringify({ example: 40 })
            );
            for (const script of ['typecheck-ratchet.mjs', 'typecheck-diagnostics.mjs'])
                writeFileSync(join(root, 'scripts', script), readFileSync(join('scripts', script)));
            const old = Array.from({ length: 40 }, (_, i) => `const old${i}: number = "x";`).join(
                '\n'
            );
            writeFileSync(join(root, 'app/src/a.ts'), (revision === 'head' ? '\n\n' : '') + old);
            if (revision === 'head')
                writeFileSync(join(root, 'app/src/new.ts'), 'const added: boolean = 42;');
        }
        const headDirectory = join(directory, 'head');
        const baseDirectory = join(directory, 'base');
        const headFile = join(directory, 'reports/head.json');
        const baseFile = join(directory, 'reports/base.json');
        const summary = join(directory, 'summary.md');
        const run = args =>
            spawnSync(process.execPath, args, {
                cwd: headDirectory,
                encoding: 'utf8',
                env: { ...process.env, GITHUB_STEP_SUMMARY: summary, GITHUB_ACTIONS: 'true' },
            });
        const checked = run(['scripts/typecheck-ratchet.mjs', `--report=${headFile}`]);
        assert.equal(checked.status, 1, checked.stderr);
        const head = JSON.parse(readFileSync(headFile));
        assert.equal(head.results[0].count, 41);
        assert.equal(head.results[0].raised, true);
        const based = run([
            'scripts/typecheck-diagnostics.mjs',
            'base',
            headFile,
            baseDirectory,
            baseFile,
        ]);
        assert.equal(based.status, 0, based.stderr);
        const base = JSON.parse(readFileSync(baseFile));
        assert.equal(base.results[0].count, 40);
        const compared = compareReports(head, base);
        assert.equal(compared[0].added.length, 1);
        assert.equal(compared[0].added[0].file, 'app/src/new.ts');
        assert.equal(compared[0].added[0].line, 1);
        const rendered = run(['scripts/typecheck-diagnostics.mjs', 'render', headFile, baseFile]);
        assert.equal(rendered.status, 0, rendered.stderr);
        assert.match(rendered.stdout, /::error file=app\/src\/new.ts,line=1/);
        assert.doesNotMatch(rendered.stdout, /::error file=app\/src\/a.ts/);
        assert.match(readFileSync(summary, 'utf8'), /1 added diagnostic/);
        assert.deepEqual(
            JSON.parse(readFileSync(join(headDirectory, 'scripts/typecheck-baseline.json'))),
            { example: 40 }
        );
        const missing = run([
            'scripts/typecheck-diagnostics.mjs',
            'render',
            headFile,
            join(directory, 'absent.json'),
        ]);
        assert.equal(missing.status, 0);
        assert.match(missing.stdout, /Comparison unavailable/);
        assert.doesNotMatch(missing.stdout, /0 added/);
        const corruptFile = join(directory, 'corrupt.json');
        writeFileSync(
            corruptFile,
            JSON.stringify({ ...base, results: [{ ...base.results[0], diagnostics: [] }] })
        );
        const corrupt = run(['scripts/typecheck-diagnostics.mjs', 'render', headFile, corruptFile]);
        assert.equal(corrupt.status, 0);
        assert.match(corrupt.stdout, /Comparison unavailable/);
        assert.doesNotMatch(corrupt.stdout, /0 added/);
        const selected = run(['scripts/typecheck-diagnostics.mjs', 'select', headFile]);
        assert.equal(selected.status, 0);
        assert.match(selected.stdout, /1 project/);
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});

test('an incomplete head is explained even though it has no valid count to compare', () => {
    const compared = compareReports(
        report(result([], { raised: false, count: null, incomplete: 'killed by SIGKILL' })),
        undefined
    );
    assert.equal(compared.length, 1);
    assert.equal(compared[0].added, null);
    const formatted = formatComparison(compared);
    assert.match(formatted.markdown, /Head typecheck did not finish/);
    assert.match(formatted.markdown, /not completed/);
    assert.deepEqual(formatted.annotations, []);
});
