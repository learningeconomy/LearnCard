import { getClient, getUser } from './helpers/getClient';
import { Profile, Credential, Presentation } from '@models';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

describe('Presentations', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('sendPresentation', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to send a presentation', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            await expect(
                noAuthClient.presentation.sendPresentation({ handle: 'userB', presentation: vp })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userA.clients.partialAuth.presentation.sendPresentation({
                    handle: 'userB',
                    presentation: vp,
                })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a presentation', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            await expect(
                userA.clients.fullAuth.presentation.sendPresentation({
                    handle: 'userB',
                    presentation: vp,
                })
            ).resolves.not.toThrow();
        });
    });

    describe('acceptPresentation', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to accept a presentation', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            await expect(
                noAuthClient.presentation.acceptPresentation({ handle: 'userA', uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
            await expect(
                userB.clients.partialAuth.presentation.acceptPresentation({ handle: 'userA', uri })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow sending a presentation', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            await expect(
                userB.clients.fullAuth.presentation.acceptPresentation({ handle: 'userA', uri })
            ).resolves.not.toThrow();
        });
    });

    describe('receivedPresentations', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });
        });

        beforeEach(async () => {
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to get received presentations', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            await userB.clients.fullAuth.presentation.acceptPresentation({ handle: 'userA', uri });

            await expect(
                userB.clients.partialAuth.presentation.receivedPresentations()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show received presentations', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            await userB.clients.fullAuth.presentation.acceptPresentation({ handle: 'userA', uri });

            const userAPresentations =
                await userA.clients.fullAuth.presentation.receivedPresentations();
            const userBPresentations =
                await userB.clients.fullAuth.presentation.receivedPresentations();

            expect(userAPresentations).toHaveLength(0);
            expect(userBPresentations).toHaveLength(1);
        });

        it('should only show accepted presentations', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            const presentations = await userB.clients.fullAuth.presentation.receivedPresentations();

            expect(presentations).toHaveLength(0);
        });

        it('should show when the presentation was sent/received', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            jest.setSystemTime(new Date('02-07-2023'));
            const received = new Date().toISOString();

            await userB.clients.fullAuth.presentation.acceptPresentation({ uri, handle: 'userA' });

            const presentations = await userB.clients.fullAuth.presentation.receivedPresentations();

            expect(presentations[0]?.sent).toEqual(sent);
            expect(presentations[0]?.received).toEqual(received);

            jest.useRealTimers();
        });
    });

    describe('sentPresentations', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });
        });

        beforeEach(async () => {
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to get sent presentations', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            await userB.clients.fullAuth.presentation.acceptPresentation({ handle: 'userA', uri });

            await expect(
                userA.clients.partialAuth.presentation.sentPresentations()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show sent presentations', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            await userB.clients.fullAuth.presentation.acceptPresentation({ handle: 'userA', uri });

            const userAPresentations =
                await userA.clients.fullAuth.presentation.sentPresentations();
            const userBPresentations =
                await userB.clients.fullAuth.presentation.sentPresentations();

            expect(userAPresentations).toHaveLength(1);
            expect(userBPresentations).toHaveLength(0);
        });

        it('should show all sent presentations, accepted or not', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            const presentations = await userA.clients.fullAuth.presentation.sentPresentations();

            expect(presentations).toHaveLength(1);
        });

        it('should show when the presentation was sent/received', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            jest.setSystemTime(new Date('02-07-2023'));
            const received = new Date().toISOString();

            await userB.clients.fullAuth.presentation.acceptPresentation({ uri, handle: 'userA' });

            const presentations = await userA.clients.fullAuth.presentation.sentPresentations();

            expect(presentations[0]?.sent).toEqual(sent);
            expect(presentations[0]?.received).toEqual(received);

            jest.useRealTimers();
        });
    });

    describe('incomingPresentations', () => {
        beforeEach(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ handle: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ handle: 'userB' });
        });

        beforeEach(async () => {
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to get incoming presentations', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            await expect(
                userB.clients.partialAuth.presentation.incomingPresentations()
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should show incoming presentations', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            const userAPresentations =
                await userA.clients.fullAuth.presentation.incomingPresentations();
            const userBPresentations =
                await userB.clients.fullAuth.presentation.incomingPresentations();

            expect(userAPresentations).toHaveLength(0);
            expect(userBPresentations).toHaveLength(1);
        });

        it('should not show accepted presentations', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const uri = await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            const beforeAcceptance =
                await userB.clients.fullAuth.presentation.incomingPresentations();

            expect(beforeAcceptance).toHaveLength(1);

            await userB.clients.fullAuth.presentation.acceptPresentation({ handle: 'userA', uri });

            const afterAcceptance =
                await userB.clients.fullAuth.presentation.incomingPresentations();

            expect(afterAcceptance).toHaveLength(0);
        });

        it('should show when the presentation was sent', async () => {
            const unsignedVp = await userA.learnCard.invoke.getTestVp();
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            jest.useFakeTimers().setSystemTime(new Date('02-06-2023'));
            const sent = new Date().toISOString();

            await userA.clients.fullAuth.presentation.sendPresentation({
                handle: 'userB',
                presentation: vp,
            });

            const presentations = await userB.clients.fullAuth.presentation.incomingPresentations();

            expect(presentations[0]?.sent).toEqual(sent);

            jest.useRealTimers();
        });
    });
});
