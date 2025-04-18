import { getClient, getUser } from './helpers/getClient';
import { sendBoost, testUnsignedBoost } from './helpers/send';
import { Profile, Credential, Boost, ClaimHook, Role } from '@models';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;
let userD: Awaited<ReturnType<typeof getUser>>;
let userE: Awaited<ReturnType<typeof getUser>>;

describe('Claim Hooks', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
        userD = await getUser('d'.repeat(64));
        userE = await getUser('e'.repeat(64));
    });

    let claimUri: string;
    let targetUri: string;

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

        claimUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        targetUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
    });

    afterAll(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
    });

    it('should not allow you to create a Claim Hook without full auth', async () => {
        await expect(
            noAuthClient.claimHook.createClaimHook({
                hook: {
                    type: 'GRANT_PERMISSIONS',
                    data: {
                        claimUri,
                        targetUri,
                        permissions: { canIssue: true },
                    },
                },
            })
        ).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        await expect(
            userA.clients.partialAuth.claimHook.createClaimHook({
                hook: {
                    type: 'GRANT_PERMISSIONS',
                    data: {
                        claimUri,
                        targetUri,
                        permissions: { canIssue: true },
                    },
                },
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('should allow you to create a Claim Hook', async () => {
        await expect(
            userA.clients.fullAuth.claimHook.createClaimHook({
                hook: {
                    type: 'GRANT_PERMISSIONS',
                    data: {
                        claimUri,
                        targetUri,
                        permissions: { canIssue: true },
                    },
                },
            })
        ).resolves.not.toThrow();
    });

    it('should run the claim hook when claiming the claim boost', async () => {
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

        const oldPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
            uri: targetUri,
        });

        expect(oldPermissions.canIssue).toBeFalsy();

        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            claimUri,
            true
        );

        const newPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
            uri: targetUri,
        });

        expect(newPermissions.canIssue).toBeTruthy();
    });

    it('should only allow admins to create claim hooks', async () => {
        await userA.clients.fullAuth.boost.addBoostAdmin({
            profileId: 'userb',
            uri: targetUri,
        });

        await expect(
            userB.clients.fullAuth.claimHook.createClaimHook({
                hook: {
                    type: 'GRANT_PERMISSIONS',
                    data: {
                        claimUri,
                        targetUri,
                        permissions: { canIssue: true },
                    },
                },
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

        await userA.clients.fullAuth.boost.addBoostAdmin({
            profileId: 'userb',
            uri: claimUri,
        });

        await expect(
            userB.clients.fullAuth.claimHook.createClaimHook({
                hook: {
                    type: 'GRANT_PERMISSIONS',
                    data: {
                        claimUri,
                        targetUri,
                        permissions: { canIssue: true },
                    },
                },
            })
        ).resolves.not.toThrow();
    });

    it('should restrict grantable permissions based on the users permissions', async () => {
        await userA.clients.fullAuth.boost.addBoostAdmin({
            profileId: 'userb',
            uri: claimUri,
        });

        await expect(
            userB.clients.fullAuth.claimHook.createClaimHook({
                hook: {
                    type: 'GRANT_PERMISSIONS',
                    data: {
                        claimUri,
                        targetUri,
                        permissions: { canIssue: true },
                    },
                },
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

        await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
            profileId: 'userb',
            uri: targetUri,
            updates: { canIssue: true, canManagePermissions: true },
        });

        await expect(
            userB.clients.fullAuth.claimHook.createClaimHook({
                hook: {
                    type: 'GRANT_PERMISSIONS',
                    data: {
                        claimUri,
                        targetUri,
                        permissions: { canIssue: true },
                    },
                },
            })
        ).resolves.not.toThrow();
    });

    it('should only allow current admins to add admin claim hooks', async () => {
        await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri: claimUri });

        await expect(
            userB.clients.fullAuth.claimHook.createClaimHook({
                hook: {
                    type: 'ADD_ADMIN',
                    data: { claimUri, targetUri },
                },
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

        await userA.clients.fullAuth.boost.updateOtherBoostPermissions({
            profileId: 'userb',
            uri: targetUri,
            updates: { canIssue: true, canManagePermissions: true },
        });

        await expect(
            userB.clients.fullAuth.claimHook.createClaimHook({
                hook: {
                    type: 'ADD_ADMIN',
                    data: { claimUri, targetUri },
                },
            })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });

        await userA.clients.fullAuth.boost.addBoostAdmin({ profileId: 'userb', uri: targetUri });

        await expect(
            userB.clients.fullAuth.claimHook.createClaimHook({
                hook: {
                    type: 'ADD_ADMIN',
                    data: { claimUri, targetUri },
                },
            })
        ).resolves.not.toThrow();
    });
});

describe('getClaimHooksForBoost', () => {
    let claimUri: string;
    let targetUri: string;
    let hookId: string;

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

        claimUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        targetUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });

        hookId = await userA.clients.fullAuth.claimHook.createClaimHook({
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

    it('should not allow you to get Claim Hooks without full auth', async () => {
        await expect(
            noAuthClient.claimHook.getClaimHooksForBoost({ uri: claimUri })
        ).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        await expect(
            userA.clients.partialAuth.claimHook.getClaimHooksForBoost({ uri: claimUri })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('should allow you to get Claim Hooks', async () => {
        await expect(
            userA.clients.fullAuth.claimHook.getClaimHooksForBoost({ uri: claimUri })
        ).resolves.not.toThrow();
    });

    it('should return full info about claim hooks', async () => {
        const hooks = await userA.clients.fullAuth.claimHook.getClaimHooksForBoost({
            uri: claimUri,
        });

        expect(hooks.records).toHaveLength(1);

        const hook = hooks.records[0]!;

        expect(hook.id).toEqual(hookId);
        expect(hook.type).toEqual('GRANT_PERMISSIONS');

        // Annoying TS stuff...
        if (hook.type !== 'GRANT_PERMISSIONS') {
            throw new Error('This error should never be thrown...');
        }

        expect(hook.createdAt).toBeDefined();
        expect(hook.updatedAt).toBeDefined();
        expect(hook.data.claimUri).toEqual(claimUri);
        expect(hook.data.targetUri).toEqual(targetUri);
        expect(hook.data.permissions.canIssue).toBeTruthy();
    });
});

describe('deleteClaimHook', () => {
    let claimUri: string;
    let targetUri: string;
    let hookId: string;

    beforeEach(async () => {
        await Profile.delete({ detach: true, where: {} });
        await Credential.delete({ detach: true, where: {} });
        await Boost.delete({ detach: true, where: {} });
        await ClaimHook.delete({ detach: true, where: {} });
        await Role.delete({ detach: true, where: {} });

        await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

        claimUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });
        targetUri = await userA.clients.fullAuth.boost.createBoost({
            credential: testUnsignedBoost,
        });

        hookId = await userA.clients.fullAuth.claimHook.createClaimHook({
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

    it('should not allow you to delete Claim Hooks without full auth', async () => {
        await expect(noAuthClient.claimHook.deleteClaimHook({ id: hookId })).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
        });
        await expect(
            userA.clients.partialAuth.claimHook.deleteClaimHook({ id: hookId })
        ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    });

    it('should allow you to delete Claim Hooks', async () => {
        await expect(
            userA.clients.fullAuth.claimHook.deleteClaimHook({ id: hookId })
        ).resolves.not.toThrow();
    });

    it('should stop updating permissions when deleted', async () => {
        const oldPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
            uri: targetUri,
        });

        await userA.clients.fullAuth.claimHook.deleteClaimHook({ id: hookId });

        expect(oldPermissions.canIssue).toBeFalsy();

        await sendBoost(
            { profileId: 'usera', user: userA },
            { profileId: 'userb', user: userB },
            claimUri,
            true
        );

        const newPermissions = await userB.clients.fullAuth.boost.getBoostPermissions({
            uri: targetUri,
        });

        expect(newPermissions.canIssue).toBeFalsy();
    });
});
