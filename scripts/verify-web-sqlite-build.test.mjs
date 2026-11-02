import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { after, before, test } from 'node:test';
import { createFixtureServer, getSmokeTimeout, waitForChild } from './verify-web-sqlite-build.mjs';

let server, origin, directory;
before(async () => {
    directory = mkdtempSync(join(tmpdir(), 'sqlite-build-server-'));
    writeFileSync(join(directory, 'index.html'), '<main>Fixture</main>');
    writeFileSync(join(directory, 'app.js'), 'export const fixture = true;');
    server = createFixtureServer(directory + sep);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    origin = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
    await new Promise(resolve => server.close(resolve));
    rmSync(directory, { recursive: true });
});

test('serves assets and preserves HTTP 200 HTML fallback for missing lazy modules', async () => {
    const asset = await fetch(origin + '/app.js');
    assert.equal(asset.headers.get('content-type'), 'text/javascript');
    assert.match(await asset.text(), /fixture/);
    const missing = await fetch(origin + '/jeep-sqlite.entry.js');
    assert.equal(missing.status, 200);
    assert.equal(missing.headers.get('content-type'), 'text/html');
});

test('rejects malformed encoding, NUL and encoded traversal without stopping the server', async () => {
    for (const [path, expected] of [
        ['/%ZZ', 400],
        ['/%00', 400],
        ['/..%2foutside.js', 403],
    ]) {
        const response = await fetch(origin + path);
        assert.equal(response.status, expected);
        await response.text();
    }
    const healthy = await fetch(origin);
    assert.equal(healthy.status, 200);
    assert.match(await healthy.text(), /Fixture/);
});

test('uses a three-minute smoke budget and rejects invalid overrides', () => {
    assert.equal(getSmokeTimeout(undefined), 180000);
    assert.equal(getSmokeTimeout('240000'), 240000);
    for (const value of ['', '0', '-1', 'NaN', 'Infinity', '1.5', '2147483648']) {
        assert.throws(() => getSmokeTimeout(value), /positive integer/);
    }
});

test('reports child assertion failure separately from timeout termination', async () => {
    await waitForChild(spawn(process.execPath, ['-e', 'process.exit(0)'], { stdio: 'ignore' }));
    await assert.rejects(
        waitForChild(spawn(process.execPath, ['-e', 'process.exit(7)'], { stdio: 'ignore' })),
        /exit code 7/
    );
    await assert.rejects(
        waitForChild(
            spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
                stdio: 'ignore',
                timeout: 100,
            })
        ),
        /signal SIGTERM \(possible timeout\)/
    );
});
