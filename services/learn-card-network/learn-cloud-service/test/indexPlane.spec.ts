import { JWE, PaginatedEncryptedCredentialRecordsType } from '@learncard/types';
import { isEncrypted } from '@learncard/helpers';

import { getClient, getUser } from './helpers/getClient';
import { CredentialRecords } from '@accesslayer/credential-record';
import { Users } from '@accesslayer/user';
import { testRecordA, testRecordB, testRecordC } from './helpers/records';
import { client } from '@mongo';
import cache from '@cache';
import { getIndexFieldKey, getIndexHashKey, setCachedIndexPageForDid } from '@cache/indexPlane';
import { getUserCacheKey } from '@cache/user';
import { MAX_INDEX_PAGE_LIMIT } from 'src/constants/limits';

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

            const unencryptedRecords = await userA.learnCard.invoke.decryptDagJwe(
                (await recordsPromise) as JWE
            );

            expect(unencryptedRecords.records).toHaveLength(2);
        });

        it('should allow getting an empty list of records', async () => {
            await userA.clients.fullAuth.index.removeAll();

            const recordsPromise = userA.clients.fullAuth.index.get();
            await expect(recordsPromise).resolves.not.toThrow();

            const unencryptedRecords = await userA.learnCard.invoke.decryptDagJwe(
                (await recordsPromise) as JWE
            );

            expect(unencryptedRecords.records).toHaveLength(0);
        });

        describe('when the database read fails (LC-2434)', () => {
            afterEach(() => {
                vi.restoreAllMocks();
            });

            it('returns an error instead of an empty page, and caches nothing', async () => {
                const did = userA.learnCard.id.did();
                vi.spyOn(CredentialRecords, 'find').mockImplementationOnce(() => {
                    throw new Error('connection pool cleared');
                });

                await expect(
                    userA.clients.fullAuth.index.get({ encrypt: false })
                ).rejects.toMatchObject({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not read index',
                });
                expect(await cache.node.exists(getIndexHashKey(did))).toBe(0);

                // The next read goes to the database and gets the real records.
                const page = (await userA.clients.fullAuth.index.get({
                    encrypt: false,
                })) as PaginatedEncryptedCredentialRecordsType;
                expect(page.records).toHaveLength(2);
            });

            it('does not serve an empty page cached under the pre-LC-2434 key', async () => {
                const did = userA.learnCard.id.did();
                // What the old code left in Redis after a failed read: the unversioned hash.
                await cache.hset(
                    `index:${did}`,
                    getIndexFieldKey({}, { limit: 25, sort: 'newestFirst' }),
                    JSON.stringify({ records: [], hasMore: false })
                );

                const page = (await userA.clients.fullAuth.index.get({
                    encrypt: false,
                })) as PaginatedEncryptedCredentialRecordsType;
                expect(page.records).toHaveLength(2);
            });
        });

        it('should allow querying encrypted fields', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { fields: { $in: ['recordA'] } },
            });
            const records = await userA.learnCard.invoke.decryptDagJwe(encryptedRecords as JWE);

            expect(records.records).toHaveLength(1);
            expect(records.records[0]).toEqual(testRecordA);
        });

        it('should allow multiple results when querying encrypted fields', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { fields: { $in: ['record'] } },
            });
            const records = await userA.learnCard.invoke.decryptDagJwe(encryptedRecords as JWE);

            expect(records.records).toHaveLength(2);
        });

        it('should allow querying unencrypted fields', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { title: 'Record A' },
            });
            const records = await userA.learnCard.invoke.decryptDagJwe(encryptedRecords as JWE);

            expect(records.records).toHaveLength(1);
            expect(records.records[0]).toEqual(testRecordA);
        });

        it('should exclude encrypted field hashes with fields.$nin', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { fields: { $in: ['record'], $nin: ['recordA'] } },
            });
            const records = await userA.learnCard.invoke.decryptDagJwe(encryptedRecords as JWE);

            expect(records.records.map((record: { id: string }) => record.id)).toEqual([
                'testRecordB',
            ]);
        });

        it('should allow fields.$nin without fields.$in', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { fields: { $nin: ['recordB'] } },
            });
            const records = await userA.learnCard.invoke.decryptDagJwe(encryptedRecords as JWE);

            expect(records.records.map((record: { id: string }) => record.id)).toEqual([
                'testRecordA',
            ]);
        });

        it('should allow $ne on unencrypted fields', async () => {
            const encryptedRecords = await userA.clients.fullAuth.index.get({
                query: { title: { $ne: 'Record A' } },
            });
            const records = await userA.learnCard.invoke.decryptDagJwe(encryptedRecords as JWE);

            expect(records.records.map((record: { id: string }) => record.id)).toEqual([
                'testRecordB',
            ]);
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

        describe('page size above the max', () => {
            const total = MAX_INDEX_PAGE_LIMIT + 50;

            beforeEach(async () => {
                const { id: _id, ...testRecord } = testRecordA;
                await userA.clients.fullAuth.index.removeAll();
                await userA.clients.fullAuth.index.addMany({
                    records: Array.from({ length: total }, () => testRecord),
                });
                await cache.node.flushall();
            });

            it('clamps limit 1000 to the max page, and hasMore/cursor page through every record', async () => {
                const first = (await userA.clients.fullAuth.index.get({
                    limit: 1000,
                    encrypt: false,
                })) as PaginatedEncryptedCredentialRecordsType;

                expect(first.records).toHaveLength(MAX_INDEX_PAGE_LIMIT);
                expect(first.hasMore).toBe(true);
                expect(first.cursor).toBeDefined();

                const second = (await userA.clients.fullAuth.index.get({
                    limit: 1000,
                    cursor: first.cursor,
                    encrypt: false,
                })) as PaginatedEncryptedCredentialRecordsType;

                expect(second.records).toHaveLength(total - MAX_INDEX_PAGE_LIMIT);
                expect(second.hasMore).toBe(false);

                const ids = [...first.records, ...second.records].map(record => record.id);
                expect(new Set(ids).size).toBe(total);
            });

            it('limits at or under the max are unchanged', async () => {
                const page = (await userA.clients.fullAuth.index.get({
                    limit: 30,
                    encrypt: false,
                })) as PaginatedEncryptedCredentialRecordsType;

                expect(page.records).toHaveLength(30);
                expect(page.hasMore).toBe(true);
            });

            it('a page cached for limit 1000 before the clamp is not served, and the clamped page is cached under the max', async () => {
                const did = userA.learnCard.id.did();
                const sort = 'newestFirst' as const;
                // What an earlier, unclamped response left in Redis for this request.
                await setCachedIndexPageForDid(
                    did,
                    {},
                    { limit: 1000, sort },
                    { records: [], hasMore: false }
                );

                const page = (await userA.clients.fullAuth.index.get({
                    limit: 1000,
                    encrypt: false,
                })) as PaginatedEncryptedCredentialRecordsType;

                expect(page.records).toHaveLength(MAX_INDEX_PAGE_LIMIT);
                expect(page.hasMore).toBe(true);

                const hashKey = getIndexHashKey(did);
                const clampedKey = getIndexFieldKey({}, { limit: MAX_INDEX_PAGE_LIMIT, sort });
                const cached = JSON.parse((await cache.hget(hashKey, clampedKey)) ?? 'null');
                expect(cached?.records).toHaveLength(MAX_INDEX_PAGE_LIMIT);
                expect(getIndexFieldKey({}, { limit: 1000, sort })).not.toBe(clampedKey);
            });
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

            const unencryptedCount = Number(
                await userA.learnCard.invoke.decryptDagJwe((await countPromise) as JWE)
            );

            expect(unencryptedCount).toEqual(2);
        });

        it('should allow counting an empty list of records', async () => {
            await userA.clients.fullAuth.index.removeAll();

            const countPromise = userA.clients.fullAuth.index.count();
            await expect(countPromise).resolves.not.toThrow();

            const unencryptedCount = Number(
                await userA.learnCard.invoke.decryptDagJwe((await countPromise) as JWE)
            );

            expect(unencryptedCount).toEqual(0);
        });

        it('should allow querying encrypted fields', async () => {
            const encryptedCount = await userA.clients.fullAuth.index.count({
                query: { fields: { $in: ['recordA'] } },
            });
            const count = Number(await userA.learnCard.invoke.decryptDagJwe(encryptedCount as JWE));

            expect(count).toEqual(1);
        });

        it('should allow multiple results when querying encrypted fields', async () => {
            const encryptedCount = await userA.clients.fullAuth.index.count({
                query: { fields: { $in: ['record'] } },
            });
            const count = Number(await userA.learnCard.invoke.decryptDagJwe(encryptedCount as JWE));

            expect(count).toEqual(2);
        });

        it('should allow querying unencrypted fields', async () => {
            const encryptedCount = await userA.clients.fullAuth.index.count({
                query: { title: 'Record A' },
            });
            const count = Number(await userA.learnCard.invoke.decryptDagJwe(encryptedCount as JWE));

            expect(count).toEqual(1);
        });

        it('should exclude encrypted field hashes with fields.$nin', async () => {
            const encryptedCount = await userA.clients.fullAuth.index.count({
                query: { fields: { $in: ['record'], $nin: ['recordA'] } },
            });
            const count = Number(await userA.learnCard.invoke.decryptDagJwe(encryptedCount as JWE));

            expect(count).toEqual(1);
        });

        it('should allow fields.$nin without fields.$in', async () => {
            const encryptedCount = await userA.clients.fullAuth.index.count({
                query: { fields: { $nin: ['recordA', 'recordB'] } },
            });
            const count = Number(await userA.learnCard.invoke.decryptDagJwe(encryptedCount as JWE));

            expect(count).toEqual(0);
        });

        it('should allow $ne on unencrypted fields', async () => {
            const encryptedCount = await userA.clients.fullAuth.index.count({
                query: { title: { $ne: 'Record A' } },
            });
            const count = Number(await userA.learnCard.invoke.decryptDagJwe(encryptedCount as JWE));

            expect(count).toEqual(1);
        });

        describe('when the database read fails (LC-2434)', () => {
            afterEach(() => {
                vi.restoreAllMocks();
            });

            it('returns an error instead of 0', async () => {
                vi.spyOn(CredentialRecords, 'countDocuments').mockRejectedValueOnce(
                    new Error('connection pool cleared')
                );

                // Encrypted, as the app asks: before LC-2434 this came back as an encrypted 0.
                await expect(userA.clients.fullAuth.index.count()).rejects.toMatchObject({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Could not read index',
                });

                const encryptedCount = await userA.clients.fullAuth.index.count();
                const count = Number(
                    await userA.learnCard.invoke.decryptDagJwe(encryptedCount as JWE)
                );
                expect(count).toEqual(2);
            });

            it('returns an error, not a count of only the signed-in DID, when the user lookup fails', async () => {
                // Drop the cached user so the lookup reaches the database.
                await cache.delete([getUserCacheKey(userA.learnCard.id.did())]);
                vi.spyOn(Users, 'findOne').mockRejectedValueOnce(
                    new Error('connection pool cleared')
                );

                await expect(userA.clients.fullAuth.index.count()).rejects.toMatchObject({
                    code: 'INTERNAL_SERVER_ERROR',
                });
            });
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

            const promise = userA.clients.fullAuth.index.add({ record: testRecordC as never });
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

            const recordA = records.records[1]!;
            const recordB = records.records[0]!;

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

            const recordAPostUpdate = newRecords.records[1]!;
            const recordBPostUpdate = newRecords.records[0]!;

            expect(recordAPostUpdate.id).toEqual('testRecordA');
            expect(recordBPostUpdate.id).toEqual('testRecordB');
        });

        it('should not allow changing to a duplicate ID', async () => {
            const records = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            const recordPreUpdate = records.records[1]!;

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

            const recordPostUpdate = newRecords.records[1]!;

            expect(recordPostUpdate.title).toEqual('Different');
        });

        it('should allow changing sort order', async () => {
            const defaultSort = (await userA.clients.fullAuth.index.get({
                encrypt: false,
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(defaultSort.records[0]?.title).toEqual('Record B');
            expect(defaultSort.records[1]?.title).toEqual('Record A');

            const oldestFirst = (await userA.clients.fullAuth.index.get({
                encrypt: false,
                sort: 'oldestFirst',
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(oldestFirst.records[0]?.title).toEqual('Record A');
            expect(oldestFirst.records[1]?.title).toEqual('Record B');

            const newestFirst = (await userA.clients.fullAuth.index.get({
                encrypt: false,
                sort: 'newestFirst',
            })) as PaginatedEncryptedCredentialRecordsType;

            expect(newestFirst.records[0]?.title).toEqual('Record B');
            expect(newestFirst.records[1]?.title).toEqual('Record A');
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
