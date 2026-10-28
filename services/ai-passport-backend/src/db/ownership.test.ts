import { afterAll, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import type { VC } from '@learncard/types';
import type { ActiveAiConsentReceipt } from '../learncard/consent';
import type { DBCredentialRecord } from '.';

const databaseName = `privacy_ownership_${randomUUID().replaceAll('-', '')}`;
process.env.MONGO_DB = databaseName;
process.env.REDIS_PREFIX = databaseName;
const owner = `did:example:owner-${randomUUID()}`;
let revision = 'current-revision';
const receipt = (): ActiveAiConsentReceipt => ({
    contractUri: 'lc:network:contract:ai',
    receiptId: 'lc:terms:one',
    status: 'live',
    updatedAt: '2026-01-01T00:00:00.000Z',
    contractUpdatedAt: '2026-01-01T00:00:00.000Z',
    categories: ['Achievement'],
    credentialUris: ['lc:alice:credential'],
    personalFields: [],
    guardian: { required: false, approved: false },
    purpose: 'model-inference',
    revision,
});
const privacy = await import('../ai/privacy');
mock.module('../ai/privacy', () => ({
    ...privacy,
    assertCurrentAiConsent: async () => {
        if (privacy.getCurrentAiSubject() !== owner) throw new Error('owner required');
        return receipt();
    },
}));
const embeddingCalls = mock(async (): Promise<number[][]> => {
    throw new Error('No embedding is expected in these tests');
});
const actualClient = await import('../ai/client');
mock.module('../ai/client', () => ({
    ...actualClient,
    embeddingAiCall: embeddingCalls,
}));
const { ChatDB } = await import('.');
const { fingerprintCredential } = await import('../credentials/verification');
const { projectCredential, serializeModelSafeCredentialProjection } =
    await import('../credentials/projection');
const { getPrivacySubjectRef } = await import('../ai/privacy-keys');
const { requestDataErasure, withOwnerOperation, getOwnerOperationFence, PRIVACY_MAINTENANCE_KEY } =
    await import('../services/dataErasure');
const { default: cache } = await import('../utils/cache');
const mongo = new MongoClient(process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27018');
await mongo.connect();
const persisted = mongo.db(databaseName);
const database = new ChatDB();
const asOwner = <T>(callback: () => T): T => privacy.runWithAiPrivacyContext(owner, callback);

const original: VC = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: 'lc:alice:credential',
    type: ['VerifiableCredential', 'TestCredential'],
    issuer: 'did:example:issuer',
    issuanceDate: '2026-01-01T00:00:00.000Z',
    credentialSubject: {
        id: owner,
        name: 'Private Learner',
        skills: ['Calculus'],
    },
    proof: {
        type: 'Ed25519Signature2020',
        created: '2026-01-01T00:00:00.000Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: 'did:example:issuer#key-1',
        proofValue: 'synthetic-test-proof',
    },
    boostId: 'lc:alice:boost',
};
function record(
    credential = original,
    uri = 'lc:alice:credential'
): DBCredentialRecord & {
    verification: NonNullable<DBCredentialRecord['verification']>;
} {
    const verification = {
        credentialUri: uri,
        contentHash: fingerprintCredential(credential),
        status: 'valid' as const,
        checkedAt: '2026-01-01T00:00:00.000Z',
        verifiedPayload: 'credential' as const,
        checks: ['proof'],
        errors: [],
        warnings: [],
        verifier: { name: 'fixture', version: '1' },
        provenance: {
            source: 'wallet' as const,
            retrievedAt: '2026-01-01T00:00:00.000Z',
        },
        consent: receipt(),
    };
    return {
        id: 'one',
        uri: verification.credentialUri,
        category: 'Achievement',
        credential,
        rawCredentialJson: JSON.stringify(credential),
        aiContext: 'Calculus',
        createdAt: verification.checkedAt,
        verification,
        projection: projectCredential(credential, 'Achievement', verification),
    };
}

beforeEach(async () => {
    revision = 'current-revision';
    for (const collection of await persisted.collections()) await collection.deleteMany({});
    await cache.redis!.del(
        `${databaseName}:privacy:erasure:${getPrivacySubjectRef(owner)}`,
        `${databaseName}:privacy:active:${getPrivacySubjectRef(owner)}`,
        PRIVACY_MAINTENANCE_KEY
    );
});
afterAll(async () => {
    await database.close();
    await persisted.dropDatabase();
    await mongo.close();
    await cache.redis!.del(
        `${databaseName}:privacy:erasure:${getPrivacySubjectRef(owner)}`,
        `${databaseName}:privacy:active:${getPrivacySubjectRef(owner)}`,
        PRIVACY_MAINTENANCE_KEY
    );
    await cache.redis!.quit();
});

describe('persistent owner boundaries', () => {
    test('a different owner cannot read or delete thread messages', async () => {
        const thread = await database.createThread(owner);
        await asOwner(() =>
            database.addMessage(owner, thread, {
                role: 'user',
                content: 'private message',
            })
        );
        expect(await database.hasThread('did:example:bob', thread)).toBe(false);
        expect(await database.getMessages('did:example:bob', thread)).toEqual([]);
        expect(await database.deleteThread('did:example:bob', thread)).toBe(false);
        expect((await database.getMessages(owner, thread))[0]?.content).toBe('private message');
        expect(await database.deleteThread(owner, thread)).toBe(true);
        expect(await database.getMessages(owner, thread)).toEqual([]);
    });

    test('raw originals live only in the encrypted owner vault and credential updates preserve Mongo identity', async () => {
        await asOwner(() => database.storeVC(owner, record()));
        const first = await persisted.collection('credentials').findOne({ did: owner });
        expect(first).not.toHaveProperty('credential');
        expect(first).not.toHaveProperty('rawCredentialJson');
        const vault = await persisted.collection('raw_credentials').findOne({ did: owner });
        expect(JSON.stringify(vault)).not.toContain('Private Learner');
        expect(JSON.stringify(vault)).not.toContain('Calculus');
        expect((await asOwner(() => database.getVCs(owner)))[0]?.credential).toEqual(original);
        await expect(
            privacy.runWithAiPrivacyContext('did:example:bob', () => database.getVCs(owner))
        ).rejects.toThrow();
        await asOwner(() =>
            database.storeVC(owner, {
                ...record(),
                _id: first!._id,
            } as DBCredentialRecord)
        );
        expect((await persisted.collection('credentials').findOne({ did: owner }))?._id).toEqual(
            first!._id
        );
        await persisted
            .collection('raw_credentials')
            .updateOne({ did: owner }, { $set: { expiresAt: new Date(0) } });
        const warn = spyOn(console, 'warn').mockImplementation(() => undefined);
        try {
            expect(await asOwner(() => database.getVCs(owner))).toEqual([]);
        } finally {
            warn.mockRestore();
        }
        expect((await asOwner(() => database.getCredentialRecords(owner)))[0]?.uri).toBe(
            'lc:alice:credential'
        );
    });

    test('one unhydratable credential is skipped with an allowlisted count, not a failed read', async () => {
        const second: VC = { ...original, id: 'lc:alice:second' };
        await asOwner(() => database.storeVC(owner, record()));
        await asOwner(() =>
            database.storeVC(owner, {
                ...record(second, 'lc:alice:second'),
                id: 'two',
                aiContext: 'Second',
            })
        );
        await persisted
            .collection('raw_credentials')
            .updateOne(
                { did: owner, uri: 'lc:alice:credential' },
                { $set: { expiresAt: new Date(0) } }
            );
        const events: unknown[] = [];
        const warn = spyOn(console, 'warn').mockImplementation((...data) => {
            events.push(...data);
        });
        const vcs = await asOwner(() => database.getVCs(owner)).finally(() => warn.mockRestore());
        expect(vcs.map(({ uri }) => uri)).toEqual(['lc:alice:second']);
        const logged = events.filter(
            event => (event as { event?: string })?.event === 'credential_raw_unavailable'
        );
        expect(logged).toHaveLength(1);
        expect({ ...(logged[0] as object) }).toEqual({
            event: 'credential_raw_unavailable',
            count: 1,
        });
        const text = JSON.stringify(logged[0]);
        expect(text).not.toContain(owner);
        expect(text).not.toContain('lc:alice');
    });

    test("the search's aiContext read returns only the requested URIs and needs no raw credential", async () => {
        const second: VC = { ...original, id: 'lc:alice:second' };
        await asOwner(() => database.storeVC(owner, record()));
        await asOwner(() =>
            database.storeVC(owner, {
                ...record(second, 'lc:alice:second'),
                id: 'two',
                aiContext: 'Second',
            })
        );
        await persisted
            .collection('raw_credentials')
            .updateMany({ did: owner }, { $set: { expiresAt: new Date(0) } });
        expect(
            await asOwner(() =>
                database.getCredentialAiContexts(owner, ['lc:alice:credential', 'lc:alice:missing'])
            )
        ).toEqual([{ uri: 'lc:alice:credential', aiContext: 'Calculus', category: 'Achievement' }]);
        expect(await asOwner(() => database.getCredentialAiContexts(owner, []))).toEqual([]);
    });

    // Prod v187: rows repaired with only a projection had no stored aiContext,
    // so every relevant candidate was dropped before the walk.
    test("the search's aiContext read falls back to the stored, ingest-verified projection", async () => {
        const stored = record();
        await asOwner(() => database.storeVC(owner, stored));
        await persisted
            .collection('credentials')
            .updateOne({ did: owner, uri: stored.uri }, { $unset: { aiContext: '' } });
        expect(await asOwner(() => database.getCredentialAiContexts(owner, [stored.uri]))).toEqual([
            {
                uri: stored.uri,
                aiContext: serializeModelSafeCredentialProjection(stored.projection!),
                category: 'Achievement',
                fromProjection: true,
            },
        ]);

        // A projection without a valid, proof-checked verification gives no text.
        await persisted
            .collection('credentials')
            .updateOne({ did: owner, uri: stored.uri }, { $set: { 'verification.checks': [] } });
        expect(await asOwner(() => database.getCredentialAiContexts(owner, [stored.uri]))).toEqual([
            { uri: stored.uri },
        ]);
    });

    test('expired generated originals become cache misses, but live vault corruption fails closed', async () => {
        const generated = {
            ...record(),
            source: 'generated' as const,
            sourceFingerprint: 'generated-fingerprint',
        };
        const cached = () =>
            asOwner(() =>
                database.getGeneratedCredentialByFingerprint(
                    owner,
                    'Achievement',
                    'generated-fingerprint'
                )
            );
        await asOwner(() => database.storeVC(owner, generated));
        expect((await cached())?.credential).toEqual(original);
        await persisted
            .collection('raw_credentials')
            .updateOne({ did: owner }, { $set: { expiresAt: new Date(0) } });
        expect(await cached()).toBeNull();
        await asOwner(() => database.storeVC(owner, generated));
        expect((await cached())?.credential).toEqual(original);
        await persisted
            .collection('raw_credentials')
            .updateOne(
                { did: owner },
                { $set: { ciphertext: Buffer.alloc(32).toString('base64') } }
            );
        await expect(cached()).rejects.toThrow();
    });

    test("changed consent excludes old derived history from model reads without deleting the owner's history", async () => {
        const thread = await database.createThread(owner);
        await asOwner(() =>
            database.addMessage(owner, thread, {
                role: 'assistant',
                content: 'old shared learning facts',
            })
        );
        await asOwner(() => database.storeThreadPlan(owner, thread, 'old plan'));
        revision = 'new-revision';
        await asOwner(() =>
            database.addMessage(owner, thread, {
                role: 'user',
                content: 'new request',
            })
        );
        expect(
            (await asOwner(() => database.getModelMessages(owner, thread))).map(
                message => message.content
            )
        ).toEqual(['new request']);
        expect(await asOwner(() => database.getThreadPlans(owner, thread))).toEqual([]);
        expect((await database.getMessages(owner, thread)).map(message => message.content)).toEqual(
            ['old shared learning facts', 'new request']
        );
        const history = await database.getMessages(owner, thread);
        expect(
            (
                await asOwner(() =>
                    database.getMessagesByIds(
                        owner,
                        history.map(({ id }) => id),
                        thread
                    )
                )
            ).map(({ content }) => content)
        ).toEqual(['new request']);
    });

    test('an erasure begun inside a credential transaction rolls back both the raw original and metadata', async () => {
        const entered = Promise.withResolvers<void>();
        const release = Promise.withResolvers<void>();
        const storeRaw = database.storeRawCredential.bind(database);
        database.storeRawCredential = async (...args) => {
            await storeRaw(...args);
            entered.resolve();
            await release.promise;
        };
        const writer = asOwner(() => database.storeVC(owner, record()));
        // Attach the rejection handler before releasing the transaction.
        const outcome = writer.then(
            () => 'committed',
            () => 'rejected'
        );
        try {
            await entered.promise;
            await requestDataErasure(owner);
            const fencing = database.fenceOwnerWrites(owner);
            release.resolve();
            expect(await outcome).toBe('rejected');
            await fencing;
            await database.deleteOwnerData(owner, getPrivacySubjectRef(owner));
            expect(await asOwner(() => database.getVCs(owner))).toEqual([]);
            expect(
                await persisted.collection('raw_credentials').findOne({ did: owner })
            ).toBeNull();
            await expect(database.createThread(owner)).rejects.toThrow();
        } finally {
            release.resolve();
            database.storeRawCredential = storeRaw;
        }
    });

    test('lease expiry after a raw-vault write aborts the entire credential transaction', async () => {
        const storeRaw = database.storeRawCredential.bind(database);
        database.storeRawCredential = async (...args) => {
            await storeRaw(...args);
            const fence = getOwnerOperationFence()!;
            await cache.redis!.zadd(fence.operationsKey, 0, fence.token);
        };
        try {
            await expect(
                asOwner(() => withOwnerOperation(owner, () => database.storeVC(owner, record())))
            ).rejects.toThrow();
            expect(await asOwner(() => database.getCredentialRecords(owner))).toEqual([]);
            expect(
                await persisted.collection('raw_credentials').findOne({ did: owner })
            ).toBeNull();
        } finally {
            database.storeRawCredential = storeRaw;
        }
    });

    test('fencing removes queued data while retaining vector fences and reserved external effects', async () => {
        const reference = await database.storeOwnerJobPayload(owner, 'ingestion', {
            privateText: 'private payload',
        });
        expect((await database.getOwnerJobPayload(reference))?.payload).toEqual({
            privateText: 'private payload',
        });
        await database.registerVectorPoints(owner, 'messages', ['point-one']);
        await database.reserveExternalArtifact(owner, {
            operationId: 'reserved-one',
            kind: 'boost',
            credentialId: 'urn:uuid:credential',
        });
        await database.fenceOwnerWrites(owner);
        await database.deleteOwnerData(owner, getPrivacySubjectRef(owner));
        expect(await database.getOwnerJobPayload(reference)).toBeNull();
        await database.completeExternalArtifact(owner, 'reserved-one', {
            status: 'complete',
            uris: ['lc:remote:one'],
        });
        await expect(
            database.completeExternalArtifact(owner, 'never-reserved', {
                status: 'unknown',
                uris: [],
            })
        ).rejects.toThrow();
        expect(
            (await database.getExternalArtifacts(owner)).map(({ operationId, status, uris }) => ({
                operationId,
                status,
                uris,
            }))
        ).toEqual([
            {
                operationId: 'reserved-one',
                status: 'complete',
                uris: ['lc:remote:one'],
            },
        ]);
        expect(await database.getVectorPointReferences(owner)).toEqual([
            { collection: 'messages', ids: ['point-one'] },
        ]);
        await expect(database.storeOwnerJobPayload(owner, 'ingestion', {})).rejects.toThrow();
    });

    test('migration recovers a valid credential despite corrupt raw JSON and schema', async () => {
        await persisted.collection('credentials').insertOne({
            ...record(),
            did: owner,
            rawCredentialJson: '{broken',
        });
        await persisted.collection('raw_credentials').insertOne({
            did: owner,
            uri: original.id,
            rawCredentialJson: JSON.stringify({ invalid: true }),
            storedAt: new Date().toISOString(),
        });
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        expect((await database.migrateLegacyPrivacyData({ apply: true })).preservedOriginals).toBe(
            1
        );
        const exported = await asOwner(() =>
            database.exportOwnerData(owner, getPrivacySubjectRef(owner))
        );
        expect(exported.rawCredentials.map(({ credential }) => credential)).toEqual([original]);
        expect(exported.credentials).toEqual([]);
    });

    test('migration keeps valid raw evidence when credential metadata is corrupt and never renews expired originals', async () => {
        const storedAt = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
        await persisted.collection('raw_credentials').insertOne({
            did: owner,
            uri: original.id,
            rawCredentialJson: JSON.stringify(original),
            storedAt,
        });
        await persisted.collection('credentials').insertOne({
            did: owner,
            uri: original.id,
            credential: { invalid: true },
        });
        await persisted.collection('credentials').insertOne({
            ...record(),
            did: owner,
            uri: 'lc:expired:credential',
            storedAt: new Date(0),
        });
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        const report = await database.migrateLegacyPrivacyData({ apply: true });
        expect(report.preservedOriginals).toBe(1);
        expect(report.unavailableOriginals).toBe(1);
        const exported = await asOwner(() =>
            database.exportOwnerData(owner, getPrivacySubjectRef(owner))
        );
        expect(exported.rawCredentials.map(({ credential }) => credential)).toEqual([original]);
        expect(exported.rawCredentials[0]?.storedAt).toBe(storedAt.toISOString());
        expect(
            await persisted.collection('raw_credentials').findOne({ uri: 'lc:expired:credential' })
        ).toBeNull();
    });

    test('an expired raw sibling cannot erase or expire a live credential candidate', async () => {
        await persisted.collection('raw_credentials').insertOne({
            did: owner,
            uri: original.id,
            rawCredentialJson: JSON.stringify(original),
            storedAt: new Date(0),
        });
        await persisted.collection('credentials').insertOne({ ...record(), did: owner });
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        await database.migrateLegacyPrivacyData({ apply: true });
        const exported = await asOwner(() =>
            database.exportOwnerData(owner, getPrivacySubjectRef(owner))
        );
        expect(exported.rawCredentials.map(({ credential }) => credential)).toEqual([original]);
    });

    test('duplicate legacy rows reconcile before unique indexes without extending retention', async () => {
        const raw = persisted.collection('raw_credentials');
        await raw.dropIndex('raw_credential_owner_uri');
        const storedAt = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
        await raw.insertMany([
            { did: owner, uri: original.id, rawCredentialJson: '{corrupt', storedAt },
            {
                did: owner,
                uri: original.id,
                rawCredentialJson: JSON.stringify(original),
                storedAt: new Date(),
            },
            {
                did: owner,
                uri: original.id,
                rawCredentialJson: JSON.stringify(original),
                storedAt,
            },
        ]);
        await persisted.collection('credentials').insertOne({ ...record(), did: owner });
        const offline = new ChatDB();
        try {
            const before = await raw.find({ did: owner }).toArray();
            const indexes = await raw.listIndexes().toArray();
            await offline.migrateLegacyPrivacyData({ apply: false });
            expect(await raw.find({ did: owner }).toArray()).toEqual(before);
            expect(await raw.listIndexes().toArray()).toEqual(indexes);
            await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
            await offline.migrateLegacyPrivacyData({ apply: true });
            const exported = await asOwner(() =>
                offline.exportOwnerData(owner, getPrivacySubjectRef(owner))
            );
            expect(exported.rawCredentials.map(({ credential }) => credential)).toEqual([original]);
            expect(exported.rawCredentials[0]?.storedAt).toBe(storedAt.toISOString());
            await expect(raw.insertOne({ did: owner, uri: original.id })).rejects.toThrow();
            expect(
                (await offline.migrateLegacyPrivacyData({ apply: true })).preservedOriginals
            ).toBe(0);
            expect((await raw.findOne({ did: owner }))?.storedAt).toBe(storedAt.toISOString());
        } finally {
            await offline.close();
        }
    });

    test('conflicting recoverable originals stop migration instead of choosing by iteration order', async () => {
        const other: VC = {
            ...original,
            credentialSubject: { id: owner, skills: ['Geometry'] },
        };
        await persisted.collection('raw_credentials').insertOne({
            did: owner,
            uri: original.id,
            rawCredentialJson: JSON.stringify(other),
            storedAt: new Date(),
        });
        await persisted.collection('credentials').insertOne({ ...record(), did: owner });
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        await expect(database.migrateLegacyPrivacyData({ apply: true })).rejects.toThrow(
            'Conflicting legacy originals'
        );
        expect(
            (await persisted.collection('credentials').findOne({ did: owner }))?.credential
        ).toEqual(original);
        expect(
            (await persisted.collection('raw_credentials').findOne({ did: owner }))
                ?.rawCredentialJson
        ).toBe(JSON.stringify(other));
    });

    test('a malformed retention timestamp leaves a recoverable original available for offline resolution', async () => {
        await persisted.collection('raw_credentials').insertOne({
            did: owner,
            uri: original.id,
            rawCredentialJson: JSON.stringify(original),
            storedAt: 'invalid-date',
        });
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        await expect(database.migrateLegacyPrivacyData({ apply: true })).rejects.toThrow(
            'retention requires offline resolution'
        );
        expect(
            (await persisted.collection('raw_credentials').findOne({ did: owner }))
                ?.rawCredentialJson
        ).toBe(JSON.stringify(original));
    });

    test('a recoverable original with ambiguous ownership is not silently purged', async () => {
        await persisted.collection('credentials').insertOne(record());
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        await expect(database.migrateLegacyPrivacyData({ apply: true })).rejects.toThrow(
            'Unattributed legacy original'
        );
        expect(
            (await persisted.collection('credentials').findOne({ uri: original.id }))?.credential
        ).toEqual(original);
    });

    test('a live authenticated original survives corrupt legacy metadata without replacement or TTL renewal', async () => {
        await asOwner(() => database.storeVC(owner, record()));
        const before = await persisted.collection('raw_credentials').findOne({ did: owner });
        await persisted
            .collection('credentials')
            .updateOne({ did: owner }, { $set: { rawCredentialJson: '{corrupt' } });
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        await database.migrateLegacyPrivacyData({ apply: true });
        const after = await persisted.collection('raw_credentials').findOne({ did: owner });
        expect(after?.ciphertext).toBe(before?.ciphertext);
        expect(after?.expiresAt).toEqual(before?.expiresAt);
        const exported = await asOwner(() =>
            database.exportOwnerData(owner, getPrivacySubjectRef(owner))
        );
        expect(exported.rawCredentials.map(({ credential }) => credential)).toEqual([original]);
    });

    test('migration preserves learner history and completion while exporting each typed issued reference', async () => {
        const summaryUri = 'lc:network:test/trpc:credential:summary';
        const topicUri = 'lc:network:test/trpc:boost:topic';
        const pathwayUri = 'lc:network:test/trpc:credential:pathway';
        const summaryBoost = 'lc:network:test/trpc:boost:summary';
        const summary = {
            credential_uri: summaryUri,
            summary_data: 'Learned calculus',
            created_at: '2026-01-01T00:00:00.000Z',
        };
        const plan = {
            plan_data: 'Historical plan',
            created_at: '2026-01-01T00:00:00.000Z',
        };
        await persisted.collection('threads').insertOne({
            id: 'completed-legacy',
            did: owner,
            title: 'Calculus',
            summaries: [summary],
            plans: [plan],
            topicCredentialUri: topicUri,
            pathwayUris: [pathwayUri],
        });
        await persisted.collection('credentials').insertOne({
            ...record({ ...original, boostId: summaryBoost }),
            did: owner,
            uri: summaryUri,
        });
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        await database.migrateLegacyPrivacyData({ apply: true });
        expect(await database.getThreadSummaryCredentials(owner, 'completed-legacy')).toEqual([
            summary,
        ]);
        expect((await database.getThreads(owner))[0]?.plans).toEqual([plan]);
        expect(await asOwner(() => database.getThreadPlans(owner, 'completed-legacy'))).toEqual([]);
        expect(await database.isThreadEnded('completed-legacy', owner)).toBe(true);
        await cache.redis!.del(PRIVACY_MAINTENANCE_KEY);
        expect(await database.endActiveThreads(owner)).toEqual([]);
        const exported = await asOwner(() =>
            database.exportOwnerData(owner, getPrivacySubjectRef(owner))
        );
        expect(exported.externalArtifacts.map(({ kind, uris }) => ({ kind, uris }))).toEqual(
            expect.arrayContaining([
                { kind: 'boost', uris: [topicUri] },
                { kind: 'boost', uris: [summaryBoost] },
                { kind: 'contract-credential', uris: [summaryUri] },
                { kind: 'contract-credential', uris: [pathwayUri] },
            ])
        );
        const before = await database.getExternalArtifacts(owner);
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        await database.migrateLegacyPrivacyData({ apply: true });
        expect(await database.getExternalArtifacts(owner)).toEqual(before);
        await database.fenceOwnerWrites(owner);
        await database.deleteOwnerData(owner, getPrivacySubjectRef(owner));
        expect(await database.getExternalArtifacts(owner)).toEqual(before);
    });

    test('a failed vault write rolls back deletion of all recoverable siblings and can resume', async () => {
        await persisted.collection('raw_credentials').insertOne({
            did: owner,
            uri: original.id,
            rawCredentialJson: JSON.stringify(original),
            storedAt: new Date(),
        });
        await persisted.collection('credentials').insertOne({ ...record(), did: owner });
        await persisted.command({
            collMod: 'raw_credentials',
            validator: { version: { $ne: 1 } },
        });
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        try {
            await expect(database.migrateLegacyPrivacyData({ apply: true })).rejects.toThrow();
            expect(
                (await persisted.collection('credentials').findOne({ did: owner }))?.credential
            ).toEqual(original);
            expect(
                (await persisted.collection('raw_credentials').findOne({ did: owner }))
                    ?.rawCredentialJson
            ).toBe(JSON.stringify(original));
        } finally {
            await persisted.command({ collMod: 'raw_credentials', validator: {} });
        }
        await database.migrateLegacyPrivacyData({ apply: true });
        const exported = await asOwner(() =>
            database.exportOwnerData(owner, getPrivacySubjectRef(owner))
        );
        expect(exported.rawCredentials.map(({ credential }) => credential)).toEqual([original]);
    });

    test('local erasure saves legacy references before removing their last local evidence', async () => {
        const uri = 'lc:network:test/trpc:credential:legacy';
        const boost = 'lc:network:test/trpc:boost:legacy';
        await persisted.collection('credentials').insertOne({
            ...record({ ...original, boostId: boost }),
            did: owner,
            source: 'generated',
            uri,
        });
        await persisted.collection('threads').insertOne({
            did: owner,
            id: 'legacy-references',
            pathwayCredentialUri: 'opaque:unclassified-reference',
        });
        await database.fenceOwnerWrites(owner);
        const result = await database.deleteOwnerData(owner, getPrivacySubjectRef(owner));
        expect(
            result.externalArtifacts.map(({ kind, status, uris }) => ({
                kind,
                status,
                uris,
            }))
        ).toEqual(
            expect.arrayContaining([
                { kind: 'contract-credential', status: 'unknown', uris: [uri] },
                { kind: 'boost', status: 'unknown', uris: [boost] },
                {
                    kind: 'legacy-generated',
                    status: 'unknown',
                    uris: ['opaque:unclassified-reference'],
                },
            ])
        );
        expect(await persisted.collection('credentials').findOne({ did: owner })).toBeNull();
        expect(await persisted.collection('threads').findOne({ did: owner })).toBeNull();
        expect(
            (await database.deleteOwnerData(owner, getPrivacySubjectRef(owner))).externalArtifacts
        ).toEqual(result.externalArtifacts);
    });

    test('erasure does not turn authoritative current publications into unknown legacy duplicates', async () => {
        const uri = 'lc:network:test/trpc:boost:tracked';
        await database.reserveExternalArtifact(owner, {
            operationId: 'current',
            kind: 'boost',
            credentialId: 'urn:uuid:current',
        });
        await database.completeExternalArtifact(owner, 'current', {
            status: 'complete',
            uris: [uri],
        });
        await persisted
            .collection('threads')
            .insertOne({ did: owner, id: 'tracked-thread', topicCredentialUri: uri });
        await database.fenceOwnerWrites(owner);
        await database.deleteOwnerData(owner, getPrivacySubjectRef(owner));
        expect(
            (await database.getExternalArtifacts(owner)).map(({ operationId, status }) => ({
                operationId,
                status,
            }))
        ).toEqual([{ operationId: 'current', status: 'complete' }]);
    });

    test('remote cleanup outcomes remain owner scoped and durable after local deletion', async () => {
        await database.reserveExternalArtifact(owner, {
            operationId: 'cleanup-one',
            kind: 'boost',
            credentialId: 'urn:uuid:one',
        });
        await database.fenceOwnerWrites(owner);
        const deletion = {
            status: 'retryable' as const,
            attemptedAt: new Date().toISOString(),
            code: 'network_unavailable',
        };
        await database.recordExternalArtifactDeletion(owner, 'cleanup-one', deletion);
        await expect(
            database.recordExternalArtifactDeletion('did:example:bob', 'cleanup-one', deletion)
        ).rejects.toThrow();
        await expect(
            database.recordExternalArtifactDeletion(owner, 'missing', deletion)
        ).rejects.toThrow();
        await database.deleteOwnerData(owner, getPrivacySubjectRef(owner));
        expect((await database.getExternalArtifacts(owner))[0]?.deletion).toEqual(deletion);
        expect(await database.getExternalArtifacts('did:example:bob')).toEqual([]);
        const successful = {
            status: 'deleted' as const,
            attemptedAt: new Date().toISOString(),
        };
        await database.recordExternalArtifactDeletion(owner, 'cleanup-one', successful);
        await database.recordExternalArtifactDeletion(owner, 'cleanup-one', {
            status: 'unknown',
            attemptedAt: new Date().toISOString(),
            code: 'remote_absence_unconfirmed',
        });
        expect((await database.getExternalArtifacts(owner))[0]?.deletion).toEqual(successful);
    });

    test('offline migration retains recoverable originals without treating legacy proof claims as verified', async () => {
        await persisted.collection('credentials').insertOne({ ...record(), did: owner });
        const preview = await database.migrateLegacyPrivacyData({ apply: false });
        expect(preview.plaintextCredentials).toBe(1);
        expect(await persisted.collection('raw_credentials').findOne({ did: owner })).toBeNull();
        await expect(database.migrateLegacyPrivacyData({ apply: true })).rejects.toThrow();
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        const applied = await database.migrateLegacyPrivacyData({ apply: true });
        expect(applied.preservedOriginals).toBe(1);
        expect(applied.resyncRequired).toBe(1);
        expect(await database.getCredentialVerification(owner, 'lc:alice:credential')).toBeNull();
        expect(await asOwner(() => database.getCredentialRecords(owner))).toEqual([]);
        const exported = await asOwner(() =>
            database.exportOwnerData(owner, getPrivacySubjectRef(owner))
        );
        expect(exported.rawCredentials.map(({ credential }) => credential)).toEqual([original]);
    });

    test('offline encryption failure preserves the original for a safe retry', async () => {
        await persisted.collection('credentials').insertOne({ ...record(), did: owner });
        await cache.redis!.set(PRIVACY_MAINTENANCE_KEY, 'owned-offline-fixture');
        const vault = await import('../credentials/raw-vault');
        const failure = spyOn(vault, 'encryptRawCredential').mockImplementation(() => {
            throw new Error('Encryption unavailable');
        });
        try {
            await expect(database.migrateLegacyPrivacyData({ apply: true })).rejects.toThrow(
                'Encryption unavailable'
            );
            expect(
                (await persisted.collection('credentials').findOne({ did: owner }))?.credential
            ).toEqual(original);
            expect(
                await persisted.collection('raw_credentials').findOne({ did: owner })
            ).toBeNull();
        } finally {
            failure.mockRestore();
        }
    });
});

// Real Mongo/Redis regressions for persistence scheduling; no mocked fences.
describe('owner persistence queue', () => {
    test('resolution telemetry separates queue wait, admitted consent preflight and transaction work', async () => {
        const { runAiInsightDiagnostics, withAiInsightStage } =
            await import('../diagnostics/ai-insight');
        const originalInfo = console.info;
        const events: any[] = [];
        console.info = event => {
            events.push(event);
        };
        const entered = Promise.withResolvers<void>(),
            release = Promise.withResolvers<void>();
        try {
            await runAiInsightDiagnostics(() =>
                withAiInsightStage('credential_resolution', () =>
                    asOwner(async () => {
                        const first = (database as any).withOwnerWrite(owner, async () => {
                            entered.resolve();
                            await release.promise;
                        });
                        await entered.promise;
                        const entry = record();
                        const next = database.storeRawCredential(
                            owner,
                            {
                                uri: entry.uri,
                                contentHash: entry.verification.contentHash,
                                rawCredentialJson: entry.rawCredentialJson,
                            },
                            async () => undefined
                        );
                        release.resolve();
                        await Promise.all([first, next]);
                    })
                )
            );
            const totals = events.find(
                event => event.event === 'ai_insight_resolution_progress'
            ).timings;
            expect(totals.owner_queue_wait).toMatchObject({ count: 2, active: 0 });
            expect(totals.owner_preflight).toMatchObject({ count: 1, active: 0 });
            expect(totals.owner_transaction).toMatchObject({ count: 2, active: 0 });
            expect(JSON.stringify(events)).not.toContain(owner);
            expect(JSON.stringify(events)).not.toContain(record().uri);
        } finally {
            release.resolve();
            console.info = originalInfo;
        }
    });

    test('same-owner concurrent snapshot writes admit one transaction at a time without retries', async () => {
        await asOwner(() => database.createThread(owner));
        const { ClientSession } = await import('mongodb');
        const originalTransaction = ClientSession.prototype.withTransaction;
        let active = 0,
            maxActive = 0,
            calls = 0,
            attempts = 0;
        const transaction = spyOn(ClientSession.prototype, 'withTransaction').mockImplementation(
            async function <T>(
                this: InstanceType<typeof ClientSession>,
                callback: import('mongodb').WithTransactionCallback<T>,
                options?: import('mongodb').TransactionOptions
            ): Promise<T> {
                calls += 1;
                active += 1;
                maxActive = Math.max(maxActive, active);
                try {
                    return (await originalTransaction.call(
                        this,
                        async session => {
                            attempts += 1;
                            return callback(session);
                        },
                        options
                    )) as T;
                } finally {
                    active -= 1;
                }
            }
        );
        try {
            await asOwner(() =>
                withOwnerOperation(owner, async () => {
                    await Promise.all(
                        Array.from({ length: 24 }, async (_, i) => {
                            const uri = `urn:synthetic:snapshot:${i}`;
                            const entry = record({ ...original, id: uri });
                            entry.verification.credentialUri = uri;
                            await Promise.all([
                                database.storeCredentialVerification(owner, entry.verification),
                                database.storeRawCredential(owner, {
                                    uri,
                                    contentHash: entry.verification.contentHash,
                                    rawCredentialJson: entry.rawCredentialJson,
                                }),
                            ]);
                        })
                    );
                })
            );
            expect(maxActive).toBe(1);
            expect(calls).toBe(48);
            expect(attempts).toBe(calls);
            expect(
                await persisted
                    .collection('credential_verifications')
                    .countDocuments({ did: owner })
            ).toBe(24);
            expect(
                await persisted.collection('raw_credentials').countDocuments({ did: owner })
            ).toBe(24);
        } finally {
            transaction.mockRestore();
        }
    });

    test('an erasure rejects queued writes without weakening the active transaction rollback', async () => {
        const entered = Promise.withResolvers<void>();
        const release = Promise.withResolvers<void>();
        const first = asOwner(() =>
            (database as any).withOwnerWrite(owner, async () => {
                entered.resolve();
                await release.promise;
            })
        );
        const firstOutcome = first.then(
            () => 'committed',
            () => 'rejected'
        );
        await entered.promise;
        const entry = record();
        const queued = asOwner(() =>
            database.storeRawCredential(owner, {
                uri: entry.uri,
                contentHash: entry.verification.contentHash,
                rawCredentialJson: entry.rawCredentialJson,
            })
        );
        const queuedOutcome = queued.then(
            () => 'committed',
            () => 'rejected'
        );
        try {
            await requestDataErasure(owner);
            const fencing = database.fenceOwnerWrites(owner);
            release.resolve();
            expect(await firstOutcome).toBe('rejected');
            expect(await queuedOutcome).toBe('rejected');
            await fencing;
            expect(
                await persisted.collection('raw_credentials').countDocuments({ did: owner })
            ).toBe(0);
        } finally {
            release.resolve();
        }
    });

    test('consent preflight is rechecked after queue admission and a rejection does not poison later writes', async () => {
        const entered = Promise.withResolvers<void>();
        const release = Promise.withResolvers<void>();
        const first = asOwner(() =>
            (database as any).withOwnerWrite(owner, async () => {
                entered.resolve();
                await release.promise;
            })
        );
        await entered.promise;
        const entry = record();
        let preflightRan = false;
        const queued = asOwner(() =>
            database.storeRawCredential(
                owner,
                {
                    uri: entry.uri,
                    contentHash: entry.verification.contentHash,
                    rawCredentialJson: entry.rawCredentialJson,
                },
                async () => {
                    preflightRan = true;
                    if (revision !== 'current-revision')
                        throw new Error('synthetic consent changed');
                }
            )
        );
        const failure = queued.catch(error => error);
        expect(preflightRan).toBe(false);
        revision = 'changed';
        release.resolve();
        await first;
        expect((await failure).message).toBe('synthetic consent changed');
        expect(await persisted.collection('raw_credentials').countDocuments({ did: owner })).toBe(
            0
        );
        revision = 'current-revision';
        await asOwner(() =>
            database.storeRawCredential(owner, {
                uri: entry.uri,
                contentHash: entry.verification.contentHash,
                rawCredentialJson: entry.rawCredentialJson,
            })
        );
        expect(await persisted.collection('raw_credentials').countDocuments({ did: owner })).toBe(
            1
        );
    });

    test('different owners can write while another owner holds its transaction', async () => {
        const entered = Promise.withResolvers<void>();
        const release = Promise.withResolvers<void>();
        const first = asOwner(() =>
            (database as any).withOwnerWrite(owner, async () => {
                entered.resolve();
                await release.promise;
            })
        );
        await entered.promise;
        try {
            const other = 'did:example:independent-synthetic-owner';
            const thread = await privacy.runWithAiPrivacyContext(other, () =>
                database.createThread(other)
            );
            expect(typeof thread).toBe('string');
        } finally {
            release.resolve();
            await first;
        }
    });

    test('nested writes share one transaction and failure rolls everything back', async () => {
        const entry = record();
        const failure = new Error('synthetic rollback');
        await expect(
            asOwner(() =>
                (database as any).withOwnerWrite(owner, async () => {
                    await database.storeCredentialVerification(owner, entry.verification);
                    await database.storeRawCredential(owner, {
                        uri: entry.uri,
                        contentHash: entry.verification.contentHash,
                        rawCredentialJson: entry.rawCredentialJson,
                    });
                    throw failure;
                })
            )
        ).rejects.toBe(failure);
        expect(await persisted.collection('raw_credentials').countDocuments({ did: owner })).toBe(
            0
        );
        expect(
            await persisted.collection('credential_verifications').countDocuments({ did: owner })
        ).toBe(0);
        await asOwner(() => database.storeVC(owner, entry));
        expect(await persisted.collection('raw_credentials').countDocuments({ did: owner })).toBe(
            1
        );
    });

    test('cross-instance nested admission rejects instead of deadlocking or opening a second owner transaction', async () => {
        const otherDatabase = new ChatDB();
        try {
            await expect(
                asOwner(() =>
                    (database as any).withOwnerWrite(owner, async () => {
                        await otherDatabase.storeCredentialVerification(
                            owner,
                            record().verification
                        );
                    })
                )
            ).rejects.toThrow('Nested queue admission');
            expect(
                await persisted
                    .collection('credential_verifications')
                    .countDocuments({ did: owner })
            ).toBe(0);
        } finally {
            await otherDatabase.close();
        }
    });
});

test('chat messages are never embedded, even with dual-write and Nova writes on', async () => {
    const previous = process.env.EMBEDDINGS_DUAL_WRITE;
    const previousWrite = process.env.EMBEDDINGS_WRITE_GENERATION;
    process.env.EMBEDDINGS_DUAL_WRITE = 'true';
    process.env.EMBEDDINGS_WRITE_GENERATION = 'nova1024v1';
    embeddingCalls.mockClear();
    try {
        const thread = await database.createThread(owner);
        await asOwner(() =>
            database.addMessage(owner, thread, {
                role: 'user',
                content: 'synthetic learning facts',
            })
        );
        const [message] = await database.getMessages(owner, thread);
        expect(message).toBeDefined();
        expect(message).not.toHaveProperty('embeddingEpoch');
        expect(embeddingCalls).not.toHaveBeenCalled();
    } finally {
        if (previous === undefined) delete process.env.EMBEDDINGS_DUAL_WRITE;
        else process.env.EMBEDDINGS_DUAL_WRITE = previous;
        if (previousWrite === undefined) delete process.env.EMBEDDINGS_WRITE_GENERATION;
        else process.env.EMBEDDINGS_WRITE_GENERATION = previousWrite;
    }
});

describe('bounded legacy verification commit', () => {
    async function previewLegacy() {
        const source = {
            did: owner,
            uri: original.id,
            category: 'Achievement',
            source: 'wallet',
            embeddingEpoch: 'legacy',
            credential: original,
        };
        const inserted = await persisted.collection('credentials').insertOne(source);
        const current = await persisted
            .collection('credentials')
            .findOne({ _id: inserted.insertedId });
        const { repairSourceFingerprint } = await import('../admin/legacy-repair-source');
        const fingerprint = repairSourceFingerprint(current);
        const operation = { jobId: randomUUID(), lease: randomUUID() };
        await persisted.collection('embedding_legacy_repair_jobs').insertOne({
            _id: operation.jobId,
            lease: operation.lease,
            leaseUntil: new Date(Date.now() + 60000),
            state: 'paused',
            scanned: 0,
            repaired: 0,
            outcomes: {},
            candidate: String(inserted.insertedId),
            fingerprint,
            revision: receipt().revision,
        } as never);
        return { id: inserted.insertedId, fingerprint, operation };
    }
    test('repair and progress commit atomically and survive a crash before response', async () => {
        const p = await previewLegacy(),
            verified = record();
        const recheck = async () => {
            await privacy.assertCurrentAiConsent('credential-ingestion');
        };
        expect(
            await asOwner(() =>
                database.commitLegacyVerification(
                    owner,
                    p.id,
                    p.fingerprint,
                    verified.verification,
                    verified.projection!,
                    recheck,
                    p.operation
                )
            )
        ).toBe(true);
        const source = await persisted.collection('credentials').findOne({ _id: p.id });
        expect(source?.verification.status).toBe('valid');
        expect(source?.embeddingEpoch).not.toBe('legacy');
        expect(source?.credential).toEqual(original);
        expect(await persisted.collection('raw_credentials').countDocuments()).toBe(0);
        const job = await persisted
            .collection('embedding_legacy_repair_jobs')
            .findOne({ _id: p.operation.jobId } as never);
        expect(job?.outcomes).toEqual({ repaired: 1 });
        expect(job?.cursor).toBe(String(p.id));
        expect(job?.candidate).toBeUndefined();
        const restarted = new ChatDB();
        try {
            expect(
                await asOwner(() =>
                    restarted.commitLegacyVerification(
                        owner,
                        p.id,
                        p.fingerprint,
                        verified.verification,
                        verified.projection!,
                        recheck,
                        p.operation
                    )
                )
            ).toBe(false);
        } finally {
            await restarted.close();
        }
        expect(
            (
                await persisted
                    .collection('embedding_legacy_repair_jobs')
                    .findOne({ _id: p.operation.jobId } as never)
            )?.scanned
        ).toBe(1);
    });
    test('expired lease, changed source and consent cannot update repair or accounting', async () => {
        const p = await previewLegacy(),
            verified = record();
        await persisted
            .collection('embedding_legacy_repair_jobs')
            .updateOne({ _id: p.operation.jobId } as never, { $set: { leaseUntil: new Date(0) } });
        await expect(
            asOwner(() =>
                database.commitLegacyVerification(
                    owner,
                    p.id,
                    p.fingerprint,
                    verified.verification,
                    verified.projection!,
                    async () => {},
                    p.operation
                )
            )
        ).rejects.toThrow('expired');
        expect(
            (await persisted.collection('credentials').findOne({ _id: p.id }))?.verification
        ).toBeUndefined();
        await persisted
            .collection('embedding_legacy_repair_jobs')
            .updateOne({ _id: p.operation.jobId } as never, {
                $set: { leaseUntil: new Date(Date.now() + 60000) },
            });
        await expect(
            asOwner(() =>
                database.commitLegacyVerification(
                    owner,
                    p.id,
                    p.fingerprint,
                    verified.verification,
                    verified.projection!,
                    async () => {
                        throw new Error('Consent changed');
                    },
                    p.operation
                )
            )
        ).rejects.toThrow('Consent changed');
        await persisted
            .collection('credentials')
            .updateOne({ _id: p.id }, { $set: { embeddingEpoch: 'concurrent' } });
        expect(
            await asOwner(() =>
                database.commitLegacyVerification(
                    owner,
                    p.id,
                    p.fingerprint,
                    verified.verification,
                    verified.projection!,
                    async () => {},
                    p.operation
                )
            )
        ).toBe(false);
        expect(
            (
                await persisted
                    .collection('embedding_legacy_repair_jobs')
                    .findOne({ _id: p.operation.jobId } as never)
            )?.scanned
        ).toBe(0);
    });
    test('owner erasure prevents metadata repair', async () => {
        const p = await previewLegacy(),
            verified = record();
        await requestDataErasure(owner);
        await expect(
            asOwner(() =>
                database.commitLegacyVerification(
                    owner,
                    p.id,
                    p.fingerprint,
                    verified.verification,
                    verified.projection!,
                    async () => {},
                    p.operation
                )
            )
        ).rejects.toThrow();
        expect(
            (await persisted.collection('credentials').findOne({ _id: p.id }))?.verification
        ).toBeUndefined();
        expect(
            (
                await persisted
                    .collection('embedding_legacy_repair_jobs')
                    .findOne({ _id: p.operation.jobId } as never)
            )?.repaired
        ).toBe(0);
    });
});
