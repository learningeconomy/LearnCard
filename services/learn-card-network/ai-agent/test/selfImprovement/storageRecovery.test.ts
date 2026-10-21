import type { Db } from 'mongodb';
import { describe, expect, it, vi } from 'vitest';

import { createMongoLearnCardAssistantProfileRepository } from '../../src/assistantProfile';
import { createLearnCardDagJweEncryptionService } from '../../src/security/encryption';
import { createMongoRetroResultRepository } from '../../src/selfImprovement/retro';
import { createMongoRunTraceRepository } from '../../src/selfImprovement/runTrace';
import {
    createInMemoryUserDocRepository,
    createMongoUserDocRepository,
    createUserDocService,
} from '../../src/selfImprovement/userDocs';
import { createStorageTestEncryption } from '../helpers/storageEncryption';

const encryption = createLearnCardDagJweEncryptionService({
    keyId: 'unused-test-key',
    getWallet: async () => {
        throw new Error('Empty storage must not request a wallet.');
    },
});

const repositories = [
    {
        name: 'profiles',
        read: (db: Db) => {
            const repository = createMongoLearnCardAssistantProfileRepository(db, encryption);
            return () => repository.findByOwnerDid('did:key:fixture');
        },
        expected: undefined,
    },
    {
        name: 'traces',
        read: (db: Db) => {
            const repository = createMongoRunTraceRepository(db, encryption);
            return () => repository.findByRunId('fixture-run');
        },
        expected: undefined,
    },
    {
        name: 'retrospectives',
        read: (db: Db) => {
            const repository = createMongoRetroResultRepository(db, encryption);
            return () => repository.findByRunId('fixture-run');
        },
        expected: [],
    },
    {
        name: 'user documents',
        read: (db: Db) => {
            const repository = createMongoUserDocRepository(db, encryption);
            return () => repository.findAllByOwner('did:key:fixture');
        },
        expected: [],
    },
];

describe.each(repositories)('$name initialization recovery', ({ read, expected }) => {
    it.each(['index', 'migration'])('recovers from a transient %s error', async failure => {
        const createIndex = vi.fn().mockResolvedValue('test-index');
        const toArray = vi.fn().mockResolvedValue([]);
        if (failure === 'index')
            createIndex.mockRejectedValueOnce(new Error('Temporary index outage'));
        else toArray.mockRejectedValueOnce(new Error('Temporary migration outage'));
        const cursor = { toArray, sort: () => cursor };
        const collection = {
            createIndex,
            find: () => cursor,
            findOne: async () => undefined,
        };
        const db = { collection: () => collection } as unknown as Db;
        const readStored = read(db);
        await expect(readStored()).rejects.toThrow('Temporary');
        await expect(readStored()).resolves.toEqual(expected);
    });
});

it('drains failed plaintext migrations before retrying a user update', async () => {
    const fixtures = createUserDocService(createInMemoryUserDocRepository());
    const documents: Array<Record<string, unknown>> = [];
    for (const name of ['failing-memory', 'delayed-memory']) {
        documents.push({
            ...(await fixtures.createDoc({
                ownerDid: 'did:key:fixture',
                name,
                kind: 'memory',
                description: 'Plaintext fixture',
                content: 'Original preference',
                sourceType: 'user-stated',
            })),
        });
    }
    const outage = new Error('Synthetic migration write failure');
    const failedWrite = Promise.withResolvers<void>();
    const delayedWrite = Promise.withResolvers<void>();
    const releaseWrite = Promise.withResolvers<void>();
    let failNextWrite = true;
    let delayNextWrite = true;
    const collection = {
        createIndex: async () => 'index',
        find: (filter: Record<string, unknown>) => {
            const snapshot = structuredClone(
                documents.filter(doc =>
                    Object.entries(filter).every(([key, value]) => doc[key] === value)
                )
            );
            const cursor = { toArray: async () => snapshot, sort: () => cursor };
            return cursor;
        },
        findOne: async ({ name }: { name: string }) =>
            structuredClone(documents.find(doc => doc.name === name)),
        replaceOne: async ({ name }: { name: string }, doc: Record<string, unknown>) => {
            if (name === 'failing-memory' && failNextWrite) {
                failNextWrite = false;
                failedWrite.resolve();
                throw outage;
            }
            if (name === 'delayed-memory' && delayNextWrite) {
                delayNextWrite = false;
                delayedWrite.resolve();
                await releaseWrite.promise;
            }
            documents[documents.findIndex(existing => existing.name === name)] = doc;
        },
    };
    const userDocs = createUserDocService(
        createMongoUserDocRepository(
            { collection: () => collection } as unknown as Db,
            createStorageTestEncryption()
        )
    );
    let observedError: unknown;
    const retryUpdate = userDocs.getDocsForDebug('did:key:fixture').catch(error => {
        observedError = error;
        return userDocs.updateDoc({
            ownerDid: 'did:key:fixture',
            name: 'delayed-memory',
            content: 'New user preference',
        });
    });
    await Promise.all([failedWrite.promise, delayedWrite.promise]);
    // Let fail-fast rejection/retry continuations run while the old write is still held.
    await new Promise<void>(resolve => setImmediate(resolve));
    const rejectedBeforeDrain = observedError !== undefined;
    releaseWrite.resolve();
    await retryUpdate;
    expect(rejectedBeforeDrain).toBe(false);
    expect(observedError).toBe(outage);
    await expect(userDocs.getActiveDoc('did:key:fixture', 'delayed-memory')).resolves.toMatchObject(
        {
            content: 'New user preference',
            version: 2,
            history: [{ version: 1, content: 'Original preference' }],
        }
    );
});
