import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
    checkProject,
    incompleteReason,
    isConfigError,
    leafConfigs,
    nextBaseline,
    nxProjects,
    toProjects,
    verdict,
} from './typecheck-ratchet.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const TS_ERROR = "src/a.ts(1,7): error TS2322: Type 'string' is not assignable to type 'number'.";

const fixture = files => {
    const dir = mkdtempSync(join(tmpdir(), 'typecheck-ratchet-test-'));
    for (const [path, content] of Object.entries(files)) {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(
            join(dir, path),
            typeof content === 'string' ? content : JSON.stringify(content)
        );
    }
    return dir;
};

// A project whose single check is a node script, so tests control output, exit code and signal.
const nodeProject = script => ({
    name: 'fixture',
    root: 'fixture',
    checks: [{ cmd: process.execPath, args: ['-e', script], cwd: tmpdir() }],
});

test('normal tsc exits are complete', () => {
    assert.equal(incompleteReason({ code: 0, signal: null, spawnError: null, errors: [] }), null);
    assert.equal(
        incompleteReason({ code: 1, signal: null, spawnError: null, errors: [TS_ERROR] }),
        null
    );
    assert.equal(
        incompleteReason({ code: 2, signal: null, spawnError: null, errors: [TS_ERROR] }),
        null
    );
});

test('a diagnostics exit with no diagnostics is incomplete', () => {
    assert.match(
        incompleteReason({ code: 2, signal: null, spawnError: null, errors: [] }),
        /code 2/
    );
});

test('exit 127 with no type errors fails closed', async () => {
    const result = await checkProject(
        nodeProject('console.error("tsc: not found"); process.exit(127)')
    );
    assert.match(result.incomplete, /code 127/);
    assert.equal(result.count, null);
});

test('a signal fails closed', async () => {
    const result = await checkProject(nodeProject('process.kill(process.pid, "SIGTERM")'));
    assert.match(result.incomplete, /SIGTERM/);
});

test('partial output followed by termination fails closed', async () => {
    const script = `console.log(${JSON.stringify(TS_ERROR)}); setTimeout(() => process.kill(process.pid, "SIGKILL"), 50)`;
    const result = await checkProject(nodeProject(script));
    assert.match(result.incomplete, /SIGKILL after 1 type errors/);
    // Even against a higher baseline, an incomplete check is a failure and never a "down".
    const { pass, lowered, incomplete } = verdict([result], { fixture: 2 });
    assert.equal(pass, false);
    assert.equal(lowered.length, 0);
    assert.equal(incomplete.length, 1);
});

test('an out-of-memory crash fails closed', async () => {
    const result = await checkProject(nodeProject('process.abort()'));
    assert.match(result.incomplete, /SIGABRT/);
});

test('a spawn failure is recorded instead of crashing or hanging', async () => {
    const result = await checkProject({
        name: 'fixture',
        root: 'fixture',
        checks: [{ cmd: join(tmpdir(), 'definitely-not-tsc'), args: [], cwd: tmpdir() }],
    });
    assert.match(result.incomplete, /could not start/);
});

test('type errors with a normal exit are counted', async () => {
    const script = `console.log(${JSON.stringify(TS_ERROR)}); console.log(${JSON.stringify(TS_ERROR.replace('1,7', '2,7'))}); process.exit(2)`;
    const result = await checkProject(nodeProject(script));
    assert.equal(result.incomplete, null);
    assert.equal(result.count, 2);
    assert.equal(verdict([result], { fixture: 1 }).pass, false);
    assert.equal(verdict([result], { fixture: 2 }).pass, true);
});

test('the baseline is never written from an incomplete check', () => {
    const results = [
        { name: 'a', count: 3, errors: [], incomplete: null },
        { name: 'b', count: null, errors: [], incomplete: 'killed by SIGKILL after 0 type errors' },
    ];
    assert.equal(nextBaseline(results, { a: 5, b: 9 }, []), null);
    assert.deepEqual(nextBaseline([results[0]], { a: 5, b: 9 }, ['a']), { a: 3, b: 9 });
});

test('package.json-only projects are typechecked and the workspace root is skipped', () => {
    const repo = fixture({
        'package.json': { scripts: { typecheck: 'nx run-many -t typecheck' } },
        'services/relay/package.json': { name: '@x/relay', scripts: { typecheck: 'tsc --noEmit' } },
        'services/relay/tsconfig.json': { include: ['src'] },
    });
    try {
        const projects = toProjects(repo, [
            { name: '@x/relay', root: 'services/relay' },
            { name: 'workspace', root: '.' },
        ]);
        assert.deepEqual(
            projects.map(p => [p.name, p.checks.map(c => c.args.join(' '))]),
            [['@x/relay', ['run typecheck']]]
        );
    } finally {
        rmSync(repo, { recursive: true, force: true });
    }
});

test(
    'discovery uses the Nx graph, so package.json-only projects are found',
    { skip: !existsSync(join(repoRoot, 'node_modules/.bin/nx')) },
    () => {
        const roots = nxProjects(repoRoot).map(p => p.root);
        assert.ok(roots.includes('services/escrow-relay'));
        assert.ok(!existsSync(join(repoRoot, 'services/escrow-relay/project.json')));
    }
);

test('solution tsconfigs are checked through their referenced leaf configs', () => {
    const repo = fixture({
        'packages/base/tsconfig.json': `{
            // solution-style config
            "files": [],
            "include": [],
            "references": [{ "path": "./tsconfig.lib.json" }, { "path": "./nested" }]
        }`,
        'packages/base/tsconfig.lib.json': { include: ['src'] },
        'packages/base/nested/tsconfig.json': {
            files: [],
            references: [{ path: '../tsconfig.spec.json' }],
        },
        'packages/base/tsconfig.spec.json': { include: ['test'] },
    });
    try {
        const base = join(repo, 'packages/base');
        assert.deepEqual(leafConfigs(join(base, 'tsconfig.json')), [
            join(base, 'tsconfig.lib.json'),
            join(base, 'tsconfig.spec.json'),
        ]);
        const [project] = toProjects(repo, [{ name: 'base', root: 'packages/base' }]);
        assert.deepEqual(
            project.checks.map(c => c.args[c.args.indexOf('-p') + 1]),
            ['packages/base/tsconfig.lib.json', 'packages/base/tsconfig.spec.json']
        );
    } finally {
        rmSync(repo, { recursive: true, force: true });
    }
});

test('a normal tsconfig is checked as-is', () => {
    const repo = fixture({ 'apps/web/tsconfig.json': { include: ['src'] } });
    try {
        assert.deepEqual(leafConfigs(join(repo, 'apps/web/tsconfig.json')), [
            join(repo, 'apps/web/tsconfig.json'),
        ]);
    } finally {
        rmSync(repo, { recursive: true, force: true });
    }
});

test('config errors are told apart from source errors', () => {
    assert.equal(isConfigError(TS_ERROR), false);
    assert.equal(isConfigError("error TS6053: File '/x/typings/image.d.ts' not found."), true);
    assert.equal(
        isConfigError(
            "packages/base/tsconfig.spec.json(3,5): error TS5095: Option 'bundler' can only be used when 'module' is set to 'preserve' or to 'es2015' or later."
        ),
        true
    );
});

test('circular tsconfig references end instead of recursing forever', () => {
    const repo = fixture({
        'packages/a/tsconfig.json': {
            files: [],
            references: [{ path: './tsconfig.b.json' }, { path: './tsconfig.lib.json' }],
        },
        'packages/a/tsconfig.b.json': { files: [], references: [{ path: './tsconfig.json' }] },
        'packages/a/tsconfig.lib.json': { include: ['src'] },
    });
    try {
        assert.deepEqual(leafConfigs(join(repo, 'packages/a/tsconfig.json')), [
            join(repo, 'packages/a/tsconfig.lib.json'),
        ]);
    } finally {
        rmSync(repo, { recursive: true, force: true });
    }
});

// A solution config whose references can't all be checked must fail, never shrink the count.
const solutionOutcome = async files => {
    const repo = fixture(files);
    try {
        const projects = toProjects(repo, [{ name: 'base', root: 'packages/base' }]);
        assert.equal(projects.length, 1, 'the project must not disappear');
        const result = await checkProject(projects[0]);
        return {
            result,
            verdict: verdict([result], { base: 3 }),
            next: nextBaseline([result], { base: 3 }, []),
        };
    } finally {
        rmSync(repo, { recursive: true, force: true });
    }
};

test('one missing reference among valid ones fails closed', async () => {
    const {
        result,
        verdict: v,
        next,
    } = await solutionOutcome({
        'packages/base/tsconfig.json': {
            files: [],
            references: [{ path: './tsconfig.lib.json' }, { path: './tsconfig.renamed.json' }],
        },
        'packages/base/tsconfig.lib.json': { include: ['src'] },
    });
    assert.match(
        result.incomplete,
        /missing referenced tsconfig packages\/base\/tsconfig\.renamed\.json/
    );
    assert.equal(v.pass, false);
    assert.equal(v.lowered.length, 0);
    assert.equal(next, null);
});

test('all references missing fails closed instead of dropping the project', async () => {
    const {
        result,
        verdict: v,
        next,
    } = await solutionOutcome({
        'packages/base/tsconfig.json': {
            files: [],
            references: [{ path: './missing.json' }, { path: './gone' }],
        },
    });
    assert.match(
        result.incomplete,
        /packages\/base\/missing\.json, packages\/base\/gone\/tsconfig\.json/
    );
    assert.equal(v.pass, false);
    assert.equal(next, null);
});

test('a cycle-only solution fails closed instead of dropping the project', async () => {
    const {
        result,
        verdict: v,
        next,
    } = await solutionOutcome({
        'packages/base/tsconfig.json': { files: [], references: [{ path: './tsconfig.b.json' }] },
        'packages/base/tsconfig.b.json': { files: [], references: [{ path: './tsconfig.json' }] },
    });
    assert.match(
        result.incomplete,
        /packages\/base\/tsconfig\.json references no checkable tsconfig/
    );
    assert.equal(v.pass, false);
    assert.equal(next, null);
});
