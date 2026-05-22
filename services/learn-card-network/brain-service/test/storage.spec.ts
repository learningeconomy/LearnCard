import { JWE } from '@learncard/types';
import { isEncrypted } from '@learncard/helpers';
import { getClient, getUser } from './helpers/getClient';
import { Profile, Credential, Presentation, Boost } from '@models';
import { minimalContract, minimalTerms } from './helpers/contract';
import { createBoost } from '../src/accesslayer/boost/create';
import { getProfileByProfileId } from '../src/accesslayer/profile/read';
import { getBoostUri } from '../src/helpers/boost.helpers';

const isBoostCredential = (vc: { type?: string[]; boostCredential?: unknown }): boolean => {
    return Boolean(vc?.type?.includes('CertifiedBoostCredential') && vc?.boostCredential);
};

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
            await Boost.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
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

            const encryptedVc = await userA.learnCard.invoke.createDagJwe(vc, [
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
            ]);
            const encryptedVp = await userA.learnCard.invoke.createDagJwe(vp, [
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
            ]);

            await expect(
                userA.clients.fullAuth.storage.store({ item: encryptedVc })
            ).resolves.not.toThrow();
            await expect(
                userA.clients.fullAuth.storage.store({ item: encryptedVp, type: 'presentation' })
            ).resolves.not.toThrow();
        });

        it('should reject plaintext storage for encrypted-only boosts', async () => {
            const profile = await getProfileByProfileId('userA');

            if (!profile) throw new Error('Profile not found');

            const template = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const boost = await createBoost(
                template,
                profile,
                { storage: 'encrypted-only' },
                'localhost%3A3000'
            );
            const plaintextCredential = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did()) as {
                boostId?: string;
            };
            plaintextCredential.boostId = getBoostUri(boost.id, 'localhost%3A3000');
            const encryptedVc = await userA.learnCard.invoke.createDagJwe(plaintextCredential, [
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
            ]);

            await expect(
                userA.clients.fullAuth.storage.store({ item: plaintextCredential })
            ).rejects.toMatchObject({
                code: 'BAD_REQUEST',
                message:
                    'This boost requires encrypted storage. Please encrypt the credential before storing.',
            });

            await expect(
                userA.clients.fullAuth.storage.store({ item: encryptedVc })
            ).resolves.not.toThrow();
        });

        it('should treat JWE payloads as encrypted and not boost credentials', async () => {
            const vc = await userA.learnCard.invoke.issueCredential(
                userA.learnCard.invoke.getTestVc(userB.learnCard.id.did())
            );
            const jwePayload = await userA.learnCard.invoke.createDagJwe(vc, [
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
            ]);

            expect(isEncrypted(jwePayload)).toBe(true);
            expect(isBoostCredential(jwePayload as unknown as { type?: string[]; boostCredential?: unknown })).toBe(false);
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
            await Boost.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
            await Presentation.delete({ detach: true, where: {} });
            await Boost.delete({ detach: true, where: {} });
        });

        it('should not require full auth to get a credential', async () => {
            const unsignedVc = userA.learnCard.invoke.getTestVc(userB.learnCard.id.did());
            const vc = await userA.learnCard.invoke.issueCredential(unsignedVc);

            const uri = await userA.clients.fullAuth.storage.store({ item: vc });

            await expect(noAuthClient.storage.resolve({ uri })).resolves.not.toThrow();
            await expect(userB.clients.partialAuth.storage.resolve({ uri })).resolves.not.toThrow();
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

            const encryptedVc = await userA.learnCard.invoke.createDagJwe(vc, [
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
            ]);
            const encryptedVp = await userA.learnCard.invoke.createDagJwe(vp, [
                userA.learnCard.id.did(),
                userB.learnCard.id.did(),
            ]);

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

            expect(await userB.learnCard.invoke.decryptDagJwe(resolvedCredential as JWE)).toEqual(
                vc
            );
            expect(await userB.learnCard.invoke.decryptDagJwe(resolvedPresentation as JWE)).toEqual(
                vp
            );
        });

        it('should allow resolving a consent flow contract', async () => {
            const uri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });

            const promise = userA.clients.fullAuth.storage.resolve({ uri });

            await expect(promise).resolves.not.toThrow();

            const resolvedContract = await promise;

            expect(resolvedContract).toEqual(minimalContract);
        });

        it('should allow resolving a consent flow contract terms', async () => {
            const contractUri = await userA.clients.fullAuth.contracts.createConsentFlowContract({
                contract: minimalContract,
                name: 'a',
            });

            const { termsUri } = await userB.clients.fullAuth.contracts.consentToContract({
                contractUri,
                terms: minimalTerms,
            });

            const promise = userA.clients.fullAuth.storage.resolve({ uri: termsUri });

            await expect(promise).resolves.not.toThrow();

            const resolvedContract = await promise;

            expect(resolvedContract).toEqual(minimalTerms);
        });
    });
});
