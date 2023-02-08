import { getClient, getUser } from './helpers/getClient';
import { Profile } from '@models';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

describe('Profiles', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('createProfile', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should not allow you to create a profile without full auth', async () => {
            await expect(
                noAuthClient.profile.createProfile({ handle: 'userA' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.profile.createProfile({ handle: 'userA' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to create a profile', async () => {
            await expect(
                userA.clients.fullAuth.profile.createProfile({ handle: 'userA' })
            ).resolves.not.toThrow();
        });

        it('should not allow creating a profile with a handle that has already been taken', async () => {
            await expect(
                userA.clients.fullAuth.profile.createProfile({ handle: 'userA' })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.profile.createProfile({ handle: 'userA' })
            ).rejects.toThrow();
        });

        it('should not allow creating a profile with an email that has already been taken', async () => {
            await expect(
                // userA.clients.fullAuth.createProfile({ handle: 'userA', email: 'userA@test.com' })

                userA.clients.fullAuth.profile.createProfile({
                    handle: 'userA',
                    email: 'userA@test.com',
                })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.profile.createProfile({
                    handle: 'userB',
                    email: 'userA@test.com',
                })
            ).rejects.toThrow();
        });

        it('should return the newly created did:web address', async () => {
            expect(await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' })).toEqual(
                'did:web:localhost%3A3000:users:userA'
            );
        });
    });

    describe('getProfile', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({
                handle: 'userA',
                email: 'userA@test.com',
            });
            await userB.clients.fullAuth.profile.createProfile({
                handle: 'userB',
                email: 'userB@test.com',
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should allow you to view your profile without full auth', async () => {
            await expect(noAuthClient.profile.getProfile()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.profile.getProfile()).resolves.not.toMatchObject(
                {
                    code: 'UNAUTHORIZED',
                }
            );
        });

        it('should get the current users profile', async () => {
            const userAProfile = await userA.clients.fullAuth.profile.getProfile();
            const userBProfile = await userB.clients.fullAuth.profile.getProfile();

            expect(userAProfile?.handle).toEqual('userA');
            expect(userAProfile?.email).toEqual('userA@test.com');
            expect(userBProfile?.handle).toEqual('userB');
            expect(userBProfile?.email).toEqual('userB@test.com');
        });
    });

    describe('getOtherProfile', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({
                handle: 'userA',
                email: 'userA@test.com',
            });
            await userB.clients.fullAuth.profile.createProfile({
                handle: 'userB',
                email: 'userB@test.com',
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should allow you to view profiles with/without full auth', async () => {
            await expect(
                noAuthClient.profile.getOtherProfile({ handle: 'userA' })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.partialAuth.profile.getOtherProfile({ handle: 'userB' })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.fullAuth.profile.getOtherProfile({ handle: 'userB' })
            ).resolves.not.toThrow();
        });

        it('should get the correct profile', async () => {
            const userAProfile = await userB.clients.fullAuth.profile.getOtherProfile({
                handle: 'userA',
            });
            const userBProfile = await userA.clients.fullAuth.profile.getOtherProfile({
                handle: 'userB',
            });

            expect(userAProfile?.handle).toEqual('userA');
            expect(userAProfile?.email).toEqual('userA@test.com');
            expect(userBProfile?.handle).toEqual('userB');
            expect(userBProfile?.email).toEqual('userB@test.com');
        });
    });

    describe('searchProfiles', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({
                handle: 'userA',
                email: 'userA@test.com',
            });
            await userB.clients.fullAuth.profile.createProfile({
                handle: 'userB',
                email: 'userB@test.com',
            });
            await Promise.all(
                Array(15)
                    .fill(0)
                    .map(async (_zero, index) => {
                        const user = await getUser((index + 1).toString().padStart(64, '0'));
                        await user.clients.fullAuth.profile.createProfile({
                            handle: `generated${index + 1}`,
                        });
                    })
            );
        }, 10000);

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should allow you to search profiles with/without full auth', async () => {
            await expect(
                noAuthClient.profile.searchProfiles({ input: 'user' })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.partialAuth.profile.searchProfiles({ input: 'user' })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.fullAuth.profile.searchProfiles({ input: 'user' })
            ).resolves.not.toThrow();
        });

        it('should show multiple results', async () => {
            const results = await noAuthClient.profile.searchProfiles({ input: 'user' });

            expect(results).toHaveLength(2);
        });

        it('should take query into account', async () => {
            const none = await noAuthClient.profile.searchProfiles({ input: 'nobody!' });
            const both = await noAuthClient.profile.searchProfiles({ input: 'user' });
            const justA = await noAuthClient.profile.searchProfiles({ input: 'userA' });
            const justB = await noAuthClient.profile.searchProfiles({ input: 'userB' });

            expect(none).toHaveLength(0);
            expect(both).toHaveLength(2);
            expect(justA).toHaveLength(1);
            expect(justB).toHaveLength(1);
        });

        it('should be case insensitive', async () => {
            const results = await noAuthClient.profile.searchProfiles({ input: 'uSeR' });

            expect(results).toHaveLength(2);
        });

        it('limit results to 25 by default', async () => {
            await Promise.all(
                Array(15)
                    .fill(0)
                    .map(async (_zero, index) => {
                        const user = await getUser((index + 100).toString().padStart(64, '0'));
                        await user.clients.fullAuth.profile.createProfile({
                            handle: `generated${index + 100}`,
                        });
                    })
            );
            const results = await noAuthClient.profile.searchProfiles({ input: 'generated' });

            expect(results).toHaveLength(25);
        });

        it('allows raising limit', async () => {
            await Promise.all(
                Array(15)
                    .fill(0)
                    .map(async (_zero, index) => {
                        const user = await getUser((index + 200).toString().padStart(64, '0'));
                        await user.clients.fullAuth.profile.createProfile({
                            handle: `generated${index + 200}`,
                        });
                    })
            );
            const results = await noAuthClient.profile.searchProfiles({
                input: 'generated',
                limit: 30,
            });

            expect(results).toHaveLength(30);
        });

        it('allows lowering limit to 1', async () => {
            const results = await noAuthClient.profile.searchProfiles({ input: 'user', limit: 1 });

            expect(results).toHaveLength(1);
        });

        it('allows empty searches', async () => {
            await expect(noAuthClient.profile.searchProfiles({ input: '' })).resolves.not.toThrow();
        });

        it('does not allow lowering limit to 0 or -1', async () => {
            await expect(
                noAuthClient.profile.searchProfiles({ input: 'user', limit: 0 })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            await expect(
                noAuthClient.profile.searchProfiles({ input: 'user', limit: -1 })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('does not allow raising limit past 100', async () => {
            await expect(
                noAuthClient.profile.searchProfiles({ input: 'user', limit: 101 })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('does not allow non-integer limits', async () => {
            await expect(
                noAuthClient.profile.searchProfiles({ input: 'user', limit: -1 })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });
    });

    describe('updateProfile', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to update your profile', async () => {
            await expect(
                noAuthClient.profile.updateProfile({ email: 'nice@test.com' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.profile.updateProfile({ email: 'nice@test.com' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to update your handle', async () => {
            await expect(
                userA.clients.fullAuth.profile.updateProfile({ handle: 'somethingElse' })
            ).resolves.not.toThrow();
        });

        it('should not allow you to update your handle to one already in use', async () => {
            await expect(
                userA.clients.fullAuth.profile.updateProfile({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('should allow you to update your email', async () => {
            await expect(
                userA.clients.fullAuth.profile.updateProfile({ email: 'nice@test.com' })
            ).resolves.not.toThrow();
        });

        it('should not allow you to update your email to one already in use', async () => {
            await userA.clients.fullAuth.profile.updateProfile({ email: 'nice@test.com' });
            await expect(
                userB.clients.fullAuth.profile.updateProfile({ email: 'nice@test.com' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('should allow you to update your profile image', async () => {
            await expect(
                userA.clients.fullAuth.profile.updateProfile({
                    image: 'https://cdn.filestackcontent.com/XxBxN1A6QgSrwCK4hUAF',
                })
            ).resolves.not.toThrow();
        });

        it('should allow you to update your profile image to one already in use', async () => {
            await userA.clients.fullAuth.profile.updateProfile({
                image: 'https://cdn.filestackcontent.com/XxBxN1A6QgSrwCK4hUAF',
            });
            await expect(
                userB.clients.fullAuth.profile.updateProfile({
                    image: 'https://cdn.filestackcontent.com/XxBxN1A6QgSrwCK4hUAF',
                })
            ).resolves.not.toThrow();
        });
    });

    describe('deleteProfile', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to delete your profile', async () => {
            await expect(noAuthClient.profile.deleteProfile()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.profile.deleteProfile()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow you to delete your profile', async () => {
            await expect(userA.clients.fullAuth.profile.deleteProfile()).resolves.not.toThrow();
            await expect(userA.clients.fullAuth.profile.getProfile()).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('should not show deleted profiles to other users', async () => {
            const beforeDeletion = await userB.clients.fullAuth.profile.getOtherProfile({
                handle: 'userA',
            });

            expect(beforeDeletion?.handle).toEqual('userA');

            await userA.clients.fullAuth.profile.deleteProfile();

            const afterDeletion = await userB.clients.fullAuth.profile.getOtherProfile({
                handle: 'userA',
            });

            expect(afterDeletion).toBeUndefined();
        });
    });

    describe('connectWith', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to connect with another user', async () => {
            await expect(
                noAuthClient.profile.connectWith({ handle: 'userB' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.profile.connectWith({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows users to send a connection request', async () => {
            await expect(
                userA.clients.fullAuth.profile.connectWith({ handle: 'userB' })
            ).resolves.not.toThrow();

            expect(await userA.clients.fullAuth.profile.pendingConnections()).toHaveLength(1);
            expect(await userB.clients.fullAuth.profile.connectionRequests()).toHaveLength(1);
        });

        it('does not allow users to resend a connection request', async () => {
            await userA.clients.fullAuth.profile.connectWith({ handle: 'userB' });
            await expect(
                userA.clients.fullAuth.profile.connectWith({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('errors when trying to connect with a user you are already connected with', async () => {
            await userA.clients.fullAuth.profile.connectWith({ handle: 'userB' });
            await userB.clients.fullAuth.profile.acceptConnectionRequest({ handle: 'userA' });
            await expect(
                userA.clients.fullAuth.profile.connectWith({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });
    });

    describe('acceptConnectionRequest', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });

            await userB.clients.fullAuth.profile.connectWith({ handle: 'userA' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to accept connection requests', async () => {
            await expect(
                noAuthClient.profile.acceptConnectionRequest({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.profile.acceptConnectionRequest({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows users to accept connection requests', async () => {
            await expect(
                userA.clients.fullAuth.profile.acceptConnectionRequest({ handle: 'userB' })
            ).resolves.not.toThrow();
        });

        it('errors when accepting a request that does not exist', async () => {
            await expect(
                userB.clients.fullAuth.profile.acceptConnectionRequest({ handle: 'userA' })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('removes the pending request', async () => {
            const pendingFromUserA = await userA.clients.fullAuth.profile.connectionRequests();
            const pendingFromUserB = await userB.clients.fullAuth.profile.pendingConnections();

            expect(pendingFromUserA).toHaveLength(1);
            expect(pendingFromUserB).toHaveLength(1);

            await userA.clients.fullAuth.profile.acceptConnectionRequest({ handle: 'userB' });

            const newPendingFromUserA = await userA.clients.fullAuth.profile.connectionRequests();
            const newPendingFromUserB = await userB.clients.fullAuth.profile.pendingConnections();

            expect(newPendingFromUserA).toHaveLength(0);
            expect(newPendingFromUserB).toHaveLength(0);
        });
    });

    describe('connections', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to view connections', async () => {
            await expect(noAuthClient.profile.connections()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.profile.connections()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('allows users to view connections', async () => {
            await expect(userA.clients.fullAuth.profile.connections()).resolves.not.toThrow();

            const noConnections = await userA.clients.fullAuth.profile.connections();

            expect(noConnections).toHaveLength(0);

            await userA.clients.fullAuth.profile.connectWith({ handle: 'userB' });
            await userB.clients.fullAuth.profile.acceptConnectionRequest({ handle: 'userA' });

            const oneConnection = await userA.clients.fullAuth.profile.connections();

            expect(oneConnection).toHaveLength(1);
            expect(oneConnection[0]!.handle).toEqual('userB');
        });
    });

    describe('pendingConnections', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to view pending connections', async () => {
            await expect(noAuthClient.profile.pendingConnections()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.profile.pendingConnections()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('allows users to view pending connections', async () => {
            await expect(
                userA.clients.fullAuth.profile.pendingConnections()
            ).resolves.not.toThrow();

            const noPendingConnections = await userA.clients.fullAuth.profile.pendingConnections();

            expect(noPendingConnections).toHaveLength(0);

            await userA.clients.fullAuth.profile.connectWith({ handle: 'userB' });

            const onePendingConnection = await userA.clients.fullAuth.profile.pendingConnections();

            expect(onePendingConnection).toHaveLength(1);
            expect(onePendingConnection[0]!.handle).toEqual('userB');
        });
    });

    describe('connectionRequests', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to view connection requests', async () => {
            await expect(noAuthClient.profile.connectionRequests()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.profile.connectionRequests()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('allows users to view connection requests', async () => {
            await expect(
                userA.clients.fullAuth.profile.connectionRequests()
            ).resolves.not.toThrow();

            const noConnectionRequests = await userA.clients.fullAuth.profile.connectionRequests();

            expect(noConnectionRequests).toHaveLength(0);

            await userB.clients.fullAuth.profile.connectWith({ handle: 'userA' });

            const oneConnectionRequest = await userA.clients.fullAuth.profile.connectionRequests();

            expect(oneConnectionRequest).toHaveLength(1);
            expect(oneConnectionRequest[0]!.handle).toEqual('userB');
        });
    });

    describe('registerSigningAuthority', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to register a signing authority', async () => {
            await expect(
                noAuthClient.profile.registerSigningAuthority({
                    signingAuthority: 'http://localhost:4000',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.profile.registerSigningAuthority({
                    signingAuthority: 'http://localhost:4000',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows registering a signing authority', async () => {
            await expect(
                userA.clients.fullAuth.profile.registerSigningAuthority({
                    signingAuthority: 'http://localhost:4000',
                })
            ).resolves.not.toThrow();
        });
    });
});
