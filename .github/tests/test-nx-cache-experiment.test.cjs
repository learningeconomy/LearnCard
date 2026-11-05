const assert = require('node:assert/strict');
const { test } = require('node:test');
const { mkdtemp, rm, readFile, writeFile } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');

const api = import('../../scripts/nx-cache-experiment/experiment.mjs');
const fixture = async t => {
    const directory = await mkdtemp(path.join(tmpdir(), 'nx-task-cache-'));
    t.after(() => rm(directory, { recursive: true, force: true }));
    return directory;
};

test('native HTTP payload transport authenticates, misses, stores, retrieves and rejects traversal', async t => {
    const { cacheServer } = await api;
    const directory = await fixture(t);
    const server = await cacheServer(directory, { writable: true, token: 'test-token' });
    t.after(server.close);
    const url = `${server.url}/v1/cache/1234567890abcdef`;
    const headers = { authorization: 'Bearer test-token' };
    assert.equal((await fetch(url)).status, 401);
    assert.equal((await fetch(url, { headers })).status, 404);
    const body = Buffer.from('opaque native task archive');
    assert.equal((await fetch(url, { method: 'PUT', headers, body })).status, 200);
    assert.equal(await (await fetch(url, { headers })).text(), body.toString());
    assert.equal((await fetch(`${server.url}/v1/cache/invalid`, { headers })).status, 404);
    assert.equal((await fetch(url, { method: 'POST', headers })).status, 404);
    assert.deepEqual(
        server.events.map(row => row.operation),
        ['miss', 'store', 'hit']
    );
});

test('consumer misses rebuild without writing shared payloads', async t => {
    const { cacheServer } = await api;
    const directory = await fixture(t);
    const hash = '1234567890abcdef';
    await writeFile(path.join(directory, hash), 'trusted original');
    const server = await cacheServer(directory, { token: 'read-only' });
    t.after(server.close);
    const headers = { authorization: 'Bearer read-only' };
    assert.equal(
        (
            await fetch(`${server.url}/v1/cache/${hash}`, {
                method: 'PUT',
                headers,
                body: 'replacement',
            })
        ).status,
        200
    );
    assert.equal(await readFile(path.join(directory, hash), 'utf8'), 'trusted original');
    assert.equal(server.events[0].operation, 'discard');
});

test('result gate rejects cached tests, missing tasks, failed builds and local rerun hits', async () => {
    const { validateTasks, builds, projects } = await api;
    const tasks = [
        ...projects.map(name => ({ id: `${name}:test`, target: 'test' })),
        ...builds.map(name => ({ id: `${name}:build`, target: 'build' })),
    ].map(row => ({ ...row, code: 0, hash: '1234567890abcdef', status: 'success' }));
    validateTasks(tasks, 'cold');
    const changed = () => structuredClone(tasks);
    let rows = changed();
    rows[0].status = 'remote-cache';
    assert.throws(() => validateTasks(rows, 'warm'), /execute freshly/);
    rows = changed();
    rows.pop();
    assert.throws(() => validateTasks(rows, 'warm'));
    rows = changed();
    rows[4].code = 1;
    assert.throws(() => validateTasks(rows, 'cold'));
    rows = changed();
    rows[4].status = 'local-cache';
    assert.throws(() => validateTasks(rows, 'warm'));
});

test('manifest rejects corrupt payloads, extra files and incompatible toolchains', async t => {
    const { verifyCache, builds } = await api;
    const directory = await fixture(t);
    const identity = { node: 'test', lock: 'locked' };
    const entries = [];
    for (let i = 0; i < builds.length; i++) {
        const hash = String(i).padStart(16, '0');
        const bytes = Buffer.from(`payload ${i}`);
        await writeFile(path.join(directory, hash), bytes);
        entries.push({
            id: `${builds[i]}:build`,
            hash,
            bytes: bytes.length,
            sha256: createHash('sha256').update(bytes).digest('hex'),
        });
    }
    const manifest = {
        version: 1,
        identity,
        sourceSha: 'a'.repeat(40),
        sourceBranch: 'main',
        entries,
    };
    await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest));
    await verifyCache(directory, identity);
    await assert.rejects(verifyCache(directory, { ...identity, lock: 'different' }), /Toolchain/);
    await writeFile(path.join(directory, 'unexpected'), 'file');
    await assert.rejects(verifyCache(directory, identity));
    await rm(path.join(directory, 'unexpected'));
    await writeFile(path.join(directory, entries[0].hash), 'tampered!');
    await assert.rejects(verifyCache(directory, identity));
});
