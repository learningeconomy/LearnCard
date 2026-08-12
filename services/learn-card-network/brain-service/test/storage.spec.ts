import { JWE, StoredCredentialEnvelope } from '@learncard/types';
import cache from '@cache';
import { getClient, getUser } from './helpers/getClient';
import { Profile, Credential, Presentation } from '@models';
import { minimalContract, minimalTerms } from './helpers/contract';

const noAuthClient = getClient();
let userA: Awaited<ReturnType<typeof getUser>>;
let userB: Awaited<ReturnType<typeof getUser>>;

const makeSdJwtEnvelope = (
    overrides: Partial<StoredCredentialEnvelope> = {}
): StoredCredentialEnvelope => ({
    format: 'dc+sd-jwt',
    data: 'eyJhbGciOiJFZERTQSIsInR5cCI6ImRjK3NkLWp3dCJ9.payload.sig~',
    ...overrides,
});

const makeMdocEnvelope = (
    overrides: Partial<StoredCredentialEnvelope> = {}
): StoredCredentialEnvelope => ({
    format: 'mso_mdoc',
    data: 'YWJjZGVmZ2hpams',
    ...overrides,
});

const storageCacheKey = (uri: string) => `storage:${uri}`;

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

    describe('envelope', () => {
        beforeAll(async () => {
            await Profile.delete({ detach: true, where: {} });

            await userA.clients.fullAuth.profile.createProfile({ profileId: 'userA' });
            await userB.clients.fullAuth.profile.createProfile({ profileId: 'userB' });
        });

        beforeEach(async () => {
            await Credential.delete({ detach: true, where: {} });
        });

        afterAll(async () => {
            await Profile.delete({ detach: true, where: {} });
            await Credential.delete({ detach: true, where: {} });
        });

        it('should require full auth to store an envelope', async () => {
            const envelope = makeSdJwtEnvelope();

            await expect(noAuthClient.storage.store({ item: envelope })).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
            });
            await expect(
                userB.clients.partialAuth.storage.store({ item: envelope })
            ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
        });

        it('should allow storing an SD-JWT-VC envelope', async () => {
            await expect(
                userA.clients.fullAuth.storage.store({ item: makeSdJwtEnvelope() })
            ).resolves.not.toThrow();
        });

        it('should allow storing an mDoc envelope (base64url binary)', async () => {
            await expect(
                userA.clients.fullAuth.storage.store({ item: makeMdocEnvelope() })
            ).resolves.not.toThrow();
        });

        it('should roundtrip an SD-JWT-VC envelope unchanged', async () => {
            const envelope = makeSdJwtEnvelope();

            const uri = await userA.clients.fullAuth.storage.store({ item: envelope });
            const resolved = await userA.clients.fullAuth.storage.resolve({ uri });

            expect(resolved).toEqual(envelope);
        });

        it('should roundtrip an mDoc envelope unchanged', async () => {
            const envelope = makeMdocEnvelope();

            const uri = await userA.clients.fullAuth.storage.store({ item: envelope });
            const resolved = await userA.clients.fullAuth.storage.resolve({ uri });

            expect(resolved).toEqual(envelope);
        });

        it('should roundtrip a vc+sd-jwt legacy-format envelope unchanged', async () => {
            const envelope = makeSdJwtEnvelope({ format: 'vc+sd-jwt' });

            const uri = await userA.clients.fullAuth.storage.store({ item: envelope });
            const resolved = await userA.clients.fullAuth.storage.resolve({ uri });

            expect(resolved).toEqual(envelope);
        });

        it('should preserve unknown passthrough fields on envelope roundtrip', async () => {
            const envelope = {
                ...makeSdJwtEnvelope(),
                metadata: { issuedBy: 'partner-x', schemaVersion: 2 },
                cnfHint: 'did:jwk:abc',
            };

            const uri = await userA.clients.fullAuth.storage.store({ item: envelope });
            const resolved = await userA.clients.fullAuth.storage.resolve({ uri });

            expect(resolved).toEqual(envelope);
        });

        it('should roundtrip through Neo4j when the Redis cache is cold', async () => {
            // The store mutation pre-populates Redis via setStorageForUri, so a
            // resolve immediately after store always hits cache. Clearing the cache
            // here forces the resolve to go through getCredentialById +
            // JSON.parse(instance.credential), which is the path users hit when the
            // cache TTL expires or Redis restarts.
            const envelope = makeSdJwtEnvelope();
            const uri = await userA.clients.fullAuth.storage.store({ item: envelope });

            await cache.delete([storageCacheKey(uri)]);

            const resolved = await userA.clients.fullAuth.storage.resolve({ uri });

            expect(resolved).toEqual(envelope);
        });

        it('should preserve `format` and `data` against ConsentFlowContract greedy-match on resolve', async () => {
            // ConsentFlowContractValidator uses .prefault() on every field, so any
            // object passes its Zod parse with defaults filling read/write. If the
            // resolve output union puts contract before envelope, an envelope is
            // silently parsed as an empty contract — format and data get stripped.
            // This test pins the union-ordering invariant.
            const envelope = makeSdJwtEnvelope();
            const uri = await userA.clients.fullAuth.storage.store({ item: envelope });

            const resolved = (await userA.clients.fullAuth.storage.resolve({ uri })) as Record<
                string,
                unknown
            >;

            expect(resolved.format).toBe('dc+sd-jwt');
            expect(resolved.data).toBe(envelope.data);
            expect(resolved.read).toBeUndefined();
            expect(resolved.write).toBeUndefined();
        });
    });
});
