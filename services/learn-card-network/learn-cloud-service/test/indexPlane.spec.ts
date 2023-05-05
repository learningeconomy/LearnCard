import { JWE, PaginatedEncryptedCredentialRecordsType } from '@learncard/types';
import { isEncrypted } from '@learncard/helpers';

import { getClient, getUser } from './helpers/getClient';
import { CredentialRecords } from '@accesslayer/credential-record';
import { Users } from '@accesslayer/user';
import { testRecordA, testRecordB, testRecordC } from './helpers/records';
import { client } from '@mongo';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

describe('Index', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    afterAll(async () => {
        await client.close();
    });

    describe('get', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
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
            const records = [
                { ...testRecordA, id: '1' },
                { ...testRecordA, id: '2' },
                { ...testRecordA, id: '3' },
                { ...testRecordA, id: '4' },
            ];

            await Users.deleteMany({});
            await userA.clients.fullAuth.index.removeAll();
            await userA.clients.fullAuth.index.addMany({ records });

            const initialResults = (await userA.clients.fullAuth.index.get({
                limit: 2,
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(initialResults.records).toHaveLength(2);
            expect(initialResults.hasMore).toBeTruthy();
            expect(initialResults.cursor).toEqual('2');

            const nextResults = (await userA.clients.fullAuth.index.get({
                limit: 2,
                cursor: '2',
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(nextResults.records).toHaveLength(2);
            expect(nextResults.hasMore).toBeFalsy();
            expect(nextResults.cursor).toEqual('4');

            const middleResults = (await userA.clients.fullAuth.index.get({
                limit: 2,
                cursor: '1',
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(middleResults.records).toHaveLength(2);
            expect(middleResults.hasMore).toBeTruthy();
            expect(middleResults.cursor).toEqual('3');

            const truncatedResults = (await userA.clients.fullAuth.index.get({
                limit: 2,
                cursor: '3',
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(truncatedResults.records).toHaveLength(1);
            expect(truncatedResults.hasMore).toBeFalsy();
            expect(truncatedResults.cursor).toEqual('4');
        });
    });

    describe('add', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
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
    });

    describe('addMany', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
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
    });

    describe('update', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
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

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
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

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
            await Users.deleteMany({});
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
