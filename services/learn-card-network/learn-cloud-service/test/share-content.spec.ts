import { computeShareLinkPayloadHash } from '../../brain-service/src/helpers/share-link-lifecycle/request-hash.helpers';
import { randomUUID } from 'node:crypto';

import { MongoClient, type Collection, type Db } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MAX_SHARE_CIPHERTEXT_BYTES, encodeBase64Url, type ShareEnvelope } from '@learncard/types';

import type {
    MongoShareContentDocument,
    ShareContentObjectBinding,
    ShareContentPutInput,
} from '@models';
import {
    SHARE_CONTENT_IDENTITY_INDEX,
    ShareContentRepositoryNotInitializedError,
    createShareContentRepository,
} from '@accesslayer/share-content';

/**
 * Real-Mongo integration tests for the LC-2187 immutable share-content
 * repository. Each test uses its own ephemeral MongoMemoryServer collection, so
 * there are no global/shared database mutations and the concurrency assertions
 * run against actual Mongo atomic primitives rather than an in-memory fixture.
 */

const SHARE_ID = encodeBase64Url(new Uint8Array(16).fill(9));
const OTHER_SHARE_ID = encodeBase64Url(new Uint8Array(16).fill(8));
const IV = encodeBase64Url(new Uint8Array(12).fill(7));

const makeEnvelope = (fill = 1, bytes = 64): ShareEnvelope => ({
    v: 1,
    alg: 'A256GCM',
    iv: IV,
    ct: encodeBase64Url(new Uint8Array(bytes).fill(fill)),
});

const makeRecovery = (fill = 1): ShareContentPutInput['ownerEncryptedRecovery'] => ({
    protected: `protected-${fill}`,
    iv: `iv-${fill}`,
    ciphertext: `ciphertext-${fill}`,
    tag: `tag-${fill}`,
});

const makeBinding = (
    overrides: Partial<ShareContentObjectBinding> = {}
): ShareContentObjectBinding => ({
    namespace: 'tenant-a',
    ownerProfileId: 'owner-a',
    shareId: SHARE_ID,
    contentVersion: 1,
    objectId: 'object-1',
    operationId: 'operation-1',
    ...overrides,
});

const makePutInput = (overrides: Partial<ShareContentPutInput> = {}): ShareContentPutInput => ({
    ...makeBinding(),
    envelope: makeEnvelope(1),
    ownerEncryptedRecovery: makeRecovery(1),
    ...overrides,
});

const pickBinding = (
    input: ShareContentPutInput | ShareContentObjectBinding
): ShareContentObjectBinding => ({
    namespace: input.namespace,
    ownerProfileId: input.ownerProfileId,
    shareId: input.shareId,
    contentVersion: input.contentVersion,
    objectId: input.objectId,
    operationId: input.operationId,
});

let server: MongoMemoryServer;
let client: MongoClient;
let db: Db;

beforeAll(async () => {
    server = await MongoMemoryServer.create();
    client = new MongoClient(server.getUri());
    await client.connect();
    db = client.db('share_content_spec');
});

afterAll(async () => {
    await client?.close();
    await server?.stop();
});

const createHarness = async (): Promise<{
    collection: Collection<MongoShareContentDocument>;
    repository: ReturnType<typeof createShareContentRepository>;
}> => {
    const collection = db.collection<MongoShareContentDocument>(
        `share_content_${randomUUID().replace(/-/g, '')}`
    );
    const repository = createShareContentRepository(collection);
    await repository.initialize();

    return { collection, repository };
};

/**
 * `listIndexes` on a collection that has never been written throws
 * `NamespaceNotFound` on MongoDB 7; treat that as "no indexes yet".
 */
const listIndexes = async (collection: Collection<MongoShareContentDocument>) => {
    try {
        return await collection.indexes();
    } catch (error) {
        if (
            typeof error === 'object' &&
            error !== null &&
            (error as { code?: unknown }).code === 26
        ) {
            return [];
        }

        throw error;
    }
};

const requireActiveContent = async (
    repository: ReturnType<typeof createShareContentRepository>,
    binding: ShareContentObjectBinding
) => {
    const result = await repository.getContent(binding);

    if (!result.ok) throw new Error(`expected active content, got ${result.error}`);

    return result.value;
};

describe('share-content repository initialization', () => {
    it('refuses every operation until initialize() installs the unique identity index', async () => {
        const collection = db.collection<MongoShareContentDocument>(
            `share_content_${randomUUID().replace(/-/g, '')}`
        );
        const repository = createShareContentRepository(collection);

        await expect(repository.put(makePutInput())).rejects.toBeInstanceOf(
            ShareContentRepositoryNotInitializedError
        );
        await expect(repository.getContent(makeBinding())).rejects.toBeInstanceOf(
            ShareContentRepositoryNotInitializedError
        );
        await expect(repository.getRecovery(makeBinding())).rejects.toBeInstanceOf(
            ShareContentRepositoryNotInitializedError
        );
        await expect(repository.stat(makeBinding())).rejects.toBeInstanceOf(
            ShareContentRepositoryNotInitializedError
        );
        await expect(repository.delete(makeBinding())).rejects.toBeInstanceOf(
            ShareContentRepositoryNotInitializedError
        );

        expect(
            (await listIndexes(collection)).find(
                index => index.name === SHARE_CONTENT_IDENTITY_INDEX
            )
        ).toBeUndefined();

        await repository.initialize();
        await repository.initialize();

        const identityIndex = (await listIndexes(collection)).find(
            index => index.name === SHARE_CONTENT_IDENTITY_INDEX
        );

        expect(identityIndex?.unique).toBe(true);
        expect(identityIndex?.key).toEqual({ namespace: 1, objectId: 1 });
    });

    it('enforces the identity uniqueness with a direct duplicate insert', async () => {
        const { collection } = await createHarness();
        const binding = makeBinding();

        await collection.insertOne({
            kind: 'active',
            ...binding,
            contentHash: 'a'.repeat(64),
            envelope: makeEnvelope(),
            ownerEncryptedRecovery: makeRecovery(),
            ciphertextBytes: 64,
            recoveryBytes: 32,
            createdAt: new Date(),
        });

        await expect(
            collection.insertOne({
                kind: 'active',
                ...binding,
                contentHash: 'b'.repeat(64),
                envelope: makeEnvelope(2),
                ownerEncryptedRecovery: makeRecovery(2),
                ciphertextBytes: 64,
                recoveryBytes: 32,
                createdAt: new Date(),
            })
        ).rejects.toMatchObject({ code: 11000 });
    });
});

describe('share-content put (create-only, idempotent)', () => {
    it('creates once and treats an exact retry as an idempotent success', async () => {
        const { collection, repository } = await createHarness();
        const input = makePutInput();

        const first = await repository.put(input);
        const second = await repository.put(input);

        expect(first.ok && first.value.status).toBe('created');
        expect(second.ok && second.value.status).toBe('idempotent');
        expect(await collection.countDocuments({})).toBe(1);

        if (!first.ok || !second.ok) throw new Error('expected successful puts');

        expect(second.value.record.contentHash).toBe(first.value.record.contentHash);
    });

    it('rejects a divergent overwrite and preserves the original bytes', async () => {
        const { collection, repository } = await createHarness();
        const input = makePutInput();
        await repository.put(input);

        const conflicting = await repository.put(
            makePutInput({ envelope: makeEnvelope(2), ownerEncryptedRecovery: makeRecovery(2) })
        );

        expect(conflicting).toEqual({ ok: false, error: 'CONFLICT' });
        expect(await collection.countDocuments({})).toBe(1);

        const content = await requireActiveContent(repository, pickBinding(input));
        expect(content.envelope).toEqual(input.envelope);
    });

    it('rejects a retry whose binding tuple differs even when the bytes match', async () => {
        const { repository } = await createHarness();
        const input = makePutInput();
        await repository.put(input);

        expect(await repository.put(makePutInput({ operationId: 'operation-2' }))).toEqual({
            ok: false,
            error: 'CONFLICT',
        });
        expect(await repository.put(makePutInput({ contentVersion: 2 }))).toEqual({
            ok: false,
            error: 'CONFLICT',
        });
    });

    it('isolates object ids that share a namespace, share id and version', async () => {
        const { collection, repository } = await createHarness();
        const first = makePutInput({ objectId: 'object-a' });
        const second = makePutInput({ objectId: 'object-b', envelope: makeEnvelope(2) });

        expect((await repository.put(first)).ok).toBe(true);
        expect((await repository.put(second)).ok).toBe(true);
        expect(await collection.countDocuments({ shareId: SHARE_ID, contentVersion: 1 })).toBe(2);

        expect((await requireActiveContent(repository, pickBinding(first))).envelope).toEqual(
            first.envelope
        );
        expect((await requireActiveContent(repository, pickBinding(second))).envelope).toEqual(
            second.envelope
        );
    });

    it('derives the content hash and rejects a caller-supplied forged hash', async () => {
        const { repository } = await createHarness();
        const input = makePutInput();

        const first = await repository.put(input);
        if (!first.ok) throw new Error('expected created');

        const retry = await repository.put(input);
        if (!retry.ok || retry.value.status !== 'idempotent')
            throw new Error('expected idempotent');

        expect(first.value.record.contentHash).toMatch(/^[0-9a-f]{64}$/);
        expect(retry.value.record.contentHash).toBe(first.value.record.contentHash);

        const forged = await repository.put({
            ...input,
            contentHash: 'a'.repeat(64),
        } as unknown as ShareContentPutInput);

        expect(forged).toEqual({ ok: false, error: 'INVALID_INPUT' });
    });

    it('rejects arbitrary metadata, URLs and non-opaque identifiers', async () => {
        const { collection, repository } = await createHarness();

        expect(
            await repository.put(makePutInput({ namespace: 'https://evil.example/path' }))
        ).toEqual({ ok: false, error: 'INVALID_INPUT' });
        expect(await repository.put(makePutInput({ objectId: 'urn:example:object:1' }))).toEqual({
            ok: false,
            error: 'INVALID_INPUT',
        });
        expect(await collection.countDocuments({})).toBe(0);
    });

    it('rejects ciphertext larger than 512 KiB before storing anything', async () => {
        const { collection, repository } = await createHarness();

        const result = await repository.put(
            makePutInput({ envelope: makeEnvelope(5, MAX_SHARE_CIPHERTEXT_BYTES + 1) })
        );

        expect(result).toEqual({ ok: false, error: 'INVALID_INPUT' });
        expect(await collection.countDocuments({})).toBe(0);
    });

    it('rejects a serialized recovery JWE larger than 64 KiB before storing anything', async () => {
        const { collection, repository } = await createHarness();

        const result = await repository.put(
            makePutInput({
                ownerEncryptedRecovery: {
                    ...makeRecovery(1),
                    ciphertext: 'a'.repeat(70_000),
                },
            })
        );

        expect(result).toEqual({ ok: false, error: 'INVALID_INPUT' });
        expect(await collection.countDocuments({})).toBe(0);
    });
});

describe('share-content projections and binding enforcement', () => {
    it('returns content without recovery and recovery without content', async () => {
        const { repository } = await createHarness();
        const input = makePutInput();
        await repository.put(input);
        const binding = pickBinding(input);

        const content = await repository.getContent(binding);
        if (!content.ok) throw new Error('expected content');

        expect(content.value.envelope).toEqual(input.envelope);
        expect('ownerEncryptedRecovery' in content.value).toBe(false);

        const recovery = await repository.getRecovery(binding);
        if (!recovery.ok) throw new Error('expected recovery');

        expect(recovery.value.ownerEncryptedRecovery).toEqual(input.ownerEncryptedRecovery);
        expect('envelope' in recovery.value).toBe(false);
    });

    const wrongBindingCases: Array<[string, Partial<ShareContentObjectBinding>]> = [
        ['namespace', { namespace: 'tenant-b' }],
        ['owner', { ownerProfileId: 'owner-b' }],
        ['share', { shareId: OTHER_SHARE_ID }],
        ['version', { contentVersion: 2 }],
        ['object', { objectId: 'object-2' }],
        ['operation', { operationId: 'operation-2' }],
    ];

    it.each(wrongBindingCases)(
        'fails closed on a wrong %s binding for content, recovery and stat',
        async (_label, mutation) => {
            const { repository } = await createHarness();
            const input = makePutInput();
            await repository.put(input);
            const wrong = makeBinding(mutation);

            expect(await repository.getContent(wrong)).toEqual({ ok: false, error: 'NOT_FOUND' });
            expect(await repository.getRecovery(wrong)).toEqual({ ok: false, error: 'NOT_FOUND' });
            expect(await repository.stat(wrong)).toEqual({ ok: false, error: 'NOT_FOUND' });

            // The original exact object is untouched and still readable.
            expect((await requireActiveContent(repository, pickBinding(input))).envelope).toEqual(
                input.envelope
            );
        }
    );

    it('reports active existence, hash and sizes through stat', async () => {
        const { repository } = await createHarness();
        const input = makePutInput();
        await repository.put(input);

        const stat = await repository.stat(pickBinding(input));
        if (!stat.ok || stat.value.kind !== 'active') throw new Error('expected active stat');

        expect(stat.value.contentHash).toMatch(/^[0-9a-f]{64}$/);
        expect(stat.value.ciphertextBytes).toBe(64);
        expect(stat.value.recoveryBytes).toBeGreaterThan(0);
    });

    it('returns NOT_FOUND for an object that was never written', async () => {
        const { repository } = await createHarness();

        expect(await repository.getContent(makeBinding())).toEqual({
            ok: false,
            error: 'NOT_FOUND',
        });
        expect(await repository.stat(makeBinding())).toEqual({ ok: false, error: 'NOT_FOUND' });
    });
});

describe('share-content delete and tombstones', () => {
    it('tombstones a missing identity so a late put can never resurrect it', async () => {
        const { collection, repository } = await createHarness();
        const input = makePutInput();
        const binding = pickBinding(input);

        const deleted = await repository.delete(binding);
        expect(deleted.ok).toBe(true);

        const raw = await collection.findOne({
            namespace: binding.namespace,
            objectId: binding.objectId,
        });
        if (raw === null) throw new Error('expected a tombstone document');

        expect(raw.kind).toBe('tombstone');
        expect(Object.prototype.hasOwnProperty.call(raw, 'envelope')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(raw, 'ownerEncryptedRecovery')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(raw, 'contentHash')).toBe(false);

        expect(await repository.put(input)).toEqual({ ok: false, error: 'TOMBSTONED' });
        expect(await collection.countDocuments({})).toBe(1);
    });

    it('atomically tombstones an active object and drops its payload', async () => {
        const { collection, repository } = await createHarness();
        const input = makePutInput();
        const binding = pickBinding(input);
        await repository.put(input);

        const deleted = await repository.delete(binding);
        expect(deleted.ok).toBe(true);

        const raw = await collection.findOne({
            namespace: binding.namespace,
            objectId: binding.objectId,
        });
        if (raw === null) throw new Error('expected a tombstone document');

        expect(raw.kind).toBe('tombstone');
        expect(Object.prototype.hasOwnProperty.call(raw, 'envelope')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(raw, 'ownerEncryptedRecovery')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(raw, 'ciphertextBytes')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(raw, 'recoveryBytes')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(raw, 'createdAt')).toBe(false);
        expect(Object.prototype.hasOwnProperty.call(raw, 'contentHash')).toBe(true);

        expect(await repository.getContent(binding)).toEqual({ ok: false, error: 'NOT_FOUND' });
        expect(await repository.getRecovery(binding)).toEqual({ ok: false, error: 'NOT_FOUND' });

        const stat = await repository.stat(binding);
        if (!stat.ok || stat.value.kind !== 'tombstone') throw new Error('expected tombstone stat');

        expect(stat.value.contentHash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('is idempotent for repeated deletes of the same tuple', async () => {
        const { repository } = await createHarness();
        const input = makePutInput();
        await repository.put(input);

        expect((await repository.delete(pickBinding(input))).ok).toBe(true);
        expect((await repository.delete(pickBinding(input))).ok).toBe(true);
    });

    it('never resurrects a tombstoned identity, even for a stale replay or new operation id', async () => {
        const { repository } = await createHarness();
        const input = makePutInput();

        await repository.put(input);
        await repository.delete(pickBinding(input));

        expect(await repository.put(input)).toEqual({ ok: false, error: 'TOMBSTONED' });
        expect(await repository.put(makePutInput({ operationId: 'operation-2' }))).toEqual({
            ok: false,
            error: 'TOMBSTONED',
        });
        expect(
            await repository.put(makePutInput({ objectId: 'object-1', contentVersion: 9 }))
        ).toEqual({ ok: false, error: 'TOMBSTONED' });
    });

    const mismatchedDeleteCases: Array<[string, Partial<ShareContentObjectBinding>]> = [
        ['owner', { ownerProfileId: 'owner-b' }],
        ['share', { shareId: OTHER_SHARE_ID }],
        ['version', { contentVersion: 2 }],
        ['operation', { operationId: 'operation-2' }],
    ];

    it.each(mismatchedDeleteCases)(
        'refuses to delete another %s binding and leaves the object intact',
        async (_label, mutation) => {
            const { collection, repository } = await createHarness();
            const input = makePutInput();
            await repository.put(input);

            const result = await repository.delete(makeBinding(mutation));
            expect(result).toEqual({ ok: false, error: 'BINDING_MISMATCH' });

            const raw = await collection.findOne({
                namespace: input.namespace,
                objectId: input.objectId,
            });
            expect(raw?.kind).toBe('active');

            expect((await requireActiveContent(repository, pickBinding(input))).envelope).toEqual(
                input.envelope
            );
        }
    );

    it('scopes a delete/tombstone to its own namespace and identity', async () => {
        const { repository } = await createHarness();
        const input = makePutInput();
        await repository.put(input);

        // Different identity: allowed to tombstone that identity, never the original.
        expect((await repository.delete(makeBinding({ objectId: 'object-2' }))).ok).toBe(true);
        expect((await repository.delete(makeBinding({ namespace: 'tenant-b' }))).ok).toBe(true);

        expect((await requireActiveContent(repository, pickBinding(input))).envelope).toEqual(
            input.envelope
        );
    });
});

describe('share-content concurrency (real Mongo atomic primitives)', () => {
    it('allows exactly one create across concurrent duplicate puts', async () => {
        const { collection, repository } = await createHarness();
        const input = makePutInput({ objectId: 'object-concurrent-duplicate' });

        const results = await Promise.all(Array.from({ length: 8 }, () => repository.put(input)));

        expect(
            results.filter(result => result.ok && result.value.status === 'created')
        ).toHaveLength(1);
        expect(
            results.filter(result => result.ok && result.value.status === 'idempotent')
        ).toHaveLength(7);
        expect(
            await collection.countDocuments({
                namespace: input.namespace,
                objectId: input.objectId,
            })
        ).toBe(1);
    });

    it('allows exactly one winner across concurrent divergent puts', async () => {
        const { collection, repository } = await createHarness();
        const base = makePutInput({ objectId: 'object-concurrent-divergent' });

        const results = await Promise.all(
            Array.from({ length: 6 }, (_value, index) =>
                repository.put(
                    makePutInput({
                        objectId: base.objectId,
                        envelope: makeEnvelope(index + 1),
                    })
                )
            )
        );

        expect(
            results.filter(result => result.ok && result.value.status === 'created')
        ).toHaveLength(1);
        expect(results.filter(result => !result.ok && result.error === 'CONFLICT')).toHaveLength(5);
        expect(
            await collection.countDocuments({
                namespace: base.namespace,
                objectId: base.objectId,
            })
        ).toBe(1);
    });

    it('never leaves ciphertext readable after a delete that races a first put', async () => {
        for (let round = 0; round < 12; round += 1) {
            const { collection, repository } = await createHarness();
            const input = makePutInput({ objectId: `object-race-${round}` });
            const binding = pickBinding(input);

            const [putResult, deleteResult] = await Promise.all([
                repository.put(input),
                repository.delete(binding),
            ]);

            expect(deleteResult.ok).toBe(true);

            expect(await repository.getContent(binding)).toEqual({
                ok: false,
                error: 'NOT_FOUND',
            });
            expect(
                await collection.countDocuments({
                    namespace: binding.namespace,
                    objectId: binding.objectId,
                    kind: 'active',
                })
            ).toBe(0);

            if (putResult.ok) {
                expect(['created', 'idempotent']).toContain(putResult.value.status);
            } else {
                expect(putResult.error).toBe('TOMBSTONED');
            }
        }
    });

    it('never leaves ciphertext readable after a delete that races a replay put', async () => {
        for (let round = 0; round < 12; round += 1) {
            const { collection, repository } = await createHarness();
            const input = makePutInput({ objectId: `object-replay-race-${round}` });
            const binding = pickBinding(input);

            await repository.put(input);

            const [putResult, deleteResult] = await Promise.all([
                repository.put(input),
                repository.delete(binding),
            ]);

            expect(deleteResult.ok).toBe(true);
            expect(await repository.getContent(binding)).toEqual({
                ok: false,
                error: 'NOT_FOUND',
            });

            if (putResult.ok) {
                expect(putResult.value.status).toBe('idempotent');
            } else {
                expect(putResult.error).toBe('TOMBSTONED');
            }

            expect(
                await collection.countDocuments({
                    namespace: binding.namespace,
                    objectId: binding.objectId,
                    kind: 'active',
                })
            ).toBe(0);
        }
    });

    it('serializes concurrent deletes without conflicted tombstones', async () => {
        const { collection, repository } = await createHarness();
        const input = makePutInput({ objectId: 'object-concurrent-delete' });
        const binding = pickBinding(input);
        await repository.put(input);

        const results = await Promise.all(
            Array.from({ length: 6 }, () => repository.delete(binding))
        );

        expect(results.every(result => result.ok)).toBe(true);
        expect(
            await collection.countDocuments({
                namespace: binding.namespace,
                objectId: binding.objectId,
                kind: 'tombstone',
            })
        ).toBe(1);
    });
});

describe('reservation payload digest', () => {
    it('keeps payload hash stable before identity allocation while binding the full record hash', async () => {
        const { repository } = await createHarness();
        const payload = { envelope: makeEnvelope(), ownerEncryptedRecovery: makeRecovery() };
        const first = await repository.put({ ...makeBinding(), ...payload });
        const second = await repository.put({
            ...makeBinding({ objectId: 'another-object', operationId: 'another-operation' }),
            ...payload,
        });
        if (!first.ok || !second.ok) throw new Error('expected writes');
        expect(first.value.record.payloadHash).toBe(second.value.record.payloadHash);
        expect(first.value.record.payloadHash).toBe(computeShareLinkPayloadHash(payload));
        expect(first.value.record.contentHash).not.toBe(second.value.record.contentHash);
    });
});
