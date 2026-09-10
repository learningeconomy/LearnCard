import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const require = createRequire(import.meta.url);
const serviceDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('generates complete docs without writing to source, including on repeated builds', () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'swagger-assets-'));
    const source = path.join(fixture, 'src/swagger-ui');
    try {
        fs.mkdirSync(path.join(fixture, 'scripts'), { recursive: true });
        fs.mkdirSync(path.join(fixture, 'node_modules'));
        fs.cpSync(path.join(serviceDir, 'src/swagger-ui'), source, { recursive: true });
        fs.copyFileSync(
            path.join(serviceDir, 'scripts/copy-swagger-assets.mjs'),
            path.join(fixture, 'scripts/copy-swagger-assets.mjs')
        );
        fs.symlinkSync(
            path.dirname(require.resolve('swagger-ui-dist/package.json')),
            path.join(fixture, 'node_modules/swagger-ui-dist'),
            'dir'
        );
        const originals = new Map(
            fs.readdirSync(source).map(name => [name, fs.readFileSync(path.join(source, name))])
        );
        for (const name of originals.keys()) fs.chmodSync(path.join(source, name), 0o444);
        fs.chmodSync(source, 0o555);
        const run = () =>
            execFileSync(process.execPath, ['scripts/copy-swagger-assets.mjs'], { cwd: fixture });
        run();
        const output = path.join(fixture, 'generated/swagger-ui');
        const html = fs.readFileSync(path.join(output, 'index.html'), 'utf8');
        for (const [, asset] of html.matchAll(/(?:src|href)="\/docs\/([^"]+)"/g)) {
            assert.ok(fs.statSync(path.join(output, asset)).size > 0, asset);
        }
        fs.writeFileSync(path.join(output, 'swagger-ui-bundle.js'), 'stale');
        run();
        assert.deepEqual(
            fs.readFileSync(path.join(output, 'swagger-ui-bundle.js')),
            fs.readFileSync(require.resolve('swagger-ui-dist/swagger-ui-bundle.js'))
        );
        assert.deepEqual(fs.readdirSync(source), [...originals.keys()]);
        for (const [name, contents] of originals) {
            assert.deepEqual(fs.readFileSync(path.join(source, name)), contents);
        }
    } finally {
        fs.chmodSync(source, 0o755);
        fs.rmSync(fixture, { recursive: true, force: true });
    }
});
