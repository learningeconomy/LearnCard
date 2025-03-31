import { getClient, getUser } from './helpers/getClient';
import { Users } from '@accesslayer/user';
import { Credentials } from '@accesslayer/credential';

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

describe('Storage', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('store', () => {
        beforeEach(async () => {
            await Users.deleteMany({});
            await Credentials.deleteMany({});
        });

        afterAll(async () => {
            await Users.deleteMany({});
            await Credentials.deleteMany({});
        });

        it('should require full auth to store a credential/presentationl', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await expect(noAuthClient.storage.store({ item: vc })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.storage.store({ item: vc })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow storing a credential/presentation', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);
            const unsignedVp = await userA.learnCard.invoke.newPresentation(vc);
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            await expect(userA.clients.fullAuth.storage.store({ item: vc })).resolves.not.toThrow();
            await expect(userA.clients.fullAuth.storage.store({ item: vp })).resolves.not.toThrow();
        });

        it('should allow storing an encrypted credential/presentation', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);
            const unsignedVp = await userA.learnCard.invoke.newPresentation(vc);
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const encryptedVc = await userA.learnCard.invoke.createDagJwe(vc, [
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
            ]);
            const encryptedVp = await userA.learnCard.invoke.createDagJwe(vp, [
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
            ]);

            await expect(
                userA.clients.fullAuth.storage.store({ item: encryptedVc })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.fullAuth.storage.store({ item: encryptedVp })
            ).resolves.not.toThrow();
        });
    });

    describe('resolve', () => {
        beforeEach(async () => {
            await Users.deleteMany({});
            await Credentials.deleteMany({});
        });

        afterAll(async () => {
            await Users.deleteMany({});
            await Credentials.deleteMany({});
        });

        it('should require full auth to get a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.storage.store({ item: vc });

            await expect(noAuthClient.storage.resolve({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userB.clients.partialAuth.storage.resolve({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow resolving a credential/presentation', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);
            const unsignedVp = await userA.learnCard.invoke.newPresentation(vc);
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const vcUri = await userA.clients.fullAuth.storage.store({ item: vc });
            const vpUri = await userA.clients.fullAuth.storage.store({ item: vp });

            const vcPromise = userA.clients.fullAuth.storage.resolve({ uri: vcUri });
            const vpPromise = userA.clients.fullAuth.storage.resolve({ uri: vpUri });

            await expect(vcPromise).resolves.not.toThrow();
            await expect(vpPromise).resolves.not.toThrow();

            const resolvedCredential = await vcPromise;
            const resolvedPresentation = await vpPromise;

            expect(await userA.learnCard.invoke.decryptDagJwe(resolvedCredential)).toEqual(vc);
            expect(await userA.learnCard.invoke.decryptDagJwe(resolvedPresentation)).toEqual(vp);
        });

        it('should allow resolving an encrypted credential/presentation', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);
            const unsignedVp = await userA.learnCard.invoke.newPresentation(vc);
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const encryptedVc = await userA.learnCard.invoke.createDagJwe(vc, [
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
            ]);
            const encryptedVp = await userA.learnCard.invoke.createDagJwe(vp, [
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
            ]);

            const vcUri = await userA.clients.fullAuth.storage.store({ item: encryptedVc });
            const vpUri = await userA.clients.fullAuth.storage.store({ item: encryptedVp });

            const vcPromise = userA.clients.fullAuth.storage.resolve({ uri: vcUri });
            const vpPromise = userA.clients.fullAuth.storage.resolve({ uri: vpUri });

            await expect(vcPromise).resolves.not.toThrow();
            await expect(vpPromise).resolves.not.toThrow();

            const resolvedCredential = await vcPromise;
            const resolvedPresentation = await vpPromise;

            expect(resolvedCredential).toEqual(encryptedVc);
            expect(resolvedPresentation).toEqual(encryptedVp);

            expect(await userB.learnCard.invoke.decryptDagJwe(resolvedCredential)).toEqual(vc);
            expect(await userB.learnCard.invoke.decryptDagJwe(resolvedPresentation)).toEqual(vp);
        });
    });

    describe('batchResolve', () => {
        beforeEach(async () => {
            await Users.deleteMany({});
            await Credentials.deleteMany({});
            await cache.node.flushall();
        });

        afterAll(async () => {
            await Users.deleteMany({});
            await Credentials.deleteMany({});
        });

        it('should require full auth to batch resolve', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.storage.store({ item: vc });

            await expect(noAuthClient.storage.batchResolve({ uris: [uri] })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.storage.batchResolve({ uris: [uri] })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow batch resolving a credentials/presentations', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);
            const unsignedVp = await userA.learnCard.invoke.newPresentation(vc);
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const vcUri = await userA.clients.fullAuth.storage.store({ item: vc });
            const vpUri = await userA.clients.fullAuth.storage.store({ item: vp });

            const vcPromise = userA.clients.fullAuth.storage.batchResolve({ uris: [vcUri] });
            const vpPromise = userA.clients.fullAuth.storage.batchResolve({ uris: [vpUri] });
            const bothPromise = userA.clients.fullAuth.storage.batchResolve({
                uris: [vcUri, vpUri],
            });

            await expect(vcPromise).resolves.not.toThrow();
            await expect(vpPromise).resolves.not.toThrow();
            await expect(bothPromise).resolves.not.toThrow();

            const resolvedCredential = await vcPromise;
            const resolvedPresentation = await vpPromise;
            const both = await bothPromise;

            expect(resolvedCredential).toHaveLength(1);
            expect(resolvedPresentation).toHaveLength(1);
            expect(both).toHaveLength(2);

            expect(resolvedCredential[0]).not.toBeNull();
            expect(resolvedPresentation[0]).not.toBeNull();
            expect(both[0]).not.toBeNull();
            expect(both[1]).not.toBeNull();

            expect(await userA.learnCard.invoke.decryptDagJwe(resolvedCredential[0]!)).toEqual(vc);
            expect(await userA.learnCard.invoke.decryptDagJwe(resolvedPresentation[0]!)).toEqual(
                vp
            );
            expect(await userA.learnCard.invoke.decryptDagJwe(both[0]!)).toEqual(vc);
            expect(await userA.learnCard.invoke.decryptDagJwe(both[1]!)).toEqual(vp);
        });

        it('should return null for invalid URIs', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);
            const unsignedVp = await userA.learnCard.invoke.newPresentation(vc);
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const vcUri = await userA.clients.fullAuth.storage.store({ item: vc });
            const vpUri = await userA.clients.fullAuth.storage.store({ item: vp });

            const resolvedUris = await userA.clients.fullAuth.storage.batchResolve({
                uris: ['invalid', vcUri, 'also-invalid', vpUri],
            });

            expect(resolvedUris).toHaveLength(4);

            expect(resolvedUris[0]).toBeNull();
            expect(resolvedUris[1]).not.toBeNull();
            expect(resolvedUris[2]).toBeNull();
            expect(resolvedUris[3]).not.toBeNull();

            expect(await userA.learnCard.invoke.decryptDagJwe(resolvedUris[1]!)).toEqual(vc);
            expect(await userA.learnCard.invoke.decryptDagJwe(resolvedUris[3]!)).toEqual(vp);
        });
    });
});
