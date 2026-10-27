import assert from 'node:assert/strict';
import { createSdk } from '../src/sdk';
import { memoryStorage } from '../src/storage';
import type { Config } from '../src/config';

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
console.log('Offline Node SDK/WASM signing and in-memory SSS smoke passed');
