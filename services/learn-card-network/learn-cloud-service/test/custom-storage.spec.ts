import { getClient, getUser } from './helpers/getClient';
import { Users } from '@accesslayer/user';
import { CustomDocuments } from '@accesslayer/custom-document';

import { client } from '@mongo';

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

describe('Custom Storage', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('create', () => {
        beforeEach(async () => {
            await CustomDocuments.deleteMany({});
        });

        afterAll(async () => {
            await CustomDocuments.deleteMany({});
        });

        it('should require full auth to create custom documents', async () => {
            const item = { test: 'test' };

            await expect(noAuthClient.customStorage.create({ item })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.customStorage.create({ item })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow storing an arbitrary object', async () => {
            const item = { test: 'test' };

            await expect(
                userA.clients.fullAuth.customStorage.create({ item })
            ).resolves.not.toThrow();
        });

        it('should allow storing complex objects', async () => {
            const item = { test: 'test', nested: { other: new Date(), array: [{ nice: 3 }] } };

            await expect(
                userA.clients.fullAuth.customStorage.create({ item })
            ).resolves.not.toThrow();

            const retrievedItem = (await userA.clients.fullAuth.customStorage.read())[0];

            expect(retrievedItem).toMatchObject(item);
        });
    });

    describe('createMany', () => {
        beforeEach(async () => {
            await CustomDocuments.deleteMany({});
        });

        afterAll(async () => {
            await CustomDocuments.deleteMany({});
        });

        it('should require full auth to create multiple custom documents', async () => {
            const items = [{ test: 'test' }, { nice: 'lol' }];

            await expect(noAuthClient.customStorage.createMany({ items })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.customStorage.createMany({ items })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow storing multiple objects', async () => {
            const items = [{ test: 'test' }, { nice: 'nice' }];

            await expect(
                userA.clients.fullAuth.customStorage.createMany({ items })
            ).resolves.not.toThrow();
        });

        it('should allow storing redundant objects', async () => {
            const items = [{ test: 'test' }, { test: 'test' }];

            await expect(
                userA.clients.fullAuth.customStorage.createMany({ items })
            ).resolves.not.toThrow();
        });
    });

    describe('read', () => {
        beforeEach(async () => {
            await CustomDocuments.deleteMany({});
        });

        afterAll(async () => {
            await CustomDocuments.deleteMany({});
        });

        it('should require full auth to read custom documents', async () => {
            await expect(noAuthClient.customStorage.read()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userB.clients.partialAuth.customStorage.read()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow reading an arbitrary object', async () => {
            const item = { test: 'test' };

            await userA.clients.fullAuth.customStorage.create({ item });

            const promise = userA.clients.fullAuth.customStorage.read();

            await expect(promise).resolves.not.toThrow();

            const retrievedItem = (await promise)[0];

            expect(retrievedItem).toMatchObject(item); // Can't use toEqual because of added _id
        });

        it('should allow querying for objects', async () => {
            const items = [{ test: 'test' }, { test: 'nice' }];

            await userA.clients.fullAuth.customStorage.createMany({ items });

            const testItems = await userA.clients.fullAuth.customStorage.read({
                query: { test: 'test' },
            });

            expect(testItems).toHaveLength(1);
            expect(testItems[0]).toMatchObject({ test: 'test' });

            const niceItems = await userA.clients.fullAuth.customStorage.read({
                query: { test: 'nice' },
            });

            expect(niceItems).toHaveLength(1);
            expect(niceItems[0]).toMatchObject({ test: 'nice' });

            const existsItems = await userA.clients.fullAuth.customStorage.read({
                query: { test: { $exists: true } },
            });

            expect(existsItems).toHaveLength(2);
        });

        it('should allow numeric comparisons when querying', async () => {
            const low = { number: 1 };
            const high = { number: 10 };

            await userA.clients.fullAuth.customStorage.createMany({ items: [low, high] });

            const retrievedItems = await userA.clients.fullAuth.customStorage.read({
                query: { number: { $gt: 5 } },
            });

            expect(retrievedItems).toHaveLength(1);
            expect(retrievedItems[0]).toMatchObject(high);
        });

        it('should store different documents for different users', async () => {
            const userAItem = { test: 'userA' };
            const userBItem = { test: 'userB' };

            await userA.clients.fullAuth.customStorage.create({ item: userAItem });
            await userB.clients.fullAuth.customStorage.create({ item: userBItem });

            const userAItems = await userA.clients.fullAuth.customStorage.read();
            const userBItems = await userB.clients.fullAuth.customStorage.read();

            expect(userAItems).toHaveLength(1);
            expect(userAItems[0]).toMatchObject(userAItem);

            expect(userBItems).toHaveLength(1);
            expect(userBItems[0]).toMatchObject(userBItem);
        });
    });

    describe('count', () => {
        beforeEach(async () => {
            await CustomDocuments.deleteMany({});
        });

        afterAll(async () => {
            await CustomDocuments.deleteMany({});
        });

        it('should require full auth to count custom documents', async () => {
            await expect(noAuthClient.customStorage.count()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userB.clients.partialAuth.customStorage.count()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow counting arbitrary objects', async () => {
            const item = { test: 'test' };

            await userA.clients.fullAuth.customStorage.create({ item });

            const promise = userA.clients.fullAuth.customStorage.count();

            await expect(promise).resolves.not.toThrow();

            const count = await promise;

            expect(count).toEqual(1);
        });

        it('should allow counting queries for objects', async () => {
            const items = [{ test: 'test' }, { test: 'nice' }];

            await userA.clients.fullAuth.customStorage.createMany({ items });

            const testCount = await userA.clients.fullAuth.customStorage.count({
                query: { test: 'test' },
            });

            expect(testCount).toEqual(1);

            const niceCount = await userA.clients.fullAuth.customStorage.count({
                query: { test: 'nice' },
            });

            expect(niceCount).toEqual(1);

            const existsCount = await userA.clients.fullAuth.customStorage.count({
                query: { test: { $exists: true } },
            });

            expect(existsCount).toEqual(2);
        });
    });

    describe('update', () => {
        beforeEach(async () => {
            await CustomDocuments.deleteMany({});

            await userA.clients.fullAuth.customStorage.create({ item: { test: 'test' } });
        });

        afterAll(async () => {
            await CustomDocuments.deleteMany({});
        });

        it('should require full auth to update custom documents', async () => {
            await expect(
                noAuthClient.customStorage.update({ update: { $set: { test: 'nice' } } })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.customStorage.update({
                    update: { $set: { test: 'nice' } },
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow updating arbitrary objects', async () => {
            const promise = userA.clients.fullAuth.customStorage.update({
                update: { $set: { test: 'nice' } },
            });

            await expect(promise).resolves.not.toThrow();

            const count = await promise;

            expect(count).toEqual(1);

            const retrievedItems = await userA.clients.fullAuth.customStorage.read();

            expect(retrievedItems).toHaveLength(1);
            expect(retrievedItems[0]).toMatchObject({ test: 'nice' });
        });

        it('should allow updating multiple objects', async () => {
            await userA.clients.fullAuth.customStorage.create({
                item: { test: 'test', nice: 'lol' },
            });

            const promise = userA.clients.fullAuth.customStorage.update({
                update: { $set: { test: 'nice' } },
            });

            await expect(promise).resolves.not.toThrow();

            const count = await promise;

            expect(count).toEqual(2);

            const retrievedItems = await userA.clients.fullAuth.customStorage.read();

            expect(retrievedItems).toHaveLength(2);
            expect(retrievedItems.every(item => item.test === 'nice')).toBeTruthy();
        });

        it('should allow selectively updating objects', async () => {
            await userA.clients.fullAuth.customStorage.create({
                item: { test: 'test', nice: 'lol' },
            });

            const promise = userA.clients.fullAuth.customStorage.update({
                query: { nice: 'lol' },
                update: { $set: { test: 'nice' } },
            });

            await expect(promise).resolves.not.toThrow();

            const count = await promise;

            expect(count).toEqual(1);

            const retrievedItems = await userA.clients.fullAuth.customStorage.read();

            expect(retrievedItems).toHaveLength(2);
            expect(retrievedItems.every(item => item.test === 'nice')).toBeFalsy();
            expect(retrievedItems.some(item => item.test === 'nice')).toBeTruthy();
        });
    });

    describe('delete', () => {
        beforeEach(async () => {
            await CustomDocuments.deleteMany({});

            await userA.clients.fullAuth.customStorage.create({ item: { test: 'test' } });
        });

        afterAll(async () => {
            await CustomDocuments.deleteMany({});
        });

        it('should require full auth to delete custom documents', async () => {
            await expect(noAuthClient.customStorage.delete()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userB.clients.partialAuth.customStorage.delete()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow deleting arbitrary objects', async () => {
            const promise = userA.clients.fullAuth.customStorage.delete();

            await expect(promise).resolves.not.toThrow();

            const count = await promise;

            expect(count).toEqual(1);

            const retrievedItems = await userA.clients.fullAuth.customStorage.read();

            expect(retrievedItems).toHaveLength(0);
        });

        it('should allow deleting multiple objects', async () => {
            await userA.clients.fullAuth.customStorage.create({
                item: { test: 'nice', nice: 'lol' },
            });

            const promise = userA.clients.fullAuth.customStorage.delete();

            await expect(promise).resolves.not.toThrow();

            const count = await promise;

            expect(count).toEqual(2);

            const retrievedItems = await userA.clients.fullAuth.customStorage.read();

            expect(retrievedItems).toHaveLength(0);
        });

        it('should allow selectively deleting objects', async () => {
            await userA.clients.fullAuth.customStorage.create({
                item: { test: 'nice', nice: 'lol' },
            });

            const promise = userA.clients.fullAuth.customStorage.delete({
                query: { nice: 'lol' },
            });

            await expect(promise).resolves.not.toThrow();

            const count = await promise;

            expect(count).toEqual(1);

            const retrievedItems = await userA.clients.fullAuth.customStorage.read();

            expect(retrievedItems).toHaveLength(1);
            expect(retrievedItems[0]).toMatchObject({ test: 'test' });
        });
    });
});
