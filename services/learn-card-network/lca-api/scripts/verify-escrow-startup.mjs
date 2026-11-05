/**
 * Owned-only real Mongo/Redis + actual Docker/Lambda-entrypoint proof.
 * First run `lc verify up`; pass its immutable imageId. No external DB/URI accepted.
 * Usage: LC_VERIFY_TRUST_LOCAL_DOCKER=1 bun --conditions=development \
 *   scripts/verify-escrow-startup.mjs --image sha256:... --evidence /private/new-directory
 * Requires cached mongo:7 and redis:7 images. Never adopts/removes existing resources.
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync, execFileSync } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { createServer } from 'node:net';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { MongoClient } from 'mongodb';
import { initLearnCard } from '@learncard/init';
import {
    encryptEscrowBlob,
    generateEscrowKeyPair,
    openEscrowRelease,
    splitPrivateKey,
} from '@learncard/sss-key-manager';

assert.equal(
    process.env.LC_VERIFY_TRUST_LOCAL_DOCKER,
    '1',
    'Run trusted-local Docker preflight first'
);
const args = process.argv.slice(2);
const image = args[args.indexOf('--image') + 1];
const evidence = args[args.indexOf('--evidence') + 1];
assert.match(image ?? '', /^sha256:[a-f0-9]{64}$/);
assert.ok(evidence?.startsWith('/'), 'Use a NEW absolute private evidence directory');
await mkdir(evidence, { mode: 0o700 }); // Fails rather than reusing another run.
const service = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const token = randomBytes(12).toString('hex');
const label = 'org.learncard.escrow-startup-verification';
const network = `escrow-proof-${token}`;
const owned = [];
const cleanEnv = Object.fromEntries(
    ['PATH', 'HOME', 'TMPDIR'].flatMap(key => (process.env[key] ? [[key, process.env[key]]] : []))
);
const docker = (...argv) =>
    execFileSync('docker', ['--host', 'unix:///var/run/docker.sock', ...argv], {
        env: cleanEnv,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
const containerLogs = id => {
    const result = spawnSync('docker', ['--host', 'unix:///var/run/docker.sock', 'logs', id], {
        env: cleanEnv,
        encoding: 'utf8',
        maxBuffer: 10 * 1024 * 1024,
    });
    assert.equal(result.status, 0);
    return result.stdout + result.stderr;
};
const port = () =>
    new Promise((done, reject) => {
        const socket = createServer();
        socket.once('error', reject);
        socket.listen(0, '127.0.0.1', () => {
            const address = socket.address();
            assert.ok(address && typeof address === 'object');
            socket.close(() => done(address.port));
        });
    });
const container = (...argv) => {
    const id = docker('run', '-d', '--pull=never', '--label', `${label}=${token}`, ...argv);
    owned.push(id);
    return id;
};
const remove = id => {
    assert.equal(docker('inspect', '--format', `{{index .Config.Labels "${label}"}}`, id), token);
    docker('rm', '-f', '-v', id);
    owned.splice(owned.indexOf(id), 1);
};
const keyId = 'owned-proof';
const enclave = await generateEscrowKeyPair();
const recipient = await generateEscrowKeyPair();
const shares = await splitPrivateKey('b'.repeat(64));
const require = createRequire(import.meta.url);
const card = await initLearnCard({
    seed: 'b'.repeat(64),
    didkit: readFile(require.resolve('@learncard/didkit-plugin/dist/didkit_wasm_bg.wasm')),
});
const did = card.id.did();
const envelope = await encryptEscrowBlob(
    { recoveryShare: shares.recoveryShare, did, shareVersion: 1 },
    enclave.publicKey,
    keyId
);
const results = [];
let networkCreated = false;
let mongo;
let child;
let activeContainer;
let logs = '';

try {
    docker('image', 'inspect', image);
    docker('network', 'create', '--label', `${label}=${token}`, network);
    networkCreated = true;
    const mongoPort = await port();
    const redisPort = await port();
    container(
        '--network',
        network,
        '--network-alias',
        'mongo',
        '-p',
        `127.0.0.1:${mongoPort}:27017`,
        'mongo:7',
        '--bind_ip_all'
    );
    const redisId = container(
        '--network',
        network,
        '--network-alias',
        'redis',
        '-p',
        `127.0.0.1:${redisPort}:6379`,
        'redis:7'
    );
    mongo = new MongoClient(`mongodb://127.0.0.1:${mongoPort}/?directConnection=true`, {
        serverSelectionTimeoutMS: 30_000,
    });
    await mongo.connect();
    const redisDeadline = Date.now() + 30_000;
    while (docker('exec', redisId, 'redis-cli', 'ping') !== 'PONG') {
        assert.ok(Date.now() < redisDeadline, 'Owned Redis failed to start');
        await delay(100);
    }
    for (const runtime of ['docker', 'lambda']) {
        for (const fixture of ['duplicates', 'conflict', 'clean']) {
            const database = `owned_${runtime}_${fixture}_${token}`;
            const db = mongo.db(database);
            const holds = db.collection('escrowholds');
            const resumeToken = randomBytes(32).toString('hex');
            const fixtureId = randomUUID();
            const now = new Date();
            const hold = {
                _id: fixtureId,
                authProvider: { type: 'firebase', id: 'completion-fixture' },
                primaryDid: did,
                shareVersion: 1,
                status: 'pending',
                identityProofType: 'auth-token',
                requestedAt: now,
                releaseAfter: now,
                releasePolicy: 'hold',
                clientEphemeralPublicKey: recipient.publicKey,
                resumeTokenHash: createHash('sha256').update(resumeToken).digest('hex'),
                notifications: [],
                createdAt: now,
                updatedAt: now,
                holdRecord: {
                    hold: {
                        holdId: fixtureId,
                        did,
                        shareVersion: 1,
                        blobHash: 'a'.repeat(64),
                        enrollmentEpoch: 1,
                        releasePolicy: 'hold',
                        clientEphemeralPublicKey: recipient.publicKey,
                        createdLo: now.getTime(),
                        createdHi: now.getTime(),
                        policyVersion: 1,
                        signature: 'synthetic',
                    },
                    holdDurationMs: 1,
                    ledgerSeq: 0,
                },
            };
            // Seed BEFORE starting either API. Fixture capability cannot release a share.
            if (fixture !== 'clean') await holds.insertOne(hold);
            if (fixture === 'duplicates') {
                await holds.insertMany(
                    [1, 2].map(() => ({
                        _id: randomUUID(),
                        authProvider: { type: 'firebase', id: 'legacy-duplicate' },
                        status: 'pending',
                    }))
                );
            }
            if (fixture === 'conflict') {
                await holds.createIndex(
                    { 'authProvider.type': 1, 'authProvider.id': 1, releasePolicy: 1 },
                    { name: 'pending_escrow_identity_policy_unique' }
                );
            }
            const apiPort = await port();
            const base = `http://127.0.0.1:${apiPort}/api`;
            const localHome = resolve(evidence, 'empty-home');
            await mkdir(localHome, { recursive: true, mode: 0o700 });
            const environment = {
                NODE_ENV: 'development',
                METABASE_SECRET_KEY: 'd'.repeat(64),
                IS_OFFLINE: 'true',
                IS_E2E_TEST: 'true',
                SEED: 'a'.repeat(64),
                PORT: String(apiPort),
                DOMAIN_NAME: `localhost%3A${apiPort}`,
                MONGO_URI:
                    runtime === 'docker'
                        ? 'mongodb://mongo:27017/?directConnection=true'
                        : `mongodb://127.0.0.1:${mongoPort}/?directConnection=true`,
                MONGO_DB_NAME: database,
                REDIS_HOST: runtime === 'docker' ? 'redis' : '127.0.0.1',
                REDIS_PORT: runtime === 'docker' ? '6379' : String(redisPort),
                SA_SEED_ENCRYPT_WRITES: 'false',
                SA_SEED_ALLOW_LEGACY_READ: 'true',
                SKIP_DIDKIT_NAPI: '1',
                ESCROW_ENCLAVE_MODE: 'software',
                ESCROW_ENCLAVE_ACTIVE_KEY_ID: keyId,
                ESCROW_ENCLAVE_SOFTWARE_PRIVATE_KEYS_JSON: JSON.stringify({
                    [keyId]: enclave.privateKey,
                }),
                ESCROW_HOLD_DURATION_MS: '1',
                SENTRY_DSN: '',
                AWS_EC2_METADATA_DISABLED: 'true',
                AWS_ACCESS_KEY_ID: 'notARealKey',
                AWS_SECRET_ACCESS_KEY: 'notARealSecretKey',
            };
            logs = '';
            if (runtime === 'docker') {
                activeContainer = container(
                    '--network',
                    network,
                    '-p',
                    `127.0.0.1:${apiPort}:${apiPort}`,
                    ...Object.entries(environment).flatMap(([key, value]) => [
                        '-e',
                        `${key}=${value}`,
                    ]),
                    '-w',
                    '/app/services/learn-card-network/lca-api',
                    image,
                    'bun',
                    'run',
                    'start:docker'
                );
            } else {
                child = spawn(
                    'bun',
                    ['--conditions=development', 'scripts/escrow-lambda-http.ts'],
                    {
                        cwd: service,
                        env: { PATH: process.env.PATH, HOME: localHome, ...environment },
                        stdio: ['ignore', 'pipe', 'pipe'],
                    }
                );
                child.stdout.on('data', data => {
                    logs += data;
                });
                child.stderr.on('data', data => {
                    logs += data;
                });
            }
            const request = async (method, path, body, authorization) => {
                const response = await fetch(base + path, {
                    method,
                    headers: {
                        ...(body ? { 'Content-Type': 'application/json' } : {}),
                        ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}),
                    },
                    body: body ? JSON.stringify(body) : undefined,
                    signal: AbortSignal.timeout(20_000),
                });
                return { status: response.status, body: await response.json() };
            };
            const ok = result => {
                assert.equal(result.status, 200, JSON.stringify(result));
                return result.body;
            };
            const deadline = Date.now() + 120_000;
            while (true) {
                try {
                    if ((await request('GET', '/health-check')).status === 200) break;
                } catch {
                    /* wait for owned startup */
                }
                assert.ok(Date.now() < deadline, `${runtime}/${fixture} API startup timed out`);
                assert.ok(!child || child.exitCode === null, 'Owned Lambda bridge exited');
                if (activeContainer)
                    assert.equal(
                        docker('inspect', '--format', '{{.State.Running}}', activeContainer),
                        'true',
                        'Owned Docker entrypoint exited'
                    );
                await delay(200);
            }
            const normal = () =>
                card.invoke
                    .getDidAuthVp({ proofFormat: 'jwt' })
                    .then(jwt => request('GET', '/did', undefined, jwt))
                    .then(ok);
            await normal();
            const owner = async (method, path, body) => {
                const jwt = await card.invoke.getDidAuthVp({ proofFormat: 'jwt' });
                const challenge = ok(await request('POST', '/keys/challenge', { did }, jwt));
                return request(
                    method,
                    path,
                    body,
                    await card.invoke.getDidAuthVp({
                        proofFormat: 'jwt',
                        challenge: challenge.challenge,
                    })
                );
            };
            const identity = `owned-${runtime}-${fixture}`;
            const auth = {
                providerType: 'firebase',
                authToken: `header.${Buffer.from(JSON.stringify({ sub: identity, email: `${identity}@example.invalid` })).toString('base64url')}.signature`,
            };
            ok(
                await owner('PUT', '/keys/auth-share', {
                    ...auth,
                    primaryDid: did,
                    authShare: { encryptedData: shares.authShare, encryptedDek: '', iv: '' },
                })
            );
            ok(
                await owner('POST', '/keys/escrow', {
                    ...auth,
                    envelope,
                    shareVersion: 1,
                    enclaveKeyId: keyId,
                })
            );
            const beforeCount = await holds.countDocuments();
            const start = await request('POST', '/keys/escrow/recover', {
                ...auth,
                clientEphemeralPublicKey: recipient.publicKey,
            });
            let diagnostic;
            if (fixture !== 'clean') {
                assert.equal(start.status, 500, 'Escrow start must fail closed');
                assert.equal(
                    await holds.countDocuments(),
                    beforeCount,
                    'No new hold may be inserted'
                );
                const complete = await request('POST', '/keys/escrow/complete', {
                    holdId: fixtureId,
                    resumeToken,
                });
                assert.equal(
                    complete.status,
                    500,
                    'Authenticated escrow completion must fail closed'
                );
                assert.deepEqual(
                    await holds.findOne({ _id: fixtureId }),
                    hold,
                    'No completion claim/charge/release may be persisted'
                );
                if (activeContainer) logs = containerLogs(activeContainer);
                const code = fixture === 'duplicates' ? 11000 : 86;
                const codeName =
                    fixture === 'duplicates' ? 'DuplicateKey' : 'IndexKeySpecsConflict';
                assert.match(logs, new RegExp(`code: ${code}\\b`));
                assert.match(logs, new RegExp(`codeName: ['"]${codeName}['"]`));
                assert.match(logs, /errmsg: ['"].+/);
                if (fixture === 'duplicates') assert.doesNotMatch(logs, /legacy-duplicate/);
                diagnostic = {
                    code,
                    codeName,
                    errmsg: 'present',
                    ...(fixture === 'duplicates' ? { duplicateKeyRedacted: true } : {}),
                };
            } else {
                const started = ok(start);
                assert.ok(started.resumeToken);
                const indexes = await holds.listIndexes().toArray();
                const unique = indexes.find(
                    index => index.name === 'pending_escrow_identity_policy_unique'
                );
                assert.equal(unique?.unique, true);
                assert.deepEqual(unique.partialFilterExpression, { status: 'pending' });
                assert.ok(!indexes.some(index => index.name === 'pending_escrow_identity_unique'));
                const wait = Math.max(
                    0,
                    new Date(started.releaseAfter).getTime() - Date.now() + 100
                );
                assert.ok(wait <= 70_000, 'Expected synthetic one-ms hold plus real safety margin');
                await delay(wait); // Real clock, no document or fake-time shortcut.
                const completed = ok(
                    await request('POST', '/keys/escrow/complete', {
                        holdId: started.holdId,
                        resumeToken: started.resumeToken,
                    })
                );
                const opened = await openEscrowRelease(completed.sealedShare, recipient.privateKey);
                assert.equal(opened.recoveryShare, shares.recoveryShare);
                assert.equal(opened.did, did);
                assert.equal((await holds.findOne({ _id: started.holdId })).status, 'completed');
                if (activeContainer) logs = containerLogs(activeContainer);
                assert.doesNotMatch(logs, /\[escrow-hold-indexes\] initialization failed/);
                diagnostic = {
                    indexes: indexes.map(index => index.name),
                    sealedShareDecrypted: true,
                };
            }
            ok(await request('GET', '/health-check'));
            await normal();
            results.push({
                runtime,
                fixture,
                health: 200,
                authenticatedDid: 200,
                escrow:
                    fixture === 'clean'
                        ? 'created/completed/decrypted'
                        : 'start/complete 500; no hold inserted or completion mutation',
                diagnostic,
            });
            console.log(JSON.stringify(results.at(-1)));
            await writeFile(resolve(evidence, `${runtime}-${fixture}.log`), logs, { mode: 0o600 });
            if (child) {
                child.kill('SIGTERM');
                await new Promise(done => child.once('exit', done));
                child = undefined;
            }
            if (activeContainer) {
                remove(activeContainer);
                activeContainer = undefined;
            }
        }
    }
    await writeFile(
        resolve(evidence, 'summary.json'),
        JSON.stringify({ image, results }, null, 2),
        { mode: 0o600 }
    );
} finally {
    if (child) {
        await writeFile(resolve(evidence, 'failure-lambda.log'), logs, { mode: 0o600 });
        if (child.exitCode === null) child.kill('SIGTERM');
    }
    if (activeContainer) {
        await writeFile(resolve(evidence, 'failure-docker.log'), containerLogs(activeContainer), {
            mode: 0o600,
        });
    }
    await mongo?.close();
    for (const id of [...owned].reverse()) {
        await writeFile(resolve(evidence, `container-${id.slice(0, 12)}.log`), containerLogs(id), {
            mode: 0o600,
        });
        remove(id);
    }
    if (networkCreated) {
        assert.equal(
            docker('network', 'inspect', '--format', `{{index .Labels "${label}"}}`, network),
            token
        );
        docker('network', 'rm', network);
    }
}
