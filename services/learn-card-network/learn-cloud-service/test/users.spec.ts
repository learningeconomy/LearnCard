import { Users } from '@accesslayer/user';
import { getClient, getUser } from './helpers/getClient';
import { testRecordA, testRecordB } from './helpers/records';
import { EncryptedCredentialRecord } from '@learncard/types';
import { CredentialRecords } from '@accesslayer/credential-record';

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

describe('Users', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('getDids', () => {
        beforeAll(async () => {
            await Users.deleteMany({});
            await userA.clients.fullAuth.user.addDid({
                presentation: await userB.learnCard.invoke.getDidAuthVp(),
            });
        });

        afterAll(async () => {
            await Users.deleteMany({});
        });

        it('should require full auth', async () => {
            await expect(noAuthClient.user.getDids()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.user.getDids()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should get all dids', async () => {
            const promise = userA.clients.fullAuth.user.getDids();

            await expect(promise).resolves.not.toThrow();

            const dids = await promise;

            expect(dids).toHaveLength(2);
            expect(dids).toContain(userA.learnCard.id.did());
            expect(dids).toContain(userB.learnCard.id.did());
        });
    });

    describe('addDid', () => {
        beforeEach(async () => {
            await Users.deleteMany({});
            await CredentialRecords.deleteMany({});
        });

        afterAll(async () => {
            await Users.deleteMany({});
            await CredentialRecords.deleteMany({});
        });

        it('should require full auth', async () => {
            await expect(
                noAuthClient.user.addDid({
                    presentation: await userB.learnCard.invoke.getDidAuthVp(),
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.user.addDid({
                    presentation: await userB.learnCard.invoke.getDidAuthVp(),
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow adding a did', async () => {
            const dids = await userA.clients.fullAuth.user.getDids();

            expect(dids).toHaveLength(1);
            expect(dids).toContain(userA.learnCard.id.did());
            expect(dids).not.toContain(userB.learnCard.id.did());

            await userA.clients.fullAuth.user.addDid({
                presentation: await userB.learnCard.invoke.getDidAuthVp(),
            });

            const newDids = await userA.clients.fullAuth.user.getDids();

            expect(newDids).toHaveLength(2);
            expect(newDids).toContain(userA.learnCard.id.did());
            expect(newDids).toContain(userB.learnCard.id.did());
        });

        it('should cause get to return records from all dids', async () => {
            await userA.clients.fullAuth.index.add({ record: testRecordA });
            await userB.clients.fullAuth.index.add({ record: testRecordB });

            const records = ((await userA.clients.fullAuth.index.get({ encrypt: false })) as any)
                .records as EncryptedCredentialRecord[];

            expect(records).toHaveLength(1);
            expect(records).toContainEqual(testRecordA);
            expect(records).not.toContainEqual(testRecordB);

            await userA.clients.fullAuth.user.addDid({
                presentation: await userB.learnCard.invoke.getDidAuthVp(),
            });

            const newRecords = ((await userA.clients.fullAuth.index.get({ encrypt: false })) as any)
                .records as EncryptedCredentialRecord[];

            expect(newRecords).toHaveLength(2);
            expect(newRecords).toContainEqual(testRecordA);
            expect(newRecords).toContainEqual(testRecordB);
        });

        it('should allow adding a did when user has a different primary did', async () => {
            const userC = await getUser('c'.repeat(64));
            const dids = await userA.clients.fullAuth.user.getDids();

            expect(dids).toHaveLength(1);
            expect(dids).toContain(userA.learnCard.id.did());
            expect(dids).not.toContain(userB.learnCard.id.did());

            await userA.clients.fullAuth.user.addDid({
                presentation: await userB.learnCard.invoke.getDidAuthVp(),
            });

            const newDids = await userA.clients.fullAuth.user.getDids();

            expect(newDids).toHaveLength(2);
            expect(newDids).toContain(userA.learnCard.id.did());
            expect(newDids).toContain(userB.learnCard.id.did());

            await userB.clients.fullAuth.user.addDid({
                presentation: await userC.learnCard.invoke.getDidAuthVp(),
            });

            const userADids = await userA.clients.fullAuth.user.getDids();

            expect(userADids).toHaveLength(3);
            expect(userADids).toContain(userA.learnCard.id.did());
            expect(userADids).toContain(userB.learnCard.id.did());
            expect(userADids).toContain(userC.learnCard.id.did());

            const userBDids = await userB.clients.fullAuth.user.getDids();

            expect(userBDids).toHaveLength(3);
            expect(userBDids).toContain(userA.learnCard.id.did());
            expect(userBDids).toContain(userB.learnCard.id.did());
            expect(userBDids).toContain(userC.learnCard.id.did());

            const userCDids = await userC.clients.fullAuth.user.getDids();

            expect(userCDids).toHaveLength(3);
            expect(userCDids).toContain(userA.learnCard.id.did());
            expect(userCDids).toContain(userB.learnCard.id.did());
            expect(userCDids).toContain(userC.learnCard.id.did());
        });
    });

    describe('removeDid', () => {
        beforeEach(async () => {
            await Users.deleteMany({});
            await CredentialRecords.deleteMany({});
            await userA.clients.fullAuth.user.addDid({
                presentation: await userB.learnCard.invoke.getDidAuthVp(),
            });
        });

        afterAll(async () => {
            await Users.deleteMany({});
            await CredentialRecords.deleteMany({});
        });

        it('should require full auth', async () => {
            await expect(
                noAuthClient.user.removeDid({
                    presentation: await userB.learnCard.invoke.getDidAuthVp(),
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.user.removeDid({
                    presentation: await userB.learnCard.invoke.getDidAuthVp(),
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow removing a did', async () => {
            const dids = await userA.clients.fullAuth.user.getDids();

            expect(dids).toHaveLength(2);
            expect(dids).toContain(userA.learnCard.id.did());
            expect(dids).toContain(userB.learnCard.id.did());

            await userA.clients.fullAuth.user.removeDid({
                presentation: await userB.learnCard.invoke.getDidAuthVp(),
            });

            const newDids = await userA.clients.fullAuth.user.getDids();

            expect(newDids).toHaveLength(1);
            expect(newDids).toContain(userA.learnCard.id.did());
            expect(newDids).not.toContain(userB.learnCard.id.did());
        });

        it('should cause get to not return records from the removed did', async () => {
            await userA.clients.fullAuth.index.add({ record: testRecordA });
            await userB.clients.fullAuth.index.add({ record: testRecordB });

            const records = ((await userA.clients.fullAuth.index.get({ encrypt: false })) as any)
                .records as EncryptedCredentialRecord[];

            expect(records).toHaveLength(2);
            expect(records).toContainEqual(testRecordA);
            expect(records).toContainEqual(testRecordB);

            await userA.clients.fullAuth.user.removeDid({
                presentation: await userB.learnCard.invoke.getDidAuthVp(),
            });

            const newRecords = ((await userA.clients.fullAuth.index.get({ encrypt: false })) as any)
                .records as EncryptedCredentialRecord[];

            expect(newRecords).toHaveLength(1);
            expect(newRecords).toContainEqual(testRecordA);
            expect(newRecords).not.toContainEqual(testRecordB);
        });
    });
});
