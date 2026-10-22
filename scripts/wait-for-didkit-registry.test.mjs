import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { once } from 'node:events';
import test from 'node:test';

import { registryPackages, waitForDidkitRegistry } from './wait-for-didkit-registry.mjs';

const name = '@learncard/didkit-plugin-node';
const version = '9.8.7';
const manifest = {
    name,
    version,
    // Match the supported builds, independent of the current release version.
    napi: {
        triples: {
            defaults: false,
            additional: [
                'x86_64-unknown-linux-gnu',
                'aarch64-unknown-linux-gnu',
                'x86_64-apple-darwin',
                'aarch64-apple-darwin',
            ],
        },
    },
};
const packages = [
    name,
    `${name}-linux-x64-gnu`,
    `${name}-linux-arm64-gnu`,
    `${name}-darwin-x64`,
    `${name}-darwin-arm64`,
];
const metadataUrl = pkg => `https://registry.npmjs.org/${encodeURIComponent(pkg)}/${version}`;
const tarballUrl = pkg => `https://registry.npmjs.org/${pkg}/-/fixture-${version}.tgz`;
const metadata = pkg => ({
    name: pkg,
    version,
    optionalDependencies: Object.fromEntries(packages.slice(1).map(binding => [binding, version])),
    dist: { tarball: tarballUrl(pkg) },
});

const fixture = (respond = () => undefined) => {
    let time = 0;
    const calls = [];
    const logs = [];
    const options = {
        manifest,
        timeoutMs: 100,
        pollIntervalMs: 10,
        now: () => time,
        wait: async milliseconds => {
            time += milliseconds;
        },
        log: message => logs.push(message),
        fetchRegistry: async (url, options) => {
            calls.push(url);
            assert.equal(options.cache, 'no-store');
            assert.equal(options.headers['Cache-Control'], 'no-cache');
            assert.ok(options.signal instanceof AbortSignal);
            const overridden = respond(url, calls.filter(call => call === url).length);
            if (overridden) return overridden;
            const pkg = packages.find(pkg => url === metadataUrl(pkg));
            if (pkg) return Response.json(metadata(pkg));
            assert.ok(
                packages.some(pkg => url === tarballUrl(pkg)),
                `Unexpected request: ${url}`
            );
            return new Response('fixture tarball');
        },
    };
    return {
        calls,
        logs,
        options,
        advance: milliseconds => {
            time += milliseconds;
        },
    };
};

test('requires the exact wrapper and all four platform tarballs without installing dependencies', async () => {
    const f = fixture();
    await waitForDidkitRegistry(f.options);
    assert.deepEqual(
        registryPackages(manifest),
        packages.map(name => ({ name, version }))
    );
    assert.equal(f.calls.length, 10);
    for (const pkg of packages) {
        assert.ok(f.calls.includes(metadataUrl(pkg)));
        assert.ok(f.calls.includes(tarballUrl(pkg)));
    }
});

test('waits through delayed wrapper metadata and does not re-download ready bindings', async () => {
    const f = fixture((url, attempt) =>
        url === metadataUrl(name) && attempt < 3 ? new Response('', { status: 404 }) : undefined
    );
    await waitForDidkitRegistry(f.options);
    assert.equal(f.calls.filter(url => url === metadataUrl(name)).length, 3);
    assert.equal(f.calls.filter(url => url === tarballUrl(packages[1])).length, 1);
    assert.match(f.logs.join('\n'), /Waiting for .*9\.8\.7 metadata/);
});

test('wrapper availability alone does not pass when a non-host platform is still missing', async () => {
    const binding = packages[4];
    const f = fixture((url, attempt) =>
        url === metadataUrl(binding) && attempt < 3 ? new Response('', { status: 404 }) : undefined
    );
    await waitForDidkitRegistry(f.options);
    assert.equal(f.calls.filter(url => url === metadataUrl(binding)).length, 3);
    assert.ok(f.logs.at(-1).includes(binding));
});

test('retries a tarball 404 even after its exact metadata is public', async () => {
    const f = fixture((url, attempt) =>
        url === tarballUrl(packages[2]) && attempt === 1
            ? new Response('', { status: 404 })
            : undefined
    );
    await waitForDidkitRegistry(f.options);
    assert.equal(f.calls.filter(url => url === tarballUrl(packages[2])).length, 2);
    assert.match(f.logs.join('\n'), /Waiting for .* tarball/);
});

test('fails closed at the deadline and names the missing platform', async () => {
    const missing = packages[3];
    const f = fixture(url =>
        url === metadataUrl(missing) ? new Response('', { status: 404 }) : undefined
    );
    await assert.rejects(waitForDidkitRegistry(f.options), error => {
        assert.match(error.message, /Timed out waiting for native registry publication/);
        assert.ok(error.message.includes(`${missing}@${version}`));
        assert.ok(!error.message.includes(`${name}@${version},`));
        return true;
    });
});

test('never accepts another version returned by the registry', async () => {
    const f = fixture(url =>
        url === metadataUrl(name)
            ? Response.json({ ...metadata(name), version: '9.8.6' })
            : undefined
    );
    await assert.rejects(waitForDidkitRegistry(f.options), /metadata does not match/);
    assert.equal(f.calls.length, 1);
});

test('rejects a wrapper with missing or mismatched optional binding dependencies', async () => {
    for (const optionalDependencies of [{}, { [packages[1]]: '9.8.6' }]) {
        const f = fixture(url =>
            url === metadataUrl(name)
                ? Response.json({ ...metadata(name), optionalDependencies })
                : undefined
        );
        await assert.rejects(
            waitForDidkitRegistry(f.options),
            /must reference .*linux-x64-gnu@9\.8\.7/
        );
    }
});

test('authentication and other non-publication failures fail immediately', async () => {
    for (const status of [401, 403, 500]) {
        const f = fixture(() => new Response('E404 is not the status', { status }));
        await assert.rejects(waitForDidkitRegistry(f.options), new RegExp(`HTTP ${status}`));
        assert.equal(f.calls.length, 1);
    }
});

test('rejects missing, external, or empty tarballs', async () => {
    for (const tarball of [undefined, 'https://private.invalid/native.tgz']) {
        const f = fixture(url =>
            url === metadataUrl(name)
                ? Response.json({ ...metadata(name), dist: { tarball } })
                : undefined
        );
        await assert.rejects(waitForDidkitRegistry(f.options));
        assert.equal(f.calls.length, 1);
    }
    const f = fixture(url => (url === tarballUrl(name) ? new Response('') : undefined));
    await assert.rejects(waitForDidkitRegistry(f.options), /Empty tarball/);
});

test('does not accept success returned after the overall deadline', async () => {
    const f = fixture(url => {
        if (url === tarballUrl(packages.at(-1))) f.advance(101);
    });
    await assert.rejects(waitForDidkitRegistry(f.options), /Timed out/);
});

test('bounds a stalled response body by the overall deadline', async t => {
    const server = createServer((_request, response) => {
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.write('{');
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    t.after(() => {
        server.closeAllConnections();
        server.close();
    });
    await assert.rejects(
        waitForDidkitRegistry({
            manifest,
            timeoutMs: 100,
            log: () => {},
            fetchRegistry: (_url, options) =>
                fetch(`http://127.0.0.1:${server.address().port}`, options),
        }),
        /timeout|aborted/i
    );
});

test('rejects tags, implicit platforms, unknown targets, and invalid deadlines before requesting', async () => {
    for (const invalid of [
        { ...manifest, version: 'latest' },
        { ...manifest, napi: {} },
        { ...manifest, napi: { triples: { defaults: false, additional: ['unknown'] } } },
    ]) {
        assert.throws(() => registryPackages(invalid));
    }
    for (const timeoutMs of [0, -1, NaN]) {
        const f = fixture();
        await assert.rejects(
            waitForDidkitRegistry({ ...f.options, timeoutMs }),
            /positive integers/
        );
        assert.equal(f.calls.length, 0);
    }
});

test('supported workspace platforms and release entry points stay gated', () => {
    const workspace = JSON.parse(
        readFileSync(
            new URL('../packages/plugins/didkit-plugin-node/package.json', import.meta.url),
            'utf8'
        )
    );
    assert.deepEqual(
        registryPackages(workspace).map(pkg => pkg.name),
        packages
    );
    const workflow = readFileSync(
        new URL('../.github/workflows/deploy.yml', import.meta.url),
        'utf8'
    );
    const gate = 'run: node scripts/wait-for-didkit-registry.mjs';
    const publishing = workflow
        .split('\n    publish-npm:')[1]
        .split('\n    smoketest-published-packages:')[0];
    assert.ok(publishing.indexOf(gate) >= 0);
    assert.ok(publishing.indexOf(gate) < publishing.indexOf('run: bunx changeset publish'));
    const agent = workflow.split('\n    deploy-ai-agent:')[1];
    assert.ok(agent.indexOf(gate) >= 0);
    assert.ok(
        agent.indexOf(gate) < agent.indexOf('run: node scripts/wait-for-trigger-native-package.mjs')
    );
});
