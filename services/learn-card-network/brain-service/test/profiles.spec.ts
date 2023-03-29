import { LCNProfileConnectionStatusEnum } from '@learncard/types';
import { getClient, getUser } from './helpers/getClient';
import { Profile, SigningAuthority } from '@models';
import cache from '@cache';

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
                noAuthClient.profile.createProfile({ profileId: 'usera' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.profile.createProfile({ profileId: 'usera' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to create a profile', async () => {
            await expect(
                userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' })
            ).resolves.not.toThrow();
        });

        it('should not allow creating a profile with a profileId that has already been taken', async () => {
            await expect(
                userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.profile.createProfile({ profileId: 'usera' })
            ).rejects.toThrow();
        });

        it('should not allow creating a profile with an email that has already been taken', async () => {
            await expect(
                userA.clients.fullAuth.profile.createProfile({
                    profileId: 'usera',
                    email: 'userA@test.com',
                })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.profile.createProfile({
                    profileId: 'userb',
                    email: 'userA@test.com',
                })
            ).rejects.toThrow();
        });

        it('should return the newly created did:web address', async () => {
            expect(
                await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' })
            ).toEqual('did:web:localhost%3A3000:users:usera');
        });

        it('should allow setting your display name', async () => {
            await userA.clients.fullAuth.profile.createProfile({
                profileId: 'usera',
                displayName: 'A',
            });
            await expect(
                userB.clients.fullAuth.profile.createProfile({
                    profileId: 'userb',
                    displayName: 'A',
                })
            ).resolves.not.toThrow();
        });

        it('should allow non-unique display names', async () => {
            await userA.clients.fullAuth.profile.createProfile({
                profileId: 'usera',
                displayName: 'A',
            });

            const userAResult = await userB.clients.fullAuth.profile.getOtherProfile({
                profileId: 'usera',
            });

            expect(userAResult?.displayName).toEqual('A');
        });

        it('should force profileIds to be lowercase', async () => {
            await userA.clients.fullAuth.profile.createProfile({
                profileId: 'userA',
            });

            const userAResult = await userA.clients.fullAuth.profile.getProfile();

            expect(userAResult?.profileId).toEqual('usera');
        });

        it('should not allow profileIds that are too short or too long', async () => {
            await expect(
                userA.clients.fullAuth.profile.createProfile({ profileId: 'a' })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
            await expect(
                userA.clients.fullAuth.profile.createProfile({ profileId: 'a'.repeat(500) })
            ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
        });

        it('should URL encode colons', async () => {
            await userA.clients.fullAuth.profile.createProfile({
                profileId: 'user:a',
            });

            const userAResult = await userA.clients.fullAuth.profile.getProfile();

            expect(userAResult?.profileId).toEqual('user%3Aa');
        });

        it('should not create a service profile', async () => {
            await userA.clients.fullAuth.profile.createProfile({
                profileId: 'usera',
            });

            const userAResult = await userA.clients.fullAuth.profile.getProfile();

            expect(userAResult?.isServiceProfile).toBeFalsy();
        });

        it('should allow setting your notifications webhook', async () => {
            await expect(
                userA.clients.fullAuth.profile.createProfile({
                    profileId: 'usera',
                    notificationsWebhook: 'https://api.learncard.app/send/notifications',
                })
            ).resolves.not.toThrow();

            const userAResult = await userA.clients.fullAuth.profile.getProfile();

            expect(userAResult?.notificationsWebhook).toEqual(
                'https://api.learncard.app/send/notifications'
            );
        });
    });

    describe('createServiceProfile', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should not allow you to create a profile without full auth', async () => {
            await expect(
                noAuthClient.profile.createServiceProfile({ profileId: 'usera' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.profile.createServiceProfile({ profileId: 'usera' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to create a profile', async () => {
            await expect(
                userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' })
            ).resolves.not.toThrow();
        });

        it('should not allow creating a profile with a profileId that has already been taken', async () => {
            await expect(
                userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' })
            ).rejects.toThrow();
        });

        it('should not allow creating a profile with an email that has already been taken', async () => {
            await expect(
                userA.clients.fullAuth.profile.createServiceProfile({
                    profileId: 'usera',
                    email: 'userA@test.com',
                })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.profile.createServiceProfile({
                    profileId: 'userb',
                    email: 'userA@test.com',
                })
            ).rejects.toThrow();
        });

        it('should return the newly created did:web address', async () => {
            expect(
                await userA.clients.fullAuth.profile.createServiceProfile({ profileId: 'usera' })
            ).toEqual('did:web:localhost%3A3000:users:usera');
        });

        it('should allow setting your display name', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({
                profileId: 'usera',
                displayName: 'A',
            });
            await expect(
                userB.clients.fullAuth.profile.createServiceProfile({
                    profileId: 'userb',
                    displayName: 'A',
                })
            ).resolves.not.toThrow();
        });

        it('should allow non-unique display names', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({
                profileId: 'usera',
                displayName: 'A',
            });

            const userAResult = await userB.clients.fullAuth.profile.getOtherProfile({
                profileId: 'usera',
            });

            expect(userAResult?.displayName).toEqual('A');
        });

        it('should force profileIds to be lowercase', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({
                profileId: 'userA',
            });

            const userAResult = await userA.clients.fullAuth.profile.getProfile();

            expect(userAResult?.profileId).toEqual('usera');
        });

        it('should create a service profile', async () => {
            await userA.clients.fullAuth.profile.createServiceProfile({
                profileId: 'usera',
            });

            const userAResult = await userA.clients.fullAuth.profile.getProfile();

            expect(userAResult?.isServiceProfile).toBeTruthy();
        });
    });

    describe('getProfile', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({
                profileId: 'usera',
                displayName: 'A',
                email: 'userA@test.com',
            });
            await userB.clients.fullAuth.profile.createProfile({
                profileId: 'userb',
                displayName: 'B',
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

            expect(userAProfile?.profileId).toEqual('usera');
            expect(userAProfile?.displayName).toEqual('A');
            expect(userAProfile?.email).toEqual('userA@test.com');
            expect(userBProfile?.profileId).toEqual('userb');
            expect(userBProfile?.displayName).toEqual('B');
            expect(userBProfile?.email).toEqual('userB@test.com');
        });
    });

    describe('getOtherProfile', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({
                profileId: 'usera',
                displayName: 'A',
                email: 'userA@test.com',
            });
            await userB.clients.fullAuth.profile.createProfile({
                profileId: 'userb',
                displayName: 'B',
                email: 'userB@test.com',
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should allow you to view profiles with/without full auth', async () => {
            await expect(
                noAuthClient.profile.getOtherProfile({ profileId: 'usera' })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.partialAuth.profile.getOtherProfile({ profileId: 'userb' })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.fullAuth.profile.getOtherProfile({ profileId: 'userb' })
            ).resolves.not.toThrow();
        });

        it('should get the correct profile', async () => {
            const userAProfile = await userB.clients.fullAuth.profile.getOtherProfile({
                profileId: 'usera',
            });
            const userBProfile = await userA.clients.fullAuth.profile.getOtherProfile({
                profileId: 'userb',
            });

            expect(userAProfile?.profileId).toEqual('usera');
            expect(userAProfile?.displayName).toEqual('A');
            expect(userAProfile?.email).toEqual('userA@test.com');
            expect(userBProfile?.profileId).toEqual('userb');
            expect(userBProfile?.displayName).toEqual('B');
            expect(userBProfile?.email).toEqual('userB@test.com');
        });
    });

    describe('searchProfiles', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({
                profileId: 'usera',
                displayName: 'AName',
                email: 'userA@test.com',
            });
            await userB.clients.fullAuth.profile.createProfile({
                profileId: 'userb',
                displayName: 'BName',
                email: 'userB@test.com',
            });
            await Promise.all(
                Array(30)
                    .fill(0)
                    .map(async (_zero, index) => {
                        const client = getClient({
                            did: `did:test:${index + 1}`,
                            isChallengeValid: true,
                        });
                        await client.profile.createProfile({
                            profileId: `generated${index + 1}`,
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
            const results = await noAuthClient.profile.searchProfiles({ input: 'generated' });

            expect(results).toHaveLength(25);
        });

        it('allows raising limit', async () => {
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

        it('should search based on both profileIds and displaynames', async () => {
            const displayNameResults = await noAuthClient.profile.searchProfiles({ input: 'name' });
            const profileIdResults = await noAuthClient.profile.searchProfiles({ input: 'user' });

            expect(displayNameResults).toHaveLength(2);
            expect(profileIdResults).toHaveLength(2);
        });

        it('should allow you to not include yourself', async () => {
            const results = await userA.clients.fullAuth.profile.searchProfiles({
                input: 'user',
                includeSelf: false,
            });

            expect(results).toHaveLength(1);
            expect(results.find(result => result.profileId === 'usera')).toBeFalsy();
        });

        it('should omit the connection status if includeConnectionStatus is false', async () => {
            const resultsNotConnected = await userA.clients.fullAuth.profile.searchProfiles({
                input: 'user',
                includeSelf: false,
                includeConnectionStatus: false,
            });
            expect(
                resultsNotConnected.find(result => result.profileId === 'userb').connectionStatus
            ).toBeUndefined();
        });

        it('should allow you to include connection status', async () => {
            const resultsNotConnected = await userA.clients.fullAuth.profile.searchProfiles({
                input: 'user',
                includeSelf: false,
                includeConnectionStatus: true,
            });
            expect(
                resultsNotConnected.find(result => result.profileId === 'userb').connectionStatus
            ).toBe(LCNProfileConnectionStatusEnum.enum.NOT_CONNECTED);

            await userA.clients.fullAuth.profile.connectWith({ profileId: 'userb' });
            const resultsRequestSent = await userA.clients.fullAuth.profile.searchProfiles({
                input: 'user',
                includeSelf: false,
                includeConnectionStatus: true,
            });
            expect(
                resultsRequestSent.find(result => result.profileId === 'userb').connectionStatus
            ).toBe(LCNProfileConnectionStatusEnum.enum.PENDING_REQUEST_SENT);

            await userB.clients.fullAuth.profile.acceptConnectionRequest({ profileId: 'usera' });
            const resultsConnected = await userA.clients.fullAuth.profile.searchProfiles({
                input: 'user',
                includeSelf: false,
                includeConnectionStatus: true,
            });
            expect(
                resultsConnected.find(result => result.profileId === 'userb').connectionStatus
            ).toBe(LCNProfileConnectionStatusEnum.enum.CONNECTED);

            await userB.clients.fullAuth.profile.disconnectWith({ profileId: 'usera' });
            const notConnectedAfterDisconnect = await userA.clients.fullAuth.profile.searchProfiles(
                {
                    input: 'user',
                    includeSelf: false,
                    includeConnectionStatus: true,
                }
            );
            expect(
                notConnectedAfterDisconnect.find(result => result.profileId === 'userb')
                    .connectionStatus
            ).toBe(LCNProfileConnectionStatusEnum.enum.NOT_CONNECTED);

            await userB.clients.fullAuth.profile.connectWith({ profileId: 'usera' });
            const resultsPendingRequestReceived =
                await userA.clients.fullAuth.profile.searchProfiles({
                    input: 'user',
                    includeSelf: false,
                    includeConnectionStatus: true,
                });
            expect(
                resultsPendingRequestReceived.find(result => result.profileId === 'userb')
                    .connectionStatus
            ).toBe(LCNProfileConnectionStatusEnum.enum.PENDING_REQUEST_RECEIVED);
        });
    });

    describe('updateProfile', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
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

        it('should allow you to update your profileId', async () => {
            await expect(
                userA.clients.fullAuth.profile.updateProfile({ profileId: 'somethingelse' })
            ).resolves.not.toThrow();
        });

        it('should not allow you to update your profileId to one already in use', async () => {
            await expect(
                userA.clients.fullAuth.profile.updateProfile({ profileId: 'usera' })
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

        it('should allow you to update your display name', async () => {
            await expect(
                userA.clients.fullAuth.profile.updateProfile({ displayName: 'nice' })
            ).resolves.not.toThrow();
        });

        it('should allow you to update your display name to one already in use', async () => {
            await userA.clients.fullAuth.profile.updateProfile({ displayName: 'nice' });
            await expect(
                userB.clients.fullAuth.profile.updateProfile({ displayName: 'nice' })
            ).resolves.not.toThrow();
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

        it('should force profileIds to be lowercase', async () => {
            await userA.clients.fullAuth.profile.updateProfile({
                profileId: 'userC',
            });

            const userAResult = await userA.clients.fullAuth.profile.getProfile();

            expect(userAResult?.profileId).toEqual('userc');
        });

        it('should allow updating your notifications webhook', async () => {
            await expect(
                userA.clients.fullAuth.profile.updateProfile({
                    notificationsWebhook: 'https://api.learncard.app/send/notifications/updated',
                })
            ).resolves.not.toThrow();

            const userAResult = await userA.clients.fullAuth.profile.getProfile();

            expect(userAResult?.notificationsWebhook).toEqual(
                'https://api.learncard.app/send/notifications/updated'
            );
        });
    });

    describe('deleteProfile', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
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

        it('should allow you to delete your profile with connections', async () => {
            await userA.clients.fullAuth.profile.connectWith({ profileId: 'userb' });
            await userB.clients.fullAuth.profile.acceptConnectionRequest({ profileId: 'usera' });

            await expect(userA.clients.fullAuth.profile.deleteProfile()).resolves.not.toThrow();
            await expect(userA.clients.fullAuth.profile.getProfile()).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('should not show deleted profiles to other users', async () => {
            const beforeDeletion = await userB.clients.fullAuth.profile.getOtherProfile({
                profileId: 'usera',
            });

            expect(beforeDeletion?.profileId).toEqual('usera');

            await userA.clients.fullAuth.profile.deleteProfile();

            const afterDeletion = await userB.clients.fullAuth.profile.getOtherProfile({
                profileId: 'usera',
            });

            expect(afterDeletion).toBeUndefined();
        });
    });

    describe('connectWith', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to connect with another user', async () => {
            await expect(
                noAuthClient.profile.connectWith({ profileId: 'userb' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.profile.connectWith({ profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows users to send a connection request', async () => {
            await expect(
                userA.clients.fullAuth.profile.connectWith({ profileId: 'userb' })
            ).resolves.not.toThrow();

            expect(await userA.clients.fullAuth.profile.pendingConnections()).toHaveLength(1);
            expect(await userB.clients.fullAuth.profile.connectionRequests()).toHaveLength(1);
        });

        it('does not allow users to resend a connection request', async () => {
            await userA.clients.fullAuth.profile.connectWith({ profileId: 'userb' });
            await expect(
                userA.clients.fullAuth.profile.connectWith({ profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('errors when trying to connect with a user you are already connected with', async () => {
            await userA.clients.fullAuth.profile.connectWith({ profileId: 'userb' });
            await userB.clients.fullAuth.profile.acceptConnectionRequest({ profileId: 'usera' });
            await expect(
                userA.clients.fullAuth.profile.connectWith({ profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });
    });

    describe('cancelConnectionRequest', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to cancel connection request with another user', async () => {
            await expect(
                noAuthClient.profile.cancelConnectionRequest({ profileId: 'userb' })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.profile.cancelConnectionRequest({ profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows users to cancel a connection request', async () => {
            await userA.clients.fullAuth.profile.connectWith({ profileId: 'userb' });

            expect(await userA.clients.fullAuth.profile.pendingConnections()).toHaveLength(1);
            expect(await userB.clients.fullAuth.profile.connectionRequests()).toHaveLength(1);

            await expect(
                userA.clients.fullAuth.profile.cancelConnectionRequest({ profileId: 'userb' })
            ).resolves.not.toThrow();

            expect(await userA.clients.fullAuth.profile.pendingConnections()).toHaveLength(0);
            expect(await userB.clients.fullAuth.profile.connectionRequests()).toHaveLength(0);
        });

        it("does not allow users to cancel a connection request that doesn't exist", async () => {
            await expect(
                userA.clients.fullAuth.profile.cancelConnectionRequest({ profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });
    });

    describe('connectWithInvite', () => {
        beforeEach(async () => {
            await cache.node.flushall();
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await cache.node.flushall();
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to connect with another user via invite challenge', async () => {
            const { challenge } = await userB.clients.fullAuth.profile.generateInvite();

            await expect(
                noAuthClient.profile.connectWithInvite({ profileId: 'userb', challenge })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.profile.connectWithInvite({
                    profileId: 'userb',
                    challenge,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows users to connect via invite challenge', async () => {
            const { challenge } = await userB.clients.fullAuth.profile.generateInvite();

            await expect(
                userA.clients.fullAuth.profile.connectWithInvite({ profileId: 'userb', challenge })
            ).resolves.not.toThrow();

            const oneConnection = await userA.clients.fullAuth.profile.connections();

            expect(oneConnection).toHaveLength(1);
            expect(oneConnection[0]!.profileId).toEqual('userb');
        });

        it('does not allow users to connect with an invalid challenge', async () => {
            await expect(
                userA.clients.fullAuth.profile.connectWithInvite({
                    profileId: 'userb',
                    challenge: 'nice',
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it("does not allow users to connect with someone else's challenge", async () => {
            const userC = await getUser('c'.repeat(64));
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            const { challenge } = await userC.clients.fullAuth.profile.generateInvite();

            await expect(
                userA.clients.fullAuth.profile.connectWithInvite({
                    profileId: 'userb',
                    challenge,
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });
    });

    describe('disconnectWith', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            await userA.clients.fullAuth.profile.connectWith({ profileId: 'userb' });
            await userB.clients.fullAuth.profile.acceptConnectionRequest({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to disconnect with another user', async () => {
            await expect(
                userA.clients.partialAuth.profile.disconnectWith({ profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows users to disconnect', async () => {
            await expect(
                userA.clients.fullAuth.profile.disconnectWith({ profileId: 'userb' })
            ).resolves.not.toThrow();

            expect(await userA.clients.fullAuth.profile.connections()).toHaveLength(0);
            expect(await userB.clients.fullAuth.profile.connections()).toHaveLength(0);
        });

        it('errors when users are not connected', async () => {
            await userA.clients.fullAuth.profile.disconnectWith({ profileId: 'userb' });

            await expect(
                userA.clients.fullAuth.profile.disconnectWith({ profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });
    });

    describe('acceptConnectionRequest', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });

            await userB.clients.fullAuth.profile.connectWith({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to accept connection requests', async () => {
            await expect(
                noAuthClient.profile.acceptConnectionRequest({ profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.profile.acceptConnectionRequest({ profileId: 'userb' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows users to accept connection requests', async () => {
            await expect(
                userA.clients.fullAuth.profile.acceptConnectionRequest({ profileId: 'userb' })
            ).resolves.not.toThrow();
        });

        it('errors when accepting a request that does not exist', async () => {
            await expect(
                userB.clients.fullAuth.profile.acceptConnectionRequest({ profileId: 'usera' })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('removes the pending request', async () => {
            const pendingFromUserA = await userA.clients.fullAuth.profile.connectionRequests();
            const pendingFromUserB = await userB.clients.fullAuth.profile.pendingConnections();

            expect(pendingFromUserA).toHaveLength(1);
            expect(pendingFromUserB).toHaveLength(1);

            await userA.clients.fullAuth.profile.acceptConnectionRequest({ profileId: 'userb' });

            const newPendingFromUserA = await userA.clients.fullAuth.profile.connectionRequests();
            const newPendingFromUserB = await userB.clients.fullAuth.profile.pendingConnections();

            expect(newPendingFromUserA).toHaveLength(0);
            expect(newPendingFromUserB).toHaveLength(0);
        });
    });

    describe('connections', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
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

            await userA.clients.fullAuth.profile.connectWith({ profileId: 'userb' });
            await userB.clients.fullAuth.profile.acceptConnectionRequest({ profileId: 'usera' });

            const oneConnection = await userA.clients.fullAuth.profile.connections();

            expect(oneConnection).toHaveLength(1);
            expect(oneConnection[0]!.profileId).toEqual('userb');
        });
    });

    describe('pendingConnections', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
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

            await userA.clients.fullAuth.profile.connectWith({ profileId: 'userb' });

            const onePendingConnection = await userA.clients.fullAuth.profile.pendingConnections();

            expect(onePendingConnection).toHaveLength(1);
            expect(onePendingConnection[0]!.profileId).toEqual('userb');
        });
    });

    describe('connectionRequests', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
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

            await userB.clients.fullAuth.profile.connectWith({ profileId: 'usera' });

            const oneConnectionRequest = await userA.clients.fullAuth.profile.connectionRequests();

            expect(oneConnectionRequest).toHaveLength(1);
            expect(oneConnectionRequest[0]!.profileId).toEqual('userb');
        });
    });

    describe('generateInvite', () => {
        beforeEach(async () => {
            await cache.node.flushall();
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await cache.node.flushall();
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to generate an invite', async () => {
            await expect(noAuthClient.profile.generateInvite()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.profile.generateInvite()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('allows users to generate an invitation challenge', async () => {
            await expect(userA.clients.fullAuth.profile.generateInvite()).resolves.not.toThrow();
        });

        it('creates a new challenge if none is supplied', async () => {
            const { challenge } = await userA.clients.fullAuth.profile.generateInvite();

            expect(challenge).toBeTruthy();
        });

        it('uses a supplied challenge if none is supplied', async () => {
            const { challenge } = await userA.clients.fullAuth.profile.generateInvite({
                challenge: 'nice',
            });

            expect(challenge).toEqual('nice');
        });

        it('does allow using multiple challenges', async () => {
            await userA.clients.fullAuth.profile.generateInvite({ challenge: 'c1' });
            await expect(
                userA.clients.fullAuth.profile.generateInvite({ challenge: 'c2' })
            ).resolves.not.toThrow();
            await expect(userA.clients.fullAuth.profile.generateInvite()).resolves.not.toThrow();
        });

        it('does not allow using the same challenge more than once', async () => {
            await userA.clients.fullAuth.profile.generateInvite({ challenge: 'nice' });
            await expect(
                userA.clients.fullAuth.profile.generateInvite({ challenge: 'nice' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('expires challenges after a while, allowing them to be used again', async () => {
            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));

            await userA.clients.fullAuth.profile.generateInvite({ challenge: 'nice' });

            jest.setSystemTime(new Date('02-06-2024'));

            await expect(
                userB.clients.fullAuth.profile.connectWithInvite({
                    challenge: 'nice',
                    profileId: 'usera',
                })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });

            await expect(
                userA.clients.fullAuth.profile.generateInvite({ challenge: 'nice' })
            ).resolves.not.toThrow();

            jest.useRealTimers();
        });
    });

    describe('registerSigningAuthority', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} })
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await SigningAuthority.delete({ detach: true, where: {} })
        });

        it('should require full auth to register a signing authority', async () => {
            await expect(
                noAuthClient.profile.registerSigningAuthority({
                    endpoint: 'http://localhost:4000',
                    name: 'mysa',
                    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw'
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.profile.registerSigningAuthority({
                    endpoint: 'http://localhost:4000',
                    name: 'mysa',
                    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw'
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows registering a signing authority', async () => {
            await expect(
                userA.clients.fullAuth.profile.registerSigningAuthority({
                    endpoint: 'http://localhost:4000',
                    name: 'mysa',
                    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw'
                })
            ).resolves.not.toThrow();
        });

        it('allows retrieving a list of signing authorities', async () => {
            await expect(userA.clients.fullAuth.profile.signingAuthorities()).resolves.toHaveLength(0);
            await expect(
                userA.clients.fullAuth.profile.registerSigningAuthority({
                    endpoint: 'http://localhost:4000',
                    name: 'mysa',
                    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw'
                })
            ).resolves.not.toThrow();

            const result = await userA.clients.fullAuth.profile.signingAuthorities()
            expect(result[0]).toMatchObject({
                signingAuthority: {
                    endpoint: 'http://localhost:4000',
                },
                relationship: {
                    name: 'mysa',
                    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw'
                }
            });

            await expect(
                userA.clients.fullAuth.profile.registerSigningAuthority({
                    endpoint: 'http://localhost:5000',
                    name: 'mysa2',
                    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw'
                })
            ).resolves.not.toThrow();

            expect(userA.clients.fullAuth.profile.signingAuthorities()).resolves.toHaveLength(2);
        });

        it('allows retrieving a specific, named signing authority', async () => {
            await expect(
                userA.clients.fullAuth.profile.registerSigningAuthority({
                    endpoint: 'http://localhost:4000',
                    name: 'mysa',
                    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw'
                })
            ).resolves.not.toThrow();

            await expect(
                userA.clients.fullAuth.profile.registerSigningAuthority({
                    endpoint: 'http://localhost:5000',
                    name: 'mysa2',
                    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw'
                })
            ).resolves.not.toThrow();

            await expect(userA.clients.fullAuth.profile.signingAuthority({ endpoint: 'http://localhost:5000', name: 'mysa2' })).resolves.toMatchObject({
                signingAuthority: {
                    endpoint: 'http://localhost:5000',
                },
                relationship: {
                    name: 'mysa2',
                    did: 'did:key:z6MkitsQTk2GDNYXAFckVcQHtC68S9j9ruVFYWrixM6RG5Mw'
                }
            })           
        });
    });
});