import { JWE } from '@learncard/types';
import { isEncrypted } from '@learncard/helpers';

import { getClient, getUser } from './helpers/getClient';
import { getCredentialRecordCollection } from '@accesslayer/credential-record';
import { testRecordA, testRecordB, testRecordC } from './helpers/records';
import { client } from '@mongo';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

const CredentialRecords = getCredentialRecordCollection();

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

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
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

            expect(unencryptedRecords).toHaveLength(2);
        });

        it('should allow querying encrypted fields', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { fields: { $in: ['recordA'] } },
            });
            const records = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE(encryptedRecords as JWE);

            expect(records).toHaveLength(1);
            expect(records[0]).toEqual(testRecordA);
        });

        it('should allow multiple results when querying encrypted fields', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { fields: { $in: ['record'] } },
            });
            const records = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE(encryptedRecords as JWE);

            expect(records).toHaveLength(2);
        });

        it('should allow querying unencrypted fields', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { title: 'Record A' },
            });
            const records = await userA.learnCard.invoke
                .getDIDObject()
                .decryptDagJWE(encryptedRecords as JWE);

            expect(records).toHaveLength(1);
            expect(records[0]).toEqual(testRecordA);
        });
    });

    describe('add', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
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
            const records = await userA.clients.fullAuth.index.get({ encrypt: false });

            expect(records).toHaveLength(0);

            const promise = userA.clients.fullAuth.index.add({ record: testRecordA });
            await expect(promise).resolves.not.toThrow();

            const newRecords = await userA.clients.fullAuth.index.get({ encrypt: false });

            expect(newRecords).toHaveLength(1);
            expect((newRecords as any)[0]).toEqual(testRecordA);
        });

        it("should not add to someone else's records", async () => {
            await userA.clients.fullAuth.index.add({ record: testRecordA });

            const userARecords = await userA.clients.fullAuth.index.get({ encrypt: false });
            const userBRecords = await userB.clients.fullAuth.index.get({ encrypt: false });

            expect(userARecords).toHaveLength(1);
            expect(userBRecords).toHaveLength(0);
        });

        it('should allow adding a record with a custom ID', async () => {
            const records = await userA.clients.fullAuth.index.get({ encrypt: false });

            expect(records).toHaveLength(0);

            const promise = userA.clients.fullAuth.index.add({ record: testRecordA });
            await expect(promise).resolves.not.toThrow();

            const newRecords = await userA.clients.fullAuth.index.get({ encrypt: false });

            expect(newRecords).toHaveLength(1);
            expect((newRecords as any)[0].id).toEqual(testRecordA.id);
        });

        it("Generate an ID for a record that doesn't have one", async () => {
            const records = await userA.clients.fullAuth.index.get({ encrypt: false });

            expect(records).toHaveLength(0);

            const promise = userA.clients.fullAuth.index.add({ record: testRecordC });
            await expect(promise).resolves.not.toThrow();

            const newRecords = await userA.clients.fullAuth.index.get({ encrypt: false });

            expect(newRecords).toHaveLength(1);
            expect((newRecords as any)[0].id).toBeDefined();
        });
    });

    describe('addMany', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
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
            const records = await userA.clients.fullAuth.index.get({ encrypt: false });

            expect(records).toHaveLength(0);

            const promise = userA.clients.fullAuth.index.addMany({ records: [testRecordA] });
            await expect(promise).resolves.not.toThrow();

            const newRecords = await userA.clients.fullAuth.index.get({ encrypt: false });

            expect(newRecords).toHaveLength(1);
            expect((newRecords as any)[0]).toEqual(testRecordA);
        });

        it('should allow adding many records', async () => {
            const records = await userA.clients.fullAuth.index.get({ encrypt: false });

            expect(records).toHaveLength(0);

            const promise = userA.clients.fullAuth.index.addMany({
                records: [testRecordA, testRecordB],
            });
            await expect(promise).resolves.not.toThrow();

            const newRecords = await userA.clients.fullAuth.index.get({ encrypt: false });

            expect(newRecords).toHaveLength(2);
        });
    });

    describe('update', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
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
            const records = await userA.clients.fullAuth.index.get({ encrypt: false });

            if (isEncrypted(records)) throw new Error('Check encrypt: false option in index.get');

            const recordPreUpdate = records[0]!;

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

            const recordPostUpdate = newRecords[0]!;

            expect(recordPostUpdate.title).toEqual('Different');
        });
    });

    describe('remove', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
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

            expect(records.length).toEqual(2);

            const promise = userA.clients.fullAuth.index.remove({ id: 'testRecordA' });
            await expect(promise).resolves.not.toThrow();

            const newRecords = await userA.clients.fullAuth.index.get({ encrypt: false });

            if (isEncrypted(newRecords)) {
                throw new Error('Check encrypt: false option in index.get');
            }

            expect(newRecords.length).toEqual(1);
        });
    });

    describe('removeAll', () => {
        beforeAll(async () => {
            await CredentialRecords.deleteMany({});

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        beforeEach(async () => {
            await CredentialRecords.deleteMany({});

            await userA.clients.fullAuth.index.addMany({ records: [testRecordA, testRecordB] });
        });

        afterAll(async () => {
            await CredentialRecords.deleteMany({});
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

            expect(records.length).toEqual(2);

            const promise = userA.clients.fullAuth.index.removeAll();
            await expect(promise).resolves.not.toThrow();

            const newRecords = await userA.clients.fullAuth.index.get({ encrypt: false });

            if (isEncrypted(newRecords)) {
                throw new Error('Check encrypt: false option in index.get');
            }

            expect(newRecords.length).toEqual(0);
        });
    });
});
