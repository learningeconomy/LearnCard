import { getClient, getUser } from './helpers/getClient';
import { Profile, Credential } from '@models';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

describe('LearnCard Network Profile Service', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('healthCheck', () => {
        it('should work with no auth', async () => {
            const response = await noAuthClient.healthCheck();
            expect(response).toBeTruthy();
        });

        it('should work with simple auth', async () => {
            const response = await userA.clients.partialAuth.healthCheck();
            expect(response).toBeTruthy();
        });

        it('should work with full auth', async () => {
            const response = await userA.clients.fullAuth.healthCheck();
            expect(response).toBeTruthy();
        });
    });

    describe('getChallenges', () => {
        it('should not work with no auth', async () => {
            await expect(noAuthClient.getChallenges({})).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should work with simple auth', async () => {
            await expect(userA.clients.partialAuth.getChallenges({})).resolves.not.toThrow();
        });

        it('should work with full auth', async () => {
            await expect(userA.clients.fullAuth.getChallenges({})).resolves.not.toThrow();
        });

        it('should default to 100 challenges', async () => {
            const challenges = await userA.clients.partialAuth.getChallenges({});
            expect(challenges).toHaveLength(100);
        });

        it('should allow requesting fewer than 100 challenges', async () => {
            const tenChallenges = await userA.clients.partialAuth.getChallenges({ amount: 10 });
            const twentyChallenges = await userA.clients.partialAuth.getChallenges({ amount: 20 });
            expect(tenChallenges).toHaveLength(10);
            expect(twentyChallenges).toHaveLength(20);
        });

        it('should not allow requesting more than 100 challenges', async () => {
            await expect(noAuthClient.getChallenges({ amount: 101 })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should not allow requesting negative or non-integer challenges', async () => {
            await expect(noAuthClient.getChallenges({ amount: -1 })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(noAuthClient.getChallenges({ amount: 10.5 })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });

    describe('createProfile', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should not allow you to create a profile without full auth', async () => {
            await expect(noAuthClient.createProfile({ handle: 'userA' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.createProfile({ handle: 'userA' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to create a profile', async () => {
            await expect(
                userA.clients.fullAuth.createProfile({ handle: 'userA' })
            ).resolves.not.toThrow();
        });

        it('should not allow creating a profile with a handle that has already been taken', async () => {
            await expect(
                userA.clients.fullAuth.createProfile({ handle: 'userA' })
            ).resolves.not.toThrow();
            await expect(
                userB.clients.fullAuth.createProfile({ handle: 'userA' })
            ).rejects.toThrow();
        });

        it('should return the newly created did:web address', async () => {
            expect(await userA.clients.fullAuth.createProfile({ handle: 'userA' })).toEqual(
                'did:web:localhost%3A3000:users:userA'
            );
        });
    });

    describe('getProfile', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.createProfile({
                handle: 'userA',
                email: 'userA@test.com',
            });
            await userB.clients.fullAuth.createProfile({
                handle: 'userB',
                email: 'userB@test.com',
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should allow you to view your profile without full auth', async () => {
            await expect(noAuthClient.getProfile()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(userA.clients.partialAuth.getProfile()).resolves.not.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should get the current users profile', async () => {
            const userAProfile = await userA.clients.fullAuth.getProfile();
            const userBProfile = await userB.clients.fullAuth.getProfile();

            expect(userAProfile?.handle).toEqual('userA');
            expect(userAProfile?.email).toEqual('userA@test.com');
            expect(userBProfile?.handle).toEqual('userB');
            expect(userBProfile?.email).toEqual('userB@test.com');
        });
    });

    describe('getOtherProfile', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.createProfile({
                handle: 'userA',
                email: 'userA@test.com',
            });
            await userB.clients.fullAuth.createProfile({
                handle: 'userB',
                email: 'userB@test.com',
            });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should allow you to view profiles with/without full auth', async () => {
            await expect(noAuthClient.getOtherProfile({ handle: 'userA' })).resolves.not.toThrow();
            await expect(
                userA.clients.partialAuth.getOtherProfile({ handle: 'userB' })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.fullAuth.getOtherProfile({ handle: 'userB' })
            ).resolves.not.toThrow();
        });

        it('should get the correct profile', async () => {
            const userAProfile = await userB.clients.fullAuth.getOtherProfile({ handle: 'userA' });
            const userBProfile = await userA.clients.fullAuth.getOtherProfile({ handle: 'userB' });

            expect(userAProfile?.handle).toEqual('userA');
            expect(userAProfile?.email).toEqual('userA@test.com');
            expect(userBProfile?.handle).toEqual('userB');
            expect(userBProfile?.email).toEqual('userB@test.com');
        });
    });

    describe('updateProfile', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to update your profile', async () => {
            await expect(
                noAuthClient.updateProfile({ email: 'nice@test.com' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.updateProfile({ email: 'nice@test.com' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow you to update your handle', async () => {
            await expect(
                userA.clients.fullAuth.updateProfile({ handle: 'somethingElse' })
            ).resolves.not.toThrow();
        });

        it('should not allow you to update your handle to one already in use', async () => {
            await expect(
                userA.clients.fullAuth.updateProfile({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('should allow you to update your email', async () => {
            await expect(
                userA.clients.fullAuth.updateProfile({ email: 'nice@test.com' })
            ).resolves.not.toThrow();
        });

        it('should not allow you to update your email to one already in use', async () => {
            await userA.clients.fullAuth.updateProfile({ email: 'nice@test.com' });
            await expect(
                userB.clients.fullAuth.updateProfile({ email: 'nice@test.com' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('should allow you to update your profile image', async () => {
            await expect(
                userA.clients.fullAuth.updateProfile({
                    image: 'https://cdn.filestackcontent.com/XxBxN1A6QgSrwCK4hUAF',
                })
            ).resolves.not.toThrow();
        });

        it('should allow you to update your profile image to one already in use', async () => {
            await userA.clients.fullAuth.updateProfile({
                image: 'https://cdn.filestackcontent.com/XxBxN1A6QgSrwCK4hUAF',
            });
            await expect(
                userB.clients.fullAuth.updateProfile({
                    image: 'https://cdn.filestackcontent.com/XxBxN1A6QgSrwCK4hUAF',
                })
            ).resolves.not.toThrow();
        });
    });

    describe('deleteProfile', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to delete your profile', async () => {
            await expect(noAuthClient.deleteProfile()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.deleteProfile()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow you to delete your profile', async () => {
            await expect(userA.clients.fullAuth.deleteProfile()).resolves.not.toThrow();
            await expect(userA.clients.fullAuth.getProfile()).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('should not show deleted profiles to other users', async () => {
            const beforeDeletion = await userB.clients.fullAuth.getOtherProfile({
                handle: 'userA',
            });

            expect(beforeDeletion?.handle).toEqual('userA');

            await userA.clients.fullAuth.deleteProfile();

            const afterDeletion = await userB.clients.fullAuth.getOtherProfile({
                handle: 'userA',
            });

            expect(afterDeletion).toBeUndefined();
        });
    });

    describe('connectWith', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to connect with another user', async () => {
            await expect(noAuthClient.connectWith({ handle: 'userB' })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.connectWith({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows users to send a connection request', async () => {
            await expect(
                userA.clients.fullAuth.connectWith({ handle: 'userB' })
            ).resolves.not.toThrow();

            expect(await userA.clients.fullAuth.pendingConnections()).toHaveLength(1);
            expect(await userB.clients.fullAuth.connectionRequests()).toHaveLength(1);
        });

        it('does not allow users to resend a connection request', async () => {
            await userA.clients.fullAuth.connectWith({ handle: 'userB' });
            await expect(
                userA.clients.fullAuth.connectWith({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });

        it('errors when trying to connect with a user you are already connected with', async () => {
            await userA.clients.fullAuth.connectWith({ handle: 'userB' });
            await userB.clients.fullAuth.acceptConnectionRequest({ handle: 'userA' });
            await expect(
                userA.clients.fullAuth.connectWith({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'CONFLICT' });
        });
    });

    describe('acceptConnectionRequest', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.createProfile({ handle: 'userB' });

            await userB.clients.fullAuth.connectWith({ handle: 'userA' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to accept connection requests', async () => {
            await expect(
                noAuthClient.acceptConnectionRequest({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.acceptConnectionRequest({ handle: 'userB' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows users to accept connection requests', async () => {
            await expect(
                userA.clients.fullAuth.acceptConnectionRequest({ handle: 'userB' })
            ).resolves.not.toThrow();
        });

        it('errors when accepting a request that does not exist', async () => {
            await expect(
                userB.clients.fullAuth.acceptConnectionRequest({ handle: 'userA' })
            ).rejects.toMatchObject({ code: 'NOT_FOUND' });
        });

        it('removes the pending request', async () => {
            const pendingFromUserA = await userA.clients.fullAuth.connectionRequests();
            const pendingFromUserB = await userB.clients.fullAuth.pendingConnections();

            expect(pendingFromUserA).toHaveLength(1);
            expect(pendingFromUserB).toHaveLength(1);

            await userA.clients.fullAuth.acceptConnectionRequest({ handle: 'userB' });

            const newPendingFromUserA = await userA.clients.fullAuth.connectionRequests();
            const newPendingFromUserB = await userB.clients.fullAuth.pendingConnections();

            expect(newPendingFromUserA).toHaveLength(0);
            expect(newPendingFromUserB).toHaveLength(0);
        });
    });

    describe('connections', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to view connections', async () => {
            await expect(noAuthClient.connections()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.connections()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('allows users to view connections', async () => {
            await expect(userA.clients.fullAuth.connections()).resolves.not.toThrow();

            const noConnections = await userA.clients.fullAuth.connections();

            expect(noConnections).toHaveLength(0);

            await userA.clients.fullAuth.connectWith({ handle: 'userB' });
            await userB.clients.fullAuth.acceptConnectionRequest({ handle: 'userA' });

            const oneConnection = await userA.clients.fullAuth.connections();

            expect(oneConnection).toHaveLength(1);
            expect(oneConnection[0]!.handle).toEqual('userB');
        });
    });

    describe('pendingConnections', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to view pending connections', async () => {
            await expect(noAuthClient.pendingConnections()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.pendingConnections()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('allows users to view pending connections', async () => {
            await expect(userA.clients.fullAuth.pendingConnections()).resolves.not.toThrow();

            const noPendingConnections = await userA.clients.fullAuth.pendingConnections();

            expect(noPendingConnections).toHaveLength(0);

            await userA.clients.fullAuth.connectWith({ handle: 'userB' });

            const onePendingConnection = await userA.clients.fullAuth.pendingConnections();

            expect(onePendingConnection).toHaveLength(1);
            expect(onePendingConnection[0]!.handle).toEqual('userB');
        });
    });

    describe('connectionRequests', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to view connection requests', async () => {
            await expect(noAuthClient.connectionRequests()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userA.clients.partialAuth.connectionRequests()).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('allows users to view connection requests', async () => {
            await expect(userA.clients.fullAuth.connectionRequests()).resolves.not.toThrow();

            const noConnectionRequests = await userA.clients.fullAuth.connectionRequests();

            expect(noConnectionRequests).toHaveLength(0);

            await userB.clients.fullAuth.connectWith({ handle: 'userA' });

            const oneConnectionRequest = await userA.clients.fullAuth.connectionRequests();

            expect(oneConnectionRequest).toHaveLength(1);
            expect(oneConnectionRequest[0]!.handle).toEqual('userB');
        });
    });

    describe('registerSigningAuthority', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
        });

        it('should require full auth to register a signing authority', async () => {
            await expect(
                noAuthClient.registerSigningAuthority({ signingAuthority: 'http://localhost:4000' })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.registerSigningAuthority({
                    signingAuthority: 'http://localhost:4000',
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('allows registering a signing authority', async () => {
            await expect(
                userA.clients.fullAuth.registerSigningAuthority({
                    signingAuthority: 'http://localhost:4000',
                })
            ).resolves.not.toThrow();
        });
    });

    describe('sendCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to send a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await expect(
                noAuthClient.sendCredential({ handle: 'userB', credential: vc })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.sendCredential({ handle: 'userB', credential: vc })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await expect(
                userA.clients.fullAuth.sendCredential({ handle: 'userB', credential: vc })
            ).resolves.not.toThrow();
        });
    });

    describe('acceptCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to accept a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.sendCredential({
                handle: 'userB',
                credential: vc,
            });

            await expect(
                noAuthClient.acceptCredential({ handle: 'userA', uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.partialAuth.acceptCredential({ handle: 'userA', uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.sendCredential({
                handle: 'userB',
                credential: vc,
            });

            await expect(
                userB.clients.fullAuth.acceptCredential({ handle: 'userA', uri })
            ).resolves.not.toThrow();
        });
    });

    describe('storeCredential', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.createProfile({ handle: 'userB' });
        });

        beforeEach(async () => {
            await Credential.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to store a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await expect(noAuthClient.storeCredential({ credential: vc })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.storeCredential({ credential: vc })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow storing a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await expect(
                userA.clients.fullAuth.storeCredential({ credential: vc })
            ).resolves.not.toThrow();
        });
    });

    describe('getCredential', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.createProfile({ handle: 'userB' });
        });

        beforeEach(async () => {
            await Credential.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to get a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.storeCredential({ credential: vc });

            await expect(noAuthClient.getCredential({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userB.clients.partialAuth.getCredential({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow storing a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.storeCredential({ credential: vc });

            const promise = userA.clients.fullAuth.getCredential({ uri });

            await expect(promise).resolves.not.toThrow();

            const resolvedCredential = await promise;

            expect(resolvedCredential).toEqual(vc);
        });
    });
});
