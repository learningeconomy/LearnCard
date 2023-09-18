import { JWE, PaginatedEncryptedCredentialRecordsType } from '@learncard/types';
import { isEncrypted } from '@learncard/helpers';

import { getClient, getUser } from './helpers/getClient';
import { CredentialRecords } from '@accesslayer/credential-record';
import { Users } from '@accesslayer/user';
import { testRecordA, testRecordB, testRecordC } from './helpers/records';
import { client } from '@mongo';
import cache from '@cache';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

beforeAll(async () => {
    try {
        await client.connect();
    } catch (error) {
        console.error(error);
    }
});

afterAll(async () => {
    try {
        await client.close();
    } catch (error) {
        console.error(error);
    }
});

describe('Index', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('get', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        it('should require full auth to get index', async () => {
            await expect(noAuthClient.index.get()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.index.get()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow getting all records', async () => {
            const recordsPromise = userA.clients.fullAuth.index.get();
            await expect(recordsPromise).resolves.not.toThrow();

            const unencryptedRecords = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE((await recordsPromise) as JWE);

            expect(unencryptedRecords.records).toHaveLength(2);
        });

        it('should allow getting an empty list of records', async () => {
            await userA.clients.fullAuth.index.removeAll();

            const recordsPromise = userA.clients.fullAuth.index.get();
            await expect(recordsPromise).resolves.not.toThrow();

            const unencryptedRecords = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE((await recordsPromise) as JWE);

            expect(unencryptedRecords.records).toHaveLength(0);
        });

        it('should allow querying encrypted fields', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { fields: { $in: ['recordA'] } },
            });
            const records = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE(encryptedRecords as JWE);

            expect(records.records).toHaveLength(1);
            expect(records.records[0]).toEqual(testRecordA);
        });

        it('should allow multiple results when querying encrypted fields', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { fields: { $in: ['record'] } },
            });
            const records = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE(encryptedRecords as JWE);

            expect(records.records).toHaveLength(2);
        });

        it('should allow querying unencrypted fields', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { title: 'Record A' },
            });
            const records = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE(encryptedRecords as JWE);

            expect(records.records).toHaveLength(1);
            expect(records.records[0]).toEqual(testRecordA);
        });

        it('should have working pagination', async () => {
            const { id, ...testRecord } = testRecordA;
            const records = [testRecord, testRecord, testRecord, testRecord];

            await Users.deleteMany({});
            await cache.node.flushall();
            await userA.clients.fullAuth.index.removeAll();
            await userA.clients.fullAuth.index.addMany({ records });

            const ids = (
                (await userA.clients.fullAuth.index.get({
                    encrypt: false,
                })) as PaginatedEncryptedCredentialRecordsType
            ).records.map(record => record.id);

            const initialResults = (await userA.clients.fullAuth.index.get({
                limit: 2,
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(initialResults.records).toHaveLength(2);
            expect(initialResults.hasMore).toBeTruthy();
            expect(initialResults.cursor).toEqual(ids[1]);

            const nextResults = (await userA.clients.fullAuth.index.get({
                limit: 2,
                cursor: ids[1],
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(nextResults.records).toHaveLength(2);
            expect(nextResults.hasMore).toBeFalsy();
            expect(nextResults.cursor).toEqual(ids[3]);

            const middleResults = (await userA.clients.fullAuth.index.get({
                limit: 2,
                cursor: ids[0],
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(middleResults.records).toHaveLength(2);
            expect(middleResults.hasMore).toBeTruthy();
            expect(middleResults.cursor).toEqual(ids[2]);

            const truncatedResults = (await userA.clients.fullAuth.index.get({
                limit: 2,
                cursor: ids[2],
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(truncatedResults.records).toHaveLength(1);
            expect(truncatedResults.hasMore).toBeFalsy();
            expect(truncatedResults.cursor).toEqual(ids[3]);
        });
    });

    describe('count', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        it('should require full auth to count index', async () => {
            await expect(noAuthClient.index.count()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.index.count()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow counting all records', async () => {
            const countPromise = userA.clients.fullAuth.index.count();
            await expect(countPromise).resolves.not.toThrow();

            const unencryptedCount = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE((await countPromise) as JWE);

            expect(unencryptedCount).toEqual(2);
        });

        it('should allow counting an empty list of records', async () => {
            await userA.clients.fullAuth.index.removeAll();

            const countPromise = userA.clients.fullAuth.index.count();
            await expect(countPromise).resolves.not.toThrow();

            const unencryptedCount = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE((await countPromise) as JWE);

            expect(unencryptedCount).toEqual(0);
        });

        it('should allow querying encrypted fields', async () => {
            const encryptedCount = await userA.clients.fullAuth.index.count({
                query: { fields: { $in: ['recordA'] } },
            });
            const count = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE(encryptedCount as JWE);

            expect(count).toEqual(1);
        });

        it('should allow multiple results when querying encrypted fields', async () => {
            const encryptedCount = await userA.clients.fullAuth.index.count({
                query: { fields: { $in: ['record'] } },
            });
            const count = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE(encryptedCount as JWE);

            expect(count).toEqual(2);
        });

        it('should allow querying unencrypted fields', async () => {
            const encryptedCount = await userA.clients.fullAuth.index.count({
                query: { title: 'Record A' },
            });
            const count = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE(encryptedCount as JWE);

            expect(count).toEqual(1);
        });
    });

    describe('add', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        it('should require full auth to add to index', async () => {
            await expect(noAuthClient.index.add({ record: testRecordA })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.index.add({ record: testRecordA })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow adding records', async () => {
            const records = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(records.records).toHaveLength(0);

            const promise = userA.clients.fullAuth.index.add({ record: testRecordA });
            await expect(promise).resolves.not.toThrow();

            const newRecords = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(newRecords.records).toHaveLength(1);
            expect(newRecords.records[0]).toEqual(testRecordA);
        });

        it("should not add to someone else's records", async () => {
            await userA.clients.fullAuth.index.add({ record: testRecordA });

            const userARecords = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;
            const userBRecords = (await userB.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(userARecords.records).toHaveLength(1);
            expect(userBRecords.records).toHaveLength(0);
        });

        it('should allow adding a record with a custom ID', async () => {
            const records = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(records.records).toHaveLength(0);

            const promise = userA.clients.fullAuth.index.add({ record: testRecordA });
            await expect(promise).resolves.not.toThrow();

            const newRecords = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(newRecords.records).toHaveLength(1);
            expect(newRecords.records[0]!.id).toEqual(testRecordA.id);
        });

        it("Generate an ID for a record that doesn't have one", async () => {
            const records = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(records.records).toHaveLength(0);

            const promise = userA.clients.fullAuth.index.add({ record: testRecordC as any });
            await expect(promise).resolves.not.toThrow();

            const newRecords = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(newRecords.records).toHaveLength(1);
            expect(newRecords.records[0]!.id).toBeDefined();
        });

        it('should not allow adding a record with a duplicate ID', async () => {
            await userA.clients.fullAuth.index.add({ record: testRecordA });

            const records = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(records.records).toHaveLength(1);

            await expect(
                userA.clients.fullAuth.index.add({ record: testRecordA })
            ).rejects.toMatchObject({ code: 'CONFLICT' });

            const newRecords = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(newRecords.records).toHaveLength(1);
        });
    });

    describe('addMany', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        it('should require full auth to add many to index', async () => {
            await expect(
                noAuthClient.index.addMany({ records: [testRecordA] })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.index.addMany({ records: [testRecordA] })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow adding one record', async () => {
            const records = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(records.records).toHaveLength(0);

            const promise = userA.clients.fullAuth.index.addMany({ records: [testRecordA] });
            await expect(promise).resolves.not.toThrow();

            const newRecords = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(newRecords.records).toHaveLength(1);
            expect(newRecords.records[0]).toEqual(testRecordA);
        });

        it('should allow adding many records', async () => {
            const records = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(records.records).toHaveLength(0);

            const promise = userA.clients.fullAuth.index.addMany({
                records: [testRecordA, testRecordB],
            });
            await expect(promise).resolves.not.toThrow();

            const newRecords = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(newRecords.records).toHaveLength(2);
        });

        it('should not allow adding a record with a duplicate ID', async () => {
            await userA.clients.fullAuth.index.add({ record: testRecordA });

            const records = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(records.records).toHaveLength(1);

            await expect(
                userA.clients.fullAuth.index.addMany({ records: [testRecordA] })
            ).rejects.toMatchObject({ code: 'CONFLICT' });

            const newRecords = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(newRecords.records).toHaveLength(1);
        });

        it('should not allow adding multiple records with duplicate IDs', async () => {
            await userA.clients.fullAuth.index.add({ record: testRecordA });

            const records = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(records.records).toHaveLength(1);

            await expect(
                userA.clients.fullAuth.index.addMany({ records: [testRecordB, testRecordB] })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });

            const newRecords = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(newRecords.records).toHaveLength(1);
        });
    });

    describe('update', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        it('should require full auth to update a record', async () => {
            await expect(
                noAuthClient.index.update({ id: 'testRecordA', updates: { title: 'Different' } })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.index.update({
                    id: 'testRecordA',
                    updates: { title: 'Different' },
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow updating a record', async () => {
            const records = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            const recordA = records.records[0]!;
            const recordB = records.records[1]!;

            expect(recordA.id).toEqual('testRecordA');
            expect(recordB.id).toEqual('testRecordB');

            await expect(
                userA.clients.fullAuth.index.update({
                    id: 'testRecordA',
                    updates: { id: 'testRecordB' },
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });

            const newRecords = await userA.clients.fullAuth.index.get({ encrypt: false });

            if (isEncrypted(newRecords)) {
                throw new Error('Check encrypt: false option in index.get');
            }

            const recordAPostUpdate = newRecords.records[0]!;
            const recordBPostUpdate = newRecords.records[1]!;

            expect(recordAPostUpdate.id).toEqual('testRecordA');
            expect(recordBPostUpdate.id).toEqual('testRecordB');
        });

        it('should not allow changing to a duplicate ID', async () => {
            const records = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            const recordPreUpdate = records.records[0]!;

            expect(recordPreUpdate.title).toEqual('Record A');

            const promise = userA.clients.fullAuth.index.update({
                id: 'testRecordA',
                updates: { title: 'Different' },
            });
            await expect(promise).resolves.not.toThrow();

            const newRecords = await userA.clients.fullAuth.index.get({ encrypt: false });

            if (isEncrypted(newRecords)) {
                throw new Error('Check encrypt: false option in index.get');
            }

            const recordPostUpdate = newRecords.records[0]!;

            expect(recordPostUpdate.title).toEqual('Different');
        });
    });

    describe('remove', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        it('should require full auth to remove a record', async () => {
            await expect(noAuthClient.index.remove({ id: 'testRecordA' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.index.remove({ id: 'testRecordA' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow removing a record', async () => {
            const records = await userA.clients.fullAuth.index.get({ encrypt: false });

            if (isEncrypted(records)) throw new Error('Check encrypt: false option in index.get');

            expect(records.records).toHaveLength(2);

            const promise = userA.clients.fullAuth.index.remove({ id: 'testRecordA' });
            await expect(promise).resolves.not.toThrow();

            const newRecords = await userA.clients.fullAuth.index.get({ encrypt: false });

            if (isEncrypted(newRecords)) {
                throw new Error('Check encrypt: false option in index.get');
            }

            expect(newRecords.records).toHaveLength(1);
        });
    });

    describe('removeAll', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
            await cache.node.flushall();
        });

        it('should require full auth to remove all records', async () => {
            await expect(noAuthClient.index.removeAll()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.index.removeAll()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow removing all records', async () => {
            const records = await userA.clients.fullAuth.index.get({ encrypt: false });

            if (isEncrypted(records)) throw new Error('Check encrypt: false option in index.get');

            expect(records.records).toHaveLength(2);

            const promise = userA.clients.fullAuth.index.removeAll();
            await expect(promise).resolves.not.toThrow();

            const newRecords = await userA.clients.fullAuth.index.get({ encrypt: false });

            if (isEncrypted(newRecords)) {
                throw new Error('Check encrypt: false option in index.get');
            }

            expect(newRecords.records).toHaveLength(0);
        });
    });
});
