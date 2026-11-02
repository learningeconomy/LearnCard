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

const classicMissingVersion = {
    status: 1,
    stderr: JSON.stringify({
        type: 'error',
        data: 'Couldn\'t find any versions for "@learncard/cli" that matches "3.6.3"',
    }),
};

test('Yarn Classic retries a missing published version with a fresh metadata cache', async t => {
    const cwd = fixture(t);
    let attempts = 0;
    const caches = [];
    await installPackages({
        manager: 'yarn',
        group: 'consumers',
        versions,
        cwd,
        wait: async () => {},
        run: (_command, _args, options) => {
            caches.push(options.env.YARN_CACHE_FOLDER);
            return ++attempts === 1 ? classicMissingVersion : { status: 0 };
        },
        verify: () => {},
    });
    assert.equal(attempts, 2);
    assert.equal(caches[0], join(cwd, '.registry-cache', '1', 'yarn-cache'));
    assert.equal(caches[1], join(cwd, '.registry-cache', '2', 'yarn-cache'));
});

test('Yarn Classic retries a tarball 404 that has no diagnostic name', async t => {
    // Exact shape from Prod Deploy run 40771349339, attempt 24.
    const tarball404 = {
        status: 1,
        stdout: JSON.stringify({
            type: 'error',
            data: 'Error: https://registry.yarnpkg.com/@learncard/openid4vc-plugin/-/openid4vc-plugin-0.3.14.tgz: Request failed "404 Not Found"\n    at ResponseError.ExtendableBuiltin (/usr/lib/node_modules/yarn/lib/cli.js:696:66)',
        }),
        stderr: '',
    };
    assert(publicationPending('yarn', tarball404));

    let attempts = 0;
    await installPackages({
        manager: 'yarn',
        group: 'plugins',
        versions,
        cwd: fixture(t),
        wait: async () => {},
        run: () => (++attempts === 1 ? tarball404 : { status: 0 }),
        verify: () => {},
    });
    assert.equal(attempts, 2);
});

test('Yarn Classic bare "Package not found" fails fast instead of waiting for registry lag', async t => {
    const packageNotFound = {
        status: 1,
        stderr: JSON.stringify({ type: 'error', data: 'Package not found' }),
    };
    assert.equal(publicationPending('yarn', packageNotFound), false);

    let attempts = 0;
    await assert.rejects(
        installPackages({
            manager: 'yarn',
            group: 'plugins',
            versions,
            cwd: fixture(t),
            wait: async () => {},
            run: () => {
                attempts++;
                return packageNotFound;
            },
        }),
        /not a registry-readiness error/
    );
    assert.equal(attempts, 1);
});

test('Yarn Classic authentication and engine errors are not pending publication', () => {
    for (const data of [
        'Request failed "401 Unauthorized"',
        'Request failed "403 Forbidden"',
        'Request failed "500 Internal Server Error"',
        'Error: https://registry.yarnpkg.com/@learncard/init/-/init-9.8.7.tgz: Request failed "401 Unauthorized"',
        'The engine "node" is incompatible with this module.',
    ]) {
        assert.equal(
            publicationPending('yarn', { stderr: JSON.stringify({ type: 'error', data }) }),
            false
        );
    }
});

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

test('rejects partial release snapshots without substituting older latest versions', async () => {
    const releaseVersions = Object.fromEntries(CONSUMER_PACKAGES.map(name => [name, '9.8.7']));
    let requests = 0;
    await assert.rejects(
        resolveVersions({
            releaseVersions,
            fetchMetadata: async () => {
                requests++;
                return { ok: true, json: async () => ({ version: '9.8.6' }) };
            },
        }),
        /complete consumer\/plugin snapshot.*must not fall back to latest/
    );
    assert.equal(requests, 0);
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

test('retries a pending dist-tag without re-resolving tags that already succeeded', async () => {
    const requests = new Map();
    const delays = [];
    let time = 0;
    const result = await resolveVersions({
        overrides: { '@learncard/cli': 'next' },
        timeoutMs: 1000,
        pollIntervalMs: 10,
        now: () => time,
        wait: async delay => {
            delays.push(delay);
            time += delay;
        },
        fetchMetadata: async url => {
            const count = (requests.get(url) ?? 0) + 1;
            requests.set(url, count);
            if (url.endsWith('/next') && count === 1) return { ok: false, status: 404 };
            return { ok: true, json: async () => ({ version: '9.8.7' }) };
        },
    });
    assert.deepEqual(result, versions);
    assert.deepEqual(delays, [10]);
    for (const [url, count] of requests) assert.equal(count, url.endsWith('/next') ? 2 : 1);
});

test('bounds retries for a dist-tag that never becomes available', async () => {
    let time = 0;
    let requests = 0;
    const delays = [];
    await assert.rejects(
        resolveVersions({
            overrides: { ...versions, '@learncard/cli': 'next' },
            timeoutMs: 25,
            pollIntervalMs: 10,
            now: () => time,
            wait: async delay => {
                delays.push(delay);
                time += delay;
            },
            fetchMetadata: async () => {
                requests++;
                return { ok: false, status: 404 };
            },
        }),
        /Timed out resolving published package @learncard\/cli@next/
    );
    assert.equal(requests, 3);
    assert.deepEqual(delays, [10, 10, 5]);
});

test('tag resolution does not retry authentication or other non-404 responses', async () => {
    for (const status of [401, 403, 500]) {
        let requests = 0;
        await assert.rejects(
            resolveVersions({
                overrides: { ...versions, '@learncard/cli': 'next' },
                fetchMetadata: async () => {
                    requests++;
                    return { ok: false, status };
                },
                wait: async () => {
                    throw new Error('Must not retry a hard failure');
                },
            }),
            new RegExp('HTTP ' + status)
        );
        assert.equal(requests, 1);
    }
});

test('a hard resolver failure cancels sibling dist-tag backoff', async () => {
    let cancelled = false;
    await assert.rejects(
        resolveVersions({
            overrides: { ...versions, '@learncard/cli': 'next', '@learncard/init': 'next' },
            fetchMetadata: async url => ({ ok: false, status: url.includes('cli') ? 401 : 404 }),
            wait: (_delay, _value, { signal }) =>
                new Promise((_resolve, reject) => {
                    signal.addEventListener(
                        'abort',
                        () => {
                            cancelled = true;
                            reject(signal.reason);
                        },
                        { once: true }
                    );
                }),
        }),
        /HTTP 401/
    );
    assert.equal(cancelled, true);
});

test('rejects tag resolution success that arrives after the shared deadline', async () => {
    let time = 0;
    await assert.rejects(
        resolveVersions({
            overrides: { ...versions, '@learncard/cli': 'next' },
            timeoutMs: 100,
            now: () => time,
            fetchMetadata: async () => {
                time = 101;
                return { ok: true, json: async () => ({ version: '9.8.7' }) };
            },
        }),
        /Timed out resolving published package/
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
            run: () => ({
                error: Object.assign(new Error('ETIMEDOUT'), { code: 'ETIMEDOUT' }),
                signal: 'SIGKILL',
            }),
        }),
        /Timed out/
    );
});

test('allows a slow successful install to use the remaining overall deadline', async t => {
    let time = 0;
    let attempts = 0;
    let verified = false;
    await installPackages({
        manager: 'npm',
        group: 'consumers',
        versions,
        cwd: fixture(t),
        timeoutMs: 300_000,
        pollIntervalMs: 1000,
        now: () => time,
        wait: async delay => {
            time += delay;
        },
        run: (_command, _args, options) => {
            attempts++;
            assert.equal(options.timeout, 300_000);
            time += 180_000;
            return { status: 0 };
        },
        verify: () => {
            verified = true;
        },
    });
    assert.equal(attempts, 1);
    assert(verified);
});

test('does not retry unexplained process signals or spawn errors', async t => {
    for (const result of [
        { signal: 'SIGKILL' },
        { error: Object.assign(new Error('ENOENT'), { code: 'ENOENT' }) },
    ]) {
        let attempts = 0;
        await assert.rejects(
            installPackages({
                manager: 'npm',
                group: 'consumers',
                versions,
                cwd: fixture(t),
                run: () => {
                    attempts++;
                    return result;
                },
            }),
            /could not complete/
        );
        assert.equal(attempts, 1);
    }
});

test('rejects a child that reports success after the overall deadline', async t => {
    let time = 0;
    await assert.rejects(
        installPackages({
            manager: 'npm',
            group: 'consumers',
            versions,
            cwd: fixture(t),
            timeoutMs: 100,
            now: () => time,
            run: () => {
                time = 101;
                return { status: 0 };
            },
            verify: () => {
                throw new Error('Must not verify an expired installation');
            },
        }),
        /Timed out/
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
