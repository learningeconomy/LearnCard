import { getClient, getUser } from './helpers/getClient';
import { testUnsignedBoost } from './helpers/send';
import { Profile, Credential, Boost, Role } from '@models';

const noAuthClient = getClient();

let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;
let userD: Awaited<ReturnType<typeof getUser>>;

describe('Default Permissions', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
        userD = await getUser('d'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });
        await userD.clients.fullAuth.profile.createProfile({ profileId: 'userd' });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });
    });

    describe('createBoost with defaultPermissions', () => {
        it('should allow creating a boost with defaultPermissions', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: true },
            });

            expect(boostUri).toBeDefined();
            expect(typeof boostUri).toBe('string');
        });

        it('should allow creating a boost with multiple defaultPermissions', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: {
                    canIssue: true,
                    canViewAnalytics: true,
                },
            });

            expect(boostUri).toBeDefined();
        });

        it('should allow creating a boost without defaultPermissions (backwards compatible)', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            expect(boostUri).toBeDefined();
        });
    });

    describe('sendBoost with defaultPermissions.canIssue = true', () => {
        it('should allow any authenticated user to send boost when defaultPermissions.canIssue is true', async () => {
            // UserA creates a boost with defaultPermissions.canIssue = true
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: true },
            });

            // UserB (not an admin) should be able to issue the boost
            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUri = await userB.clients.fullAuth.boost.sendBoost({
                profileId: 'userc',
                uri: boostUri,
                credential,
            });

            expect(credentialUri).toBeDefined();
        });

        it('should allow multiple different users to issue when defaultPermissions.canIssue is true', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: true },
            });

            // UserB issues to UserC
            const credentialB = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUriB = await userB.clients.fullAuth.boost.sendBoost({
                profileId: 'userc',
                uri: boostUri,
                credential: credentialB,
            });

            expect(credentialUriB).toBeDefined();

            // UserC issues to UserD
            const credentialC = await userC.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userC.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userD.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUriC = await userC.clients.fullAuth.boost.sendBoost({
                profileId: 'userd',
                uri: boostUri,
                credential: credentialC,
            });

            expect(credentialUriC).toBeDefined();
        });

        it('should still allow the boost creator to issue', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: true },
            });

            const credential = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUri = await userA.clients.fullAuth.boost.sendBoost({
                profileId: 'userb',
                uri: boostUri,
                credential,
            });

            expect(credentialUri).toBeDefined();
        });
    });

    describe('sendBoost without defaultPermissions.canIssue', () => {
        it('should not allow non-admin users to send boost when no defaultPermissions', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'userc',
                    uri: boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should not allow non-admin users to send boost when defaultPermissions.canIssue is false', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: false },
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'userc',
                    uri: boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should not allow non-admin users when defaultPermissions has other permissions but not canIssue', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canViewAnalytics: true },
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'userc',
                    uri: boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });

    describe('interaction with explicit admin roles', () => {
        it('should allow admin to issue regardless of defaultPermissions', async () => {
            // Create boost without defaultPermissions.canIssue
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            // Add userB as admin
            await userA.clients.fullAuth.boost.addBoostAdmin({
                uri: boostUri,
                profileId: 'userb',
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUri = await userB.clients.fullAuth.boost.sendBoost({
                profileId: 'userc',
                uri: boostUri,
                credential,
            });

            expect(credentialUri).toBeDefined();
        });

        it('should allow both admin and non-admin to issue when defaultPermissions.canIssue is true', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: true },
            });

            // Add userB as admin explicitly
            await userA.clients.fullAuth.boost.addBoostAdmin({
                uri: boostUri,
                profileId: 'userb',
            });

            // UserB (admin) issues
            const credentialB = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUriB = await userB.clients.fullAuth.boost.sendBoost({
                profileId: 'userc',
                uri: boostUri,
                credential: credentialB,
            });

            expect(credentialUriB).toBeDefined();

            // UserC (non-admin, but has defaultPermissions) issues
            const credentialC = await userC.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userC.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userD.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUriC = await userC.clients.fullAuth.boost.sendBoost({
                profileId: 'userd',
                uri: boostUri,
                credential: credentialC,
            });

            expect(credentialUriC).toBeDefined();
        });
    });

    describe('createChildBoost with defaultPermissions', () => {
        it('should allow creating a child boost with defaultPermissions', async () => {
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                    defaultPermissions: { canIssue: true },
                },
            });

            expect(childUri).toBeDefined();

            // UserB should be able to issue from child boost
            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: childUri,
            });

            const credentialUri = await userB.clients.fullAuth.boost.sendBoost({
                profileId: 'userc',
                uri: childUri,
                credential,
            });

            expect(credentialUri).toBeDefined();
        });

        it('child boost defaultPermissions should be independent of parent', async () => {
            // Parent has defaultPermissions.canIssue = true
            const parentUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: true },
            });

            // Child does NOT have defaultPermissions.canIssue
            const childUri = await userA.clients.fullAuth.boost.createChildBoost({
                parentUri,
                boost: {
                    credential: testUnsignedBoost,
                },
            });

            // UserB should NOT be able to issue from child boost (no defaultPermissions)
            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: childUri,
            });

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'userc',
                    uri: childUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });

    describe('authentication requirements', () => {
        it('should still require authentication even with defaultPermissions.canIssue', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: true },
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            // No auth client should still fail
            await expect(
                noAuthClient.boost.sendBoost({
                    profileId: 'userc',
                    uri: boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should require full auth (not just partial) even with defaultPermissions.canIssue', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: true },
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            // Partial auth client should still fail
            await expect(
                userB.clients.partialAuth.boost.sendBoost({
                    profileId: 'userc',
                    uri: boostUri,
                    credential,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });
    });

    describe('boost recipients tracking', () => {
        it('should track recipients when issued via defaultPermissions', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: true },
            });

            const credential = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await userB.clients.fullAuth.boost.sendBoost({
                profileId: 'userc',
                uri: boostUri,
                credential,
            });

            // Accept the boost
            const incomingBoosts = await userC.clients.fullAuth.credential.incomingCredentials();
            expect(incomingBoosts.length).toBeGreaterThan(0);
            await userC.clients.fullAuth.credential.acceptCredential({ uri: incomingBoosts[0]!.uri });

            // Check recipients - boost owner should be able to see analytics
            const recipients = await userA.clients.fullAuth.boost.getBoostRecipients({
                uri: boostUri,
            });

            expect(recipients).toHaveLength(1);
            expect(recipients[0]?.to.profileId).toBe('userc');
            expect(recipients[0]?.from).toBe('userb');
        });

        it('should count recipients correctly from multiple issuers via defaultPermissions', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: true },
            });

            // UserA issues to UserB
            const credentialA = await userA.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userA.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userB.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await userA.clients.fullAuth.boost.sendBoost({
                profileId: 'userb',
                uri: boostUri,
                credential: credentialA,
            });

            // UserB accepts
            const incomingB = await userB.clients.fullAuth.credential.incomingCredentials();
            await userB.clients.fullAuth.credential.acceptCredential({ uri: incomingB[0]!.uri });

            // UserB (now a recipient) issues to UserC
            const credentialB = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await userB.clients.fullAuth.boost.sendBoost({
                profileId: 'userc',
                uri: boostUri,
                credential: credentialB,
            });

            // UserC accepts
            const incomingC = await userC.clients.fullAuth.credential.incomingCredentials();
            await userC.clients.fullAuth.credential.acceptCredential({ uri: incomingC[0]!.uri });

            // Check recipient count
            const count = await userA.clients.fullAuth.boost.getBoostRecipientCount({
                uri: boostUri,
            });

            expect(count).toBe(2);
        });
    });

    describe('updateBoost with defaultPermissions', () => {
        it('should allow adding defaultPermissions to an existing boost', async () => {
            // Create boost without defaultPermissions
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            // Verify userB cannot issue initially
            const credentialBefore = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'userc',
                    uri: boostUri,
                    credential: credentialBefore,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

            // Update boost to add defaultPermissions
            await userA.clients.fullAuth.boost.updateBoost({
                uri: boostUri,
                updates: {
                    defaultPermissions: { canIssue: true },
                },
            });

            // Now userB should be able to issue
            const credentialAfter = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUri = await userB.clients.fullAuth.boost.sendBoost({
                profileId: 'userc',
                uri: boostUri,
                credential: credentialAfter,
            });

            expect(credentialUri).toBeDefined();
        });

        it('should allow changing defaultPermissions on an existing boost', async () => {
            // Create boost with defaultPermissions.canIssue = true
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
                defaultPermissions: { canIssue: true },
            });

            // Verify userB can issue
            const credential1 = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userC.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUri1 = await userB.clients.fullAuth.boost.sendBoost({
                profileId: 'userc',
                uri: boostUri,
                credential: credential1,
            });

            expect(credentialUri1).toBeDefined();

            // Update to remove canIssue
            await userA.clients.fullAuth.boost.updateBoost({
                uri: boostUri,
                updates: {
                    defaultPermissions: { canIssue: false },
                },
            });

            // Now userB should NOT be able to issue
            const credential2 = await userB.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userB.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userD.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            await expect(
                userB.clients.fullAuth.boost.sendBoost({
                    profileId: 'userd',
                    uri: boostUri,
                    credential: credential2,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should require edit permission to update defaultPermissions', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            // userB (not an admin) should not be able to update
            await expect(
                userB.clients.fullAuth.boost.updateBoost({
                    uri: boostUri,
                    updates: {
                        defaultPermissions: { canIssue: true },
                    },
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow admin to update defaultPermissions', async () => {
            const boostUri = await userA.clients.fullAuth.boost.createBoost({
                credential: testUnsignedBoost,
            });

            // Add userB as admin
            await userA.clients.fullAuth.boost.addBoostAdmin({
                uri: boostUri,
                profileId: 'userb',
            });

            // userB (admin) should be able to update (returns false when only relationship changes, not node properties)
            await userB.clients.fullAuth.boost.updateBoost({
                uri: boostUri,
                updates: {
                    defaultPermissions: { canIssue: true },
                },
            });

            // Verify the update took effect - userC can now issue
            const credential = await userC.learnCard.invoke.issueCredential({
                ...testUnsignedBoost,
                issuer: userC.learnCard.id.did(),
                credentialSubject: {
                    ...testUnsignedBoost.credentialSubject,
                    id: userD.learnCard.id.did(),
                },
                boostId: boostUri,
            });

            const credentialUri = await userC.clients.fullAuth.boost.sendBoost({
                profileId: 'userd',
                uri: boostUri,
                credential,
            });

            expect(credentialUri).toBeDefined();
        });
    });
});
