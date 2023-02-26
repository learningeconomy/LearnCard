import { getClient, getUser } from './helpers/getClient';
import { testVc, sendCredential } from './helpers/send';
import { Profile, Credential } from '@models';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

describe('Credentials', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
    });

    describe('sendCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to send a credential', async () => {
            await expect(
                noAuthClient.credential.sendCredential({ profileId: 'userb', credential: testVc })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.credential.sendCredential({
                    profileId: 'userb',
                    credential: testVc,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a credential', async () => {
            await expect(
                userA.clients.fullAuth.credential.sendCredential({
                    profileId: 'userb',
                    credential: testVc,
                })
            ).resolves.not.toThrow();
        });

        it('should allow sending an encrypted credential', async () => {
            const encryptedVc = await userA.learnCard.invoke
                .getDIDObject()
                .createDagJWE(testVc, [userA.learnCard.id.did(), userB.learnCard.id.did()]);

            await expect(
                userA.clients.fullAuth.credential.sendCredential({
                    profileId: 'userb',
                    credential: encryptedVc,
                })
            ).resolves.not.toThrow();
        });
    });

    describe('acceptCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to accept a credential', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            await expect(noAuthClient.credential.acceptCredential({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.credential.acceptCredential({ uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a credential', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            await expect(
                userB.clients.fullAuth.credential.acceptCredential({ uri })
            ).resolves.not.toThrow();
        });
    });

    describe('receivedCredentials', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        beforeEach(async () => {
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to get received credentials', async () => {
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(
                userB.clients.partialAuth.credential.receivedCredentials()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show received credentials', async () => {
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            const userACredentials = await userA.clients.fullAuth.credential.receivedCredentials();
            const userBCredentials = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(userACredentials).toHaveLength(0);
            expect(userBCredentials).toHaveLength(1);
        });

        it('should only show accepted credentials', async () => {
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const credentials = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(credentials).toHaveLength(0);
        });

        it('should show when the credential was sent/received', async () => {
            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            jest.setSystemTime(new Date('02-07-2023'));
            const received = new Date().toISOString();

            await userB.clients.fullAuth.credential.acceptCredential({ uri });

            const credentials = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(credentials[0]?.sent).toEqual(sent);
            expect(credentials[0]?.received).toEqual(received);

            jest.useRealTimers();
        });

        it('should allow filtering received credentials by who sent them', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );
            await sendCredential(
                { profileId: 'userc', user: userC },
                { profileId: 'userb', user: userB }
            );

            const allCredentials = await userB.clients.fullAuth.credential.receivedCredentials();
            const filteredCredentials = await userB.clients.fullAuth.credential.receivedCredentials(
                {
                    from: 'usera',
                }
            );

            expect(allCredentials).toHaveLength(2);
            expect(filteredCredentials).toHaveLength(1);
            expect(filteredCredentials[0]?.from).toEqual('usera');
        });
    });

    describe('sentCredentials', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        beforeEach(async () => {
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to get sent credentials', async () => {
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(
                userA.clients.partialAuth.credential.sentCredentials()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show sent credentials', async () => {
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            const userACredentials = await userA.clients.fullAuth.credential.sentCredentials();
            const userBCredentials = await userB.clients.fullAuth.credential.sentCredentials();

            expect(userACredentials).toHaveLength(1);
            expect(userBCredentials).toHaveLength(0);
        });

        it('should show all sent credentials, accepted or not', async () => {
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const credentials = await userA.clients.fullAuth.credential.sentCredentials();

            expect(credentials).toHaveLength(1);
        });

        it('should show when the credential was sent/received', async () => {
            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            jest.setSystemTime(new Date('02-07-2023'));
            const received = new Date().toISOString();

            await userB.clients.fullAuth.credential.acceptCredential({ uri });

            const credentials = await userA.clients.fullAuth.credential.sentCredentials();

            expect(credentials[0]?.sent).toEqual(sent);
            expect(credentials[0]?.received).toEqual(received);

            jest.useRealTimers();
        });

        it('should allow filtering sent credentials by who they were sent to', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );
            await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userc', user: userC }
            );

            const allCredentials = await userA.clients.fullAuth.credential.sentCredentials();
            const filteredCredentials = await userA.clients.fullAuth.credential.sentCredentials({
                to: 'userb',
            });

            expect(allCredentials).toHaveLength(2);
            expect(filteredCredentials).toHaveLength(1);
            expect(filteredCredentials[0]?.to).toEqual('userb');
        });
    });

    describe('incomingCredentials', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        beforeEach(async () => {
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to get incoming credentials', async () => {
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            await expect(
                userB.clients.partialAuth.credential.incomingCredentials()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show incoming credentials', async () => {
            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const userACredentials = await userA.clients.fullAuth.credential.incomingCredentials();
            const userBCredentials = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(userACredentials).toHaveLength(0);
            expect(userBCredentials).toHaveLength(1);
        });

        it('should not show accepted credentials', async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const beforeAcceptance = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(beforeAcceptance).toHaveLength(1);

            await userB.clients.fullAuth.credential.acceptCredential({ uri });

            const afterAcceptance = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(afterAcceptance).toHaveLength(0);
        });

        it('should show when the credential was sent', async () => {
            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const credentials = await userB.clients.fullAuth.credential.incomingCredentials();

            expect(credentials[0]?.sent).toEqual(sent);

            jest.useRealTimers();
        });

        it('should allow filtering incoming credentials by who sent them', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });
            await userC.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            const allCredentials = await userB.clients.fullAuth.credential.incomingCredentials();
            const filteredCredentials = await userB.clients.fullAuth.credential.incomingCredentials(
                {
                    from: 'usera',
                }
            );

            expect(allCredentials).toHaveLength(2);
            expect(filteredCredentials).toHaveLength(1);
            expect(filteredCredentials[0]?.from).toEqual('usera');
        });
    });

    describe('deleteCredential', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to delete a credential', async () => {
            const uri = await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(noAuthClient.credential.deleteCredential({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.credential.deleteCredential({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow you to delete a credential', async () => {
            const uri = await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(userA.clients.fullAuth.storage.resolve({ uri })).resolves.not.toThrow();

            await expect(
                userA.clients.fullAuth.credential.deleteCredential({ uri })
            ).resolves.not.toThrow();

            await expect(userA.clients.fullAuth.storage.resolve({ uri })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('should remove deleted credentials from sent/received lists', async () => {
            const uri = await sendCredential(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            let userASent = await userA.clients.fullAuth.credential.sentCredentials();
            let userBReceived = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(userASent).toHaveLength(1);
            expect(userBReceived).toHaveLength(1);

            await userA.clients.fullAuth.credential.deleteCredential({ uri });

            userASent = await userA.clients.fullAuth.credential.sentCredentials();
            userBReceived = await userB.clients.fullAuth.credential.receivedCredentials();

            expect(userASent).toHaveLength(0);
            expect(userBReceived).toHaveLength(0);
        });

        it("should not allow profiles to delete credentials they don't own", async () => {
            const uri = await userA.clients.fullAuth.credential.sendCredential({
                profileId: 'userb',
                credential: testVc,
            });

            await expect(userA.clients.fullAuth.storage.resolve({ uri })).resolves.not.toThrow();

            await expect(
                userB.clients.fullAuth.credential.deleteCredential({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });
});
