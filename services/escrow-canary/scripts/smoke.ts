import assert from 'node:assert/strict';
import { createSdk } from '../src/sdk';
import { memoryStorage } from '../src/storage';
import type { Config } from '../src/config';
import { checkReady, initPool } from '../src/tier3/admin';
import { evaluate } from '../src/tier3/evaluator';
import { parseMessage, parseTemplate } from '../src/tier3/inbox';
import { createMemoryLedger } from '../src/tier3/ledger';

// Deliberately public test seed; never reads operator environment or secrets.
globalThis.fetch = async () => {
    throw new Error('Offline smoke attempted network access');
};
const config: Config = {
    environment: 'staging',
    serverUrl: 'https://example.invalid/api',
    tenantId: 'test',
    firebaseApiKey: 'test',
    keyId: 'test',
    authorityGeneration: 'test',
    measurements: [{ pcr0: 'a'.repeat(96), pcr1: 'b'.repeat(96), pcr2: 'c'.repeat(96) }],
    accounts: [
        { id: 'a', secretArn: 'a' },
        { id: 'b', secretArn: 'b' },
        { id: 'c', secretArn: 'c' },
    ],
};
const sdk = createSdk(config);
const key = 'a'.repeat(64);
const did = await sdk.did(key);
assert.ok(did.startsWith('did:key:'));
const proof = await sdk.sign(key, 'offline-smoke-challenge');
assert.equal(proof.split('.').length, 3);
const memory = memoryStorage();
const strategy = sdk.strategy(memory.storage);
assert.equal(await strategy.hasLocalKey(), false);
const split = await strategy.splitKey(key);
assert.equal(await strategy.reconstructKey(split.localKey, split.remoteKey), key);

// Tier 3: bundled ledger/evaluator/MIME code paths, with no AWS access.
const ledger = createMemoryLedger();
await initPool({ ledger, environment: 'staging', now: 0 });
await checkReady({ ledger, environment: 'staging', now: 0 });
assert.deepEqual(evaluate(await ledger.scanAll(), 1, 12), {
    overdue: 0,
    poolAvailable: 12,
    startAgeMinutes: 0,
    paused: false,
});
const sample = parseMessage(
    new TextEncoder().encode(
        'Subject: Your LearnCard recovery code\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\nYour LearnCard recovery code is: 00000000\r\n'
    )
);
assert.equal(parseTemplate(sample)?.kind, 'code');
console.log('Offline Node SDK/WASM signing, in-memory SSS and tier 3 smoke passed');
