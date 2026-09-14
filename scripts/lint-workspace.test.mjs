import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(new URL('./lint-workspace.ts', import.meta.url));
const nodeModulesPath = fileURLToPath(new URL('../node_modules', import.meta.url));

const writeFixtureFile = (root, path, content) => {
    const absolutePath = join(root, path);
    mkdirSync(dirname(absolutePath), { recursive: true });
    writeFileSync(absolutePath, content);
    return absolutePath;
};

const createFixtureRoot = t => {
    const root = mkdtempSync(join(tmpdir(), 'lint-workspace-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    symlinkSync(nodeModulesPath, join(root, 'node_modules'), 'dir');
    writeFixtureFile(root, 'package.json', '{"private":true,"type":"module"}\n');
    writeFixtureFile(root, 'scripts/eslint-baseline.json', '{}\n');
    writeFixtureFile(
        root,
        'eslint.config.mjs',
        'export default [{ files: ["**/*.js"], rules: { "no-debugger": "error" } }];\n'
    );
    return root;
};

const runLint = (root, ...args) =>
    spawnSync('bun', [scriptPath, ...args], {
        cwd: root,
        encoding: 'utf8',
        timeout: 30_000,
    });

const assertPassed = result => {
    assert.ifError(result.error);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.match(result.stdout, /ESLint passed/);
};

const assertLintError = (result, path) => {
    assert.ifError(result.error);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /ESLint found errors outside the explicit legacy baseline/);
    assert.ok(result.stderr.includes(path), result.stderr);
    assert.match(result.stderr, /no-debugger/);
};

test('--files ignores unrelated broken metadata and links without bypassing lint errors', t => {
    const root = createFixtureRoot(t);
    writeFixtureFile(root, 'packages/unrelated/project.json', '{ invalid JSON');
    writeFixtureFile(root, 'packages/other/project.json', '{}');
    symlinkSync('missing-header.h', join(root, 'dangling-header.h'));
    symlinkSync('.', join(root, 'cycle'), 'dir');
    writeFixtureFile(root, 'selected.js', 'export const selected = true;\n');

    assertPassed(runLint(root, '--files', 'selected.js'));

    writeFixtureFile(root, 'selected.js', 'debugger;\n');
    assertLintError(runLint(root, '--files', 'selected.js'), 'selected.js');
});

test('full discovery skips links and nested Git repositories but lints real projects', t => {
    const root = createFixtureRoot(t);
    // A worktree's own Git marker must not exclude its workspace projects.
    writeFixtureFile(root, '.git', 'gitdir: /unused-worktree-metadata\n');
    writeFixtureFile(
        root,
        'packages/real/project.json',
        JSON.stringify({ sourceRoot: 'packages/real/src' })
    );
    writeFixtureFile(root, 'packages/real/src/index.js', 'export const real = true;\n');
    symlinkSync('../..', join(root, 'packages/real/cycle'), 'dir');
    symlinkSync('missing.jar', join(root, 'dangling.jar'));
    mkdirSync(join(root, 'packages/linked'), { recursive: true });
    symlinkSync('missing.json', join(root, 'packages/linked/project.json'));

    // Modern submodules use a .git file; older nested checkouts use a directory.
    writeFixtureFile(root, 'vendor/submodule/.git', 'gitdir: ../../.git/modules/submodule\n');
    writeFixtureFile(root, 'vendor/submodule/project.json', '{ invalid vendored JSON');
    mkdirSync(join(root, 'vendor/checkout/.git'), { recursive: true });
    writeFixtureFile(root, 'vendor/checkout/project.json', '{}');
    mkdirSync(join(root, 'packages/linked-file'), { recursive: true });
    symlinkSync(
        '../../vendor/submodule/project.json',
        join(root, 'packages/linked-file/project.json')
    );

    assertPassed(runLint(root));

    writeFixtureFile(root, 'packages/real/src/index.js', 'debugger;\n');
    assertLintError(runLint(root), 'packages/real/src/index.js');
});

test('full discovery still rejects malformed workspace project JSON', t => {
    const root = createFixtureRoot(t);
    writeFixtureFile(root, 'packages/broken/project.json', '{ invalid JSON');

    const result = runLint(root);

    assert.ifError(result.error);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /SyntaxError/);
});

test('full discovery still requires a workspace project sourceRoot', t => {
    const root = createFixtureRoot(t);
    writeFixtureFile(root, 'packages/broken/project.json', '{}');

    const result = runLint(root);

    assert.ifError(result.error);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stderr, /packages\/broken\/project\.json must declare sourceRoot/);
});
