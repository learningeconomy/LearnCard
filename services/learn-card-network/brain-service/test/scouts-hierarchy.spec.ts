/**
 * Scouts Hierarchy Integration Tests
 *
 * Tests the full ScoutPass organizational hierarchy flow:
 * Global Admin → Director (Network) → Leader (Troop) → Scout (Member)
 *
 * Permission model from PermissionsByRole in troops.helpers.ts:
 * - Global Admin: Full permissions including canIssue, canRevoke, canManagePermissions
 * - Director: canManagePermissions + all children permissions (canIssueChildren: '*', etc.)
 * - Leader: canIssueChildren: '*', canRevokeChildren: '*', canManageChildrenPermissions: '*'
 * - Scout: No permissions
 *
 * Verifies:
 * 1. Global admin can create network and issue director IDs
 * 2. Director can issue troop leader IDs (via canIssueChildren)
 * 3. Troop leader can issue scout IDs (via canIssueChildren)
 * 4. Troop leader can revoke scout IDs (via canRevokeChildren)
 * 5. Revoked scouts are filtered from member lists
 */

import { getUser } from './helpers/getClient';
import { sendBoost, testUnsignedBoost } from './helpers/send';
import { Profile, Credential, Boost, ClaimHook, Role } from '@models';

// Permission constants matching PermissionsByRole in troops.helpers.ts
const GLOBAL_ADMIN_PERMISSIONS = {
    canEdit: true,
    canIssue: true,
    canRevoke: true,
    canManagePermissions: true,
    canIssueChildren: '*',
    canCreateChildren: '*',
    canEditChildren: '*',
    canRevokeChildren: '*',
    canManageChildrenPermissions: '*',
    canViewAnalytics: true,
};

const DIRECTOR_PERMISSIONS = {
    canEdit: false,
    canIssue: false,
    canRevoke: false,
    canManagePermissions: true,
    canIssueChildren: '*',
    canCreateChildren: '*',
    canEditChildren: '*',
    canRevokeChildren: '*',
    canManageChildrenPermissions: '*',
    canViewAnalytics: true,
};

const LEADER_PERMISSIONS = {
    canEdit: false,
    canIssue: false,
    canRevoke: false,
    canManagePermissions: false,
    canIssueChildren: '*',
    canCreateChildren: '',
    canEditChildren: '',
    canRevokeChildren: '*',
    canManageChildrenPermissions: '*',
    canViewAnalytics: true,
};

const SCOUT_PERMISSIONS = {
    canEdit: false,
    canIssue: false,
    canRevoke: false,
    canManagePermissions: false,
    canIssueChildren: '',
    canCreateChildren: '',
    canEditChildren: '',
    canRevokeChildren: '',
    canManageChildrenPermissions: '',
    canViewAnalytics: false,
};

// Test users representing the scouts hierarchy
let globalAdmin: Awaited<ReturnType<typeof getUser>>;
let director: Awaited<ReturnType<typeof getUser>>;
let troopLeader: Awaited<ReturnType<typeof getUser>>;
let scout1: Awaited<ReturnType<typeof getUser>>;
let scout2: Awaited<ReturnType<typeof getUser>>;

describe('Scouts Hierarchy - Basic Setup', () => {
    beforeAll(async () => {
        globalAdmin = await getUser('a'.repeat(64));
        director = await getUser('b'.repeat(64));
        troopLeader = await getUser('c'.repeat(64));
        scout1 = await getUser('d'.repeat(64));
        scout2 = await getUser('e'.repeat(64));
    });

    beforeEach(async () => {
        // Clean slate for each test
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        // Create profiles for all users
        await globalAdmin.clients.fullAuth.profile.createProfile({ profileId: 'global-admin' });
        await director.clients.fullAuth.profile.createProfile({ profileId: 'director' });
        await troopLeader.clients.fullAuth.profile.createProfile({ profileId: 'troop-leader' });
        await scout1.clients.fullAuth.profile.createProfile({ profileId: 'scout1' });
        await scout2.clients.fullAuth.profile.createProfile({ profileId: 'scout2' });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });
    });

    it('should create a global network with proper permissions', async () => {
        // Global admin creates the root global network boost
        const globalNetworkUri = await globalAdmin.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });

        expect(globalNetworkUri).toBeDefined();
        expect(globalNetworkUri).toMatch(/^lc:network:/);

        // Verify global admin has full permissions (matching GLOBAL_ADMIN_PERMISSIONS)
        const permissions = await globalAdmin.clients.fullAuth.boost.getBoostPermissions({
            uri: globalNetworkUri,
        });

        expect(permissions.canIssue).toBeTruthy();
        expect(permissions.canRevoke).toBeTruthy();
        expect(permissions.canManagePermissions).toBeTruthy();
        expect(permissions.canCreateChildren).toBeTruthy();
    });
});

describe('Scouts Hierarchy - Permission Delegation via Claim Hooks', () => {
    let globalNetworkUri: string;
    let networkUri: string;
    let troopUri: string;
    let scoutUri: string;

    beforeAll(async () => {
        globalAdmin = await getUser('a'.repeat(64));
        director = await getUser('b'.repeat(64));
        troopLeader = await getUser('c'.repeat(64));
        scout1 = await getUser('d'.repeat(64));
        scout2 = await getUser('e'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await globalAdmin.clients.fullAuth.profile.createProfile({ profileId: 'global-admin' });
        await director.clients.fullAuth.profile.createProfile({ profileId: 'director' });
        await troopLeader.clients.fullAuth.profile.createProfile({ profileId: 'troop-leader' });
        await scout1.clients.fullAuth.profile.createProfile({ profileId: 'scout1' });
        await scout2.clients.fullAuth.profile.createProfile({ profileId: 'scout2' });

        // Create hierarchy: Global → Network → Troop → Scout
        globalNetworkUri = await globalAdmin.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });

        networkUri = await globalAdmin.clients.fullAuth.boost.createChildBoost({
            parentUri: globalNetworkUri,
            boost: { credential: testUnsignedBoost },
        });

        troopUri = await globalAdmin.clients.fullAuth.boost.createChildBoost({
            parentUri: networkUri,
            boost: { credential: testUnsignedBoost },
        });

        scoutUri = await globalAdmin.clients.fullAuth.boost.createChildBoost({
            parentUri: troopUri,
            boost: { credential: testUnsignedBoost },
        });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });
    });

    it('should grant director permissions when claiming network ID via claim hook', async () => {
        // Set up claim hook: claiming networkUri grants DIRECTOR_PERMISSIONS on troopUri
        // Director gets canManagePermissions and canIssueChildren:'*' on children
        await globalAdmin.clients.fullAuth.claimHook.createClaimHook({
            hook: {
                type: 'GRANT_PERMISSIONS',
                data: {
                    claimUri: networkUri,
                    targetUri: troopUri,
                    permissions: {
                        canManagePermissions: true,
                        canIssueChildren: '*',
                        canRevokeChildren: '*',
                        canCreateChildren: '*',
                    },
                },
            },
        });

        // Verify director doesn't have permissions initially
        const permsBefore = await director.clients.fullAuth.boost.getBoostPermissions({
            uri: troopUri,
        });
        expect(permsBefore.canManagePermissions).toBeFalsy();

        // Global admin issues network ID to director
        await sendBoost(
            { profileId: 'global-admin', user: globalAdmin },
            { profileId: 'director', user: director },
            networkUri,
            true // auto-accept
        );

        // Verify director now has permissions (from claim hook)
        const permsAfter = await director.clients.fullAuth.boost.getBoostPermissions({
            uri: troopUri,
        });
        expect(permsAfter.canManagePermissions).toBeTruthy();
    });

    it('should allow director to issue troop leader IDs after receiving permissions', async () => {
        // Set up claim hook for director (grants DIRECTOR_PERMISSIONS pattern)
        await globalAdmin.clients.fullAuth.claimHook.createClaimHook({
            hook: {
                type: 'GRANT_PERMISSIONS',
                data: {
                    claimUri: networkUri,
                    targetUri: troopUri,
                    permissions: {
                        canIssue: true,
                        canRevoke: true,
                        canManagePermissions: true,
                    },
                },
            },
        });

        // Issue network ID to director
        await sendBoost(
            { profileId: 'global-admin', user: globalAdmin },
            { profileId: 'director', user: director },
            networkUri,
            true
        );

        // Director should now be able to issue troop leader IDs
        const troopLeaderCredUri = await sendBoost(
            { profileId: 'director', user: director },
            { profileId: 'troop-leader', user: troopLeader },
            troopUri,
            true
        );

        expect(troopLeaderCredUri).toBeDefined();

        // Verify troop leader is in recipients list
        const recipients = await director.clients.fullAuth.boost.getPaginatedBoostRecipients({
            uri: troopUri,
        });
        expect(recipients.records.length).toBe(1);
        expect(recipients.records[0]?.to?.profileId).toBe('troop-leader');
    });
});

describe('Scouts Hierarchy - Full Chain with Role-Based Permissions', () => {
    let globalNetworkUri: string;
    let networkUri: string;
    let troopUri: string;
    let scoutUri: string;

    beforeAll(async () => {
        globalAdmin = await getUser('a'.repeat(64));
        director = await getUser('b'.repeat(64));
        troopLeader = await getUser('c'.repeat(64));
        scout1 = await getUser('d'.repeat(64));
        scout2 = await getUser('e'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await globalAdmin.clients.fullAuth.profile.createProfile({ profileId: 'global-admin' });
        await director.clients.fullAuth.profile.createProfile({ profileId: 'director' });
        await troopLeader.clients.fullAuth.profile.createProfile({ profileId: 'troop-leader' });
        await scout1.clients.fullAuth.profile.createProfile({ profileId: 'scout1' });
        await scout2.clients.fullAuth.profile.createProfile({ profileId: 'scout2' });

        // Create full hierarchy
        globalNetworkUri = await globalAdmin.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });

        networkUri = await globalAdmin.clients.fullAuth.boost.createChildBoost({
            parentUri: globalNetworkUri,
            boost: { credential: testUnsignedBoost },
        });

        troopUri = await globalAdmin.clients.fullAuth.boost.createChildBoost({
            parentUri: networkUri,
            boost: { credential: testUnsignedBoost },
        });

        scoutUri = await globalAdmin.clients.fullAuth.boost.createChildBoost({
            parentUri: troopUri,
            boost: { credential: testUnsignedBoost },
        });

        // Set up claim hooks matching the role-based permission model:
        
        // Claiming networkUri → Director gets permissions on troopUri
        await globalAdmin.clients.fullAuth.claimHook.createClaimHook({
            hook: {
                type: 'GRANT_PERMISSIONS',
                data: {
                    claimUri: networkUri,
                    targetUri: troopUri,
                    permissions: {
                        canIssue: true,
                        canRevoke: true,
                        canManagePermissions: true,
                    },
                },
            },
        });

        // Claiming troopUri → Leader gets permissions on scoutUri
        // Leader has canIssueChildren:'*', canRevokeChildren:'*' but NOT canCreateChildren
        await globalAdmin.clients.fullAuth.claimHook.createClaimHook({
            hook: {
                type: 'GRANT_PERMISSIONS',
                data: {
                    claimUri: troopUri,
                    targetUri: scoutUri,
                    permissions: {
                        canIssue: true,
                        canRevoke: true,
                        // Note: Leader does NOT get canManagePermissions or canCreateChildren
                    },
                },
            },
        });

        // Issue credentials down the chain
        await sendBoost(
            { profileId: 'global-admin', user: globalAdmin },
            { profileId: 'director', user: director },
            networkUri,
            true
        );

        await sendBoost(
            { profileId: 'director', user: director },
            { profileId: 'troop-leader', user: troopLeader },
            troopUri,
            true
        );
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });
    });

    it('should allow troop leader to issue scout IDs (canIssueChildren)', async () => {
        // Verify troop leader has canIssue permission on scoutUri
        const perms = await troopLeader.clients.fullAuth.boost.getBoostPermissions({
            uri: scoutUri,
        });
        expect(perms.canIssue).toBeTruthy();

        // Troop leader issues scout IDs
        await sendBoost(
            { profileId: 'troop-leader', user: troopLeader },
            { profileId: 'scout1', user: scout1 },
            scoutUri,
            true
        );

        await sendBoost(
            { profileId: 'troop-leader', user: troopLeader },
            { profileId: 'scout2', user: scout2 },
            scoutUri,
            true
        );

        // Verify both scouts are in recipients list
        const recipients = await troopLeader.clients.fullAuth.boost.getPaginatedBoostRecipients({
            uri: scoutUri,
        });
        expect(recipients.records.length).toBe(2);

        const profileIds = recipients.records.map(r => r.to?.profileId).sort();
        expect(profileIds).toEqual(['scout1', 'scout2']);
    });

    it('should allow troop leader to revoke scout IDs (canRevokeChildren)', async () => {
        // Issue scout IDs to both scouts
        await sendBoost(
            { profileId: 'troop-leader', user: troopLeader },
            { profileId: 'scout1', user: scout1 },
            scoutUri,
            true
        );

        await sendBoost(
            { profileId: 'troop-leader', user: troopLeader },
            { profileId: 'scout2', user: scout2 },
            scoutUri,
            true
        );

        // Verify both scouts are in recipients list
        const recipientsBefore = await troopLeader.clients.fullAuth.boost.getPaginatedBoostRecipients({
            uri: scoutUri,
        });
        expect(recipientsBefore.records.length).toBe(2);

        // Revoke scout1's credential (troop leader has canRevokeChildren:'*')
        const revokeResult = await troopLeader.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri: scoutUri,
            recipientProfileId: 'scout1',
        });
        expect(revokeResult).toBe(true);

        // Verify scout1 is no longer in recipients list
        const recipientsAfter = await troopLeader.clients.fullAuth.boost.getPaginatedBoostRecipients({
            uri: scoutUri,
        });
        expect(recipientsAfter.records.length).toBe(1);
        expect(recipientsAfter.records[0]?.to?.profileId).toBe('scout2');
    });

    it('should update recipient count after revocation', async () => {
        // Issue scout IDs
        await sendBoost(
            { profileId: 'troop-leader', user: troopLeader },
            { profileId: 'scout1', user: scout1 },
            scoutUri,
            true
        );

        await sendBoost(
            { profileId: 'troop-leader', user: troopLeader },
            { profileId: 'scout2', user: scout2 },
            scoutUri,
            true
        );

        // Check count before
        const countBefore = await troopLeader.clients.fullAuth.boost.getBoostRecipientCount({
            uri: scoutUri,
        });
        expect(countBefore).toBe(2);

        // Revoke scout1
        await troopLeader.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri: scoutUri,
            recipientProfileId: 'scout1',
        });

        // Check count after
        const countAfter = await troopLeader.clients.fullAuth.boost.getBoostRecipientCount({
            uri: scoutUri,
        });
        expect(countAfter).toBe(1);
    });

    it('should return revoked credentials via getRevokedCredentials for the user', async () => {
        // Issue scout ID to scout1
        await sendBoost(
            { profileId: 'troop-leader', user: troopLeader },
            { profileId: 'scout1', user: scout1 },
            scoutUri,
            true
        );

        // Scout1 should have no revoked credentials initially
        const revokedBefore = await scout1.clients.fullAuth.credential.getRevokedCredentials({});
        expect(revokedBefore.length).toBe(0);

        // Revoke scout1's credential
        await troopLeader.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri: scoutUri,
            recipientProfileId: 'scout1',
        });

        // Scout1 should now see revoked credential
        const revokedAfter = await scout1.clients.fullAuth.credential.getRevokedCredentials({});
        expect(revokedAfter.length).toBe(1);
    });

    it('should not allow scouts to revoke (no permissions)', async () => {
        // Issue scout ID to scout1
        await sendBoost(
            { profileId: 'troop-leader', user: troopLeader },
            { profileId: 'scout1', user: scout1 },
            scoutUri,
            true
        );

        // Scout2 (who has SCOUT_PERMISSIONS = no permissions) tries to revoke scout1
        await expect(
            scout2.clients.fullAuth.boost.revokeBoostRecipient({
                boostUri: scoutUri,
                recipientProfileId: 'scout1',
            })
        ).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });
});

describe('Scouts Hierarchy - Permission Revocation via Claim Hook Reversal', () => {
    let networkUri: string;
    let troopUri: string;

    beforeAll(async () => {
        globalAdmin = await getUser('a'.repeat(64));
        director = await getUser('b'.repeat(64));
        troopLeader = await getUser('c'.repeat(64));
    });

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await globalAdmin.clients.fullAuth.profile.createProfile({ profileId: 'global-admin' });
        await director.clients.fullAuth.profile.createProfile({ profileId: 'director' });
        await troopLeader.clients.fullAuth.profile.createProfile({ profileId: 'troop-leader' });

        // Create hierarchy
        const globalNetworkUri = await globalAdmin.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });

        networkUri = await globalAdmin.clients.fullAuth.boost.createChildBoost({
            parentUri: globalNetworkUri,
            boost: { credential: testUnsignedBoost },
        });

        troopUri = await globalAdmin.clients.fullAuth.boost.createChildBoost({
            parentUri: networkUri,
            boost: { credential: testUnsignedBoost },
        });

        // Set up claim hook (Director permissions)
        await globalAdmin.clients.fullAuth.claimHook.createClaimHook({
            hook: {
                type: 'GRANT_PERMISSIONS',
                data: {
                    claimUri: networkUri,
                    targetUri: troopUri,
                    permissions: {
                        canIssue: true,
                        canRevoke: true,
                        canManagePermissions: true,
                    },
                },
            },
        });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });
    });

    it('should remove director permissions when their credential is revoked', async () => {
        // Issue network ID to director
        await sendBoost(
            { profileId: 'global-admin', user: globalAdmin },
            { profileId: 'director', user: director },
            networkUri,
            true
        );

        // Verify director has permissions
        const permsGranted = await director.clients.fullAuth.boost.getBoostPermissions({
            uri: troopUri,
        });
        expect(permsGranted.canIssue).toBeTruthy();
        expect(permsGranted.canManagePermissions).toBeTruthy();

        // Global admin revokes director's credential
        await globalAdmin.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri: networkUri,
            recipientProfileId: 'director',
        });

        // Verify director no longer has permissions
        const permsRevoked = await director.clients.fullAuth.boost.getBoostPermissions({
            uri: troopUri,
        });
        expect(permsRevoked.canIssue).toBeFalsy();
        expect(permsRevoked.canManagePermissions).toBeFalsy();
    });

    it('should prevent revoked director from issuing troop leader IDs', async () => {
        // Issue network ID to director
        await sendBoost(
            { profileId: 'global-admin', user: globalAdmin },
            { profileId: 'director', user: director },
            networkUri,
            true
        );

        // Verify director can issue initially
        const permsBefore = await director.clients.fullAuth.boost.getBoostPermissions({
            uri: troopUri,
        });
        expect(permsBefore.canIssue).toBeTruthy();

        // Global admin revokes director's credential
        await globalAdmin.clients.fullAuth.boost.revokeBoostRecipient({
            boostUri: networkUri,
            recipientProfileId: 'director',
        });

        // Director should NOT be able to issue troop leader IDs anymore
        await expect(
            sendBoost(
                { profileId: 'director', user: director },
                { profileId: 'troop-leader', user: troopLeader },
                troopUri,
                true
            )
        ).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
    });
});
