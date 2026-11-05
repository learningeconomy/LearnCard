import { randomUUID } from 'node:crypto';
import { MongoClient, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateEscrowHoldInput } from './EscrowHold';

const database = vi.hoisted(() => {
    const state: { current?: Db } = {};
    return state;
});
vi.mock('@mongo', () => ({
    default: {
        collection: (name: string) => {
            if (!database.current) throw new Error('Disposable Mongo is not ready');
            return database.current.collection(name);
        },
    },
}));
vi.mock('@environment', () => ({
    environment: { SEED: 'a'.repeat(64), ESCROW_HOLD_RESTART_MIN_AGE_MS: 0 },
}));

const key = { 'authProvider.type': 1, 'authProvider.id': 1, releasePolicy: 1 };
const name = 'pending_escrow_identity_policy_unique';
const unique = { unique: true, partialFilterExpression: { status: 'pending' } };
const identity = { type: 'firebase', id: 'synthetic-private-identity' } as const;
const input = (): CreateEscrowHoldInput => ({
    holdRecord: {
        hold: {
            holdId: randomUUID(),
            did: 'did:key:test',
            shareVersion: 1,
            blobHash: 'ab'.repeat(32),
            enrollmentEpoch: 1,
            releasePolicy: 'hold',
            clientEphemeralPublicKey: 'test-key',
            createdLo: 0,
            createdHi: 0,
            policyVersion: 1,
            signature: 'test-signature',
        },
        holdDurationMs: 0,
        ledgerSeq: 0,
    },
    authProvider: identity,
    primaryDid: 'did:key:test',
    shareVersion: 1,
    identityProofType: 'auth-token',
    requestedAt: new Date(),
    releaseAfter: new Date(),
    releasePolicy: 'hold',
    clientEphemeralPublicKey: 'test-key',
    resumeTokenHash: 'ab'.repeat(32),
});

let server: MongoMemoryServer;
let client: MongoClient;
let model: typeof import('./EscrowHold');
beforeAll(async () => {
    // Never uses MONGO_URI, the service environment, or a running/shared Mongo.
    server = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
    client = new MongoClient(server.getUri());
    database.current = client.db('escrow_index_regression');
});
beforeEach(async () => {
    await database.current?.dropDatabase();
    vi.resetModules();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    model = await import('./EscrowHold');
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
    await client?.close();
    await server?.stop();
});

const collection = () => {
    if (!database.current) throw new Error('Disposable Mongo is not ready');
    return database.current.collection('escrowholds');
};

describe('escrow index migration with real Mongo', () => {
    it('surfaces E11000, shares failing waiters, blocks writes and retries after repair', async () => {
        await collection().insertMany([
            { authProvider: identity, status: 'pending' },
            { authProvider: identity, status: 'pending', releasePolicy: 'hold' },
        ]);
        const ready = model.ensureEscrowHoldsIndexes();
        expect(model.ensureEscrowHoldsIndexes()).toBe(ready);
        await expect(ready).rejects.toMatchObject({
            message: 'Escrow hold index initialization failed',
            cause: { code: 11000, codeName: 'DuplicateKey' },
        });
        expect(console.error).toHaveBeenCalledWith(
            '[escrow-hold-indexes] initialization failed',
            expect.objectContaining({
                operation: name,
                code: 11000,
                codeName: 'DuplicateKey',
                errmsg: expect.stringContaining('E11000'),
                keyValue: {
                    'authProvider.type': '[redacted]',
                    'authProvider.id': '[redacted]',
                    releasePolicy: '[redacted]',
                },
            })
        );
        expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain(identity.id);
        await expect(model.createEscrowHold(input())).rejects.toMatchObject({
            cause: { code: 11000 },
        });
        await expect(model.retryClaimedEscrowHold(randomUUID(), new Date())).rejects.toMatchObject({
            cause: { code: 11000 },
        });
        expect(await collection().countDocuments()).toBe(2);
        // This repair is ONLY to this test's owned, temporary database.
        await collection().deleteOne({ authProvider: identity });
        await expect(model.ensureEscrowHoldsIndexes()).resolves.toBeUndefined();
        await expect(model.createEscrowHold(input())).rejects.toMatchObject({ code: 11000 });
        expect(await collection().countDocuments()).toBe(1);
    });

    it('is idempotent when the old index is absent and preserves per-policy uniqueness', async () => {
        await expect(model.createEscrowHoldsIndexes()).resolves.toBeUndefined();
        await expect(model.createEscrowHoldsIndexes()).resolves.toBeUndefined();
        await model.createEscrowHold(input());
        await expect(model.createEscrowHold(input())).rejects.toMatchObject({ code: 11000 });
        await expect(
            model.createEscrowHold({ ...input(), releasePolicy: 'pin' })
        ).resolves.toBeDefined();
        expect(console.error).not.toHaveBeenCalled();
    });

    it('normalizes legacy rows and installs the replacement before dropping the old index', async () => {
        await collection().createIndex(
            { 'authProvider.type': 1, 'authProvider.id': 1 },
            { name: 'pending_escrow_identity_unique', ...unique }
        );
        await collection().insertOne({ authProvider: identity, status: 'pending' });
        await model.createEscrowHoldsIndexes();
        expect(await collection().findOne()).toMatchObject({ releasePolicy: 'hold' });
        const indexes = await collection().listIndexes().toArray();
        expect(indexes.find(index => index.name === name)).toMatchObject({ key, ...unique });
        expect(indexes.some(index => index.name === 'pending_escrow_identity_unique')).toBe(false);
    });

    it('preserves the old guard when a conflicting same-name nonunique index blocks migration', async () => {
        await collection().createIndex(
            { 'authProvider.type': 1, 'authProvider.id': 1 },
            { name: 'pending_escrow_identity_unique', ...unique }
        );
        await collection().createIndex(key, { name });
        await expect(model.ensureEscrowHoldsIndexes()).rejects.toMatchObject({
            cause: { code: 86 },
        });
        expect(console.error).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                operation: name,
                code: 86,
                codeName: 'IndexKeySpecsConflict',
            })
        );
        const indexes = await collection().listIndexes().toArray();
        expect(indexes.find(index => index.name === 'pending_escrow_identity_unique')?.unique).toBe(
            true
        );
        expect(indexes.find(index => index.name === name)?.unique).not.toBe(true);
        await expect(model.createEscrowHold(input())).rejects.toMatchObject({
            cause: { code: 86 },
        });
        expect(await collection().countDocuments()).toBe(0);
    });

    it('accepts a verified equivalent unique index under another name', async () => {
        await collection().createIndex(key, { name: 'existing_equivalent', ...unique });
        await expect(model.ensureEscrowHoldsIndexes()).resolves.toBeUndefined();
        await model.createEscrowHold(input());
        await expect(model.createEscrowHold(input())).rejects.toMatchObject({ code: 11000 });
    });

    it('does not hide a lookup conflict just because a unique index exists', async () => {
        await collection().createIndex(key, { name, ...unique });
        await collection().createIndex({ releaseAfter: 1 }, { expireAfterSeconds: 60 });
        await expect(model.ensureEscrowHoldsIndexes()).rejects.toMatchObject({
            cause: { code: 85 },
        });
        expect(console.error).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ operation: 'releaseAfter_1', code: 85 })
        );
    });

    it('allows only one winner when the first concurrent creates initialize the indexes', async () => {
        const results = await Promise.allSettled([
            model.createEscrowHold(input()),
            model.createEscrowHold(input()),
        ]);
        expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1);
        expect(results.find(result => result.status === 'rejected')).toMatchObject({
            reason: { code: 11000 },
        });
        expect(await collection().countDocuments()).toBe(1);
    });
});
