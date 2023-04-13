import { getClient, getUser } from './helpers/getClient';
import { testVc, sendBoost, testUnsignedBoost } from './helpers/send';
import { Profile, Credential, Boost, SigningAuthority } from '@models';
import { getClaimLinkOptionsInfoForBoost, getTTLForClaimLink } from '@cache/claim-links';
import { BoostStatus } from 'types/boost';

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

    describe('createboost', () => {
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

        it("should not allow getting someone else's boosts", async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({ credential: testVc });

            await expect(userA.clients.fullAuth.boost.getBoost({ uri })).resolves.not.toThrow();

            await expect(userB.clients.partialAuth.boost.getBoost({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
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
            const userBProfile = await userB.clients.fullAuth.profile.getProfile();

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
            const userBProfile = await userB.clients.fullAuth.profile.getProfile();

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

        it('should allow the recipient to claim a sent boost', async () => {
            const uri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });
            const userAProfile = await userA.clients.fullAuth.profile.getProfile();
            const userBProfile = await userB.clients.fullAuth.profile.getProfile();

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
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const boost = boosts[0]!;
            const uri = boost.uri;

            expect(boost.name).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { name: 'nice' } })
            ).rejects.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getBoosts();
            const newBoost = newBoosts[0]!;

            expect(newBoost.name).not.toEqual('nice');
        });

        it('should allow you to update a draft boosts name', async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const boost = boosts[0]!;
            const uri = boost.uri;

            expect(boost.status).toBe(BoostStatus.enum.DRAFT);
            expect(boost.name).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { name: 'nice' } })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getBoosts();
            const newBoost = newBoosts[0]!;

            expect(newBoost.name).toEqual('nice');
        });

        it('should prevent you from updating a published boosts category', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const boost = boosts[0]!;
            const uri = boost.uri;

            expect(boost.category).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { category: 'nice' } })
            ).rejects.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getBoosts();
            const newBoost = newBoosts[0]!;

            expect(newBoost.category).not.toEqual('nice');
        });

        it('should allow you to update a draft boosts category', async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const boost = boosts[0]!;
            const uri = boost.uri;

            expect(boost.category).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { category: 'nice' } })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getBoosts();
            const newBoost = newBoosts[0]!;

            expect(newBoost.category).toEqual('nice');
        });

        it('should prevent you from updating a published boosts type', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const boost = boosts[0]!;
            const uri = boost.uri;

            expect(boost.type).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { type: 'nice' } })
            ).rejects.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getBoosts();
            const newBoost = newBoosts[0]!;

            expect(newBoost.type).not.toEqual('nice');
        });

        it('should allow you to update boost type', async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const boost = boosts[0]!;
            const uri = boost.uri;

            expect(boost.type).toBeUndefined();

            await expect(
                userA.clients.fullAuth.boost.updateBoost({ uri, updates: { type: 'nice' } })
            ).resolves.not.toThrow();

            const newBoosts = await userA.clients.fullAuth.boost.getBoosts();
            const newBoost = newBoosts[0]!;

            expect(newBoost.type).toEqual('nice');
        });

        it('should prevent you from updating a published boosts credential', async () => {
            await userA.clients.fullAuth.boost.createBoost({ credential: testVc });
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const boost = boosts[0]!;
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

            const newBoosts = await userA.clients.fullAuth.boost.getBoosts();
            const newBoost = newBoosts[0]!;

            expect(
                await userA.clients.fullAuth.storage.resolve({ uri: newBoost.uri })
            ).toMatchObject(beforeUpdateBoostCredential);
        });

        it('should allow you to update boost credential', async () => {
            await userA.clients.fullAuth.boost.createBoost({
                credential: testVc,
                status: BoostStatus.enum.DRAFT,
            });
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const boost = boosts[0]!;
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

            const newBoosts = await userA.clients.fullAuth.boost.getBoosts();
            const newBoost = newBoosts[0]!;

            expect(
                await userA.clients.fullAuth.storage.resolve({ uri: newBoost.uri })
            ).not.toMatchObject(beforeUpdateBoostCredential);
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
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const uri = boosts[0]!.uri;

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

            const beforeDeleteLength = (await userA.clients.fullAuth.boost.getBoosts()).length;
            await expect(
                userA.clients.fullAuth.boost.deleteBoost({ uri: draftBoostUri })
            ).resolves.not.toThrow();

            expect(await userA.clients.fullAuth.boost.getBoosts()).toHaveLength(
                beforeDeleteLength - 1
            );
        });

        it('should prevent you from deleting a published boost', async () => {
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const boost = boosts[0]!;
            const uri = boost.uri;

            const beforeDeleteLength = (await userA.clients.fullAuth.boost.getBoosts()).length;
            await expect(userA.clients.fullAuth.boost.deleteBoost({ uri })).rejects.toThrow();
            expect(await userA.clients.fullAuth.boost.getBoosts()).toHaveLength(beforeDeleteLength);
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
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const uri = boosts[0]!.uri;

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
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const uri = boosts[0]!.uri;

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
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const uri = boosts[0]!.uri;

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
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const uri = boosts[0]!.uri;

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

        it('should allow setting a custom time to live in seconds for a claimable boost', async () => {
            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const uri = boosts[0]!.uri;

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

            const boosts = await userA.clients.fullAuth.boost.getBoosts();
            const uri = boosts[0]!.uri;

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
                if (ttlBeforeClaims) expect(ttlAfterClaims).toBeLessThan(ttlBeforeClaims);

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
});
