import { JWE } from '@learncard/types';
import { getClient, getUser } from './helpers/getClient';
import { Profile, Credential, Presentation } from '@models';
import { minimalContract, minimalTerms } from './helpers/contract';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

describe('Storage', () => {
    beforeAll(async () => {
        userA = await getUser();
        userB = await getUser('b'.repeat(64));
    });

    describe('store', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userB' });
        });

        beforeEach(async () => {
            await Credential.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to store a credential/presentationl', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            await expect(noAuthClient.storage.store({ item: vc })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.storage.store({ item: vc })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow storing a credential/presentation', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);
            const unsignedVp = await userA.learnCard.invoke.newPresentation(vc);
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            await expect(userA.clients.fullAuth.storage.store({ item: vc })).resolves.not.toThrow();
            await expect(userA.clients.fullAuth.storage.store({ item: vp })).resolves.not.toThrow();
        });

        it('should allow storing an encrypted credential/presentation', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);
            const unsignedVp = await userA.learnCard.invoke.newPresentation(vc);
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const encryptedVc = await userA.learnCard.invoke
                .getDIDObject()
                .createDagJWE(vc, [userA.learnCard.id.did(), userB.learnCard.id.did()]);
            const encryptedVp = await userA.learnCard.invoke
                .getDIDObject()
                .createDagJWE(vp, [userA.learnCard.id.did(), userB.learnCard.id.did()]);

            await expect(
                userA.clients.fullAuth.storage.store({ item: encryptedVc })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.fullAuth.storage.store({ item: encryptedVp, type: 'presentation' })
            ).resolves.not.toThrow();
        });
    });

    describe('resolve', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userB' });
        });

        beforeEach(async () => {
            await Credential.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
        });

        it('should require full auth to get a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.storage.store({ item: vc });

            await expect(noAuthClient.storage.resolve({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(userB.clients.partialAuth.storage.resolve({ uri })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
        });

        it('should allow resolving a credential/presentation', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);
            const unsignedVp = await userA.learnCard.invoke.newPresentation(vc);
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const vcUri = await userA.clients.fullAuth.storage.store({ item: vc });
            const vpUri = await userA.clients.fullAuth.storage.store({ item: vp });

            const vcPromise = userA.clients.fullAuth.storage.resolve({ uri: vcUri });
            const vpPromise = userA.clients.fullAuth.storage.resolve({ uri: vpUri });

            await expect(vcPromise).resolves.not.toThrow();
            await expect(vpPromise).resolves.not.toThrow();

            const resolvedCredential = await vcPromise;
            const resolvedPresentation = await vpPromise;

            expect(resolvedCredential).toEqual(vc);
            expect(resolvedPresentation).toEqual(vp);
        });

        it('should allow resolving an encrypted credential/presentation', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);
            const unsignedVp = await userA.learnCard.invoke.newPresentation(vc);
            const vp = await userA.learnCard.invoke.issuePresentation(unsignedVp);

            const encryptedVc = await userA.learnCard.invoke
                .getDIDObject()
                .createDagJWE(vc, [userA.learnCard.id.did(), userB.learnCard.id.did()]);
            const encryptedVp = await userA.learnCard.invoke
                .getDIDObject()
                .createDagJWE(vp, [userA.learnCard.id.did(), userB.learnCard.id.did()]);

            const vcUri = await userA.clients.fullAuth.storage.store({ item: encryptedVc });
            const vpUri = await userA.clients.fullAuth.storage.store({
                item: encryptedVp,
                type: 'presentation',
            });

            const vcPromise = userA.clients.fullAuth.storage.resolve({ uri: vcUri });
            const vpPromise = userA.clients.fullAuth.storage.resolve({ uri: vpUri });

            await expect(vcPromise).resolves.not.toThrow();
            await expect(vpPromise).resolves.not.toThrow();

            const resolvedCredential = await vcPromise;
            const resolvedPresentation = await vpPromise;

            expect(resolvedCredential).toEqual(encryptedVc);
            expect(resolvedPresentation).toEqual(encryptedVp);

            expect(
                await userB.learnCard.invoke.getDIDObject().decryptDagJWE(resolvedCredential as JWE)
            ).toEqual(vc);
            expect(
                await userB.learnCard.invoke
                    .getDIDObject()
                    .decryptDagJWE(resolvedPresentation as JWE)
            ).toEqual(vp);
        });

        it('should allow resolving a consent flow contract', async () => {
            const uri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
            });

            const promise = userA.clients.fullAuth.storage.resolve({ uri });

            await expect(promise).resolves.not.toThrow();

            const resolvedContract = await promise;

            expect(resolvedContract).toEqual(minimalContract);
        });

        it('should allow resolving a consent flow contract terms', async () => {
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
            });

            const uri = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });

            const promise = userA.clients.fullAuth.storage.resolve({ uri });

            await expect(promise).resolves.not.toThrow();

            const resolvedContract = await promise;

            expect(resolvedContract).toEqual(minimalTerms);
        });
    });
});
