import { getClient, getUser } from './helpers/getClient';
import { testVp, sendPresentation } from './helpers/send';
import { Profile, Credential, Presentation } from '@models';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;
let userC: Awaited<ReturnType<typeof getUser>>;

describe('Presentations', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
        userC = await getUser('c'.repeat(64));
    });

    describe('sendPresentation', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to send a presentation', async () => {
            await expect(
                noAuthClient.presentation.sendPresentation({
                    profileId: 'userb',
                    presentation: testVp,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.presentation.sendPresentation({
                    profileId: 'userb',
                    presentation: testVp,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a presentation', async () => {
            await expect(
                userA.clients.fullAuth.presentation.sendPresentation({
                    profileId: 'userb',
                    presentation: testVp,
                })
            ).resolves.not.toThrow();
        });

        it('should allow sending an encrypted preesentation', async () => {
            const encryptedVp = await userA.learnCard.invoke
                .getDIDObject()
                .createDagJWE(testVp, [userA.learnCard.id.did(), userB.learnCard.id.did()]);

            await expect(
                userA.clients.fullAuth.presentation.sendPresentation({
                    profileId: 'userb',
                    presentation: encryptedVp,
                })
            ).resolves.not.toThrow();
        });
    });

    describe('acceptPresentation', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to accept a presentation', async () => {
            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userB',
                presentation: testVp,
            });

            await expect(
                noAuthClient.presentation.acceptPresentation({ profileId: 'usera', uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.partialAuth.presentation.acceptPresentation({
                    profileId: 'usera',
                    uri,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a presentation', async () => {
            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });

            await expect(
                userB.clients.fullAuth.presentation.acceptPresentation({ profileId: 'usera', uri })
            ).resolves.not.toThrow();
        });
    });

    describe('receivedPresentations', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        beforeEach(async () => {
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to get received presentations', async () => {
            await sendPresentation(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(
                userB.clients.partialAuth.presentation.receivedPresentations()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show received presentations', async () => {
            await sendPresentation(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            const userAPresentations =
                await userA.clients.fullAuth.presentation.receivedPresentations();
            const userBPresentations =
                await userB.clients.fullAuth.presentation.receivedPresentations();

            expect(userAPresentations).toHaveLength(0);
            expect(userBPresentations).toHaveLength(1);
        });

        it('should only show accepted presentations', async () => {
            await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });

            const presentations = await userB.clients.fullAuth.presentation.receivedPresentations();

            expect(presentations).toHaveLength(0);
        });

        it('should show when the presentation was sent/received', async () => {
            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });

            jest.setSystemTime(new Date('02-07-2023'));
            const received = new Date().toISOString();

            await userB.clients.fullAuth.presentation.acceptPresentation({
                uri,
                profileId: 'usera',
            });

            const presentations = await userB.clients.fullAuth.presentation.receivedPresentations();

            expect(presentations[0]?.sent).toEqual(sent);
            expect(presentations[0]?.received).toEqual(received);

            jest.useRealTimers();
        });

        it('should allow filtering received presentations by who sent them', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            await sendPresentation(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );
            await sendPresentation(
                { profileId: 'userc', user: userC },
                { profileId: 'userb', user: userB }
            );

            const allPresentations =
                await userB.clients.fullAuth.presentation.receivedPresentations();
            const filteredPresentations =
                await userB.clients.fullAuth.presentation.receivedPresentations({
                    from: 'usera',
                });

            expect(allPresentations).toHaveLength(2);
            expect(filteredPresentations).toHaveLength(1);
            expect(filteredPresentations[0]?.from).toEqual('usera');
        });
    });

    describe('sentPresentations', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        beforeEach(async () => {
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to get sent presentations', async () => {
            await sendPresentation(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(
                userA.clients.partialAuth.presentation.sentPresentations()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show sent presentations', async () => {
            await sendPresentation(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            const userAPresentations =
                await userA.clients.fullAuth.presentation.sentPresentations();
            const userBPresentations =
                await userB.clients.fullAuth.presentation.sentPresentations();

            expect(userAPresentations).toHaveLength(1);
            expect(userBPresentations).toHaveLength(0);
        });

        it('should show all sent presentations, accepted or not', async () => {
            await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });

            const presentations = await userA.clients.fullAuth.presentation.sentPresentations();

            expect(presentations).toHaveLength(1);
        });

        it('should show when the presentation was sent/received', async () => {
            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });

            jest.setSystemTime(new Date('02-07-2023'));
            const received = new Date().toISOString();

            await userB.clients.fullAuth.presentation.acceptPresentation({
                uri,
                profileId: 'usera',
            });

            const presentations = await userA.clients.fullAuth.presentation.sentPresentations();

            expect(presentations[0]?.sent).toEqual(sent);
            expect(presentations[0]?.received).toEqual(received);

            jest.useRealTimers();
        });

        it('should allow filtering sent presentations by who they were sent to', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            await sendPresentation(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );
            await sendPresentation(
                { profileId: 'usera', user: userA },
                { profileId: 'userc', user: userC }
            );

            const allPresentations = await userA.clients.fullAuth.presentation.sentPresentations();
            const filteredPresentations =
                await userA.clients.fullAuth.presentation.sentPresentations({
                    to: 'userb',
                });

            expect(allPresentations).toHaveLength(2);
            expect(filteredPresentations).toHaveLength(1);
            expect(filteredPresentations[0]?.to).toEqual('userb');
        });
    });

    describe('incomingPresentations', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        beforeEach(async () => {
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to get incoming presentations', async () => {
            await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });

            await expect(
                userB.clients.partialAuth.presentation.incomingPresentations()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show incoming presentations', async () => {
            await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });

            const userAPresentations =
                await userA.clients.fullAuth.presentation.incomingPresentations();
            const userBPresentations =
                await userB.clients.fullAuth.presentation.incomingPresentations();

            expect(userAPresentations).toHaveLength(0);
            expect(userBPresentations).toHaveLength(1);
        });

        it('should not show accepted presentations', async () => {
            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });

            const beforeAcceptance =
                await userB.clients.fullAuth.presentation.incomingPresentations();

            expect(beforeAcceptance).toHaveLength(1);

            await userB.clients.fullAuth.presentation.acceptPresentation({
                profileId: 'usera',
                uri,
            });

            const afterAcceptance =
                await userB.clients.fullAuth.presentation.incomingPresentations();

            expect(afterAcceptance).toHaveLength(0);
        });

        it('should show when the presentation was sent', async () => {
            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });

            const presentations = await userB.clients.fullAuth.presentation.incomingPresentations();

            expect(presentations[0]?.sent).toEqual(sent);

            jest.useRealTimers();
        });

        it('should allow filtering incoming presentations by who sent them', async () => {
            await userC.clients.fullAuth.profile.createProfile({ profileId: 'userc' });

            await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });
            await userC.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });

            const allPresentations =
                await userB.clients.fullAuth.presentation.incomingPresentations();
            const filteredPresentations =
                await userB.clients.fullAuth.presentation.incomingPresentations({
                    from: 'usera',
                });

            expect(allPresentations).toHaveLength(2);
            expect(filteredPresentations).toHaveLength(1);
            expect(filteredPresentations[0]?.from).toEqual('usera');
        });
    });

    describe('deletePresentation', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ profileId: 'usera' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userb' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to delete a presentation', async () => {
            const uri = await sendPresentation(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(
                noAuthClient.presentation.deletePresentation({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userA.clients.partialAuth.presentation.deletePresentation({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow you to delete a presentation', async () => {
            const uri = await sendPresentation(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            await expect(userA.clients.fullAuth.storage.resolve({ uri })).resolves.not.toThrow();

            await expect(
                userA.clients.fullAuth.presentation.deletePresentation({ uri })
            ).resolves.not.toThrow();

            await expect(userA.clients.fullAuth.storage.resolve({ uri })).rejects.toMatchObject({
                code: 'NOT_FOUND',
            });
        });

        it('should remove deleted presentations from sent/received lists', async () => {
            const uri = await sendPresentation(
                { profileId: 'usera', user: userA },
                { profileId: 'userb', user: userB }
            );

            let userASent = await userA.clients.fullAuth.presentation.sentPresentations();
            let userBReceived = await userB.clients.fullAuth.presentation.receivedPresentations();

            expect(userASent).toHaveLength(1);
            expect(userBReceived).toHaveLength(1);

            await userA.clients.fullAuth.presentation.deletePresentation({ uri });

            userASent = await userA.clients.fullAuth.presentation.sentPresentations();
            userBReceived = await userB.clients.fullAuth.presentation.receivedPresentations();

            expect(userASent).toHaveLength(0);
            expect(userBReceived).toHaveLength(0);
        });

        it("should not allow profiles to delete presentations they don't own", async () => {
            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                profileId: 'userb',
                presentation: testVp,
            });

            await expect(userA.clients.fullAuth.storage.resolve({ uri })).resolves.not.toThrow();

            await expect(
                userB.clients.fullAuth.presentation.deletePresentation({ uri })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });
    });
});
