import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('release-bundled-dependents.mjs', import.meta.url));
const generated = '.changeset/bundled-dependencies-learncard-cli.md';

/**
 * cli -> init (workspace:*) -> network-plugin (workspace:^): the shape that let a plugin
 * patch release without the CLI that bundles it.
 */
const fixture = (t, changesets) => {
    const root = mkdtempSync(join(tmpdir(), 'bundled-dependents-test-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const files = {
        'package.json': { name: 'root', private: true, workspaces: ['packages/*'] },
        'yarn.lock': '',
        '.changeset/config.json': {
            changelog: false,
            commit: false,
            access: 'public',
            baseBranch: 'main',
            updateInternalDependencies: 'patch',
        },
        'packages/cli/package.json': {
            name: '@learncard/cli',
            version: '4.0.0',
            dependencies: { '@learncard/init': 'workspace:*' },
        },
        'packages/init/package.json': {
            name: '@learncard/init',
            version: '2.0.0',
            dependencies: { '@learncard/network-plugin': 'workspace:^' },
        },
        'packages/network-plugin/package.json': {
            name: '@learncard/network-plugin',
            version: '3.0.0',
        },
        'packages/unrelated/package.json': { name: '@learncard/unrelated', version: '1.0.0' },
    };
    for (const [name, summary] of Object.entries(changesets)) {
        files[`.changeset/${name}.md`] = summary;
    }
    for (const [file, contents] of Object.entries(files)) {
        mkdirSync(dirname(join(root, file)), { recursive: true });
        writeFileSync(
            join(root, file),
            typeof contents === 'string' ? contents : JSON.stringify(contents)
        );
    }
    return {
        root,
        run: (...args) =>
            spawnSync(process.execPath, [script, '--root=' + root, ...args], { encoding: 'utf8' }),
    };
};

const changeset = (name, type) => `---\n'${name}': ${type}\n---\n\nChange.\n`;

test('adds a patch changeset when only a transitively bundled dependency is released', t => {
    const f = fixture(t, { plugin: changeset('@learncard/network-plugin', 'patch') });
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    const written = readFileSync(join(f.root, generated), 'utf8');
    assert.match(written, /'@learncard\/cli': patch/);
    assert.match(written, /@learncard\/network-plugin/);
});

test('does nothing when the bundling package is already being released', t => {
    const f = fixture(t, {
        plugin: changeset('@learncard/network-plugin', 'patch'),
        cli: changeset('@learncard/cli', 'minor'),
    });
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(f.root, generated)), false);
});

test('does nothing when the released package is not bundled', t => {
    const f = fixture(t, { unrelated: changeset('@learncard/unrelated', 'patch') });
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(existsSync(join(f.root, generated)), false);
});

test('--dry-run reports without writing', t => {
    const f = fixture(t, { plugin: changeset('@learncard/network-plugin', 'patch') });
    const result = f.run('--dry-run');
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /Would add/);
    assert.equal(existsSync(join(f.root, generated)), false);
});
