import { getClient, getUser } from './helpers/getClient';
import { Profile, AuthGrant } from '@models';
import { AuthGrantStatusValidator, AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX } from '@learncard/types';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;
// let scopedUserRead: Awaited<ReturnType<typeof getUser>>;
// let scopedUserWrite: Awaited<ReturnType<typeof getUser>>;
// let scopedUserDelete: Awaited<ReturnType<typeof getUser>>;

describe('Auth Grants', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
        // scopedUserRead = await getUser('d'.repeat(64), '*:read profile:*');
        // scopedUserWrite = await getUser('e'.repeat(64), '*:write profile:*');
        // scopedUserDelete = await getUser('f'.repeat(64), '*:write *:delete profile:*');
    });

    describe('addAuthGrant', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await AuthGrant.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await AuthGrant.delete({ detach: true, where: {} });
        });

        it('should not allow you to add an auth grant without full auth', async () => {
            await expect(
                noAuthClient.authGrants.addAuthGrant({ name: 'test' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.authGrants.addAuthGrant({ name: 'test' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        // it('should only allow scoped users with write scope', async () => {
        //     await scopedUserRead.clients.fullAuth.profile.createServiceProfile({
        //         profileId: 'userd',
        //     });
        //     await scopedUserWrite.clients.fullAuth.profile.createServiceProfile({
        //         profileId: 'usere',
        //     });

        //     await expect(
        //         scopedUserRead.clients.fullAuth.authGrants.addAuthGrant({ name: 'test' })
        //     ).rejects.toThrow();

        //     await expect(
        //         scopedUserWrite.clients.fullAuth.authGrants.addAuthGrant({ name: 'test' })
        //     ).resolves.not.toThrow();
        // });

        it('should allow you to add an auth grant for a service profile', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });

            await expect(
                userA.clients.fullAuth.authGrants.addAuthGrant({ name: 'test' })
            ).resolves.not.toThrow();
        });

        it('should not allow you to add an auth grant for a regular user profile', async () => {
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await expect(
                userA.clients.fullAuth.authGrants.addAuthGrant({ name: 'test' })
            ).rejects.toThrow();
        });

        it('should return the newly created auth grant', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });

            const authGrantId = await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test',
            });

            expect(
                (await userA.clients.fullAuth.authGrants.getAuthGrant({ id: authGrantId }))?.name
            ).toEqual('test');
            expect(
                (await userA.clients.fullAuth.authGrants.getAuthGrant({ id: authGrantId }))
                    ?.challenge
            ).toInclude(AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX);
        });

        it('should not allow you to get an auth grant for a another users profile', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createServiceProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            const authGrantId = await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test',
            });

            await expect(
                userB.clients.fullAuth.authGrants.getAuthGrant({ id: authGrantId })
            ).rejects.toThrow();

            await expect(
                userC.clients.fullAuth.authGrants.getAuthGrant({ id: authGrantId })
            ).rejects.toThrow();
        });
    });

    describe('getAuthGrants', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await AuthGrant.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await AuthGrant.delete({ detach: true, where: {} });
        });

        it('should not allow you to get auth grants for a regular user profile', async () => {
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await expect(userA.clients.fullAuth.authGrants.getAuthGrants()).rejects.toThrow();
        });

        // it('should allow you to get auth grants for a scoped user profile with read scope', async () => {
        //     // If you have read scope, you should be able to get auth grants
        //     await scopedUserRead.clients.fullAuth.profile.createServiceProfile({
        //         profileId: 'userd',
        //     });

        //     await expect(
        //         scopedUserRead.clients.fullAuth.authGrants.getAuthGrants()
        //     ).resolves.not.toThrow();

        //     // If you only have write scope, you should not be able to get auth grants
        //     await scopedUserWrite.clients.fullAuth.profile.createServiceProfile({
        //         profileId: 'usere',
        //     });
        //     await expect(
        //         scopedUserWrite.clients.fullAuth.authGrants.getAuthGrants()
        //     ).rejects.toThrow();
        // });

        it('should return the auth grants for a service profile', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });

            const authGrantId = await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test',
            });

            const authGrants = await userA.clients.fullAuth.authGrants.getAuthGrants();
            expect(authGrants).toHaveLength(1);
            expect((authGrants[0] as any).id).toEqual(authGrantId);

            await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test2',
            });

            const authGrants2 = await userA.clients.fullAuth.authGrants.getAuthGrants();

            expect(authGrants2).toHaveLength(2);
            expect(authGrants2[0] as any).toBeDefined();
            expect(authGrants2[1] as any).toBeDefined();
        });

        it('should accept a limit', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });

            await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test',
            });

            await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test2',
            });

            const authGrants = await userA.clients.fullAuth.authGrants.getAuthGrants({
                limit: 1,
            });

            expect(authGrants).toHaveLength(1);
        });

        it('should accept a query', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });

            const authGrantId = await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'chocolate',
            });

            await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'banana',
            });

            const authGrants = await userA.clients.fullAuth.authGrants.getAuthGrants({
                query: { name: 'chocolate' },
            });

            expect(authGrants).toHaveLength(1);
            expect((authGrants[0] as any).id).toEqual(authGrantId);
        });
    });

    describe('updateAuthGrant', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await AuthGrant.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await AuthGrant.delete({ detach: true, where: {} });
        });

        it('should not allow you to update an auth grant for a regular user profile', async () => {
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await expect(
                userA.clients.fullAuth.authGrants.updateAuthGrant({ id: 'test', updates: {} })
            ).rejects.toThrow();
        });

        // it('should not allow you to update an auth grant for a scoped user profile', async () => {
        //     await scopedUserRead.clients.fullAuth.profile.createServiceProfile({
        //         profileId: 'userd',
        //     });
        //     await expect(
        //         scopedUserRead.clients.fullAuth.authGrants.updateAuthGrant({
        //             id: 'test',
        //             updates: {},
        //         })
        //     ).rejects.toThrow();
        // });

        // it('should allow you to update an auth grant for a scoped user profile with write scope', async () => {
        //     await scopedUserWrite.clients.fullAuth.profile.createServiceProfile({
        //         profileId: 'usere',
        //     });

        //     const authGrantId = await scopedUserWrite.clients.fullAuth.authGrants.addAuthGrant({
        //         name: 'test',
        //     });

        //     await expect(
        //         scopedUserWrite.clients.fullAuth.authGrants.updateAuthGrant({
        //             id: authGrantId,
        //             updates: { name: 'test2' },
        //         })
        //     ).resolves.not.toThrow();
        // });

        it('should return the updated auth grant', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });

            const authGrantId = await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test',
            });

            const didAuthGrantUpdate = await userA.clients.fullAuth.authGrants.updateAuthGrant({
                id: authGrantId,
                updates: { name: 'test2' },
            });

            expect(didAuthGrantUpdate).toBeTruthy();

            const updatedAuthGrant = await userA.clients.fullAuth.authGrants.getAuthGrant({
                id: authGrantId,
            });

            expect((updatedAuthGrant as any).name).toEqual('test2');
        });

        it("should not allow you to update someone else's auth grant", async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createServiceProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            const authGrantId = await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test',
            });

            await expect(
                userB.clients.fullAuth.authGrants.updateAuthGrant({
                    id: authGrantId,
                    updates: { name: 'test2' },
                })
            ).rejects.toThrow();

            await expect(
                userC.clients.fullAuth.authGrants.updateAuthGrant({
                    id: authGrantId,
                    updates: { name: 'test2' },
                })
            ).rejects.toThrow();
        });
    });

    describe('deleteAuthGrant', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await AuthGrant.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await AuthGrant.delete({ detach: true, where: {} });
        });

        it('should not allow you to delete an auth grant for a regular user profile', async () => {
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await expect(
                userA.clients.fullAuth.authGrants.deleteAuthGrant({ id: 'test' })
            ).rejects.toThrow();
        });

        it('should not allow deleting an active auth grant', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });

            const authGrantId = await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test',
            });

            await expect(
                userA.clients.fullAuth.authGrants.deleteAuthGrant({ id: authGrantId })
            ).rejects.toThrow();
        });

        // it('should not allow you to delete an auth grant for a scoped user profile', async () => {
        //     await scopedUserRead.clients.fullAuth.profile.createServiceProfile({
        //         profileId: 'userd',
        //     });

        //     await expect(
        //         scopedUserRead.clients.fullAuth.authGrants.deleteAuthGrant({ id: 'test' })
        //     ).rejects.toThrow();
        // });

        // it('should allow you to delete an auth grant for a scoped user profile with delete scope', async () => {
        //     await scopedUserDelete.clients.fullAuth.profile.createServiceProfile({
        //         profileId: 'userf',
        //     });

        //     const authGrantId = await scopedUserDelete.clients.fullAuth.authGrants.addAuthGrant({
        //         name: 'test',
        //     });

        //     await scopedUserWrite.clients.fullAuth.authGrants.revokeAuthGrant({ id: authGrantId });

        //     await expect(
        //         scopedUserWrite.clients.fullAuth.authGrants.deleteAuthGrant({ id: authGrantId })
        //     ).resolves.not.toThrow();
        // });

        it('should return true when deleting an auth grant', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });

            const authGrantId = await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test',
            });

            await userA.clients.fullAuth.authGrants.revokeAuthGrant({ id: authGrantId });

            const result = await userA.clients.fullAuth.authGrants.deleteAuthGrant({
                id: authGrantId,
            });

            expect(result).toEqual(true);

            const authGrants = await userA.clients.fullAuth.authGrants.getAuthGrants();

            expect(authGrants).toHaveLength(0);
        });

        it("should not allow you to delete someone else's auth grant", async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createServiceProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            const authGrantId = await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test',
            });

            await userA.clients.fullAuth.authGrants.revokeAuthGrant({ id: authGrantId });

            await expect(
                userB.clients.fullAuth.authGrants.deleteAuthGrant({ id: authGrantId })
            ).rejects.toThrow();

            await expect(
                userC.clients.fullAuth.authGrants.deleteAuthGrant({ id: authGrantId })
            ).rejects.toThrow();
        });
    });

    describe('revokeAuthGrant', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await AuthGrant.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await AuthGrant.delete({ detach: true, where: {} });
        });

        it('should not allow you to revoke an auth grant for a regular user profile', async () => {
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await expect(
                userA.clients.fullAuth.authGrants.revokeAuthGrant({ id: 'test' })
            ).rejects.toThrow();
        });

        // it('should not allow you to revoke an auth grant for a scoped user profile', async () => {
        //     await scopedUserRead.clients.fullAuth.profile.createServiceProfile({
        //         profileId: 'userd',
        //     });
        //     await expect(
        //         scopedUserRead.clients.fullAuth.authGrants.revokeAuthGrant({ id: 'test' })
        //     ).rejects.toThrow();
        // });

        // it('should allow you to revoke an auth grant for a scoped user profile with write scope', async () => {
        //     await scopedUserWrite.clients.fullAuth.profile.createServiceProfile({
        //         profileId: 'usere',
        //     });
        //     const authGrantId = await scopedUserWrite.clients.fullAuth.authGrants.addAuthGrant({
        //         name: 'test',
        //     });
        //     await expect(
        //         scopedUserWrite.clients.fullAuth.authGrants.revokeAuthGrant({ id: authGrantId })
        //     ).resolves.not.toThrow();
        // });

        it('should revoke the auth grant', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });

            const authGrantId = await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test',
            });

            const revokedAuthGrant = await userA.clients.fullAuth.authGrants.revokeAuthGrant({
                id: authGrantId,
            });

            expect(revokedAuthGrant).toBeTruthy();

            const authGrant = await userA.clients.fullAuth.authGrants.getAuthGrant({
                id: authGrantId,
            });

            expect((authGrant as any).status).toEqual(AuthGrantStatusValidator.Values.revoked);
        });

        it("should not allow you to revoke someone else's auth grant", async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createServiceProfile({ profileId: 'userb' });
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            const authGrantId = await userA.clients.fullAuth.authGrants.addAuthGrant({
                name: 'test',
            });

            await expect(
                userB.clients.fullAuth.authGrants.revokeAuthGrant({ id: authGrantId })
            ).rejects.toThrow();

            await expect(
                userC.clients.fullAuth.authGrants.revokeAuthGrant({ id: authGrantId })
            ).rejects.toThrow();
        });
    });
});
