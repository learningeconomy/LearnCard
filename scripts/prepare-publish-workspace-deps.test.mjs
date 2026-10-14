import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('prepare-publish-workspace-deps.mjs', import.meta.url));
const fixture = (t, field, spec = 'workspace:*') => {
    const root = mkdtempSync(join(tmpdir(), 'publish-manifests-test-'));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const manifests = {
        'a-public': {
            name: '@learncard/a-public',
            version: '1.0.0',
            dependencies: { '@learncard/public': 'workspace:^' },
        },
        'public': { name: '@learncard/public', version: '2.0.0' },
        'private': { name: '@learncard/service-config', version: '0.1.1', private: true },
        'service': {
            name: '@learncard/service',
            version: '3.0.0',
            [field]: { '@learncard/service-config': spec },
        },
    };
    for (const [name, manifest] of Object.entries(manifests)) {
        const file = join(root, name, 'package.json');
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, JSON.stringify(manifest));
    }
    return {
        root,
        run: (...args) =>
            spawnSync(process.execPath, [script, '--root=' + root, ...args], { encoding: 'utf8' }),
        read: name => JSON.parse(readFileSync(join(root, name, 'package.json'), 'utf8')),
    };
};

for (const field of ['dependencies', 'optionalDependencies', 'peerDependencies']) {
    for (const spec of ['workspace:*', '0.1.1']) {
        test(
            'rejects private ' + field + ' with ' + spec + ' before mutating other manifests',
            t => {
                const f = fixture(t, field, spec);
                const result = f.run();
                assert.equal(result.status, 1);
                assert.match(result.stderr, /references a private workspace package/);
                assert.equal(f.read('a-public').dependencies['@learncard/public'], 'workspace:^');
                assert.equal(f.read('service')[field]['@learncard/service-config'], spec);
                assert.equal(f.run('--dry-run').status, 1);
            }
        );
    }
}

test('allows bundled private build dependencies while resolving public workspace versions', t => {
    const f = fixture(t, 'devDependencies');
    assert.equal(f.run('--dry-run').status, 0);
    assert.equal(f.read('a-public').dependencies['@learncard/public'], 'workspace:^');
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(f.read('a-public').dependencies['@learncard/public'], '^2.0.0');
    assert.equal(f.read('service').devDependencies['@learncard/service-config'], '0.1.1');
});

const bundledFixture = t => {
    const f = fixture(t, 'dependencies');
    const manifest = f.read('service');
    manifest.name = '@learncard/network-brain-service';
    manifest.main = 'dist/index.js';
    writeFileSync(join(f.root, 'service/package.json'), JSON.stringify(manifest));
    const dist = join(f.root, 'service/dist');
    mkdirSync(dist);
    const code = 'exports.applyStageConfig = () => {};';
    writeFileSync(join(dist, 'index.js'), code);
    writeFileSync(join(dist, 'index.d.ts'), 'export declare const applyStageConfig: () => void;');
    const metadata = {
        inputs: { '../../../packages/service-config/src/stageConfig.ts': {} },
        outputs: { 'dist/index.js': { bytes: Buffer.byteLength(code), imports: [] } },
    };
    const writeMetadata = () =>
        writeFileSync(join(dist, 'publish-metafile.json'), JSON.stringify(metadata));
    writeMetadata();
    return { ...f, dist, metadata, writeMetadata };
};

test('removes only the verified bundled helper from the public service install graph', t => {
    const f = bundledFixture(t);
    assert.equal(f.run('--dry-run').status, 0);
    assert.equal(f.read('service').dependencies['@learncard/service-config'], 'workspace:*');
    const result = f.run();
    assert.equal(result.status, 0, result.stderr);
    assert.equal(f.read('service').dependencies['@learncard/service-config'], undefined);
    assert.equal(f.read('private').private, true);

    // Lambda/Docker bootstrap helpers may be unused by the npm entry point.
    const unused = bundledFixture(t);
    unused.metadata.inputs = {};
    unused.writeMetadata();
    assert.equal(unused.run().status, 0);
    assert.equal(unused.read('service').dependencies['@learncard/service-config'], undefined);
});

for (const [name, damage, expected] of [
    [
        'missing build evidence',
        f => rmSync(join(f.dist, 'publish-metafile.json')),
        /Build evidence missing/,
    ],
    [
        'external runtime import',
        f => {
            f.metadata.outputs['dist/index.js'].imports.push({
                path: '@learncard/service-config',
                external: true,
            });
            f.writeMetadata();
        },
        /Bundle still requires/,
    ],
    ['mismatched bundle', f => writeFileSync(join(f.dist, 'index.js'), 'stale'), /does not match/],
    [
        'private declaration import',
        f =>
            writeFileSync(
                join(f.dist, 'index.d.ts'),
                'import type { StageEnv } from "@learncard/service-config";'
            ),
        /declarations still reference/,
    ],
    ['missing declarations', f => rmSync(join(f.dist, 'index.d.ts')), /declarations missing/],
]) {
    test('refuses to omit the runtime dependency with ' + name, t => {
        const f = bundledFixture(t);
        damage(f);
        const result = f.run();
        assert.equal(result.status, 1);
        assert.match(result.stderr, expected);
        assert.equal(f.read('service').dependencies['@learncard/service-config'], 'workspace:*');
        assert.equal(f.read('a-public').dependencies['@learncard/public'], 'workspace:^');
    });
}
