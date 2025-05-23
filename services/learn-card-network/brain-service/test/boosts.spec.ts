import { getClient, getUser } from './helpers/getClient';
import { testVc, sendBoost, testUnsignedBoost } from './helpers/send';
import { Profile, Credential, Boost, SigningAuthority } from '@models';
import { getClaimLinkOptionsInfoForBoost, getTTLForClaimLink } from '@cache/claim-links';
import { BoostStatus } from 'types/boost';
import { adminRole, creatorRole, emptyRole } from './helpers/permissions';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;
let userD: Awaited<ReturnType<typeof getUser>>;
let userE: Awaited<ReturnType<typeof getUser>>;

describe('Boosts', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
        userD = await getUser('d'.repeat(64));
        userE = await getUser('e'.repeat(64));
    });

    describe('createBoost', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should not allow you to create a boost without full auth', async () => {
            await expect(
                noAuthClient.boost.createBoost({ credential: testVc })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.createBoost({ credential: testVc })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to create a boost', async () => {
            await expect(
                userA.clients.fullAuth.boost.createBoost({ credential: testVc })
            ).resolves.not.toThrow();
        });
    });

    describe('getBoost', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to get boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(noAuthClient.boost.getBoost({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.boost.getBoost({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow getting boosts', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(userA.clients.fullAuth.boost.getBoost({ uri })).resolves.not.toThrow();

            const boost = await userA.clients.fullAuth.boost.getBoost({ uri });

            expect(boost).toBeDefined();
        });

        it('should allow admins to get boosts', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            const boost = await userB.clients.fullAuth.boost.getBoost({ uri });

            expect(boost).toBeDefined();
        });

        it('should allow non-admins to get boosts', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(userA.clients.fullAuth.boost.getBoost({ uri })).resolves.not.toThrow();

            await expect(userB.clients.fullAuth.boost.getBoost({ uri })).resolves.not.toThrow();
        });

        it('should allow admins of parent boosts to get boosts', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                uri: parentUri,
                profileId: 'userb',
            });

            const boost = await userB.clients.fullAuth.boost.getBoost({ uri });

            expect(boost).toBeDefined();
        });

        it('should include default claim permissions', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                claimPermissions: adminRole,
            });

            await expect(userA.clients.fullAuth.boost.getBoost({ uri })).resolves.not.toThrow();

            const boost = await userA.clients.fullAuth.boost.getBoost({ uri });

            expect(boost).toBeDefined();
            expect(boost.claimPermissions).toEqual(adminRole);
        });

        it('should include meta', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                meta: { test: 'lol' },
            });

            await expect(userA.clients.fullAuth.boost.getBoost({ uri })).resolves.not.toThrow();

            const boost = await userA.clients.fullAuth.boost.getBoost({ uri });

            expect(boost).toBeDefined();
            expect(boost.meta).toEqual({ test: 'lol' });
        });
    });

    describe('getBoosts', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to get boosts', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(noAuthClient.boost.getBoosts()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.boost.getBoosts()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow getting boosts', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(userA.clients.fullAuth.boost.getBoosts()).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoosts();

            expect(boosts).toHaveLength(1);
        });

        it('should get boosts you are admin of, not just created', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            await expect(userB.clients.fullAuth.boost.getBoosts()).resolves.not.toThrow();

            const boosts = await userB.clients.fullAuth.boost.getBoosts();

            expect(boosts).toHaveLength(1);
        });

        it('should allow querying boosts', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'A' });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'B' });

            await expect(
                userA.clients.fullAuth.boost.getBoosts({ query: { category: 'A' } })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoosts({
                query: { category: 'A' },
            });

            expect(boosts).toHaveLength(1);
            expect(boosts[0]?.category).toEqual('A');
        });

        it('should allow querying with $in', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'A' });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'B' });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'C' });

            await expect(
                userA.clients.fullAuth.boost.getBoosts({ query: { category: { $in: ['A', 'B'] } } })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoosts({
                query: { category: { $in: ['A', 'B'] } },
            });

            expect(boosts).toHaveLength(2);
            expect(boosts[0]?.category).not.toEqual('C');
            expect(boosts[1]?.category).not.toEqual('C');
        });

        it('should allow querying with $regex', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'All' });
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'allo',
            });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'C' });

            await expect(
                userA.clients.fullAuth.boost.getBoosts({ query: { category: { $regex: /all/i } } })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoosts({
                query: { category: { $regex: /all/i } },
            });

            expect(boosts).toHaveLength(2);
            expect(boosts[0]?.category).not.toEqual('C');
            expect(boosts[1]?.category).not.toEqual('C');
        });

        it('should include meta', async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                meta: { test: 'lol' },
            });

            const boosts = await userA.clients.fullAuth.boost.getBoosts();

            expect(boosts).toHaveLength(1);
            expect(boosts[0]?.meta).toEqual({ test: 'lol' });
        });
    });

    describe('getPaginatedBoosts', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to get boosts', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(noAuthClient.boost.getPaginatedBoosts()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.getPaginatedBoosts()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow getting boosts', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(userA.clients.fullAuth.boost.getPaginatedBoosts()).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();

            expect(boosts.records).toHaveLength(1);
        });

        it('should allow querying boosts', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'A' });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'B' });

            await expect(
                userA.clients.fullAuth.boost.getPaginatedBoosts({ query: { category: 'A' } })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts({
                query: { category: 'A' },
            });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('A');
        });

        it('should allow querying with $in', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'A' });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'B' });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'C' });

            await expect(
                userA.clients.fullAuth.boost.getPaginatedBoosts({
                    query: { category: { $in: ['A', 'B'] } },
                })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts({
                query: { category: { $in: ['A', 'B'] } },
            });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records[0]?.category).not.toEqual('C');
            expect(boosts.records[1]?.category).not.toEqual('C');
        });

        it('should allow querying with $regex', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'All' });
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'allo',
            });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'C' });

            await expect(
                userA.clients.fullAuth.boost.getPaginatedBoosts({
                    query: { category: { $regex: /all/i } },
                })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts({
                query: { category: { $regex: /all/i } },
            });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records[0]?.category).not.toEqual('C');
            expect(boosts.records[1]?.category).not.toEqual('C');
        });

        it('should paginate correctly', async () => {
            for (let index = 0; index < 10; index += 1) {
                await userA.clients.fullAuth.boost.createBoost({
                    credential: testVc,
                    name: `Test ${index}`,
                });
            }

            await expect(userA.clients.fullAuth.boost.getPaginatedBoosts()).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts({ limit: 20 });

            expect(boosts.records).toHaveLength(10);

            const firstPage = await userA.clients.fullAuth.boost.getPaginatedBoosts({ limit: 5 });

            expect(firstPage.records).toHaveLength(5);
            expect(firstPage.hasMore).toBeTruthy();
            expect(firstPage.cursor).toBeDefined();

            const secondPage = await userA.clients.fullAuth.boost.getPaginatedBoosts({
                limit: 5,
                cursor: firstPage.cursor,
            });

            expect(secondPage.hasMore).toBeFalsy();

            expect([...firstPage.records, ...secondPage.records]).toEqual(boosts.records);
        });

        it('should include meta', async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                meta: { test: 'lol' },
            });

            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.meta).toEqual({ test: 'lol' });
        });
    });

    describe('sendBoost', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to send boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const userBProfile = (await userB.clients.fullAuth.profile.getProfile())!;

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: uri,
            });

            await userA.clients.fullAuth.boost.sendBoost({
                profileId: userBProfile.profileId,
                uri,
                credential,
            });

            await expect(
                noAuthClient.boost.sendBoost({
                    profileId: userBProfile.profileId,
                    uri,
                    credential,
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });

            await expect(
                userA.clients.partialAuth.boost.sendBoost({
                    profileId: userBProfile.profileId,
                    uri,
                    credential,
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow sending a boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const userBProfile = (await userB.clients.fullAuth.profile.getProfile())!;

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: uri,
            });

            const credentialUri = await userA.clients.fullAuth.boost.sendBoost({
                profileId: userBProfile.profileId,
                uri,
                credential,
            });
            expect(credentialUri).toBeDefined();
        });

        it('should allow admins to send a boost', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            const userCProfile = (await userC.clients.fullAuth.profile.getProfile())!;

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: uri,
            });

            const credentialUri = await userB.clients.fullAuth.boost.sendBoost({
                profileId: userCProfile.profileId,
                uri,
                credential,
            });
            expect(credentialUri).toBeDefined();
        });

        it('should not allow non-admins to send a boost', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const userCProfile = (await userC.clients.fullAuth.profile.getProfile())!;

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: uri,
            });

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: userCProfile.profileId,
                    uri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow the recipient to claim a sent boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const userAProfile = (await userA.clients.fullAuth.profile.getProfile())!;
            const userBProfile = (await userB.clients.fullAuth.profile.getProfile())!;

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userA.learnCard.id.did(),
                },
                boostId: uri,
            });

            const credentialUri = await userA.clients.fullAuth.boost.sendBoost({
                profileId: userBProfile.profileId,
                uri,
                credential,
            });

            expect(
                await userB.clients.fullAuth.credential.receivedCredentials({
                    from: userAProfile.profileId,
                })
            ).toHaveLength(0);
            expect(
                await userB.clients.fullAuth.credential.acceptCredential({ uri: credentialUri })
            ).toBe(true);
            expect(
                await userB.clients.fullAuth.credential.receivedCredentials({
                    from: userAProfile.profileId,
                })
            ).toHaveLength(1);
        });
    });

    describe('getBoostRecipients', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to get boost recipients', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            await userA.clients.fullAuth.boost.getBoostRecipients({ uri });

            await expect(noAuthClient.boost.getBoostRecipients({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.getBoostRecipients({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow getting boost recipients', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            await expect(
                userA.clients.fullAuth.boost.getBoostRecipients({ uri })
            ).resolves.not.toThrow();

            expect(await userA.clients.fullAuth.boost.getBoostRecipients({ uri })).toHaveLength(0);

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri
            );

            expect(await userA.clients.fullAuth.boost.getBoostRecipients({ uri })).toHaveLength(1);
        });

        it("should return recipients that haven't accepted yet", async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(await userA.clients.fullAuth.boost.getBoostRecipients({ uri })).toHaveLength(0);

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri,
                false
            );

            expect(await userA.clients.fullAuth.boost.getBoostRecipients({ uri })).toHaveLength(1);
        });

        it("should allow not returning recipients that haven't accepted yet", async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(await userA.clients.fullAuth.boost.getBoostRecipients({ uri })).toHaveLength(0);

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri,
                false
            );

            expect(
                await userA.clients.fullAuth.boost.getBoostRecipients({
                    uri,
                    includeUnacceptedBoosts: false,
                })
            ).toHaveLength(0);
        });
    });

    describe('getPaginatedBoostRecipients', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to get boost recipients', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await expect(
                noAuthClient.boost.getPaginatedBoostRecipients({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.getPaginatedBoostRecipients({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow getting boost recipients', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            await expect(
                userA.clients.fullAuth.boost.getPaginatedBoostRecipients({ uri })
            ).resolves.not.toThrow();

            expect(
                (await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({ uri })).records
            ).toHaveLength(0);

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri
            );

            expect(
                (await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({ uri })).records
            ).toHaveLength(1);
        });

        it("should return recipients that haven't accepted yet", async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(
                (await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({ uri })).records
            ).toHaveLength(0);

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri,
                false
            );

            expect(
                (await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({ uri })).records
            ).toHaveLength(1);
        });

        it("should allow not returning recipients that haven't accepted yet", async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(
                (await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({ uri })).records
            ).toHaveLength(0);

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri,
                false
            );

            expect(
                (
                    await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
                        uri,
                        includeUnacceptedBoosts: false,
                    })
                ).records
            ).toHaveLength(0);
        });

        it('should allow querying recipients', async () => {
            await userC.clients.fullAuth.profile.createProfile({
                profileId: 'userc',
                displayName: 'Johnny Appleseed',
            });
            await userD.clients.fullAuth.profile.createProfile({
                profileId: 'userd',
                displayName: 'Jack Appleseed',
            });

            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(
                (
                    await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
                        uri,
                        query: { profileId: 'userb' },
                    })
                ).records
            ).toHaveLength(0);

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri,
                false
            );
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userc', user: userC },
                uri,
                false
            );
            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userd', user: userD },
                uri,
                false
            );

            expect(
                (
                    await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
                        uri,
                        query: { profileId: 'userb' },
                    })
                ).records
            ).toHaveLength(1);
            expect(
                (
                    await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
                        uri,
                        query: { profileId: { $regex: /user/i } },
                    })
                ).records
            ).toHaveLength(3);
            expect(
                (
                    await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
                        uri,
                        query: { profileId: { $in: ['userb', 'userc'] } },
                    })
                ).records
            ).toHaveLength(2);

            expect(
                (
                    await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
                        uri,
                        query: { displayName: 'Johnny Appleseed' },
                    })
                ).records
            ).toHaveLength(1);
            expect(
                (
                    await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
                        uri,
                        query: { displayName: { $regex: /apple/i } },
                    })
                ).records
            ).toHaveLength(2);
            expect(
                (
                    await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
                        uri,
                        query: { displayName: { $in: ['Johnny Appleseed', 'N/A'] } },
                    })
                ).records
            ).toHaveLength(1);
        });
    });

    describe('getBoostRecipientCount', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to count boost recipients', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            await userA.clients.fullAuth.boost.getBoostRecipientCount({ uri });

            await expect(noAuthClient.boost.getBoostRecipientCount({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.getBoostRecipientCount({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow counting boost recipients', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            await expect(
                userA.clients.fullAuth.boost.getBoostRecipientCount({ uri })
            ).resolves.not.toThrow();

            expect(await userA.clients.fullAuth.boost.getBoostRecipientCount({ uri })).toEqual(0);

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri
            );

            expect(await userA.clients.fullAuth.boost.getBoostRecipientCount({ uri })).toEqual(1);
        });

        it("should return recipients that haven't accepted yet", async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(await userA.clients.fullAuth.boost.getBoostRecipientCount({ uri })).toEqual(0);

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri,
                false
            );

            expect(await userA.clients.fullAuth.boost.getBoostRecipientCount({ uri })).toEqual(1);
        });

        it("should allow not returning recipients that haven't accepted yet", async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(await userA.clients.fullAuth.boost.getBoostRecipientCount({ uri })).toEqual(0);

            await sendBoost(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB },
                uri,
                false
            );

            expect(
                await userA.clients.fullAuth.boost.getBoostRecipientCount({
                    uri,
                    includeUnacceptedBoosts: false,
                })
            ).toEqual(0);
        });
    });

    describe('updateBoost', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to update a boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });

            await expect(
                noAuthClient.boost.updateBoost({ uri, updates: { name: 'nice' } })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.boost.updateBoost({ uri, updates: { name: 'nice' } })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should prevent you from updating a published boosts name', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            expect(boost.name).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { name: 'nice' } })
            ).rejects.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(newBoost.name).not.toEqual('nice');
        });

        it('should allow you to update a draft boosts name', async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            expect(boost.status).toBe(BoostStatus.enum.DRAFT);
            expect(boost.name).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { name: 'nice' } })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(newBoost.name).toEqual('nice');
        });

        it('should prevent you from updating a published boosts category', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            expect(boost.category).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { category: 'nice' } })
            ).rejects.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(newBoost.category).not.toEqual('nice');
        });

        it('should allow you to update a draft boosts category', async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            expect(boost.category).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { category: 'nice' } })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(newBoost.category).toEqual('nice');
        });

        it('should prevent you from updating a published boosts type', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            expect(boost.type).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { type: 'nice' } })
            ).rejects.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(newBoost.type).not.toEqual('nice');
        });

        it('should allow you to update boost type', async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            expect(boost.type).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { type: 'nice' } })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(newBoost.type).toEqual('nice');
        });

        it('should prevent you from updating a published boosts credential', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            const beforeUpdateBoostCredential = await userA.clients.fullAuth.storage.resolve({
                uri,
            });
            await expect(
                userA.clients.fullAuth.boost.updateBoost({
                    uri,
                    updates: { credential: testUnsignedBoost },
                })
            ).rejects.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(
                await userA.clients.fullAuth.storage.resolve({ uri: newBoost.uri })
            ).toMatchObject(beforeUpdateBoostCredential);
        });

        it('should allow you to update boost credential', async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            const beforeUpdateBoostCredential = await userA.clients.fullAuth.storage.resolve({
                uri,
            });
            await expect(
                userA.clients.fullAuth.boost.updateBoost({
                    uri,
                    updates: { credential: testUnsignedBoost },
                })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(
                await userA.clients.fullAuth.storage.resolve({ uri: newBoost.uri })
            ).not.toMatchObject(beforeUpdateBoostCredential);
        });

        it("should allow you to update a draft boost's meta", async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
                meta: { nice: 'lol' },
            });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            expect(boost.status).toBe(BoostStatus.enum.DRAFT);
            expect(boost.meta).toEqual({ nice: 'lol' });

            await expect(
                userA.clients.fullAuth.boost.updateBoost({
                    uri,
                    updates: { meta: { nice: 'nice!' } },
                })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(newBoost.meta).toEqual({ nice: 'nice!' });
        });

        it("should allow you to update a published boost's meta", async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.LIVE,
                meta: { nice: 'lol' },
            });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            expect(boost.status).toBe(BoostStatus.enum.LIVE);
            expect(boost.meta).toEqual({ nice: 'lol' });

            await expect(
                userA.clients.fullAuth.boost.updateBoost({
                    uri,
                    updates: { meta: { nice: 'nice!' } },
                })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(newBoost.meta).toEqual({ nice: 'nice!' });
        });

        it('should not remove existing meta keys', async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
                meta: { nice: 'lol' },
            });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            expect(boost.status).toBe(BoostStatus.enum.DRAFT);
            expect(boost.meta).toEqual({ nice: 'lol' });

            await expect(
                userA.clients.fullAuth.boost.updateBoost({
                    uri,
                    updates: { meta: { neat: 'lol' } },
                })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(newBoost.meta).toEqual({ nice: 'lol', neat: 'lol' });
        });

        it("should allow you to update a draft boost's meta key with null to remove it", async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
                meta: { nice: 'lol' },
            });
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            expect(boost.status).toBe(BoostStatus.enum.DRAFT);
            expect(boost.meta).toEqual({ nice: 'lol' });

            await expect(
                userA.clients.fullAuth.boost.updateBoost({
                    uri,
                    updates: { meta: { nice: null, neat: 'lol' } },
                })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(newBoost.meta).toEqual({ neat: 'lol' });
        });

        it('should allow admins to update boost credential', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            const beforeUpdateBoostCredential = await userA.clients.fullAuth.storage.resolve({
                uri,
            });
            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri,
                    updates: { credential: testUnsignedBoost },
                })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(
                await userA.clients.fullAuth.storage.resolve({ uri: newBoost.uri })
            ).not.toMatchObject(beforeUpdateBoostCredential);
        });

        it('should not allow non-admins to update boost credential', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });

            const beforeUpdateBoostCredential = await userA.clients.fullAuth.storage.resolve({
                uri,
            });
            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri,
                    updates: { credential: testUnsignedBoost },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            const newBoosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const newBoost = newBoosts.records[0]!;

            expect(
                await userA.clients.fullAuth.storage.resolve({ uri: newBoost.uri })
            ).toMatchObject(beforeUpdateBoostCredential);
        });
    });

    describe('getBoostAdmins', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to get boost admins', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            await userA.clients.fullAuth.boost.getBoostAdmins({ uri });

            await expect(noAuthClient.boost.getBoostAdmins({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.getBoostAdmins({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow getting boost admins', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            await expect(
                userA.clients.fullAuth.boost.getBoostAdmins({ uri })
            ).resolves.not.toThrow();

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(1);

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(2);
        });

        it('should allow discluding self in boost admins', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri, includeSelf: false }))
                    .records
            ).toHaveLength(0);

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri, includeSelf: false }))
                    .records
            ).toHaveLength(1);
        });

        it('should allow anyone to see boost admins', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(
                (await userB.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(1);
        });

        it('should paginate correctly', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await Promise.all(
                Array(10)
                    .fill(0)
                    .map(async (_zero, index) => {
                        const client = getClient({
                            did: `did:test:${index + 1}`,
                            isChallengeValid: true,
                            scope: '*:*',
                        });
                        await client.profile.createProfile({ profileId: `generated${index + 1}` });
                        await userA.clients.fullAuth.boost.addBoostAdmin({
                            uri,
                            profileId: `generated${index + 1}`,
                        });
                    })
            );

            const admins = await userA.clients.fullAuth.boost.getBoostAdmins({
                uri,
                includeSelf: false,
                limit: 20,
            });

            expect(admins.records).toHaveLength(10);

            const firstPage = await userA.clients.fullAuth.boost.getBoostAdmins({
                uri,
                includeSelf: false,
                limit: 5,
            });

            expect(firstPage.records).toHaveLength(5);
            expect(firstPage.hasMore).toBeTruthy();
            expect(firstPage.cursor).toBeDefined();

            const secondPage = await userA.clients.fullAuth.boost.getBoostAdmins({
                uri,
                includeSelf: false,
                limit: 5,
                cursor: firstPage.cursor,
            });

            expect(secondPage.hasMore).toBeFalsy();

            expect([...firstPage.records, ...secondPage.records]).toEqual(admins.records);
        });
    });

    describe('addBoostAdmin', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to add boost admin', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await expect(
                noAuthClient.boost.addBoostAdmin({ uri, profileId: 'userb' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.addBoostAdmin({ uri, profileId: 'userb' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow adding boost admins', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(1);

            await expect(
                userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' })
            ).resolves.not.toThrow();

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(2);
        });

        it('should allow admins to add more admins', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(2);

            await expect(
                userB.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userc' })
            ).resolves.not.toThrow();

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(3);
        });

        it('should not allow non-admins to add more admins', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(1);

            await expect(
                userB.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userc' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(1);
        });
    });

    describe('removeBoostAdmin', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to remove boost admin', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            await expect(
                noAuthClient.boost.removeBoostAdmin({ uri, profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.boost.removeBoostAdmin({ uri, profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow removing boost admins', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(2);

            await expect(
                userA.clients.fullAuth.boost.removeBoostAdmin({ uri, profileId: 'userb' })
            ).resolves.not.toThrow();

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(1);
        });

        it('should only allow admins to remove admins', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(2);

            await expect(
                userC.clients.fullAuth.boost.removeBoostAdmin({ uri, profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(2);
        });

        it('should not allow removing boost creator', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(2);

            await expect(
                userB.clients.fullAuth.boost.removeBoostAdmin({ uri, profileId: 'usera' })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });

            await expect(
                userA.clients.fullAuth.boost.removeBoostAdmin({ uri, profileId: 'usera' })
            ).rejects.toMatchObject({ code: 'FORBIDDEN' });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(2);
        });

        it('should allow admins to remove themselves', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ uri, profileId: 'userb' });

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(2);

            await expect(
                userB.clients.fullAuth.boost.removeBoostAdmin({ uri, profileId: 'userb' })
            ).resolves.not.toThrow();

            expect(
                (await userA.clients.fullAuth.boost.getBoostAdmins({ uri })).records
            ).toHaveLength(1);
        });
    });

    describe('deleteBoost', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to delete a boost', async () => {
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const uri = boosts.records[0]!.uri;

            await expect(noAuthClient.boost.deleteBoost({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.deleteBoost({ uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to delete a draft boost', async () => {
            const draftBoostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });

            const beforeDeleteLength = (await userA.clients.fullAuth.boost.getPaginatedBoosts())
                .records.length;
            await expect(
                userA.clients.fullAuth.boost.deleteBoost({ uri: draftBoostUri })
            ).resolves.not.toThrow();

            expect((await userA.clients.fullAuth.boost.getPaginatedBoosts()).records).toHaveLength(
                beforeDeleteLength - 1
            );
        });

        it('should allow admins to delete a draft boost', async () => {
            const draftBoostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                uri: draftBoostUri,
                profileId: 'userb',
            });

            const beforeDeleteLength = (await userA.clients.fullAuth.boost.getPaginatedBoosts())
                .records.length;
            await expect(
                userB.clients.fullAuth.boost.deleteBoost({ uri: draftBoostUri })
            ).resolves.not.toThrow();

            expect((await userA.clients.fullAuth.boost.getPaginatedBoosts()).records).toHaveLength(
                beforeDeleteLength - 1
            );
        });

        it('should not allow non-admins to delete a draft boost', async () => {
            const draftBoostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });

            const beforeDeleteLength = (await userA.clients.fullAuth.boost.getPaginatedBoosts())
                .records.length;
            await expect(
                userB.clients.fullAuth.boost.deleteBoost({ uri: draftBoostUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            expect((await userA.clients.fullAuth.boost.getPaginatedBoosts()).records).toHaveLength(
                beforeDeleteLength
            );
        });

        it('should allow deleting a published boost', async () => {
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            const beforeDeleteLength = (await userA.clients.fullAuth.boost.getPaginatedBoosts())
                .records.length;
            await expect(userA.clients.fullAuth.boost.deleteBoost({ uri })).resolves.not.toThrow();

            expect((await userA.clients.fullAuth.boost.getPaginatedBoosts()).records).toHaveLength(
                beforeDeleteLength - 1
            );
        });

        it('should not allow deleting a boost with children', async () => {
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const boost = boosts.records[0]!;
            const uri = boost.uri;

            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: uri,
                boost: { credential: testVc, status: BoostStatus.enum.DRAFT },
            });

            const beforeDeleteLength = (await userA.clients.fullAuth.boost.getPaginatedBoosts())
                .records.length;
            await expect(userB.clients.fullAuth.boost.deleteBoost({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });

            expect((await userA.clients.fullAuth.boost.getPaginatedBoosts()).records).toHaveLength(
                beforeDeleteLength
            );
        });
    });

    describe('claimBoost', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            await userA.clients.fullAuth.boost.createBoost({ credential: testUnsignedBoost });

            await userA.clients.fullAuth.profile.registerSigningAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
                did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw',
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} });
        });

        it('should require full auth to generate a claim boost', async () => {
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const uri = boosts.records[0]!.uri;

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });
            if (sa) {
                const claimLinkSA = {
                    endpoint: sa.signingAuthority.endpoint,
                    name: sa.relationship.name,
                };

                await expect(
                    noAuthClient.boost.generateClaimLink({ boostUri: uri, claimLinkSA })
                ).rejects.toMatchObject({
                    code: 'UNAUTHORIZED',
                });
                await expect(
                    userA.clients.partialAuth.boost.generateClaimLink({
                        boostUri: uri,
                        claimLinkSA,
                    })
                ).rejects.toMatchObject({
                    code: 'UNAUTHORIZED',
                });
            } else {
                expect(sa).toBeDefined();
            }
        });

        it('should prevent generating a claim boost link for a draft boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                status: BoostStatus.enum.DRAFT,
            });

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });
            if (sa) {
                const claimLinkSA = {
                    endpoint: sa.signingAuthority.endpoint,
                    name: sa.relationship.name,
                };

                await expect(
                    userA.clients.fullAuth.boost.generateClaimLink({ boostUri: uri, claimLinkSA })
                ).rejects.toMatchObject({
                    code: 'FORBIDDEN',
                });
            } else {
                expect(sa).toBeDefined();
            }
        });

        it('should generate a valid claim challenge', async () => {
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const uri = boosts.records[0]!.uri;

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });
            if (sa) {
                const claimLinkSA = {
                    endpoint: sa.signingAuthority.endpoint,
                    name: sa.relationship.name,
                };
                const challenge = 'mychallenge';

                await expect(
                    userA.clients.fullAuth.boost.generateClaimLink({
                        boostUri: uri,
                        challenge,
                        claimLinkSA,
                    })
                ).resolves.toMatchObject({
                    boostUri: uri,
                    challenge,
                });
            } else {
                expect(sa).toBeDefined();
            }
        });

        it('should allow claiming a claimable boost', async () => {
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const uri = boosts.records[0]!.uri;

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });
            if (sa) {
                const claimLinkSA = {
                    endpoint: sa.signingAuthority.endpoint,
                    name: sa.relationship.name,
                };
                const challenge = 'mychallenge';

                await expect(
                    userA.clients.fullAuth.boost.generateClaimLink({
                        boostUri: uri,
                        challenge,
                        claimLinkSA,
                    })
                ).resolves.toMatchObject({
                    boostUri: uri,
                    challenge,
                });

                // Verify at least 2 folks can claim the boost!
                await expect(
                    userB.clients.fullAuth.boost.claimBoostWithLink({ boostUri: uri, challenge })
                ).resolves.not.toThrow();
                await expect(
                    userC.clients.fullAuth.boost.claimBoostWithLink({ boostUri: uri, challenge })
                ).resolves.not.toThrow();
            } else {
                expect(sa).toBeDefined();
            }
        });

        it("should auto-accept a boost you've claimed", async () => {
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const uri = boosts.records[0]!.uri;

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });
            if (sa) {
                const claimLinkSA = {
                    endpoint: sa.signingAuthority.endpoint,
                    name: sa.relationship.name,
                };
                const challenge = 'mychallenge';

                await expect(
                    userA.clients.fullAuth.boost.generateClaimLink({
                        boostUri: uri,
                        challenge,
                        claimLinkSA,
                    })
                ).resolves.toMatchObject({
                    boostUri: uri,
                    challenge,
                });

                // Verify user B doesn't have to accept the credential (it's implicitly accepted by claiming it)
                await expect(
                    userB.clients.fullAuth.boost.claimBoostWithLink({ boostUri: uri, challenge })
                ).resolves.not.toThrow();

                // Because it's accepted implicitly, it shouldn't show up in incoming credentials
                const incoming = await userB.clients.fullAuth.credential.incomingCredentials();
                expect(incoming[0]).toBeUndefined();

                // And it should show up in received credentials.
                const credentials = await userB.clients.fullAuth.credential.receivedCredentials();
                expect(credentials[0]).toBeDefined();
            } else {
                expect(sa).toBeDefined();
            }
        });

        it('should set NO TTL for a claimable boost if no expiration is specified', async () => {
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const uri = boosts.records[0]!.uri;

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });
            if (sa) {
                const claimLinkSA = {
                    endpoint: sa.signingAuthority.endpoint,
                    name: sa.relationship.name,
                };
                const challenge = 'mychallenge';

                await expect(
                    userA.clients.fullAuth.boost.generateClaimLink({
                        boostUri: uri,
                        challenge,
                        claimLinkSA,
                    })
                ).resolves.toMatchObject({
                    boostUri: uri,
                    challenge,
                });

                await expect(
                    getClaimLinkOptionsInfoForBoost(uri, challenge)
                ).resolves.toMatchObject({});
                await expect(getTTLForClaimLink(uri, challenge)).resolves.toBe(-1);
            } else {
                expect(sa).toBeDefined();
            }
        });

        it('should allow setting a custom time to live in seconds for a claimable boost', async () => {
            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const uri = boosts.records[0]!.uri;

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });
            if (sa) {
                const claimLinkSA = {
                    endpoint: sa.signingAuthority.endpoint,
                    name: sa.relationship.name,
                };
                const challenge = 'mychallenge';

                await expect(
                    userA.clients.fullAuth.boost.generateClaimLink({
                        boostUri: uri,
                        challenge,
                        claimLinkSA,
                        options: { ttlSeconds: 50_000 },
                    })
                ).resolves.toMatchObject({
                    boostUri: uri,
                    challenge,
                });

                await expect(
                    getClaimLinkOptionsInfoForBoost(uri, challenge)
                ).resolves.toMatchObject({ ttlSeconds: 50_000 });
                await expect(getTTLForClaimLink(uri, challenge)).resolves.toBeGreaterThan(45_000);
            } else {
                expect(sa).toBeDefined();
            }
        });

        it('should allow claiming a claimable boost with limited claim count', async () => {
            await userD.clients.fullAuth.profile.createProfile({ profileId: 'userd' });
            await userE.clients.fullAuth.profile.createProfile({ profileId: 'usere' });

            const boosts = await userA.clients.fullAuth.boost.getPaginatedBoosts();
            const uri = boosts.records[0]!.uri;

            const sa = await userA.clients.fullAuth.profile.signingAuthority({
                endpoint: 'http://localhost:5000/api',
                name: 'mysa',
            });
            if (sa) {
                const claimLinkSA = {
                    endpoint: sa.signingAuthority.endpoint,
                    name: sa.relationship.name,
                };
                const challenge = 'mychallenge';

                await expect(
                    userA.clients.fullAuth.boost.generateClaimLink({
                        boostUri: uri,
                        challenge,
                        claimLinkSA,
                        options: { totalUses: 3 },
                    })
                ).resolves.toMatchObject({
                    boostUri: uri,
                    challenge,
                });

                const ttlBeforeClaims = await getTTLForClaimLink(uri, challenge);
                expect(ttlBeforeClaims).toBeDefined();

                await expect(
                    userB.clients.fullAuth.boost.claimBoostWithLink({ boostUri: uri, challenge })
                ).resolves.not.toThrow();
                await expect(
                    userC.clients.fullAuth.boost.claimBoostWithLink({ boostUri: uri, challenge })
                ).resolves.not.toThrow();

                // Ensure that the TTL of the claim link is NOT being reset after users claim it.
                const ttlAfterClaims = await getTTLForClaimLink(uri, challenge);
                if (ttlBeforeClaims === -1) {
                    expect(ttlAfterClaims).toBe(ttlBeforeClaims);
                } else if (ttlBeforeClaims) {
                    expect(ttlAfterClaims).toBeLessThan(ttlBeforeClaims);
                }

                await expect(
                    userD.clients.fullAuth.boost.claimBoostWithLink({ boostUri: uri, challenge })
                ).resolves.not.toThrow();

                // After 3 boosts have been claimed, this should reject the next user who tries to claim it
                await expect(
                    userE.clients.fullAuth.boost.claimBoostWithLink({ boostUri: uri, challenge })
                ).rejects.toThrow();
            } else {
                expect(sa).toBeDefined();
            }
        });
    });

    describe('countBoosts', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to count boosts', async () => {
            await expect(noAuthClient.boost.countBoosts()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.boost.countBoosts()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should return 0 when user has no boosts', async () => {
            const count = await userA.clients.fullAuth.boost.countBoosts();
            expect(count).toBe(0);
        });

        it('should count boosts created by the user', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            const count = await userA.clients.fullAuth.boost.countBoosts();
            expect(count).toBe(2);
        });

        it('should count boosts where user is an admin', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });
            const uriB = await userB.clients.fullAuth.boost.createBoost({ credential: testVc });

            await userB.clients.fullAuth.boost.addBoostAdmin({ uri: uriB, profileId: 'usera' });

            const count = await userA.clients.fullAuth.boost.countBoosts();
            expect(count).toBe(2);
        });

        it('should not count boosts where user is not creator or admin', async () => {
            await userB.clients.fullAuth.boost.createBoost({ credential: testVc });

            const count = await userA.clients.fullAuth.boost.countBoosts();
            expect(count).toBe(0);
        });

        it('should count distinct boosts only', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });
            const uriB = await userB.clients.fullAuth.boost.createBoost({ credential: testVc });

            // Make userA an admin of userB's boost
            await userB.clients.fullAuth.boost.addBoostAdmin({ uri: uriB, profileId: 'usera' });

            const count = await userA.clients.fullAuth.boost.countBoosts();
            expect(count).toBe(2); // userA should see 2 distinct boosts: one they created and one they're an admin of
        });

        it('should allow querying boosts', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'A' });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'B' });

            await expect(
                userA.clients.fullAuth.boost.countBoosts({ query: { category: 'A' } })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoosts({
                query: { category: 'A' },
            });

            expect(count).toEqual(1);
        });

        it('should allow querying with $in', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'A' });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'B' });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'C' });

            await expect(
                userA.clients.fullAuth.boost.countBoosts({
                    query: { category: { $in: ['A', 'B'] } },
                })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoosts({
                query: { category: { $in: ['A', 'B'] } },
            });

            expect(count).toEqual(2);
        });

        it('should allow querying with $regex', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'All' });
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'allo',
            });
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc, category: 'C' });

            await expect(
                userA.clients.fullAuth.boost.countBoosts({
                    query: { category: { $regex: /all/i } },
                })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoosts({
                query: { category: { $regex: /all/i } },
            });

            expect(count).toEqual(2);
        });
    });

    describe('createChildBoost', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should not allow you to create a child boost without full auth', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await expect(
                noAuthClient.boost.createChildBoost({ parentUri, boost: { credential: testVc } })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testVc },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to make a child boost a parent', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await expect(
                userA.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testVc },
                })
            ).resolves.not.toThrow();
        });
    });

    describe('makeBoostParent', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should not allow you to make a boost a parent without full auth', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(
                noAuthClient.boost.makeBoostParent({ parentUri, childUri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.makeBoostParent({ parentUri, childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to make a boost a parent', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(
                userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri })
            ).resolves.not.toThrow();
        });

        it("should not allow making a parent when it's already a parent", async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(
                userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri })
            ).resolves.not.toThrow();

            await expect(
                userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it("should not allow making a parent when it's already a grandparent", async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            await expect(
                userA.clients.fullAuth.boost.makeBoostParent({
                    parentUri: grandParentUri,
                    childUri,
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it("should not allow making a parent when it's already a child", async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(
                userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri })
            ).resolves.not.toThrow();

            await expect(
                userA.clients.fullAuth.boost.makeBoostParent({
                    parentUri: childUri,
                    childUri: parentUri,
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it("should not allow making a parent when it's already a grandchild", async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            await expect(
                userA.clients.fullAuth.boost.makeBoostParent({
                    parentUri: childUri,
                    childUri: grandParentUri,
                })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });
    });

    describe('getBoostChildren', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to get boost children', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await expect(
                noAuthClient.boost.getBoostChildren({ uri: parentUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.boost.getBoostChildren({ uri: parentUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow getting boost children', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            await expect(
                userA.clients.fullAuth.boost.getBoostChildren({ uri: parentUri })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostChildren({ uri: parentUri });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('B');
        });

        it('should not return parents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const boosts = await userA.clients.fullAuth.boost.getBoostChildren({ uri: parentUri });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('B');
        });

        it('should not return grandchildren', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const boosts = await userA.clients.fullAuth.boost.getBoostChildren({
                uri: grandParentUri,
            });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('A');
        });

        it('should allow returning grandchildren', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const boosts = await userA.clients.fullAuth.boost.getBoostChildren({
                uri: grandParentUri,
                numberOfGenerations: Infinity,
            });

            expect(boosts.records).toHaveLength(2);
        });

        it('should allow querying boost children', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            await expect(
                userA.clients.fullAuth.boost.getBoostChildren({
                    uri: parentUri,
                    query: { category: 'A' },
                })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostChildren({
                uri: parentUri,
                query: { category: 'A' },
            });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('A');
        });

        it('should allow querying with $in', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'C' },
            });

            await expect(
                userA.clients.fullAuth.boost.getBoostChildren({
                    uri: parentUri,
                    query: { category: { $in: ['A', 'B'] } },
                })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostChildren({
                uri: parentUri,
                query: { category: { $in: ['A', 'B'] } },
            });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records[0]?.category).not.toEqual('C');
            expect(boosts.records[1]?.category).not.toEqual('C');
        });

        it('should allow querying with $regex', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'All' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'allo' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'C' },
            });

            await expect(
                userA.clients.fullAuth.boost.getBoostChildren({
                    uri: parentUri,
                    query: { category: { $regex: /all/i } },
                })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostChildren({
                uri: parentUri,
                query: { category: { $regex: /all/i } },
            });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records[0]?.category).not.toEqual('C');
            expect(boosts.records[1]?.category).not.toEqual('C');
        });

        it('should paginate correctly', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            for (let index = 0; index < 10; index += 1) {
                await userA.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testVc, name: `Test ${index}` },
                });
            }

            await expect(
                userA.clients.fullAuth.boost.getBoostChildren({ uri: parentUri })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostChildren({
                uri: parentUri,
                limit: 20,
            });

            expect(boosts.records).toHaveLength(10);

            const firstPage = await userA.clients.fullAuth.boost.getBoostChildren({
                uri: parentUri,
                limit: 5,
            });

            expect(firstPage.records).toHaveLength(5);
            expect(firstPage.hasMore).toBeTruthy();
            expect(firstPage.cursor).toBeDefined();

            const secondPage = await userA.clients.fullAuth.boost.getBoostChildren({
                uri: parentUri,
                limit: 5,
                cursor: firstPage.cursor,
            });

            expect(secondPage.hasMore).toBeFalsy();

            expect([...firstPage.records, ...secondPage.records]).toEqual(boosts.records);
        });

        it('should include meta', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B', meta: { nice: 'lol' } },
            });

            const boosts = await userA.clients.fullAuth.boost.getBoostChildren({ uri: parentUri });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('B');
            expect(boosts.records[0]?.meta).toEqual({ nice: 'lol' });
        });
    });

    describe('countBoostChildren', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to count boost children', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await expect(
                noAuthClient.boost.countBoostChildren({ uri: parentUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.boost.countBoostChildren({ uri: parentUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow counting boost children', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            await expect(
                userA.clients.fullAuth.boost.countBoostChildren({ uri: parentUri })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostChildren({ uri: parentUri });

            expect(count).toEqual(1);
        });

        it('should not count parents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            const count = await userA.clients.fullAuth.boost.countBoostChildren({ uri: parentUri });

            expect(count).toEqual(1);
        });

        it('should not count grandchildren', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            const count = await userA.clients.fullAuth.boost.countBoostChildren({
                uri: grandParentUri,
            });

            expect(count).toEqual(1);
        });

        it('should allow counting grandchildren', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            const count = await userA.clients.fullAuth.boost.countBoostChildren({
                uri: grandParentUri,
                numberOfGenerations: Infinity,
            });

            expect(count).toEqual(2);
        });

        it('should allow querying boost children', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const child1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const child2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri: child1Uri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri: child2Uri });

            await expect(
                userA.clients.fullAuth.boost.countBoostChildren({
                    uri: parentUri,
                    query: { category: 'A' },
                })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostChildren({
                uri: parentUri,
                query: { category: 'A' },
            });

            expect(count).toEqual(1);
        });

        it('should allow querying with $in', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'C' },
            });

            await expect(
                userA.clients.fullAuth.boost.countBoostChildren({
                    uri: parentUri,
                    query: { category: { $in: ['A', 'B'] } },
                })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostChildren({
                uri: parentUri,
                query: { category: { $in: ['A', 'B'] } },
            });

            expect(count).toEqual(2);
        });

        it('should allow querying with $regex', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'All' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'allo' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'C' },
            });

            await expect(
                userA.clients.fullAuth.boost.countBoostChildren({
                    uri: parentUri,
                    query: { category: { $regex: /all/i } },
                })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostChildren({
                uri: parentUri,
                query: { category: { $regex: /all/i } },
            });

            expect(count).toEqual(2);
        });
    });

    describe('getBoostSiblings', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to get boost siblings', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await expect(
                noAuthClient.boost.getBoostSiblings({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.boost.getBoostSiblings({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow getting boost siblings', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            await expect(
                userA.clients.fullAuth.boost.getBoostSiblings({ uri: childUri })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostSiblings({ uri: childUri });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('B');
        });

        it('should not return cousins', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const parent2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent2Uri,
                boost: { credential: testVc, category: 'C' },
            });

            const boosts = await userA.clients.fullAuth.boost.getBoostSiblings({ uri: childUri });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('B');
        });

        it('should return siblings from multiple parents', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent2Uri,
                boost: { credential: testVc, category: 'C' },
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent2Uri, childUri });

            await expect(
                userA.clients.fullAuth.boost.getBoostSiblings({ uri: childUri })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostSiblings({ uri: childUri });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records[0]?.category).not.toEqual('A');
            expect(boosts.records[1]?.category).not.toEqual('A');
        });

        it('should allow querying boost siblings', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'C' },
            });

            await expect(
                userA.clients.fullAuth.boost.getBoostSiblings({
                    uri: childUri,
                    query: { category: 'B' },
                })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostSiblings({
                uri: childUri,
                query: { category: 'B' },
            });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('B');
        });

        it('should allow querying with $in', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'C' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'D' },
            });

            await expect(
                userA.clients.fullAuth.boost.getBoostSiblings({
                    uri: childUri,
                    query: { category: { $in: ['B', 'C'] } },
                })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostSiblings({
                uri: childUri,
                query: { category: { $in: ['B', 'C'] } },
            });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records[0]?.category).not.toEqual('D');
            expect(boosts.records[1]?.category).not.toEqual('D');
        });

        it('should allow querying with $regex', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'All' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'allo' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'C' },
            });

            await expect(
                userA.clients.fullAuth.boost.getBoostSiblings({
                    uri: childUri,
                    query: { category: { $regex: /all/i } },
                })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostSiblings({
                uri: childUri,
                query: { category: { $regex: /all/i } },
            });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records[0]?.category).not.toEqual('C');
            expect(boosts.records[1]?.category).not.toEqual('C');
        });

        it('should paginate correctly', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'Nice' },
            });

            for (let index = 0; index < 10; index += 1) {
                await userA.clients.fullAuth.boost.createChildBoost({
                    parentUri,
                    boost: { credential: testVc, name: `Test ${index}` },
                });
            }

            await expect(
                userA.clients.fullAuth.boost.getBoostSiblings({ uri: childUri })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostSiblings({
                uri: childUri,
                limit: 20,
            });

            expect(boosts.records).toHaveLength(10);

            const firstPage = await userA.clients.fullAuth.boost.getBoostSiblings({
                uri: childUri,
                limit: 5,
            });

            expect(firstPage.records).toHaveLength(5);
            expect(firstPage.hasMore).toBeTruthy();
            expect(firstPage.cursor).toBeDefined();

            const secondPage = await userA.clients.fullAuth.boost.getBoostSiblings({
                uri: childUri,
                limit: 5,
                cursor: firstPage.cursor,
            });

            expect(secondPage.hasMore).toBeFalsy();

            expect([...firstPage.records, ...secondPage.records]).toEqual(boosts.records);
        });

        it('should include meta', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B', meta: { nice: 'lol' } },
            });

            const boosts = await userA.clients.fullAuth.boost.getBoostSiblings({ uri: childUri });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('B');
            expect(boosts.records[0]?.meta).toEqual({ nice: 'lol' });
        });
    });

    describe('countBoostSiblings', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to count boost siblings', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await expect(
                noAuthClient.boost.countBoostSiblings({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.boost.countBoostSiblings({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow counting boost siblings', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await expect(
                userA.clients.fullAuth.boost.countBoostSiblings({ uri: childUri })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostSiblings({ uri: childUri });

            expect(count).toEqual(1);
        });

        it('should not count cousins', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            const parent2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent2Uri,
                boost: { credential: testVc },
            });

            const count = await userA.clients.fullAuth.boost.countBoostSiblings({ uri: childUri });

            expect(count).toEqual(1);
        });

        it('should count siblings from multiple parents', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent2Uri,
                boost: { credential: testVc },
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent2Uri, childUri });

            await expect(
                userA.clients.fullAuth.boost.countBoostSiblings({ uri: childUri })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostSiblings({ uri: childUri });

            expect(count).toEqual(2);
        });

        it('should allow querying boost siblings', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'C' },
            });

            await expect(
                userA.clients.fullAuth.boost.countBoostSiblings({
                    uri: childUri,
                    query: { category: 'B' },
                })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostSiblings({
                uri: childUri,
                query: { category: 'B' },
            });

            expect(count).toEqual(1);
        });

        it('should allow querying with $in', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'C' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'D' },
            });

            await expect(
                userA.clients.fullAuth.boost.countBoostSiblings({
                    uri: childUri,
                    query: { category: { $in: ['B', 'C'] } },
                })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostSiblings({
                uri: childUri,
                query: { category: { $in: ['B', 'C'] } },
            });

            expect(count).toEqual(2);
        });

        it('should allow querying with $regex', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'All' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'allo' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'C' },
            });

            await expect(
                userA.clients.fullAuth.boost.countBoostSiblings({
                    uri: childUri,
                    query: { category: { $regex: /all/i } },
                })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostSiblings({
                uri: childUri,
                query: { category: { $regex: /all/i } },
            });

            expect(count).toEqual(2);
        });
    });

    describe('getFamilialBoosts', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to get familial boosts', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await expect(
                noAuthClient.boost.getFamilialBoosts({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.boost.getFamilialBoosts({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow getting familial boosts', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, category: 'C' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'D' },
            });

            await expect(
                userA.clients.fullAuth.boost.getFamilialBoosts({ uri: childUri })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({ uri: childUri });

            expect(boosts.records).toHaveLength(3);
            expect(boosts.records[0]?.category).not.toEqual('B');
            expect(boosts.records[1]?.category).not.toEqual('B');
            expect(boosts.records[2]?.category).not.toEqual('B');
        });

        it('should return children', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: {
                    credential: testVc,
                },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testVc,
                    category: 'B',
                },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({ uri: parentUri });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records.some(boost => boost.category === 'B')).toBeTruthy();
        });

        it('should return parents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({ uri: parentUri });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records.some(boost => boost.category === 'A')).toBeTruthy();
        });

        it('should return siblings', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({ uri: childUri });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records.some(boost => boost.category === 'B')).toBeTruthy();
        });

        it('should not return grandparents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, category: 'B' },
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({ uri: childUri });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('B');
        });

        it('should allow returning grandparents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, category: 'B' },
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: childUri,
                parentGenerations: Infinity,
            });

            expect(boosts.records).toHaveLength(2);
        });

        it('should not return grandchildren', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: grandParentUri,
            });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('A');
        });

        it('should allow returning grandchildren', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: grandParentUri,
                childGenerations: Infinity,
            });

            expect(boosts.records).toHaveLength(2);
        });

        it('should allow different numbers of generations for children/parents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                name: 'My Grandpa',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, name: 'My Dad' },
            });
            const middleUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'Me' },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: middleUri,
                boost: { credential: testVc, name: 'My Son' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, name: 'My Grandson' },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: middleUri,
                childGenerations: 2,
                parentGenerations: 1,
            });

            expect(boosts.records).toHaveLength(3);
            expect(boosts.records.some(boost => boost.name === 'My Grandpa')).toBeFalsy();
            expect(boosts.records.some(boost => boost.name === 'My Dad')).toBeTruthy();
            expect(boosts.records.some(boost => boost.name === 'My Son')).toBeTruthy();
            expect(boosts.records.some(boost => boost.name === 'My Grandson')).toBeTruthy();
        });

        it('should not return cousins', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const parent2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent2Uri,
                boost: { credential: testVc, category: 'C' },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: childUri,
                parentGenerations: Infinity,
                childGenerations: Infinity,
            });

            expect(boosts.records).toHaveLength(3);
            expect(boosts.records.some(boost => boost.category === 'C')).toBeFalsy();
            expect(boosts.records.some(boost => boost.category === 'B')).toBeTruthy();
        });

        it('should allow returning cousins', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const parent2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent2Uri,
                boost: { credential: testVc, category: 'C' },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: childUri,
                parentGenerations: Infinity,
                childGenerations: Infinity,
                includeExtendedFamily: true,
            });

            expect(boosts.records).toHaveLength(5);
            expect(boosts.records.some(boost => boost.category === 'C')).toBeTruthy();
        });

        it('should return siblings from multiple parents', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent2Uri,
                boost: { credential: testVc, category: 'C' },
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent2Uri, childUri });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({ uri: childUri });

            expect(boosts.records).toHaveLength(4);
        });

        it('should allow querying familial boosts', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                name: 'My Grandpa',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, name: 'My Dad' },
            });
            const middleUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'Me' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'My Brother' },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: middleUri,
                boost: { credential: testVc, name: 'My Son' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, name: 'My Grandson' },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: middleUri,
                query: { name: 'My Son' },
            });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.name).toEqual('My Son');
        });

        it('should allow querying with $in', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                name: 'My Grandpa',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, name: 'My Dad' },
            });
            const middleUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'Me' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'My Brother' },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: middleUri,
                boost: { credential: testVc, name: 'My Son' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, name: 'My Grandson' },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: middleUri,
                query: { name: { $in: ['My Dad', 'My Brother'] } },
            });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records.some(boost => boost.name === 'My Dad')).toBeTruthy();
            expect(boosts.records.some(boost => boost.name === 'My Brother')).toBeTruthy();
        });

        it('should allow querying with $regex', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                name: 'My Grandpa',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, name: 'My Dad' },
            });
            const middleUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'Me' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'My Brother' },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: middleUri,
                boost: { credential: testVc, name: 'My Son' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, name: 'My Grandson' },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: middleUri,
                parentGenerations: Infinity,
                childGenerations: Infinity,
                query: { name: { $regex: /son/i } },
            });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records.some(boost => boost.name === 'My Son')).toBeTruthy();
            expect(boosts.records.some(boost => boost.name === 'My Grandson')).toBeTruthy();
        });

        it('should paginate correctly', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                name: 'My Grandpa',
            });
            const grandParent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                name: 'My Grandma',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, name: 'My Dad' },
            });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParent2Uri,
                childUri: parentUri,
            });

            const middleUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'Me' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'My Brother' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'My Sister' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'My Other Brother' },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: middleUri,
                boost: { credential: testVc, name: 'My Son' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: middleUri,
                boost: { credential: testVc, name: 'My Daughter' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, name: 'My Grandson' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, name: 'My Granddaughter' },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: middleUri,
                parentGenerations: Infinity,
                childGenerations: Infinity,
                limit: 20,
            });

            expect(boosts.records).toHaveLength(10);

            const firstPage = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: middleUri,
                parentGenerations: Infinity,
                childGenerations: Infinity,
                limit: 5,
            });

            expect(firstPage.records).toHaveLength(5);
            expect(firstPage.hasMore).toBeTruthy();
            expect(firstPage.cursor).toBeDefined();

            const secondPage = await userA.clients.fullAuth.boost.getFamilialBoosts({
                uri: middleUri,
                parentGenerations: Infinity,
                childGenerations: Infinity,
                limit: 5,
                cursor: firstPage.cursor,
            });

            expect(secondPage.hasMore).toBeFalsy();

            expect([...firstPage.records, ...secondPage.records]).toEqual(boosts.records);
        });

        it('should include meta', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
                meta: { nice: 'lol' },
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, category: 'C', meta: { nice: 'lol' } },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'D', meta: { nice: 'lol' } },
            });

            const boosts = await userA.clients.fullAuth.boost.getFamilialBoosts({ uri: childUri });

            expect(boosts.records[0]?.meta).toEqual({ nice: 'lol' });
        });
    });

    describe('countFamilialBoosts', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to count familial boosts', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await expect(
                noAuthClient.boost.countFamilialBoosts({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.boost.countFamilialBoosts({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow counting familial boosts', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, category: 'C' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'D' },
            });

            await expect(
                userA.clients.fullAuth.boost.countFamilialBoosts({ uri: childUri })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({ uri: childUri });

            expect(count).toEqual(3);
        });

        it('should count children', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: {
                    credential: testVc,
                },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testVc,
                    category: 'B',
                },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({
                uri: parentUri,
            });

            expect(count).toEqual(2);
        });

        it('should count parents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({
                uri: parentUri,
            });

            expect(count).toEqual(2);
        });

        it('should count siblings', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({ uri: childUri });

            expect(count).toEqual(2);
        });

        it('should not count grandparents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, category: 'B' },
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({ uri: childUri });

            expect(count).toEqual(1);
        });

        it('should allow counting grandparents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, category: 'B' },
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({
                uri: childUri,
                parentGenerations: Infinity,
            });

            expect(count).toEqual(2);
        });

        it('should not count grandchildren', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({
                uri: grandParentUri,
            });

            expect(count).toEqual(1);
        });

        it('should allow counting grandchildren', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({
                uri: grandParentUri,
                childGenerations: Infinity,
            });

            expect(count).toEqual(2);
        });

        it('should allow different numbers of generations for children/parents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                name: 'My Grandpa',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, name: 'My Dad' },
            });
            const middleUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'Me' },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: middleUri,
                boost: { credential: testVc, name: 'My Son' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, name: 'My Grandson' },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({
                uri: middleUri,
                childGenerations: 2,
                parentGenerations: 1,
            });

            expect(count).toEqual(3);
        });

        it('should not count cousins', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const parent2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent2Uri,
                boost: { credential: testVc, category: 'C' },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({
                uri: childUri,
                parentGenerations: Infinity,
                childGenerations: Infinity,
            });

            expect(count).toEqual(3);
        });

        it('should allow counting cousins', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const parent2Uri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent2Uri,
                boost: { credential: testVc, category: 'C' },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({
                uri: childUri,
                parentGenerations: Infinity,
                childGenerations: Infinity,
                includeExtendedFamily: true,
            });

            expect(count).toEqual(5);
        });

        it('should count siblings from multiple parents', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'A' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, category: 'B' },
            });

            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: parent2Uri,
                boost: { credential: testVc, category: 'C' },
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent2Uri, childUri });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({ uri: childUri });

            expect(count).toEqual(4);
        });

        it('should allow querying familial boosts', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                name: 'My Grandpa',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, name: 'My Dad' },
            });
            const middleUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'Me' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'My Brother' },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: middleUri,
                boost: { credential: testVc, name: 'My Son' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, name: 'My Grandson' },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({
                uri: middleUri,
                query: { name: 'My Son' },
            });

            expect(count).toEqual(1);
        });

        it('should allow querying with $in', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                name: 'My Grandpa',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, name: 'My Dad' },
            });
            const middleUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'Me' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'My Brother' },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: middleUri,
                boost: { credential: testVc, name: 'My Son' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, name: 'My Grandson' },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({
                uri: middleUri,
                query: { name: { $in: ['My Dad', 'My Brother'] } },
            });

            expect(count).toEqual(2);
        });

        it('should allow querying with $regex', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                name: 'My Grandpa',
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc, name: 'My Dad' },
            });
            const middleUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'Me' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc, name: 'My Brother' },
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: middleUri,
                boost: { credential: testVc, name: 'My Son' },
            });
            await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: childUri,
                boost: { credential: testVc, name: 'My Grandson' },
            });

            const count = await userA.clients.fullAuth.boost.countFamilialBoosts({
                uri: middleUri,
                parentGenerations: Infinity,
                childGenerations: Infinity,
                query: { name: { $regex: /son/i } },
            });

            expect(count).toEqual(2);
        });
    });

    describe('getBoostParents', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to get boost parents', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            await expect(
                noAuthClient.boost.getBoostParents({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.boost.getBoostParents({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow getting boost parents', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            await expect(
                userA.clients.fullAuth.boost.getBoostParents({ uri: childUri })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostParents({ uri: childUri });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('B');
        });

        it('should not return children', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            const boosts = await userA.clients.fullAuth.boost.getBoostParents({ uri: parentUri });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('A');
        });

        it('should not return grandparents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            const boosts = await userA.clients.fullAuth.boost.getBoostParents({
                uri: childUri,
            });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('B');
        });

        it('should allow returning grandparents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            const boosts = await userA.clients.fullAuth.boost.getBoostParents({
                uri: childUri,
                numberOfGenerations: Infinity,
            });

            expect(boosts.records).toHaveLength(2);
        });

        it('should allow querying boost parents', async () => {
            const parent1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent1Uri, childUri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent2Uri, childUri });

            await expect(
                userA.clients.fullAuth.boost.getBoostParents({
                    uri: childUri,
                    query: { category: 'A' },
                })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostParents({
                uri: childUri,
                query: { category: 'A' },
            });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('A');
        });

        it('should allow querying with $in', async () => {
            const parent1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });
            const parent3Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'C',
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent1Uri, childUri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent2Uri, childUri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent3Uri, childUri });

            await expect(
                userA.clients.fullAuth.boost.getBoostParents({
                    uri: childUri,
                    query: { category: { $in: ['A', 'B'] } },
                })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostParents({
                uri: childUri,
                query: { category: { $in: ['A', 'B'] } },
            });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records[0]?.category).not.toEqual('C');
            expect(boosts.records[1]?.category).not.toEqual('C');
        });

        it('should allow querying with $regex', async () => {
            const parent1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'All',
            });
            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'allo',
            });
            const parent3Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'C',
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent1Uri, childUri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent2Uri, childUri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent3Uri, childUri });

            await expect(
                userA.clients.fullAuth.boost.getBoostParents({
                    uri: childUri,
                    query: { category: { $regex: /all/i } },
                })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostParents({
                uri: childUri,
                query: { category: { $regex: /all/i } },
            });

            expect(boosts.records).toHaveLength(2);
            expect(boosts.records[0]?.category).not.toEqual('C');
            expect(boosts.records[1]?.category).not.toEqual('C');
        });

        it('should paginate correctly', async () => {
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            for (let index = 0; index < 10; index += 1) {
                const parentUri = await userA.clients.fullAuth.boost.createBoost({
                    credential: testVc,
                    name: `Test ${index}`,
                });
                await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });
            }

            await expect(
                userA.clients.fullAuth.boost.getBoostParents({ uri: childUri })
            ).resolves.not.toThrow();

            const boosts = await userA.clients.fullAuth.boost.getBoostParents({
                uri: childUri,
                limit: 20,
            });

            expect(boosts.records).toHaveLength(10);

            const firstPage = await userA.clients.fullAuth.boost.getBoostParents({
                uri: childUri,
                limit: 5,
            });

            expect(firstPage.records).toHaveLength(5);
            expect(firstPage.hasMore).toBeTruthy();
            expect(firstPage.cursor).toBeDefined();

            const secondPage = await userA.clients.fullAuth.boost.getBoostParents({
                uri: childUri,
                limit: 5,
                cursor: firstPage.cursor,
            });

            expect(secondPage.hasMore).toBeFalsy();

            expect([...firstPage.records, ...secondPage.records]).toEqual(boosts.records);
        });

        it('should include meta', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
                meta: { nice: 'lol' },
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            const boosts = await userA.clients.fullAuth.boost.getBoostParents({ uri: childUri });

            expect(boosts.records).toHaveLength(1);
            expect(boosts.records[0]?.category).toEqual('B');
            expect(boosts.records[0]?.meta).toEqual({ nice: 'lol' });
        });
    });

    describe('countBoostParents', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should require full auth to count boost parents', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            await expect(
                noAuthClient.boost.countBoostParents({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.boost.countBoostParents({ uri: childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow counting boost parents', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            await expect(
                userA.clients.fullAuth.boost.countBoostParents({ uri: childUri })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostParents({ uri: childUri });

            expect(count).toEqual(1);
        });

        it('should not count children', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            const count = await userA.clients.fullAuth.boost.countBoostParents({ uri: parentUri });

            expect(count).toEqual(1);
        });

        it('should not count grandparents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            const count = await userA.clients.fullAuth.boost.countBoostParents({
                uri: childUri,
            });

            expect(count).toEqual(1);
        });

        it('should allow counting grandparents', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            const count = await userA.clients.fullAuth.boost.countBoostParents({
                uri: childUri,
                numberOfGenerations: Infinity,
            });

            expect(count).toEqual(2);
        });

        it('should allow querying boost parents', async () => {
            const parent1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent1Uri, childUri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent2Uri, childUri });

            await expect(
                userA.clients.fullAuth.boost.countBoostParents({
                    uri: childUri,
                    query: { category: 'A' },
                })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostParents({
                uri: childUri,
                query: { category: 'A' },
            });

            expect(count).toEqual(1);
        });

        it('should allow querying with $in', async () => {
            const parent1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });
            const parent3Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'C',
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent1Uri, childUri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent2Uri, childUri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent3Uri, childUri });

            await expect(
                userA.clients.fullAuth.boost.countBoostParents({
                    uri: childUri,
                    query: { category: { $in: ['A', 'B'] } },
                })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostParents({
                uri: childUri,
                query: { category: { $in: ['A', 'B'] } },
            });

            expect(count).toEqual(2);
        });

        it('should allow querying with $regex', async () => {
            const parent1Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'All',
            });
            const parent2Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'allo',
            });
            const parent3Uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'C',
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent1Uri, childUri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent2Uri, childUri });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri: parent3Uri, childUri });

            await expect(
                userA.clients.fullAuth.boost.countBoostParents({
                    uri: childUri,
                    query: { category: { $regex: /all/i } },
                })
            ).resolves.not.toThrow();

            const count = await userA.clients.fullAuth.boost.countBoostParents({
                uri: childUri,
                query: { category: { $regex: /all/i } },
            });

            expect(count).toEqual(2);
        });
    });

    describe('removeBoostParent', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should not allow you to remove a boost parent without full auth', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            await expect(
                noAuthClient.boost.removeBoostParent({ parentUri, childUri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.removeBoostParent({ parentUri, childUri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to remove a boost parent', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            const initialParentsCount = await userA.clients.fullAuth.boost.countBoostParents({
                uri: childUri,
            });

            await expect(
                userA.clients.fullAuth.boost.removeBoostParent({ parentUri, childUri })
            ).resolves.not.toThrow();

            const newParentsCount = await userA.clients.fullAuth.boost.countBoostParents({
                uri: childUri,
            });

            expect(initialParentsCount - newParentsCount).toEqual(1);
        });

        it("should not allow removing a parent when it isn't a parent", async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(
                userA.clients.fullAuth.boost.removeBoostParent({ parentUri, childUri })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it("should not allow removing a parent when it's a grandparent", async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'A',
            });
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                category: 'B',
            });

            await userA.clients.fullAuth.boost.makeBoostParent({
                parentUri: grandParentUri,
                childUri: parentUri,
            });
            await userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri });

            await expect(
                userA.clients.fullAuth.boost.removeBoostParent({
                    parentUri: grandParentUri,
                    childUri,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it("should not allow removing a parent when it's actually a child", async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const childUri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(
                userA.clients.fullAuth.boost.makeBoostParent({ parentUri, childUri })
            ).resolves.not.toThrow();

            await expect(
                userA.clients.fullAuth.boost.removeBoostParent({
                    parentUri: childUri,
                    childUri: parentUri,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });
    });

    describe('getBoostPermissions', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should not allow you to get permissions without full auth', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await expect(noAuthClient.boost.getBoostPermissions({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.getBoostPermissions({ uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to view permissions of boosts you created', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await expect(
                userA.clients.fullAuth.boost.getBoostPermissions({ uri })
            ).resolves.not.toThrow();

            const permissions = await userA.clients.fullAuth.boost.getBoostPermissions({ uri });

            expect(permissions).toEqual(creatorRole);
        });

        it('should allow you to view permissions of boosts you are admin of', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userB.clients.fullAuth.boost.getBoostPermissions({ uri });

            expect(permissions).toEqual(adminRole);
        });

        it('should allow you to view permissions of boosts you are not admin of', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            const permissions = await userB.clients.fullAuth.boost.getBoostPermissions({ uri });

            expect(permissions).toEqual(emptyRole);
        });

        it('should respect parent and grandparent overrides', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            const grandChildUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: grandParentUri,
            });

            const grandParentPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
                uri: grandParentUri,
            });

            expect(grandParentPermissions.canEditChildren).toEqual('*');

            const parentPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
                uri: parentUri,
            });

            expect(parentPermissions.canEdit).toBeTruthy();

            const grandChildPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
                uri: grandChildUri,
            });

            expect(grandChildPermissions.canEdit).toBeTruthy();
        });
    });

    describe('getOtherBoostPermissions', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should not allow you to get permissions without full auth', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await expect(
                noAuthClient.boost.getOtherBoostPermissions({ uri, profileId: 'usera' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.boost.getOtherBoostPermissions({
                    uri,
                    profileId: 'usera',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to view permissions of boosts you created', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await expect(
                userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                })
            ).resolves.not.toThrow();

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                uri,
                profileId: 'userb',
            });

            expect(permissions).toEqual(emptyRole);

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const adminPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                uri,
                profileId: 'userb',
            });

            expect(adminPermissions).toEqual(adminRole);
        });

        it('should allow you to view permissions of boosts you are admin of', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userB.clients.fullAuth.boost.getOtherBoostPermissions({
                uri,
                profileId: 'usera',
            });

            expect(permissions).toEqual(creatorRole);
        });

        it('should not allow you to view permissions of boosts you are not admin of', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await expect(
                userB.clients.fullAuth.boost.getOtherBoostPermissions({
                    uri,
                    profileId: 'usera',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should respect parent and grandparent overrides', async () => {
            const grandParentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });
            const parentUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri: grandParentUri,
                boost: { credential: testVc },
            });
            const grandChildUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: { credential: testVc },
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({
                profileId: 'userb',
                uri: grandParentUri,
            });

            const grandParentPermissions =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandParentUri,
                });

            expect(grandParentPermissions.canEditChildren).toEqual('*');

            const parentPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri: parentUri,
            });

            expect(parentPermissions.canEdit).toBeTruthy();

            const grandChildPermissions =
                await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                    profileId: 'userb',
                    uri: grandChildUri,
                });

            expect(grandChildPermissions.canEdit).toBeTruthy();
        });
    });

    describe('updateBoostPermissions', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should not allow you to update permissions without full auth', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            await expect(
                noAuthClient.boost.updateBoostPermissions({ uri, updates: { canEdit: false } })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.boost.updateBoostPermissions({
                    uri,
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to update permissions of boosts you are admin of', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userB.clients.fullAuth.boost.getBoostPermissions({ uri });

            expect(permissions).toEqual(adminRole);

            expect(
                await userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri,
                    updates: { canEdit: false },
                })
            ).toBeTruthy();

            const newPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
                uri,
            });

            expect(newPermissions).toEqual({ ...adminRole, canEdit: false });
        });

        it('should not allow you to update permissions of boosts you are not admin of', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri,
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it("should not allow you to update permissions you don't have access to", async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri,
                profileId: 'userb',
                updates: { canEdit: false },
            });

            await expect(
                userB.clients.fullAuth.boost.updateBoostPermissions({
                    uri,
                    updates: { canEdit: true },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should not allow you the boost creator to break permissions', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await expect(
                userA.clients.fullAuth.boost.updateBoostPermissions({
                    uri,
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });

    describe('updateOtherBoostPermissions', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should not allow you to update permissions without full auth', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            await expect(
                noAuthClient.boost.updateBoostPermissions({ uri, updates: { canEdit: false } })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to update permissions of boosts you are admin of', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            const permissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(permissions).toEqual(adminRole);

            expect(
                await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userb',
                    updates: { canEdit: false },
                })
            ).toBeTruthy();

            const newPermissions = await userA.clients.fullAuth.boost.getOtherBoostPermissions({
                profileId: 'userb',
                uri,
            });

            expect(newPermissions).toEqual({ ...adminRole, canEdit: false });
        });

        it('should not allow you to update permissions of boosts you are not admin of', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userc',
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it("should not allow you to update permissions you don't have access to", async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
                uri,
                profileId: 'userb',
                updates: { canEdit: false },
            });

            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'userc',
                    updates: { canEdit: true },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should not allow you to update permissions of the boost creator', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
            });

            await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri });

            await expect(
                userB.clients.fullAuth.boost.updateOtherBoostPermissions({
                    uri,
                    profileId: 'usera',
                    updates: { canEdit: false },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });
});
