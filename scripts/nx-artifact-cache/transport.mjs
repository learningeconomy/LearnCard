import assert from 'node:assert/strict';
import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';

export const builds = ['core', 'helpers', 'types'];
export const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const json = async file => JSON.parse(await readFile(file, 'utf8'));
const hashPattern = /^[a-f0-9]{8,64}$/;

// This endpoint lives only on the owned runner. Its files are Nx's native task
// archives; transport is a GitHub artifact, not a copied local cache database.
export async function cacheServer(
    directory,
    { writable = false, token = randomBytes(24).toString('hex') } = {}
) {
    await mkdir(directory, { recursive: true });
    const events = [];
    const server = createServer(async (request, response) => {
        try {
            if (request.headers.authorization !== `Bearer ${token}`) {
                response.writeHead(401).end();
                return;
            }
            const hash = /^\/v1\/cache\/([a-f0-9]{8,64})$/.exec(request.url)?.[1];
            if (!hash || !['GET', 'PUT'].includes(request.method)) {
                response.writeHead(404).end();
                return;
            }
            const file = path.join(directory, hash);
            if (request.method === 'GET') {
                try {
                    assert.ok((await lstat(file)).isFile());
                    const bytes = await readFile(file);
                    events.push({ hash, operation: 'hit', bytes: bytes.length });
                    response.writeHead(200, { 'Content-Length': bytes.length }).end(bytes);
                } catch {
                    events.push({ hash, operation: 'miss' });
                    response.writeHead(404).end();
                }
                return;
            }
            const length = Number(request.headers['content-length']);
            if (!Number.isSafeInteger(length) || length <= 0 || length > 128 * 1024 * 1024) {
                response.writeHead(413).end();
                return;
            }
            const chunks = [];
            let received = 0;
            for await (const chunk of request) {
                received += chunk.length;
                if (received > length) throw new Error('Oversized upload');
                if (writable) chunks.push(chunk);
            }
            assert.equal(received, length);
            if (writable) {
                assert.ok(events.filter(row => row.operation === 'store').length < 10);
                await writeFile(file, Buffer.concat(chunks), { flag: 'wx' });
            }
            // Accept-and-discard consumer writes: a miss can rebuild normally,
            // without modifying or re-exporting the shared producer artifact.
            events.push({ hash, operation: writable ? 'store' : 'discard', bytes: length });
            response.writeHead(200).end();
        } catch {
            response.writeHead(500).end();
        }
    });
    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', () => {
            server.off('error', reject);
            resolve();
        });
    });
    return {
        url: `http://127.0.0.1:${server.address().port}`,
        token,
        events,
        close: () => new Promise(resolve => server.close(resolve)),
    };
}

// Provenance comes from the Actions API, independently of the downloaded payload.
export async function verifyCache(directory, identity, producer) {
    const manifest = await json(path.join(directory, 'manifest.json'));
    assert.equal(manifest.version, 1);
    assert.deepEqual(manifest.identity, identity);
    assert.equal(manifest.sourceSha, producer.headSha);
    assert.equal(manifest.runId, String(producer.runId));
    assert.equal(manifest.runAttempt, String(producer.runAttempt));
    assert.match(manifest.sourceSha, /^[a-f0-9]{40}$/);
    assert.deepEqual(
        manifest.entries.map(entry => entry.id).sort(),
        builds.map(p => `${p}:build`)
    );
    assert.equal(new Set(manifest.entries.map(entry => entry.hash)).size, builds.length);
    assert.deepEqual(
        (await readdir(directory)).sort(),
        ['manifest.json', ...manifest.entries.map(entry => entry.hash)].sort()
    );
    for (const entry of manifest.entries) {
        assert.match(entry.hash, hashPattern);
        const file = path.join(directory, entry.hash);
        const stat = await lstat(file);
        assert.ok(stat.isFile() && !stat.isSymbolicLink());
        assert.ok(entry.bytes > 0 && entry.bytes <= 128 * 1024 * 1024);
        assert.equal(stat.size, entry.bytes);
        assert.equal(digest(await readFile(file)), entry.sha256);
    }
    return manifest;
}
