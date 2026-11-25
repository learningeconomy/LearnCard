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
    createDiagnosticReport,
    formatComparison,
    parseDiagnostic,
} from './typecheck-diagnostics.mjs';
import { checkProject, verdict } from './typecheck-ratchet.mjs';

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
        assert.match(formatted.markdown, /Current head diagnostic sample/);
        assert.match(formatted.markdown, /not necessarily introduced by this branch/);
        assert.match(formatted.markdown, /src\/a.ts:1:1.*TS2322.*Old problem/);
        assert.equal(formatted.annotations.length, 1);
        assert.match(formatted.annotations[0], /title=Current TS2322/);
        assert.doesNotMatch(formatted.annotations[0], /title=Added/);
    });

test('unavailable comparison samples are bounded, escaped, and keep configuration diagnostics visible', () => {
    const errors = Array.from({ length: 35 }, (_, i) =>
        diagnostic(i + 1, `Problem ${i} <script>\n::notice::injected`)
    );
    errors[0] = parseDiagnostic('error TS6053: File missing', '/repo');
    errors[1].file = 'src/a,b.ts';
    errors[2].file = '../outside.ts';
    const formatted = formatComparison(compareReports(report(result(errors)), undefined));
    assert.match(formatted.markdown, /\(configuration\).*TS6053.*File missing/);
    assert.match(formatted.markdown, /Showing 30 of 35/);
    assert.match(formatted.markdown, /&lt;script&gt;/);
    assert.doesNotMatch(formatted.markdown, /Problem 30/);
    assert.equal(formatted.annotations.length, 28);
    assert.match(formatted.annotations[0], /file=src\/a%2Cb.ts,line=2,col=1/);
    assert.match(formatted.annotations[0], /%0A::notice::injected/);
    assert.ok(formatted.annotations.every(annotation => annotation.split('\n').length === 1));
    assert.doesNotMatch(formatted.annotations.join('\n'), /file=\.\.\//);
});

test('head configuration errors also fall back to current diagnostics', () => {
    const error = parseDiagnostic('error TS6053: File missing', '/repo');
    const compared = compareReports(
        report(result([error], { configErrors: 1 })),
        report(result([]))
    );
    const formatted = formatComparison(compared);
    assert.match(formatted.markdown, /Comparison unavailable.*configuration errors/);
    assert.match(formatted.markdown, /Current head diagnostic sample/);
    assert.match(formatted.markdown, /TS6053.*File missing/);
    assert.deepEqual(formatted.annotations, []);
});

test('available comparisons annotate only added errors, and workflow-command fields are escaped', () => {
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
                env: {
                    ...process.env,
                    GITHUB_STEP_SUMMARY: summary,
                    GITHUB_OUTPUT: join(directory, 'outputs.txt'),
                    GITHUB_ACTIONS: 'true',
                },
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
        assert.match(missing.stdout, /Current head diagnostic sample/);
        assert.match(missing.stdout, /app\/src\/a.ts:3:7.*TS2322/);
        assert.match(missing.stdout, /Showing 30 of 41/);
        assert.match(missing.stdout, /::error file=app\/src\/a.ts,line=3,col=7,title=Current/);
        assert.match(readFileSync(summary, 'utf8'), /Current head diagnostic sample/);
        assert.doesNotMatch(missing.stdout, /0 added/);
        const corruptFile = join(directory, 'corrupt.json');
        writeFileSync(
            corruptFile,
            JSON.stringify({ ...base, results: [{ ...base.results[0], diagnostics: [] }] })
        );
        const corrupt = run(['scripts/typecheck-diagnostics.mjs', 'render', headFile, corruptFile]);
        assert.equal(corrupt.status, 0);
        assert.match(corrupt.stdout, /Comparison unavailable/);
        assert.match(corrupt.stdout, /Current head diagnostic sample/);
        assert.match(corrupt.stdout, /app\/src\/a.ts:3:7.*TS2322/);
        assert.doesNotMatch(corrupt.stdout, /0 added/);
        const selected = run(['scripts/typecheck-diagnostics.mjs', 'select', headFile]);
        assert.equal(selected.status, 0);
        assert.match(selected.stdout, /1 project/);
        assert.equal(readFileSync(join(directory, 'outputs.txt'), 'utf8'), 'needed=true\n');
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
    assert.match(formatted.markdown, /No head diagnostics were captured/);
    assert.deepEqual(formatted.annotations, []);
});

test('partial diagnostics from an incomplete head remain visible without claiming additions', () => {
    const compared = compareReports(
        report(
            result([diagnostic(4)], { raised: false, count: null, incomplete: 'killed by SIGKILL' })
        ),
        report(result([]))
    );
    const formatted = formatComparison(compared);
    assert.match(formatted.markdown, /Head typecheck did not finish/);
    assert.match(formatted.markdown, /src\/a.ts:4:1.*Old problem/);
    assert.match(formatted.annotations[0], /title=Current TS2322/);
    assert.doesNotMatch(formatted.markdown, /added diagnostic\(s\)/);
});

test('project-local commands resolve diagnostics against their check cwd, preserving repository source annotations', async () => {
    const root = mkdtempSync(join(tmpdir(), 'typecheck-project-cwd-'));
    try {
        const project = join(root, 'services/example');
        mkdirSync(join(project, 'src'), { recursive: true });
        const statement = 'const added: boolean = 42;';
        writeFileSync(join(project, 'src/a.ts'), statement);
        writeFileSync(
            join(project, 'tsconfig.json'),
            JSON.stringify({
                compilerOptions: { strict: true, types: [], skipLibCheck: true },
                include: ['src'],
            })
        );
        const compiler = resolve('node_modules/typescript/bin/tsc');
        const local = await checkProject({
            name: 'example',
            checks: [
                {
                    cmd: process.execPath,
                    args: [compiler, '--noEmit', '-p', '.', '--pretty', 'false'],
                    cwd: project,
                },
            ],
        });
        const repository = await checkProject({
            name: 'example',
            checks: [
                {
                    cmd: process.execPath,
                    args: [compiler, '--noEmit', '-p', 'services/example', '--pretty', 'false'],
                    cwd: root,
                },
            ],
        });
        assert.equal(local.count, 1);
        assert.match(local.errors[0], /^src\/a.ts/);
        assert.equal(local.errorCwds[0], project);
        const localReport = createDiagnosticReport([local], {}, root);
        const repositoryReport = createDiagnosticReport([repository], {}, root);
        const d = localReport.results[0].diagnostics[0];
        assert.equal(d.file, 'services/example/src/a.ts');
        assert.equal(d.sourceLine, statement);
        assert.deepEqual(
            addedDiagnostics(
                localReport.results[0].diagnostics,
                repositoryReport.results[0].diagnostics
            ),
            []
        );
        const formatted = formatComparison(compareReports(localReport, report(result([]))));
        assert.match(formatted.annotations[0], /file=services\/example\/src\/a.ts,line=1/);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('a base worktree outside the head cannot inherit head-only ambient types, unlike a nested checkout', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'typecheck-worktree-isolation-'));
    const head = join(directory, 'head');
    try {
        mkdirSync(join(head, 'src'), { recursive: true });
        mkdirSync(join(head, 'node_modules/@types/head-only'), { recursive: true });
        writeFileSync(
            join(head, 'node_modules/@types/head-only/index.d.ts'),
            'declare const TYPECHECK_HEAD_ONLY_GLOBAL: number;'
        );
        writeFileSync(
            join(head, 'tsconfig.json'),
            JSON.stringify({
                compilerOptions: { strict: true, skipLibCheck: true },
                include: ['src'],
            })
        );
        writeFileSync(join(head, 'src/a.ts'), 'const value: number = TYPECHECK_HEAD_ONLY_GLOBAL;');
        const git = args => {
            const ran = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-C', head, ...args], {
                encoding: 'utf8',
            });
            assert.equal(ran.status, 0, ran.stderr);
        };
        git(['init', '--quiet']);
        git(['add', 'src', 'tsconfig.json']);
        git([
            '-c',
            'user.name=Typecheck Test',
            '-c',
            'user.email=typecheck@example.invalid',
            'commit',
            '--quiet',
            '-m',
            'fixture',
        ]);
        const nested = join(head, '.typecheck-comparison-base');
        const isolated = join(directory, 'runner-temp-base');
        git(['worktree', 'add', '--detach', nested, 'HEAD']);
        git(['worktree', 'add', '--detach', isolated, 'HEAD']);
        const check = cwd =>
            checkProject({
                name: 'example',
                checks: [
                    {
                        cmd: process.execPath,
                        args: [
                            resolve('node_modules/typescript/bin/tsc'),
                            '--noEmit',
                            '-p',
                            '.',
                            '--pretty',
                            'false',
                        ],
                        cwd,
                    },
                ],
            });
        const leaked = await check(nested);
        const independent = await check(isolated);
        assert.equal(leaked.incomplete, null);
        assert.equal(leaked.count, 0, 'a nested base incorrectly sees the head-only global');
        assert.equal(independent.incomplete, null);
        assert.equal(independent.count, 1);
        assert.match(independent.errors[0], /TS2304.*TYPECHECK_HEAD_ONLY_GLOBAL/);
    } finally {
        rmSync(directory, { recursive: true, force: true });
    }
});
