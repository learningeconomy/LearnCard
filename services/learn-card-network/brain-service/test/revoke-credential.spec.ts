import { getClient, getUser } from './helpers/getClient';
import { sendBoost, testUnsignedBoost } from './helpers/send';
import { Profile, Credential, Boost, ClaimHook, Role } from '@models';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

describe('Revoke Boost Recipient', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
    });

    let boostUri: string;

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

        boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
    });

    it('should not allow revocation without full auth', async () => {
        // First send boost to userB
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );

        await expect(
            noAuthClient.boost.revokeBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            })
        ).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });

    it('should not allow revocation without canRevoke permission', async () => {
        // First send boost to userB
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );

        // userC doesn't have revoke permission
        await expect(
            userC.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri,
                recipientProfileId: 'userb',
            })
        ).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });

    it('should allow boost creator to revoke a recipient', async () => {
        // First send boost to userB
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );

        // Check recipient is in the list
        const recipientsBefore = await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
            uri: boostUri,
        });
        expect(recipientsBefore.records.length).toBe(1);
        expect(recipientsBefore.records[0]?.to?.profileId).toBe('userb');

        // Revoke the credential
        const result = await userA.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri,
            recipientProfileId: 'userb',
        });
        expect(result).toBe(true);

        // Check recipient is filtered out of the list
        const recipientsAfter = await userA.clients.fullAuth.boost.getPaginatedBoostRecipients({
            uri: boostUri,
        });
        expect(recipientsAfter.records.length).toBe(0);
    });

    it('should filter revoked recipients from count', async () => {
        // First send boost to userB
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );

        // Check count before revocation
        const countBefore = await userA.clients.fullAuth.boost.getBoostRecipientCount({
            uri: boostUri,
        });
        expect(countBefore).toBe(1);

        // Revoke the credential
        await userA.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri,
            recipientProfileId: 'userb',
        });

        // Check count after revocation
        const countAfter = await userA.clients.fullAuth.boost.getBoostRecipientCount({
            uri: boostUri,
        });
        expect(countAfter).toBe(0);
    });

    it('should return NOT_FOUND when trying to revoke non-existent recipient', async () => {
        await expect(
            userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri,
                recipientProfileId: 'nonexistent',
            })
        ).rejects.toMatchObject({
            code: 'NOT_FOUND',
        });
    });

    it('should return BAD_REQUEST when trying to revoke with invalid boost URI format', async () => {
        await expect(
            userA.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri: 'lc:boost:non-existent',
                recipientProfileId: 'userb',
            })
        ).rejects.toMatchObject({
            code: 'BAD_REQUEST',
        });
    });
});

describe('Revoke with Claim Hooks', () => {
    let claimUri: string;
    let targetUri: string;

    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

        // Create claim boost and target boost
        claimUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        targetUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });

        // Set up claim hook to grant permissions when claiming
        await userA.clients.fullAuth.claimHook.createClaimHook({
            hook: {
                type: 'GRANT_PERMISSIONS',
                data: {
                    claimUri,
                    targetUri,
                    permissions: { canIssue: true },
                },
            },
        });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
    });

    it('should remove permissions granted via claim hooks when revoking', async () => {
        // Verify userB doesn't have permissions initially
        const oldPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
            uri: targetUri,
        });
        expect(oldPermissions.canIssue).toBeFalsy();

        // Send and accept the claim boost
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            claimUri,
            true
        );

        // Verify userB now has permissions
        const newPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
            uri: targetUri,
        });
        expect(newPermissions.canIssue).toBeTruthy();

        // Revoke the credential
        await userA.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri: claimUri,
            recipientProfileId: 'userb',
        });

        // Verify userB no longer has the permissions
        const revokedPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
            uri: targetUri,
        });
        expect(revokedPermissions.canIssue).toBeFalsy();
    });
});

describe('Revoke with AUTO_CONNECT Claim Hooks', () => {
    let claimUri: string;
    let targetUri: string;

    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

        // Create claim boost and target boost
        claimUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        targetUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });

        // Set up AUTO_CONNECT claim hook
        await userA.clients.fullAuth.claimHook.createClaimHook({
            hook: {
                type: 'AUTO_CONNECT',
                data: {
                    claimUri,
                    targetUri,
                },
            },
        });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
    });

    it('should remove AUTO_CONNECT_RECIPIENT relationship when revoking', async () => {
        // Send and accept the claim boost
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            claimUri,
            true
        );

        // Verify AUTO_CONNECT_RECIPIENT was created by checking the query directly
        // The relationship should exist on the target boost pointing to userB
        const { neogma } = await import('@instance');
        
        const beforeResult = await neogma.queryRunner.run(
            `MATCH (b:Boost)-[:AUTO_CONNECT_RECIPIENT]->(p:Profile {profileId: 'userb'})
             WHERE b.id = $boostId
             RETURN count(*) as count`,
            { boostId: targetUri.split(':').pop() }
        );
        expect(beforeResult.records[0]?.get('count').toNumber()).toBe(1);

        // Revoke the credential
        await userA.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri: claimUri,
            recipientProfileId: 'userb',
        });

        // Verify AUTO_CONNECT_RECIPIENT was removed
        const afterResult = await neogma.queryRunner.run(
            `MATCH (b:Boost)-[:AUTO_CONNECT_RECIPIENT]->(p:Profile {profileId: 'userb'})
             WHERE b.id = $boostId
             RETURN count(*) as count`,
            { boostId: targetUri.split(':').pop() }
        );
        expect(afterResult.records[0]?.get('count').toNumber()).toBe(0);
    });
});

describe('Revoke with autoConnectRecipients', () => {
    let boostUri: string;

    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

        // Create boost with autoConnectRecipients enabled
        boostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            autoConnectRecipients: true,
        });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
    });

    // Helper to check connections via direct Neo4j query
    const getConnectionCount = async (fromProfileId: string, toProfileId: string): Promise<number> => {
        const { neogma } = await import('@instance');
        const result = await neogma.queryRunner.run(
            `MATCH (a:Profile {profileId: $fromId})-[r:CONNECTED_WITH]-(b:Profile {profileId: $toId})
             RETURN count(r) as count`,
            { fromId: fromProfileId, toId: toProfileId }
        );
        return result.records[0]?.get('count').toNumber() ?? 0;
    };

    it('should remove CONNECTED_WITH relationship when revoking credential from boost with autoConnectRecipients', async () => {
        // Send and accept the boost
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );

        // Verify connection was created
        const countBefore = await getConnectionCount('usera', 'userb');
        expect(countBefore).toBeGreaterThan(0);

        // Revoke the credential
        await userA.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri,
            recipientProfileId: 'userb',
        });

        // Verify connection was removed (if it was the only source)
        const countAfter = await getConnectionCount('usera', 'userb');
        expect(countAfter).toBe(0);
    });

    it('should preserve CONNECTED_WITH if it has other sources', async () => {
        // Create a second boost with autoConnectRecipients
        const secondBoostUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
            autoConnectRecipients: true,
        });

        // Send both boosts to userB
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            boostUri,
            true
        );
        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            secondBoostUri,
            true
        );

        // Verify connection exists
        const countBefore = await getConnectionCount('usera', 'userb');
        expect(countBefore).toBeGreaterThan(0);

        // Revoke only the first credential
        await userA.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri,
            recipientProfileId: 'userb',
        });

        // Connection should still exist (from second boost)
        const countAfterFirst = await getConnectionCount('usera', 'userb');
        expect(countAfterFirst).toBeGreaterThan(0);

        // Revoke the second credential
        await userA.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri: secondBoostUri,
            recipientProfileId: 'userb',
        });

        // Now connection should be gone
        const countFinal = await getConnectionCount('usera', 'userb');
        expect(countFinal).toBe(0);
    });
});
