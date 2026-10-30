const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { test } = require('node:test');
const modulePromise = import('../../scripts/e2e-hosted/sdk-build-cache.mjs');
const root = path.resolve(__dirname, '../..');
const write = (file, value) => {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, value);
};
function fixture(t) {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-cache-test-'));
    t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
    const workspace = path.join(temp, 'repo'),
        cache = path.join(temp, 'snapshot');
    fs.mkdirSync(workspace);
    const spec = { key: 'exact-input-key', roots: ['packages/a/dist', 'services/b/dist'] };
    for (const name of spec.roots) {
        write(path.join(workspace, name, 'index.js'), `compiled ${name}`);
        write(path.join(workspace, name, 'empty/.keep'), '');
    }
    fs.chmodSync(path.join(workspace, spec.roots[0], 'index.js'), 0o755);
    return { temp, workspace, cache, spec };
}
function graphs() {
    const result = {};
    for (const [role, id] of [
        ['browser', 'learn-card-app:docker-build'],
        ['service', 'e2e:test:e2e'],
    ]) {
        const names = ['common', role];
        result[role] = {
            graph: {
                nodes: Object.fromEntries(
                    names.map(name => [name, { data: { root: `packages/${name}` } }])
                ),
                dependencies: Object.fromEntries(names.map(name => [name, []])),
            },
            tasks: {
                tasks: Object.fromEntries([
                    [
                        id,
                        {
                            id,
                            target: {
                                project: role,
                                target: role === 'browser' ? 'docker-build' : 'test:e2e',
                            },
                        },
                    ],
                    ...names.map(name => [
                        `${name}:build`,
                        {
                            id: `${name}:build`,
                            target: { project: name, target: 'build' },
                            outputs: [`packages/${name}/dist`],
                        },
                    ]),
                ]),
                dependencies: {
                    [id]: names.map(name => `${name}:build`),
                    ...Object.fromEntries(names.map(name => [`${name}:build`, []])),
                },
            },
        };
    }
    return result;
}
test('restores the exact output inventory, executable modes, and removes stale files', async t => {
    const { snapshot, restore, inventory } = await modulePromise;
    const f = fixture(t);
    const before = Object.fromEntries(
        f.spec.roots.map(name => [name, inventory(path.join(f.workspace, name))])
    );
    snapshot(f.workspace, f.cache, f.spec);
    for (const name of f.spec.roots) {
        fs.rmSync(path.join(f.workspace, name), { recursive: true });
        write(path.join(f.workspace, name, 'stale.js'), 'stale');
    }
    restore(f.workspace, f.cache, f.spec);
    assert.deepEqual(
        Object.fromEntries(
            f.spec.roots.map(name => [name, inventory(path.join(f.workspace, name))])
        ),
        before
    );
});
for (const damage of [
    'content',
    'missing',
    'extra',
    'mode',
    'link',
    'dangling',
    'manifest-key',
    'manifest-roots',
]) {
    test(`rejects ${damage} before changing existing workspace outputs`, async t => {
        const { snapshot, restore } = await modulePromise;
        const f = fixture(t);
        snapshot(f.workspace, f.cache, f.spec);
        const file = path.join(f.cache, 'payload', f.spec.roots[0], 'index.js');
        if (damage === 'content') fs.writeFileSync(file, 'corruption');
        if (damage === 'missing') fs.unlinkSync(file);
        if (damage === 'extra') write(path.join(f.cache, 'payload/extra'), 'extra');
        if (damage === 'mode') fs.chmodSync(file, 0o644);
        if (damage === 'link' || damage === 'dangling') {
            fs.unlinkSync(file);
            fs.symlinkSync(damage === 'link' ? '/etc/hosts' : '/missing-sdk-cache-test-file', file);
        }
        if (damage.startsWith('manifest')) {
            const manifestFile = path.join(f.cache, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestFile));
            if (damage === 'manifest-key') manifest.key = 'other';
            else manifest.roots = ['packages/other/dist'];
            fs.writeFileSync(manifestFile, JSON.stringify(manifest));
        }
        const sentinel = path.join(f.workspace, f.spec.roots[1], 'sentinel');
        write(sentinel, 'original');
        assert.throws(() => restore(f.workspace, f.cache, f.spec));
        assert.equal(fs.readFileSync(sentinel, 'utf8'), 'original');
    });
}
test('rejects unsafe, nested, linked outputs and snapshot storage in the workspace', async t => {
    const { snapshot, restore, safeOutput } = await modulePromise;
    const f = fixture(t);
    for (const name of [
        '../dist',
        'apps/a/dist',
        'packages/a/../dist',
        'packages/a/*/dist',
        'packages/a/src',
    ])
        assert.throws(() => safeOutput(name));
    assert.throws(() => snapshot(f.workspace, path.join(f.workspace, '.snapshot'), f.spec));
    assert.throws(() =>
        snapshot(f.workspace, f.cache, {
            ...f.spec,
            roots: ['packages/a/dist', 'packages/a/dist/nested/dist'],
        })
    );
    snapshot(f.workspace, f.cache, f.spec);
    fs.rmSync(path.join(f.workspace, 'packages'), { recursive: true });
    fs.symlinkSync(path.join(f.temp, 'outside'), path.join(f.workspace, 'packages'));
    assert.throws(() => restore(f.workspace, f.cache, f.spec));
});
test('source bytes, executable modes and compiler/tool/configuration identity invalidate keys', async t => {
    const { inputKey } = await modulePromise;
    const f = fixture(t),
        file = 'packages/a/source.ts';
    write(path.join(f.workspace, file), 'v1');
    const key = inputKey(f.workspace, [file], { compiler: 1, environment: 'a' });
    assert.equal(inputKey(f.workspace, [file, file], { compiler: 1, environment: 'a' }), key);
    for (const configuration of [
        { compiler: 2, environment: 'a' },
        { compiler: 1, environment: 'b' },
    ])
        assert.notEqual(inputKey(f.workspace, [file], configuration), key);
    fs.chmodSync(path.join(f.workspace, file), 0o755);
    assert.notEqual(inputKey(f.workspace, [file], { compiler: 1, environment: 'a' }), key);
    fs.chmodSync(path.join(f.workspace, file), 0o644);
    fs.writeFileSync(path.join(f.workspace, file), 'v2');
    assert.notEqual(inputKey(f.workspace, [file], { compiler: 1, environment: 'a' }), key);
});
test('fixed producer union includes both consumer graphs once', async () => {
    const { plan } = await modulePromise;
    const p = plan(graphs());
    assert.deepEqual(p.projects, ['browser', 'common', 'service']);
    assert.deepEqual(p.consumers.browser.projects, ['browser', 'common']);
    assert.deepEqual(p.consumers.service.projects, ['common', 'service']);
});
for (const change of [
    'runtime-preflight',
    'configuration',
    'missing-output',
    'app-dependency',
    'unknown-dependency',
    'missing-task',
]) {
    test(`unsupported ${change} disables the optimized plan`, async () => {
        const { plan } = await modulePromise;
        const g = graphs(),
            b = g.browser,
            task = b.tasks.tasks['common:build'];
        if (change === 'runtime-preflight') task.target.target = 'preflight';
        if (change === 'configuration') task.target.configuration = 'other';
        if (change === 'missing-output') delete task.outputs;
        if (change === 'app-dependency') b.graph.nodes.common.data.root = 'apps/frontend';
        if (change === 'unknown-dependency') b.graph.dependencies.common = [{ target: 'missing' }];
        if (change === 'missing-task') b.tasks.dependencies[task.id].push('missing:build');
        assert.throws(() => plan(g));
    });
}
test('SDK compilers receive a stable release and no caller tokens or app variables', async t => {
    const { compilerEnvironment } = await modulePromise;
    const prior = process.env.SENTRY_AUTH_TOKEN;
    t.after(() => {
        if (prior === undefined) delete process.env.SENTRY_AUTH_TOKEN;
        else process.env.SENTRY_AUTH_TOKEN = prior;
    });
    process.env.SENTRY_AUTH_TOKEN = 'fixture-token';
    const env = compilerEnvironment('/workspace', { bunPath: '/bin/bun' }, 'source-key');
    assert.equal(env.SENTRY_AUTH_TOKEN, undefined);
    assert.equal(env.GITHUB_SHA, undefined);
    assert.equal(env.SENTRY_RELEASE, 'source-key');
    assert.equal(env.SKIP_DIDKIT_NAPI, '1');
});
test('full key calculation survives app-only second commits, invalidates SDK/config/lock changes and rejects ignored dotenv', async t => {
    const { specification } = await modulePromise;
    const f = fixture(t),
        g = graphs();
    const git = (...args) => execFileSync('git', args, { cwd: f.workspace, stdio: 'pipe' });
    write(path.join(f.workspace, 'package.json'), '{}');
    write(path.join(f.workspace, 'bun.lock'), 'lock-v1');
    write(path.join(f.workspace, 'tsconfig.json'), '{}');
    write(path.join(f.workspace, 'docs/snippets/quickstart/send.mjs'), 'cli-embedded-example-v1');
    write(path.join(f.workspace, '.gitignore'), 'node_modules/\n.env*\n');
    write(path.join(f.workspace, 'packages/common/source.ts'), 'sdk-v1');
    write(path.join(f.workspace, 'packages/browser/source.ts'), 'browser-sdk');
    write(path.join(f.workspace, 'packages/service/source.ts'), 'service-sdk');
    write(path.join(f.workspace, 'apps/learn-card-app/src/app.ts'), 'frontend-v1');
    write(
        path.join(f.workspace, 'node_modules/nx/package.json'),
        JSON.stringify({ version: 'fixture', bin: { nx: 'nx.cjs' } })
    );
    write(
        path.join(f.workspace, 'node_modules/nx/nx.cjs'),
        `const fs=require('fs');const role=process.argv.includes('learn-card-app:docker-build')?'browser':'service';fs.writeFileSync(process.argv.find(a=>a.startsWith('--graph=')).slice(8),JSON.stringify(${JSON.stringify(g)}[role]));`
    );
    git('init', '--quiet');
    git('add', '.');
    git(
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.com',
        '-c',
        'core.hooksPath=/dev/null',
        'commit',
        '--quiet',
        '-m',
        'first'
    );
    const key = specification(f.workspace).key;
    fs.writeFileSync(path.join(f.workspace, 'apps/learn-card-app/src/app.ts'), 'frontend-v2');
    git('add', '.');
    git(
        '-c',
        'user.name=Fixture',
        '-c',
        'user.email=fixture@example.com',
        '-c',
        'core.hooksPath=/dev/null',
        'commit',
        '--quiet',
        '-m',
        'second'
    );
    assert.equal(specification(f.workspace).key, key);
    for (const file of [
        'bun.lock',
        'tsconfig.json',
        'packages/common/source.ts',
        'docs/snippets/quickstart/send.mjs',
    ]) {
        const previous = fs.readFileSync(path.join(f.workspace, file));
        fs.appendFileSync(path.join(f.workspace, file), 'changed');
        assert.notEqual(specification(f.workspace).key, key);
        fs.writeFileSync(path.join(f.workspace, file), previous);
    }
    write(path.join(f.workspace, '.env.local'), 'PRIVATE_FIXTURE=value');
    assert.throws(() => specification(f.workspace), /environment file/);
});
test('workflow publisher is main-only and consumers are exact, read-only, same-path restores', () => {
    const producer = fs.readFileSync(
        path.join(root, '.github/workflows/sdk-build-cache.yml'),
        'utf8'
    );
    const consumer = fs.readFileSync(
        path.join(root, '.github/actions/sdk-build-cache/action.yml'),
        'utf8'
    );
    assert.match(producer, /success\(\) && github.ref == 'refs\/heads\/main'/);
    assert.match(producer, /persist-credentials: false/);
    assert.match(producer, /actions\/cache\/save@v6/);
    assert.doesNotMatch(consumer, /actions\/cache\/save|restore-keys:|lookup-only:/);
    for (const text of [producer, consumer])
        assert.match(text, /path: \$\{\{ runner.temp \}\}\/e2e-sdk-snapshot/);
    assert.match(consumer, /inputs.use-cache == 'true'/);
    assert.match(consumer, /E2E_SDK_CACHE_ENABLED=false/);
    assert.doesNotMatch(producer + consumer, /path:.*(?:\.nx|test-results|apps\/)/);
});
