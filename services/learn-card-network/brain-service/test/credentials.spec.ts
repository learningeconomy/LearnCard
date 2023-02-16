import { getClient, getUser } from './helpers/getClient';
import { Profile, Credential } from '@models';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

describe('Credentials', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('sendCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to send a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await expect(
                noAuthClient.credential.sendCredential({ profileId: 'userB', credential: vc })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.credential.sendCredential({
                    profileId: 'userB',
                    credential: vc,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await expect(
                userA.clients.fullAuth.credential.sendCredential({
                    profileId: 'userB',
                    credential: vc,
                })
            ).resolves.not.toThrow();
        });
    });

    describe('acceptCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to accept a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            await expect(
                noAuthClient.credential.acceptCredential({ profileId: 'userA', uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.partialAuth.credential.acceptCredential({ profileId: 'userA', uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            await expect(
                userB.clients.fullAuth.credential.acceptCredential({ profileId: 'userA', uri })
            ).resolves.not.toThrow();
        });
    });

    describe('receivedCredentials', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userB' });
        });

        beforeEach(async () => {
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to get received credentials', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            await userB.clients.fullAuth.credential.acceptCredential({ profileId: 'userA', uri });

            await expect(
                userB.clients.partialAuth.credential.receivedCredentials()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show received credentials', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            await userB.clients.fullAuth.credential.acceptCredential({ profileId: 'userA', uri });

            const userACredentials = await userA.clients.fullAuth.credential.receivedCredentials();
            const userBCredentials = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(userACredentials).toHaveLength(0);
            expect(userBCredentials).toHaveLength(1);
        });

        it('should only show accepted credentials', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            const credentials = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(credentials).toHaveLength(0);
        });

        it('should show when the credential was sent/received', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            jest.setSystemTime(new Date('02-07-2023'));
            const received = new Date().toISOString();

            await userB.clients.fullAuth.credential.acceptCredential({ uri, profileId: 'userA' });

            const credentials = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(credentials[0]?.sent).toEqual(sent);
            expect(credentials[0]?.received).toEqual(received);

            jest.useRealTimers();
        });
    });

    describe('sentCredentials', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userB' });
        });

        beforeEach(async () => {
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to get sent credentials', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            await userB.clients.fullAuth.credential.acceptCredential({ profileId: 'userA', uri });

            await expect(
                userA.clients.partialAuth.credential.sentCredentials()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show sent credentials', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            await userB.clients.fullAuth.credential.acceptCredential({ profileId: 'userA', uri });

            const userACredentials = await userA.clients.fullAuth.credential.sentCredentials();
            const userBCredentials = await userB.clients.fullAuth.credential.sentCredentials();

            expect(userACredentials).toHaveLength(1);
            expect(userBCredentials).toHaveLength(0);
        });

        it('should show all sent credentials, accepted or not', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            const credentials = await userA.clients.fullAuth.credential.sentCredentials();

            expect(credentials).toHaveLength(1);
        });

        it('should show when the credential was sent/received', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            jest.setSystemTime(new Date('02-07-2023'));
            const received = new Date().toISOString();

            await userB.clients.fullAuth.credential.acceptCredential({ uri, profileId: 'userA' });

            const credentials = await userA.clients.fullAuth.credential.sentCredentials();

            expect(credentials[0]?.sent).toEqual(sent);
            expect(credentials[0]?.received).toEqual(received);

            jest.useRealTimers();
        });
    });

    describe('incomingCredentials', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userB' });
        });

        beforeEach(async () => {
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to get incoming credentials', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            await expect(
                userB.clients.partialAuth.credential.incomingCredentials()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show incoming credentials', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            const userACredentials = await userA.clients.fullAuth.credential.incomingCredentials();
            const userBCredentials = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(userACredentials).toHaveLength(0);
            expect(userBCredentials).toHaveLength(1);
        });

        it('should not show accepted credentials', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            const beforeAcceptance = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(beforeAcceptance).toHaveLength(1);

            await userB.clients.fullAuth.credential.acceptCredential({ profileId: 'userA', uri });

            const afterAcceptance = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(afterAcceptance).toHaveLength(0);
        });

        it('should show when the credential was sent', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userB',
                credential: vc,
            });

            const credentials = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(credentials[0]?.sent).toEqual(sent);

            jest.useRealTimers();
        });
    });
});
