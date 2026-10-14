import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import {
    CONSUMER_PACKAGES,
    PLUGIN_PACKAGES,
    installPackages,
    publicationPending,
    resolveVersions,
    verifyInstalledVersions,
    workspaceVersions,
} from './smoketest-npm-packages.mjs';

const versions = Object.fromEntries(
    [...CONSUMER_PACKAGES, ...PLUGIN_PACKAGES].map(name => [name, '9.8.7'])
);
const fixture = t => {
    const root = mkdtempSync(join(tmpdir(), 'published-packages-test-'));
    writeFileSync(join(root, 'package.json'), '{"name":"learncard-smoketest","private":true}');
    t.after(() => rmSync(root, { recursive: true, force: true }));
    return root;
};

const pending = {
    npm: { status: 1, stdout: '{"error":{"code":"ETARGET"}}', stderr: '' },
    pnpm: {
        status: 1,
        stdout: 'ERR_PNPM_NO_MATCHING_VERSION No matching version found',
        stderr: '',
    },
    yarn: {
        status: 1,
        stdout: '{"type":"error","name":82,"displayName":"YN0082","data":"No candidates found"}',
        stderr: '',
    },
    bun: {
        status: 1,
        stdout: '',
        stderr: 'error: No version matching "9.8.7" found for specifier "@learncard/init" (but package exists)',
    },
};

test('uses the release snapshot without consulting possibly stale latest tags', async () => {
    const result = await resolveVersions({
        releaseVersions: versions,
        fetchMetadata: () => {
            throw new Error('Must not request latest');
        },
    });
    assert.deepEqual(result, versions);
    await assert.rejects(
        resolveVersions({ releaseVersions: { '@learncard/init': 'latest' } }),
        /Missing exact/
    );
});

test('snapshots nightly tags once and preserves explicit manual versions', async () => {
    const requests = [];
    const result = await resolveVersions({
        overrides: { '@learncard/init': '8.7.6', '@learncard/cli': 'next' },
        fetchMetadata: async url => {
            requests.push(url);
            return { ok: true, json: async () => ({ version: '9.8.7' }) };
        },
    });
    assert.equal(result['@learncard/init'], '8.7.6');
    assert.equal(result['@learncard/cli'], '9.8.7');
    assert.equal(requests.length, Object.keys(versions).length - 1);
    assert(requests.some(url => url.endsWith('/next')));
    assert(!requests.some(url => url.includes('init')));
    await assert.rejects(
        resolveVersions({ fetchMetadata: async () => ({ ok: false, status: 401 }) }),
        /HTTP 401/
    );
});

test('reads all release versions from workspace manifests and rejects private smoke targets', t => {
    const root = fixture(t);
    for (const [index, name] of Object.keys(versions).entries()) {
        const dir = join(root, String(index));
        mkdirSync(dir);
        writeFileSync(join(dir, 'package.json'), JSON.stringify({ name, version: versions[name] }));
    }
    assert.deepEqual(workspaceVersions(root), versions);
    writeFileSync(
        join(root, '0/package.json'),
        JSON.stringify({ name: CONSUMER_PACKAGES[0], version: '9.8.7', private: true })
    );
    assert.throws(() => workspaceVersions(root), /Missing exact/);
});

for (const manager of Object.keys(pending)) {
    test(
        manager + ' retries missing versions using exact specs and fresh installation state',
        async t => {
            const cwd = fixture(t);
            let time = 0;
            let attempts = 0;
            let verified = false;
            const original = readFileSync(join(cwd, 'package.json'), 'utf8');
            await installPackages({
                manager,
                group: 'consumers',
                versions,
                cwd,
                timeoutMs: 1000,
                pollIntervalMs: 10,
                now: () => time,
                wait: async delay => {
                    time += delay;
                },
                run: (command, args, options) => {
                    attempts += 1;
                    assert.equal(command, manager);
                    for (const name of CONSUMER_PACKAGES) assert(args.includes(name + '@9.8.7'));
                    assert.equal(options.env.npm_config_registry, 'https://registry.npmjs.org/');
                    assert.equal(options.env.YARN_NODE_LINKER, 'node-modules');
                    if (attempts === 1) {
                        mkdirSync(join(cwd, 'node_modules'));
                        writeFileSync(join(cwd, 'yarn.lock'), 'stale registry resolution');
                        writeFileSync(
                            join(cwd, 'package.json'),
                            '{"private":true,"dependencies":{"stale":"latest"}}'
                        );
                        return pending[manager];
                    }
                    assert.equal(existsSync(join(cwd, 'node_modules')), false);
                    assert.equal(existsSync(join(cwd, 'yarn.lock')), false);
                    assert.equal(readFileSync(join(cwd, 'package.json'), 'utf8'), original);
                    return { status: 0 };
                },
                verify: (_cwd, names, pinned) => {
                    assert.deepEqual(names, CONSUMER_PACKAGES);
                    assert.deepEqual(pinned, versions);
                    verified = true;
                },
            });
            assert.equal(attempts, 2);
            assert(verified);
        }
    );
}

test('retries registry 404 diagnostics, and fails immediately for authentication and other failures', async t => {
    assert(publicationPending('npm', { stdout: '', stderr: 'npm error code E404' }));
    assert(publicationPending('pnpm', { stdout: 'ERR_PNPM_FETCH_404 GET package: Not Found' }));
    assert(
        publicationPending('yarn', {
            stdout: '{"type":"error","name":35,"data":"Response Code: 404 (Not Found)"}',
        })
    );
    assert(
        publicationPending('bun', {
            stderr: 'error: GET https://registry.npmjs.org/@learncard/init - 404',
        })
    );
    for (const [manager, result] of [
        ['npm', { stdout: '{"error":{"code":"E401","summary":"ETARGET elsewhere"}}' }],
        ['pnpm', { stdout: 'ERR_PNPM_FETCH_401 Unauthorized' }],
        [
            'yarn',
            { stdout: '{"type":"error","name":35,"data":"Response Code: 401 (Unauthorized)"}' },
        ],
        ['bun', { stderr: 'error: GET https://registry.npmjs.org/package - 401' }],
    ]) {
        assert.equal(publicationPending(manager, result), false);
        let attempts = 0;
        await assert.rejects(
            installPackages({
                manager,
                group: 'plugins',
                versions,
                cwd: fixture(t),
                run: () => {
                    attempts++;
                    return { status: 1, ...result };
                },
            }),
            /not a registry-readiness error/
        );
        assert.equal(attempts, 1);
    }
});

test('enforces a total deadline, including sleep and stalled child processes', async t => {
    let time = 0;
    let attempts = 0;
    await assert.rejects(
        installPackages({
            manager: 'npm',
            group: 'bundler',
            versions,
            cwd: fixture(t),
            timeoutMs: 10,
            pollIntervalMs: 100,
            now: () => time,
            wait: async delay => {
                assert.equal(delay, 10);
                time += delay;
            },
            run: (_command, args, options) => {
                attempts++;
                assert(args.includes('@learncard/init@9.8.7'));
                assert(args.includes('esbuild'));
                assert.equal(options.timeout, 10);
                return pending.npm;
            },
        }),
        /Timed out/
    );
    assert.equal(attempts, 1);
    await assert.rejects(
        installPackages({
            manager: 'npm',
            group: 'consumers',
            versions,
            cwd: fixture(t),
            run: () => ({ error: new Error('ETIMEDOUT'), signal: 'SIGKILL' }),
        }),
        /could not complete/
    );
});

test('rejects a manager that installs an older version after reporting success', async t => {
    const cwd = fixture(t);
    const dir = join(cwd, 'node_modules/@learncard/init');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'package.json'), '{"version":"9.8.6"}');
    assert.throws(
        () => verifyInstalledVersions(cwd, ['@learncard/init'], versions),
        /expected 9.8.7, installed 9.8.6/
    );
    await assert.rejects(
        installPackages({
            manager: 'npm',
            group: 'bundler',
            versions,
            cwd,
            run: () => ({ status: 0 }),
        }),
        /expected 9.8.7/
    );
});
