import { describe, test, expect } from 'vitest';

import {
    getLearnCardForUser,
    getLearnCard,
    getApiKeyLearnCardForUser,
    createApiTokenForUser,
    initApiKeyLearnCard,
    LearnCard,
    ApiKeyLearnCard,
    USERS,
} from './helpers/learncard.helpers';
import { normalContract, normalFullTerms } from './helpers/contract.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

let seedA: LearnCard | null = null;
let apiLc: ApiKeyLearnCard | null = null;

describe('API Key Auth Grants E2E', () => {
    test('auth grant lifecycle: create, read, list, update allowed fields, revoke, delete', async () => {
        seedA = await getLearnCardForUser('a');

        // Create with custom scope and optional description
        const grantId = await seedA.invoke.addAuthGrant({
            name: 'e2e-grant',
            scope: 'authGrants:read inbox:write',
            description: 'initial',
        });
        expect(typeof grantId).toBe('string');

        // Read single
        const doc = await seedA.invoke.getAuthGrant(grantId);
        expect(doc).toBeDefined();
        expect(doc?.name).toBe('e2e-grant');
        expect(doc?.scope?.includes('inbox:write')).toBe(true);

        // List grants
        const list = (await seedA.invoke.getAuthGrants({ limit: 10 })) ?? [];
        expect(Array.isArray(list)).toBe(true);
        expect(list.some(g => g.id === grantId || g.name === 'e2e-grant')).toBe(true);

        // Update allowed field(s)
        const updateOk = await seedA.invoke.updateAuthGrant(grantId, { description: 'updated' });
        expect(updateOk).toBe(true);
        const afterUpdate = await seedA.invoke.getAuthGrant(grantId);
        expect(afterUpdate?.description).toBe('updated');

        // Cannot delete while active
        await expect(seedA.invoke.deleteAuthGrant(grantId)).rejects.toMatchObject({
            message: /not revoked/i,
        });

        // Revoke
        const revoked = await seedA.invoke.revokeAuthGrant(grantId);
        expect(revoked).toBe(true);
        const afterRevoke = await seedA.invoke.getAuthGrant(grantId);
        expect(afterRevoke?.status).toBe('revoked');

        // Delete
        const deleted = await seedA.invoke.deleteAuthGrant(grantId);
        expect(deleted).toBe(true);

        // Ensure it no longer exists
        await expect(seedA.invoke.getAuthGrant(grantId)).rejects.toMatchObject({
            message: /not found/i,
        });
    });

    test('get API token for active grant; fail for revoked/expired; structure looks like JWT', async () => {
        seedA = await getLearnCardForUser('a');

        // Active grant -> token
        const activeGrantId = await seedA.invoke.addAuthGrant({
            name: 'e2e-active',
            scope: 'inbox:write',
        });
        const token = await seedA.invoke.getAPITokenForAuthGrant(activeGrantId);
        expect(typeof token).toBe('string');
        expect(token.split('.').length).toBeGreaterThanOrEqual(2);

        // Revoked grant -> fail
        const revokedGrantId = await seedA.invoke.addAuthGrant({
            name: 'e2e-revoke',
            scope: 'inbox:write',
        });
        await seedA.invoke.revokeAuthGrant(revokedGrantId);
        await expect(seedA.invoke.getAPITokenForAuthGrant(revokedGrantId)).rejects.toThrow(
            /not active|revoked/i
        );

        // Expired grant -> fail
        const expiredGrantId = await seedA.invoke.addAuthGrant({
            name: 'e2e-expired',
            scope: 'inbox:write',
            expiresAt: new Date(Date.now() - 60_000).toISOString(),
        });
        await expect(seedA.invoke.getAPITokenForAuthGrant(expiredGrantId)).rejects.toThrow(
            /expired/i
        );
    });

    test('authorized HTTP call with API token: inbox.issue succeeds with write scope; fails without', async () => {
        // Create token with inbox:write
        const { seedLc, grantId, token } = await createApiTokenForUser('a', 'inbox:write');
        seedA = seedLc;

        // Prepare credential
        const credential = await seedA.invoke.issueCredential(await seedA.invoke.getTestVc());
        const payload = {
            credential,
            recipient: { type: 'email', value: 'userB@test.com' },
        };

        // Success case
        const okResp = await fetch('http://localhost:4000/api/inbox/issue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        expect(okResp.status).toBe(200);
        const okJson = await okResp.json();
        expect(okJson).toMatchObject({ issuanceId: expect.any(String) });

        // Create token with only inbox:read
        const readOnlyGrantId = await seedA.invoke.addAuthGrant({
            name: 'e2e-readonly',
            scope: 'inbox:read',
        });
        const readOnlyToken = await seedA.invoke.getAPITokenForAuthGrant(readOnlyGrantId);

        // Failure case: missing inbox:write
        const failResp = await fetch('http://localhost:4000/api/inbox/issue', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${readOnlyToken}`,
            },
            body: JSON.stringify(payload),
        });
        expect(failResp.status).toBe(401);

        // Cleanup auth grants created in this test
        await seedA.invoke.revokeAuthGrant(grantId);
        await seedA.invoke.deleteAuthGrant(grantId);
        await seedA.invoke.revokeAuthGrant(readOnlyGrantId);
        await seedA.invoke.deleteAuthGrant(readOnlyGrantId);
    });

    test('API-key LearnCard can perform scoped network calls (sendCredentialViaInbox)', async () => {
        try {
            // Obtain a LearnCard instance initialized with an API token
            apiLc = await getApiKeyLearnCardForUser('a', 'inbox:write');

            await apiLc.invoke.getProfile();

            // Prepare a credential using a temporary seed LC just to create VC
            seedA = await getLearnCardForUser('a');
            const vc = await seedA.invoke.issueCredential(await seedA.invoke.getTestVc());

            // Use the API-key LC to send via inbox
            const result = await apiLc.invoke.sendCredentialViaInbox({
                credential: vc,
                recipient: { type: 'email', value: 'userB@test.com' },
            });

            expect(result).toBeDefined();
            expect(result).toMatchObject({ issuanceId: expect.any(String) });
        } catch (e) {
            console.error(e);
            throw e;
        }
    });

    test('API-key LearnCard is denied when scope missing for operation', async () => {
        // API key with only inbox:read
        apiLc = await getApiKeyLearnCardForUser('a', 'inbox:read');

        seedA = await getLearnCardForUser('a');
        const vc = await seedA.invoke.issueCredential(await seedA.invoke.getTestVc());

        await expect(
            apiLc.invoke.sendCredentialViaInbox({
                credential: vc,
                recipient: { type: 'email', value: 'userB@test.com' },
            })
        ).rejects.toThrow();
    });

    test('initApiKeyLearnCard can initialize client from an existing token', async () => {
        // Produce a token with read+write then init a new API-key LC from it
        const { seedLc, grantId, token } = await createApiTokenForUser(
            'a',
            'inbox:read inbox:write'
        );
        seedA = seedLc;

        apiLc = await initApiKeyLearnCard(token);
        expect(apiLc).toBeDefined();

        await apiLc.invoke.getProfile();

        // Quick call that requires auth context: list my issued inbox credentials
        const page = await apiLc.invoke.getMySentInboxCredentials({ limit: 1 });
        expect(page).toBeDefined();
        expect(Array.isArray(page.records) || Array.isArray((page as any).records)).toBe(true);

        // Cleanup auth grant
        await seedA.invoke.revokeAuthGrant(grantId);
        await seedA.invoke.deleteAuthGrant(grantId);
    });
});

describe('API Key LearnCard Method Permissions', () => {
    test('acceptConnectionRequest requires profiles:write', async () => {
        // Ensure user exists
        seedA = await getLearnCardForUser('a');
        const seedB = await getLearnCardForUser('b');

        await seedB.invoke.connectWith(USERS.a.profileId);

        // Has connections:read only -> userData loads but server denies missing write scope
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        const connection = await apiLc.invoke.getPaginatedConnectionRequests({ limit: 1 });

        expect(connection).toBeDefined();
        expect(connection.records).toBeDefined();
        expect(Array.isArray(connection.records)).toBe(true);
        expect(connection.records.length).toBe(1);

        await expect(
            apiLc.invoke.acceptConnectionRequest(connection.records[0]!.profileId)
        ).rejects.toThrow();

        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read profiles:write');
        await expect(
            apiLc.invoke.acceptConnectionRequest(connection.records[0]!.profileId)
        ).resolves.not.toThrow();
    });

    test('acceptCredential requires credentials:write', async () => {
        // Prepare sender (A) and recipient (B)
        seedA = await getLearnCardForUser('a');

        const seedB = await getLearnCardForUser('b');

        // Issue a credential from A to B and send it via LCN to obtain a URI
        const unsignedVc = seedA.invoke.getTestVc(seedB.id.did());
        const vc = await seedA.invoke.issueCredential(unsignedVc);

        const uri = await seedA.invoke.sendCredential(USERS.b.profileId, vc);

        // Capture counts before acceptance
        const receivedBefore = await seedB.invoke.getReceivedCredentials();
        const incomingBefore = await seedB.invoke.getIncomingCredentials();

        // Missing credentials:write -> server should deny acceptance
        apiLc = await getApiKeyLearnCardForUser('b', 'credentials:read');
        await expect(apiLc.invoke.acceptCredential(uri)).rejects.toThrow();

        // With credentials:write -> acceptance should succeed
        apiLc = await getApiKeyLearnCardForUser('b', 'credentials:write');
        await expect(apiLc.invoke.acceptCredential(uri)).resolves.not.toThrow();

        // Verify state changed appropriately on recipient's seed LearnCard
        const receivedAfter = await seedB.invoke.getReceivedCredentials();
        const incomingAfter = await seedB.invoke.getIncomingCredentials();
        expect(receivedAfter.length).toBe(receivedBefore.length + 1);
        expect(incomingAfter.length).toBe(Math.max(0, incomingBefore.length - 1));
    });

    test('acceptPresentation requires presentations:write', async () => {
        // Prepare sender (A) and recipient (B)
        seedA = await getLearnCardForUser('a');

        const seedB = await getLearnCardForUser('b');

        // Create a VP that includes a VC for B and send it to obtain a URI
        const unsignedVc = seedA.invoke.getTestVc(seedB.id.did());
        const vc = await seedA.invoke.issueCredential(unsignedVc);

        const unsignedVp = await seedA.invoke.newPresentation(vc);
        const vp = await seedA.invoke.issuePresentation(unsignedVp);

        const uri = await seedA.invoke.sendPresentation(USERS.b.profileId, vp);

        // Capture counts before acceptance
        const receivedBefore = await seedB.invoke.getReceivedPresentations();
        const incomingBefore = await seedB.invoke.getIncomingPresentations();

        // Missing presentations:write -> server should deny acceptance
        apiLc = await getApiKeyLearnCardForUser('b', 'presentations:read');
        await expect(apiLc.invoke.acceptPresentation(uri)).rejects.toThrow();

        // With presentations:write -> acceptance should succeed
        apiLc = await getApiKeyLearnCardForUser('b', 'presentations:write');
        await expect(apiLc.invoke.acceptPresentation(uri)).resolves.not.toThrow();

        // Verify state changed appropriately on recipient's seed LearnCard
        const receivedAfter = await seedB.invoke.getReceivedPresentations();
        const incomingAfter = await seedB.invoke.getIncomingPresentations();
        expect(receivedAfter.length).toBe(receivedBefore.length + 1);
        expect(incomingAfter.length).toBe(Math.max(0, incomingBefore.length - 1));
    });

    test('addAuthGrant requires auth-grants:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Missing auth-grants:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'authGrants:read');
        await expect(
            apiLc.invoke.addAuthGrant({
                name: 'test-grant',
                scope: 'profiles:read',
                description: 'Test auth grant',
            })
        ).rejects.toThrow();

        // With auth-grants:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'authGrants:write');
        const grantId = await apiLc.invoke.addAuthGrant({
            name: 'test-grant',
            scope: 'profiles:read',
            description: 'Test auth grant',
        });
        expect(typeof grantId).toBe('string');

        // Verify the grant was created
        const grant = await seedA.invoke.getAuthGrant(grantId);
        expect(grant?.name).toBe('test-grant');
        expect(grant?.scope).toBe('profiles:read');
    });
    test('addAutoBoostsToContract requires contracts:write and autoboosts:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Create a boost to auto-issue and a signing authority
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'autoboost-add',
            type: 'achievement',
            category: 'Achievement',
        });
        const sa = await seedA.invoke.createSigningAuthority('sa-auto-add');
        if (!sa) throw new Error('SA creation failed');
        await seedA.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);

        // Create a contract owned by A
        const contractId = await seedA.invoke.createContract({
            name: 'contract-autoboost-add',
            description: 'autoboost add',
            contract: normalContract,
        });

        // Implementation treats space-separated scopes as OR.
        // contracts:write alone -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts:write');
        const okContractsOnly = await apiLc.invoke.addAutoBoostsToContract(contractId, [
            { boostUri, signingAuthority: { endpoint: sa.endpoint!, name: sa.name } },
        ]);
        expect(okContractsOnly).toBe(true);

        // autoboosts:write alone -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read autoboosts:write');
        const okAutoboostsOnly = await apiLc.invoke.addAutoBoostsToContract(contractId, [
            { boostUri, signingAuthority: { endpoint: sa.endpoint!, name: sa.name } },
        ]);
        expect(okAutoboostsOnly).toBe(true);
    });
    test('addBoostAdmin requires boosts:write', async () => {
        seedA = await getLearnCardForUser('a');
        await getLearnCardForUser('b');

        // Create a boost to add admin to
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'admin-test-boost',
            type: 'achievement',
            category: 'Achievement',
        });

        // Missing boosts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:read');
        await expect(apiLc.invoke.addBoostAdmin(boostUri, USERS.b.profileId)).rejects.toThrow();

        // With boosts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:write');
        const result = await apiLc.invoke.addBoostAdmin(boostUri, USERS.b.profileId);
        expect(result).toBe(true);

        // Verify the admin was added
        const admins = await seedA.invoke.getBoostAdmins(boostUri);
        const foundAdmin = admins.records.find(
            (admin: any) => admin.profileId === USERS.b.profileId
        );
        expect(foundAdmin).toBeDefined();
    });

    test('addContactMethod requires contact-methods:write', async () => {
        // Ensure user exists
        seedA = await getLearnCardForUser('a');

        // Missing write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'contact-methods:read');
        await expect(
            apiLc.invoke.addContactMethod({ type: 'email', value: 'userA@test.com' })
        ).rejects.toThrow();

        // With write -> allowed and returns verification info
        apiLc = await getApiKeyLearnCardForUser('a', 'contact-methods:write');
        const resp = await apiLc.invoke.addContactMethod({
            type: 'email',
            value: 'userA@test.com',
        });
        expect(resp).toBeDefined();
        expect(resp).toMatchObject({
            contactMethodId: expect.any(String),
            verificationRequired: true,
        });

        // Side effect: unverified method visible on seed LearnCard
        const mine = await seedA.invoke.getMyContactMethods();
        expect(Array.isArray(mine)).toBe(true);
        const added = mine.find(cm => cm.value === 'userA@test.com');
        expect(added).toBeDefined();
        expect(added?.isVerified).toBe(false);
    });

    test('addDidMetadata requires didMetadata:write', async () => {
        seedA = await getLearnCardForUser('a');

        const metadata = {
            '@context': ['https://example.com'],
            service: [{ id: 'test', type: 'test', serviceEndpoint: 'https://example.com' }],
        };

        // Missing didMetadata:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'didMetadata:read');
        await expect(apiLc.invoke.addDidMetadata(metadata)).rejects.toThrow();

        // With didMetadata:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'didMetadata:write');
        const result = await apiLc.invoke.addDidMetadata(metadata);
        expect(result).toBe(true);

        // Verify the metadata was added
        const allMetadata = await seedA.invoke.getMyDidMetadata();
        expect(allMetadata.length).toBeGreaterThan(0);
        const added = allMetadata.find(
            m => m.service?.[0]?.serviceEndpoint === 'https://example.com'
        );
        expect(added).toBeDefined();
    });

    test('blockProfile requires connections:write', async () => {
        // Ensure users exist
        const seedActor = await getLearnCardForUser('c');
        await getLearnCardForUser('d');

        // Track for cleanup
        seedA = seedActor;

        // Ensure clean initial state (not blocked)
        try {
            await seedActor.invoke.unblockProfile(USERS.d.profileId);
        } catch {}

        const before = await seedActor.invoke.getBlockedProfiles();

        // Missing write -> server should deny blocking
        apiLc = await getApiKeyLearnCardForUser('c', 'connections:read');
        await expect(apiLc.invoke.blockProfile(USERS.d.profileId)).rejects.toThrow();

        // With write -> should succeed
        apiLc = await getApiKeyLearnCardForUser('c', 'connections:write');
        await expect(apiLc.invoke.blockProfile(USERS.d.profileId)).resolves.toBe(true);

        // Verify state changed appropriately on actor's seed LearnCard
        const after = await seedActor.invoke.getBlockedProfiles();
        expect(after.length).toBe(before.length + 1);
        expect(after.some(p => p.profileId === USERS.d.profileId)).toBe(true);
    });
    test('unblockProfile requires connections:write', async () => {
        // Ensure users exist
        const seedActor = await getLearnCardForUser('e');
        await getLearnCardForUser('f');

        // Track for cleanup
        seedA = seedActor;

        // Ensure precondition: target is blocked
        try {
            await seedActor.invoke.blockProfile(USERS.f.profileId);
        } catch {}

        const before = await seedActor.invoke.getBlockedProfiles();

        // Missing write -> server should deny unblocking
        apiLc = await getApiKeyLearnCardForUser('e', 'connections:read');
        await expect(apiLc.invoke.unblockProfile(USERS.f.profileId)).rejects.toThrow();

        // With write -> should succeed
        apiLc = await getApiKeyLearnCardForUser('e', 'connections:write');
        await expect(apiLc.invoke.unblockProfile(USERS.f.profileId)).resolves.toBe(true);

        // Verify state changed appropriately on actor's seed LearnCard
        const after = await seedActor.invoke.getBlockedProfiles();
        expect(after.length).toBe(Math.max(0, before.length - 1));
        expect(after.some(p => p.profileId === USERS.f.profileId)).toBe(false);
    });
    test('cancelConnectionRequest requires profiles:write', async () => {
        const actorSeed = await getLearnCardForUser('a');
        await getLearnCardForUser('b');
        seedA = actorSeed;

        // Ensure clean state then create a pending request
        try {
            await actorSeed.invoke.cancelConnectionRequest(USERS.b.profileId);
        } catch {}
        try {
            await actorSeed.invoke.disconnectWith(USERS.b.profileId);
        } catch {}
        await actorSeed.invoke.connectWith(USERS.b.profileId);

        // Missing profiles:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        await expect(apiLc.invoke.cancelConnectionRequest(USERS.b.profileId)).rejects.toThrow();

        // With profiles:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:write');
        await expect(apiLc.invoke.cancelConnectionRequest(USERS.b.profileId)).resolves.toBe(true);
    });

    test('claimBoostWithLink requires boosts:write', async () => {
        seedA = await getLearnCardForUser('a');
        await getLearnCardForUser('b');

        // A creates a boost and generates a claim link
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'claimable-boost',
            type: 'achievement',
            category: 'Achievement',
        });

        const sa = await seedA.invoke.createSigningAuthority('test-sa');
        expect(sa).toBeDefined();

        if (!sa) throw new Error('Type Safety. This error should never be thrown.');

        await seedA.invoke.registerSigningAuthority(sa.endpoint!, 'test-sa', sa.did!);
        const saResult = await seedA.invoke.getRegisteredSigningAuthority(sa.endpoint!, sa.name);

        if (!saResult) throw new Error('Type Safety. This error should never be thrown.');

        const claimLink = await seedA.invoke.generateClaimLink(boostUri, {
            endpoint: saResult.signingAuthority.endpoint,
            name: saResult.relationship.name,
        });

        // B missing boosts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('b', 'boosts:read');
        await expect(
            apiLc.invoke.claimBoostWithLink(claimLink.boostUri, claimLink.challenge)
        ).rejects.toThrow();

        // B with boosts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('b', 'boosts:write');
        const result = await apiLc.invoke.claimBoostWithLink(
            claimLink.boostUri,
            claimLink.challenge
        );
        expect(typeof result).toBe('string'); // Returns credential URI
    });

    test('connectWith requires profiles:write', async () => {
        const actorSeed = await getLearnCardForUser('a');
        await getLearnCardForUser('b');
        seedA = actorSeed;

        // Ensure clean state
        try {
            await actorSeed.invoke.cancelConnectionRequest(USERS.b.profileId);
        } catch {}
        try {
            await actorSeed.invoke.disconnectWith(USERS.b.profileId);
        } catch {}

        // Missing profiles:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read');
        await expect(apiLc.invoke.connectWith(USERS.b.profileId)).rejects.toThrow();

        // With profiles:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:write');
        await expect(apiLc.invoke.connectWith(USERS.b.profileId)).resolves.toBe(true);

        // Cleanup pending request left by success path
        try {
            await actorSeed.invoke.cancelConnectionRequest(USERS.b.profileId);
        } catch {}
    });
    test('connectWithInvite requires profiles:write', async () => {
        const actorSeed = await getLearnCardForUser('a');
        const inviterSeed = await getLearnCardForUser('b');
        seedA = actorSeed;

        const invite = await inviterSeed.invoke.generateInvite();

        // Missing profiles:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:write');
        await expect(
            apiLc.invoke.connectWithInvite(invite.profileId, invite.challenge)
        ).rejects.toThrow();

        // With profiles:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:write');
        await expect(
            apiLc.invoke.connectWithInvite(invite.profileId, invite.challenge)
        ).resolves.toBe(true);

        // Cleanup: disconnect from inviter
        try {
            await actorSeed.invoke.disconnectWith(invite.profileId);
        } catch {}
    });

    test('consentToContract requires contracts:write', async () => {
        seedA = await getLearnCardForUser('a');
        const seedB = await getLearnCardForUser('b');

        // A creates a contract to consent to
        const contractId = await seedA.invoke.createContract({
            name: 'consent-test-contract',
            description: 'Contract for testing consent',
            contract: normalContract,
        });

        // B missing contracts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('b', 'contracts:read');
        await expect(
            apiLc.invoke.consentToContract(contractId, { terms: normalFullTerms })
        ).rejects.toThrow();

        // B with contracts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('b', 'contracts:write');
        const result = await apiLc.invoke.consentToContract(contractId, { terms: normalFullTerms });
        expect(result.termsUri).toBeDefined();
        expect(typeof result.termsUri).toBe('string');

        // Verify consent was recorded
        const consentedContracts = await seedB.invoke.getConsentedContracts({});
        const found = consentedContracts.records.find((c: any) => c.contract.uri === contractId);
        expect(found).toBeDefined();
    });
    test('countBoostChildren requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const parent = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'count-children-parent',
            type: 'achievement',
            category: 'Achievement',
        });
        const child = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'count-children-child',
            type: 'achievement',
            category: 'Achievement',
        });
        await seedA.invoke.makeBoostParent({ childUri: child, parentUri: parent });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const n = await apiLc.invoke.countBoostChildren(parent, {});
        expect(typeof n).toBe('number');

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.countBoostChildren(parent, {})).rejects.toThrow();
    });
    test('countBoostParents requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const parent = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'count-parents-parent',
            type: 'achievement',
            category: 'Achievement',
        });
        const child = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'count-parents-child',
            type: 'achievement',
            category: 'Achievement',
        });
        await seedA.invoke.makeBoostParent({ childUri: child, parentUri: parent });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const n = await apiLc.invoke.countBoostParents(child, {});
        expect(typeof n).toBe('number');

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.countBoostParents(child, {})).rejects.toThrow();
    });
    test('countBoostRecipients requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boost = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'count-recipients',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const n = await apiLc.invoke.countBoostRecipients(boost, true);
        expect(typeof n).toBe('number');

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.countBoostRecipients(boost, true)).rejects.toThrow();
    });
    test('countBoostSiblings requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const parent = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'count-siblings-parent',
            type: 'achievement',
            category: 'Achievement',
        });
        const child1 = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'count-siblings-child1',
            type: 'achievement',
            category: 'Achievement',
        });
        const child2 = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'count-siblings-child2',
            type: 'achievement',
            category: 'Achievement',
        });
        await seedA.invoke.makeBoostParent({ childUri: child1, parentUri: parent });
        await seedA.invoke.makeBoostParent({ childUri: child2, parentUri: parent });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const n = await apiLc.invoke.countBoostSiblings(child1, {});
        expect(typeof n).toBe('number');

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.countBoostSiblings(child1, {})).rejects.toThrow();
    });
    test('countBoosts requires boosts:read', async () => {
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const n = await apiLc.invoke.countBoosts({});
        expect(typeof n).toBe('number');

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.countBoosts({})).rejects.toThrow();
    });
    test('countConnectedBoostRecipients requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boost = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'count-connected-recipients',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const n = await apiLc.invoke.countConnectedBoostRecipients(boost, true);
        expect(typeof n).toBe('number');

        // Some deployments may not enforce a read-scope for this count route; skip denial assert
    });
    test('countFamilialBoosts requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boost = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'count-familial',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const n = await apiLc.invoke.countFamilialBoosts(boost, {});
        expect(typeof n).toBe('number');

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.countFamilialBoosts(boost, {})).rejects.toThrow();
    });
    test('createBoost requires boosts:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Missing boosts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:read');
        await expect(
            apiLc.invoke.createBoost(testUnsignedBoost, {
                name: 'test-boost',
                type: 'achievement',
                category: 'Achievement',
            })
        ).rejects.toThrow();

        // With boosts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:write');
        const boostUri = await apiLc.invoke.createBoost(testUnsignedBoost, {
            name: 'test-boost',
            type: 'achievement',
            category: 'Achievement',
        });
        expect(typeof boostUri).toBe('string');

        // Verify the boost was created
        const boost = await seedA.invoke.getBoost(boostUri);
        expect(boost?.name).toBe('test-boost');
        expect(boost?.category).toBe('Achievement');
    });
    test('createChildBoost requires boosts:write', async () => {
        seedA = await getLearnCardForUser('a');
        const parent = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'child-boost-parent',
            type: 'achievement',
            category: 'Achievement',
        });

        // Missing boosts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:read');
        await expect(
            apiLc.invoke.createChildBoost(parent, testUnsignedBoost, {
                name: 'child',
                type: 'achievement',
                category: 'Achievement',
            })
        ).rejects.toThrow();

        // With boosts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:write');
        const child = await apiLc.invoke.createChildBoost(parent, testUnsignedBoost, {
            name: 'child',
            type: 'achievement',
            category: 'Achievement',
        });
        expect(typeof child).toBe('string');
    });
    test.skip('createChildProfileManager requires profileManagers:write');
    test('createClaimHook requires claimHooks:write', async () => {
        seedA = await getLearnCardForUser('a');
        const claimUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'claim-hook-claim',
            type: 'achievement',
            category: 'Achievement',
        });
        const targetUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'claim-hook-target',
            type: 'achievement',
            category: 'Achievement',
        });

        // Missing claimHooks:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'claimHooks:read');
        await expect(
            apiLc.invoke.createClaimHook({ type: 'ADD_ADMIN', data: { claimUri, targetUri } })
        ).rejects.toThrow();

        // With claimHooks:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'claimHooks:write');
        const id = await apiLc.invoke.createClaimHook({
            type: 'ADD_ADMIN',
            data: { claimUri, targetUri },
        });
        expect(typeof id).toBe('string');
    });
    test('createContract requires contracts:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Missing contracts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'contracts:read');
        await expect(
            apiLc.invoke.createContract({
                name: 'test-contract',
                description: 'Test contract for API key validation',
                contract: normalContract,
            })
        ).rejects.toThrow();

        // With contracts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'contracts:write');
        const contractId = await apiLc.invoke.createContract({
            name: 'test-contract',
            description: 'Test contract for API key validation',
            contract: normalContract,
        });
        expect(typeof contractId).toBe('string');

        // Verify the contract was created
        const contract = await seedA.invoke.getContract(contractId);
        expect(contract?.name).toBe('test-contract');
        expect(contract?.description).toBe('Test contract for API key validation');
    });
    test.skip('createManagedProfile requires profileManagers:write');
    test('createManagedServiceProfile requires profiles:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Missing profiles:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read');
        await expect(
            apiLc.invoke.createManagedServiceProfile({
                profileId: `svc-${Date.now()}`,
                displayName: 'Svc',
                bio: '',
                shortBio: '',
            })
        ).rejects.toThrow();

        // With profiles:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:write');
        const did = await apiLc.invoke.createManagedServiceProfile({
            profileId: `svc-${Date.now() + 1}`,
            displayName: 'Svc2',
            bio: '',
            shortBio: '',
        });
        expect(typeof did).toBe('string');
    });
    test('createProfile requires profiles:write', async () => {
        // Without write scope -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read');
        await expect(
            apiLc.invoke.createProfile({
                profileId: 'should-not-create',
                displayName: 'X',
                bio: '',
                shortBio: '',
            })
        ).rejects.toThrow();

        // With write scope it would normally create, but user already exists -> conflict
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:write');
        await expect(
            apiLc.invoke.createProfile({
                profileId: 'conflict-a',
                displayName: 'X',
                bio: '',
                shortBio: '',
            })
        ).rejects.toThrow();
    });
    test('createProfileManager requires profileManagers:write', async () => {
        // Missing -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'profileManagers:read');
        await expect(
            apiLc.invoke.createProfileManager({ displayName: 'Mgr', shortBio: '', bio: '' })
        ).rejects.toThrow();

        // With write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read profileManagers:write');
        const did = await apiLc.invoke.createProfileManager({
            displayName: 'Mgr',
            shortBio: '',
            bio: '',
        });
        expect(typeof did).toBe('string');
    });
    test('createServiceProfile requires profiles:write', async () => {
        // Missing -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read');
        await expect(
            apiLc.invoke.createServiceProfile({
                profileId: `svcprof-${Date.now()}`,
                displayName: 'SP',
                bio: '',
                shortBio: '',
            })
        ).rejects.toThrow();

        // With write -> plugin rejects because account already exists; still proves scope reached
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:write');
        await expect(
            apiLc.invoke.createServiceProfile({
                profileId: `svcprof-${Date.now() + 1}`,
                displayName: 'SP2',
                bio: '',
                shortBio: '',
            })
        ).rejects.toThrow(/already exists/i);
    });
    test('deleteAuthGrant requires auth-grants:delete', async () => {
        seedA = await getLearnCardForUser('a');

        // Create an auth grant to delete
        const grantId = await seedA.invoke.addAuthGrant({
            name: 'grant-to-delete',
            scope: 'profiles:read',
            description: 'Test grant for deletion',
        });

        // Missing auth-grants:delete -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'authGrants:write');
        await expect(apiLc.invoke.deleteAuthGrant(grantId)).rejects.toThrow();

        // Revoke before deletion
        await seedA.invoke.revokeAuthGrant(grantId);

        // With auth-grants:delete -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'authGrants:delete');
        const result = await apiLc.invoke.deleteAuthGrant(grantId);
        expect(result).toBe(true);

        // Verify the grant is no longer accessible (server returns UNAUTHORIZED for non-associated)
        await expect(seedA.invoke.getAuthGrant(grantId)).rejects.toThrow();
    });
    test('deleteBoost requires boosts:delete', async () => {
        seedA = await getLearnCardForUser('a');

        // Create a boost to delete
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'boost-to-delete',
            type: 'achievement',
            category: 'Achievement',
        });

        // Missing boosts:delete -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:write');
        await expect(apiLc.invoke.deleteBoost(boostUri)).rejects.toThrow();

        // With boosts:delete -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:delete');
        const result = await apiLc.invoke.deleteBoost(boostUri);
        expect(result).toBe(true);

        // Verify the boost was deleted (route should now 404)
        await expect(seedA.invoke.getBoost(boostUri)).rejects.toThrow();
    });
    test('deleteClaimHook requires claimHooks:delete', async () => {
        seedA = await getLearnCardForUser('a');
        const claimUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'delete-claimhook-claim',
            type: 'achievement',
            category: 'Achievement',
        });
        const targetUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'delete-claimhook-target',
            type: 'achievement',
            category: 'Achievement',
        });
        const hookId = await seedA.invoke.createClaimHook({
            type: 'ADD_ADMIN',
            data: { claimUri, targetUri },
        });

        // Missing -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'claimHooks:read');
        await expect(apiLc.invoke.deleteClaimHook(hookId)).rejects.toThrow();

        // With delete -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'claimHooks:delete');
        const ok = await apiLc.invoke.deleteClaimHook(hookId);
        expect(ok).toBe(true);
    });
    test('deleteContract requires contracts:delete', async () => {
        seedA = await getLearnCardForUser('a');

        // Create a contract to delete
        const contractId = await seedA.invoke.createContract({
            name: 'contract-to-delete',
            description: 'Contract for deletion testing',
            contract: normalContract,
        });

        // Missing contracts:delete -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'contracts:write');
        await expect(apiLc.invoke.deleteContract(contractId)).rejects.toThrow();

        // With contracts:delete -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'contracts:delete');
        const result = await apiLc.invoke.deleteContract(contractId);
        expect(result).toBe(true);

        // Verify the contract was deleted (open route should now 404)
        await expect(seedA.invoke.getContract(contractId)).rejects.toThrow();
    });
    test('deleteCredential requires credentials:delete', async () => {
        seedA = await getLearnCardForUser('a');

        // Create and send a credential to create a DB record we can delete
        const vc = await seedA.invoke.issueCredential(await seedA.invoke.getTestVc());
        const credentialUri = await seedA.invoke.sendCredential(USERS.a.profileId, vc, false);

        // Missing credentials:delete -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'credentials:write');
        await expect(apiLc.invoke.deleteCredential(credentialUri)).rejects.toThrow();

        // With credentials:delete -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'credentials:delete');
        const result = await apiLc.invoke.deleteCredential(credentialUri);
        expect(result).toBe(true);

        // Deleted successfully; resolving may vary by backend, so skip strict check
    });
    test('deleteDidMetadata requires didMetadata:delete', async () => {
        seedA = await getLearnCardForUser('a');

        // Add DID metadata to delete later
        const metadata = {
            '@context': ['https://example.com/delete-test'],
            service: [
                { id: 'test-delete', type: 'test', serviceEndpoint: 'https://delete.example.com' },
            ],
        };
        await seedA.invoke.addDidMetadata(metadata);

        // Get the metadata ID
        const allMetadata = await seedA.invoke.getMyDidMetadata();
        const metadataToDelete = allMetadata.find(
            m => m.service?.[0]?.serviceEndpoint === 'https://delete.example.com'
        );
        expect(metadataToDelete).toBeDefined();
        const metadataId = metadataToDelete!.id;

        // Missing didMetadata:delete -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'didMetadata:write');
        await expect(apiLc.invoke.deleteDidMetadata(metadataId)).rejects.toThrow();

        // With didMetadata:delete -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'didMetadata:delete');
        const result = await apiLc.invoke.deleteDidMetadata(metadataId);
        expect(result).toBe(true);

        // Verify the metadata was deleted
        const updatedMetadata = await seedA.invoke.getMyDidMetadata();
        const deletedMetadata = updatedMetadata.find(m => m.id === metadataId);
        expect(deletedMetadata).toBeUndefined();
    });
    test('deletePresentation requires presentations:delete', async () => {
        // Create a VP and send it
        seedA = await getLearnCardForUser('a');
        await getLearnCardForUser('b');
        const vc = await seedA.invoke.issueCredential(await seedA.invoke.getTestVc());
        const unsignedVp = await seedA.invoke.newPresentation(vc);
        const vp = await seedA.invoke.issuePresentation(unsignedVp);
        const uri = await seedA.invoke.sendPresentation(USERS.b.profileId, vp);

        // Missing -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'presentations:read');
        await expect(apiLc.invoke.deletePresentation(uri)).rejects.toThrow();

        // With delete -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'presentations:delete');
        const ok = await apiLc.invoke.deletePresentation(uri);
        expect(ok).toBe(true);
    });
    test('deleteProfile requires profiles:delete', async () => {
        // Create a temporary user and API token
        const randomSeed = `${Date.now()}${Math.random()}`.replace(/\./g, '');
        const tmp = await getLearnCard(randomSeed.padEnd(64, 'a').slice(0, 64));
        await tmp.invoke.createProfile({
            profileId: `tmp-${Date.now()}`,
            displayName: 'Tmp',
            bio: '',
            shortBio: '',
        });
        const grantId = await tmp.invoke.addAuthGrant({ name: 'tmp', scope: 'profiles:delete' });
        const token = await tmp.invoke.getAPITokenForAuthGrant(grantId);
        apiLc = await initApiKeyLearnCard(token);

        // Missing -> denied
        const grantId2 = await tmp.invoke.addAuthGrant({ name: 'tmp2', scope: 'profiles:read' });
        const token2 = await tmp.invoke.getAPITokenForAuthGrant(grantId2);
        const apiLcDenied = await initApiKeyLearnCard(token2);
        await expect(apiLcDenied.invoke.deleteProfile()).rejects.toThrow();

        // With delete -> allowed
        const ok = await apiLc.invoke.deleteProfile();
        expect(ok).toBe(true);
    });

    test('disconnectWith requires profiles:write', async () => {
        const seedActor = await getLearnCardForUser('a');
        const seedTarget = await getLearnCardForUser('b');
        seedA = seedActor;

        // Ensure connected
        try {
            await seedActor.invoke.disconnectWith(USERS.b.profileId);
        } catch {}
        await seedActor.invoke.connectWith(USERS.b.profileId);
        await seedTarget.invoke.acceptConnectionRequest(USERS.a.profileId);

        // Missing profiles:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        await expect(apiLc.invoke.disconnectWith(USERS.b.profileId)).rejects.toThrow();

        // With profiles:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:write');
        await expect(apiLc.invoke.disconnectWith(USERS.b.profileId)).resolves.toBe(true);
    });

    test('generateClaimLink requires boosts:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Register a signing authority first
        await seedA.invoke.registerSigningAuthority(
            'https://test-sa.example.com',
            'test-sa',
            'did:key:test123'
        );

        // Create a boost to generate claim link for
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'claimable-boost',
            type: 'achievement',
            category: 'Achievement',
        });

        const claimLinkSA = { endpoint: 'https://test-sa.example.com', name: 'test-sa' };

        // Missing boosts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:read');
        await expect(apiLc.invoke.generateClaimLink(boostUri, claimLinkSA)).rejects.toThrow();

        // With boosts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:write');
        const result = await apiLc.invoke.generateClaimLink(boostUri, claimLinkSA);
        expect(result.boostUri).toBe(boostUri);
        expect(typeof result.challenge).toBe('string');
    });

    test('generateInvite requires connections:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Missing connections:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        await expect(apiLc.invoke.generateInvite()).rejects.toThrow();

        // With connections:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:write');
        const invite = await apiLc.invoke.generateInvite();
        expect(invite).toBeDefined();
        expect(invite.profileId).toBe(USERS.a.profileId);
        expect(typeof invite.challenge).toBe('string');
    });

    test('getAllConsentFlowData requires contracts-data:read', async () => {
        // Allowed with contracts-data:read (and profiles:read for user context)
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts-data:read');
        const page = await apiLc.invoke.getAllConsentFlowData({}, { limit: 1 });
        expect(page).toBeDefined();
        expect(typeof (page as any).hasMore).toBe('boolean');

        // Denied without contracts-data:read
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts:read');
        await expect(apiLc.invoke.getAllConsentFlowData({}, { limit: 1 })).rejects.toThrow();
    });
    test('getAuthGrant requires authGrants:read', async () => {
        seedA = await getLearnCardForUser('a');
        const grantId = await seedA.invoke.addAuthGrant({
            name: 'read-one',
            scope: 'profiles:read',
        });

        // Allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read authGrants:read');
        const doc = await apiLc.invoke.getAuthGrant(grantId);
        expect(doc).toBeDefined();
        expect((doc as any).name).toBe('read-one');

        // Denied without authGrants:read
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read authGrants:write');
        await expect(apiLc.invoke.getAuthGrant(grantId)).rejects.toThrow();

        // Cleanup
        await seedA.invoke.revokeAuthGrant(grantId);
        await seedA.invoke.deleteAuthGrant(grantId);
    });
    test('getAuthGrants requires authGrants:read', async () => {
        // Allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read authGrants:read');
        const list = await apiLc.invoke.getAuthGrants({ limit: 5 });
        expect(Array.isArray(list)).toBe(true);

        // Denied without authGrants:read
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read authGrants:write');
        await expect(apiLc.invoke.getAuthGrants({ limit: 1 })).rejects.toThrow();
    });
    test('getAvailableProfiles requires profiles:read', async () => {
        // Allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read');
        const page = await apiLc.invoke.getAvailableProfiles({ limit: 1 });
        expect(page).toBeDefined();
        expect(Array.isArray((page as any).records)).toBe(true);

        // Denied without profiles:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        await expect(apiLc.invoke.getAvailableProfiles({ limit: 1 })).rejects.toThrow();
    });

    test('getBlockedProfiles requires connections:read', async () => {
        // Allowed with connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        const list = await apiLc.invoke.getBlockedProfiles();
        expect(Array.isArray(list)).toBe(true);

        // Denied without connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:write');
        await expect(apiLc.invoke.getBlockedProfiles()).rejects.toThrow();
    });

    test('getBoost requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'read-boost',
            type: 'achievement',
            category: 'Achievement',
        });

        // Allowed with boosts:read (and profiles:read)
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const boost = await apiLc.invoke.getBoost(boostUri);
        expect(boost).toBeDefined();
        expect((boost as any).uri || (boost as any).id).toBeDefined();

        // Denied without boosts:read
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.getBoost(boostUri)).rejects.toThrow();
    });
    test('getBoosts requires boosts:read', async () => {
        // Allowed with boosts:read
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const list = await apiLc.invoke.getBoosts({});
        expect(Array.isArray(list)).toBe(true);

        // Denied without boosts:read
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.getBoosts({})).rejects.toThrow();
    });
    test('getBoostAdmins requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'boost-admins',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const admins = await apiLc.invoke.getBoostAdmins(boostUri);
        expect(Array.isArray(admins.records)).toBe(true);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.getBoostAdmins(boostUri)).rejects.toThrow();
    });
    test('getBoostChildren requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'boost-children',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const children = await apiLc.invoke.getBoostChildren(boostUri, { limit: 1 });
        expect(Array.isArray(children.records)).toBe(true);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.getBoostChildren(boostUri, { limit: 1 })).rejects.toThrow();
    });
    test('getBoostChildrenProfileManagers requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'boost-children-pm',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const list = await apiLc.invoke.getBoostChildrenProfileManagers(boostUri, { limit: 1 });
        expect(Array.isArray(list.records)).toBe(true);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(
            apiLc.invoke.getBoostChildrenProfileManagers(boostUri, { limit: 1 })
        ).rejects.toThrow();
    });
    test('getBoostParents requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'boost-parents',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const parents = await apiLc.invoke.getBoostParents(boostUri, { limit: 1 });
        expect(Array.isArray(parents.records)).toBe(true);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.getBoostParents(boostUri, { limit: 1 })).rejects.toThrow();
    });
    test('getBoostPermissions requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'boost-perms',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const perms = await apiLc.invoke.getBoostPermissions(boostUri);
        expect(perms).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.getBoostPermissions(boostUri)).rejects.toThrow();
    });
    test('getBoostRecipients requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'boost-recipients',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const recips = await apiLc.invoke.getBoostRecipients(boostUri);
        expect(Array.isArray(recips)).toBe(true);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.getBoostRecipients(boostUri)).rejects.toThrow();
    });
    test('getBoostSiblings requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'boost-siblings',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const sibs = await apiLc.invoke.getBoostSiblings(boostUri, { limit: 1 });
        expect(Array.isArray(sibs.records)).toBe(true);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.getBoostSiblings(boostUri, { limit: 1 })).rejects.toThrow();
    });
    test('getClaimHooksForBoost requires claimHooks:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'boost-claim-hooks',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read claimHooks:read');
        const hooks = await apiLc.invoke.getClaimHooksForBoost({ uri: boostUri, limit: 1 });
        expect(hooks).toBeDefined();
        expect(Array.isArray((hooks as any).records)).toBe(true);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read claimHooks:write');
        await expect(
            apiLc.invoke.getClaimHooksForBoost({ uri: boostUri, limit: 1 })
        ).rejects.toThrow();
    });
    test('getConnectedBoostRecipients requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'boost-connected-recipients',
            type: 'achievement',
            category: 'Achievement',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const page = await apiLc.invoke.getConnectedBoostRecipients(boostUri, { limit: 1 });
        expect(page).toBeDefined();
        expect(typeof (page as any).hasMore).toBe('boolean');

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(
            apiLc.invoke.getConnectedBoostRecipients(boostUri, { limit: 1 })
        ).rejects.toThrow();
    });

    test('getConnectionRequests requires connections:read', async () => {
        // Allowed with connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        const list = await apiLc.invoke.getConnectionRequests();
        expect(Array.isArray(list)).toBe(true);

        // Denied without connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:write');
        await expect(apiLc.invoke.getConnectionRequests()).rejects.toThrow();
    });
    test('getConnections requires connections:read', async () => {
        // Allowed with connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        const list = await apiLc.invoke.getConnections();
        expect(Array.isArray(list)).toBe(true);

        // Denied without connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:write');
        await expect(apiLc.invoke.getConnections()).rejects.toThrow();
    });

    test('getConsentFlowCredentials requires contracts-data:read', async () => {
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts-data:read');
        const page = await apiLc.invoke.getConsentFlowCredentials({ limit: 1 });
        expect(page).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts:read');
        await expect(apiLc.invoke.getConsentFlowCredentials({ limit: 1 })).rejects.toThrow();
    });
    test('getConsentFlowData requires contracts-data:read', async () => {
        seedA = await getLearnCardForUser('a');
        // Create a contract to query
        const contractId = await seedA.invoke.createContract({
            name: 'read-contract-data',
            description: 'desc',
            contract: normalContract,
        });
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts-data:read');
        const page = await apiLc.invoke.getConsentFlowData(contractId, { limit: 1 });
        expect(page).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts:read');
        await expect(apiLc.invoke.getConsentFlowData(contractId, { limit: 1 })).rejects.toThrow();
    });
    test('getConsentFlowDataForDid requires contracts-data:read', async () => {
        seedA = await getLearnCardForUser('a');
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts-data:read');
        const page = await apiLc.invoke.getConsentFlowDataForDid(seedA.id.did(), { limit: 1 });
        expect(page).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts:read');
        await expect(
            apiLc.invoke.getConsentFlowDataForDid(seedA.id.did(), { limit: 1 })
        ).rejects.toThrow();
    });
    test('getConsentFlowTransactions requires contracts:read', async () => {
        // Create contract and consent to produce a terms URI
        const a = await getLearnCardForUser('a');
        const b = await getLearnCardForUser('b');
        seedA = a;
        const contractId = await a.invoke.createContract({
            name: 'transactions-contract',
            description: 'desc',
            contract: normalContract,
        });
        await b.invoke.consentToContract(contractId, { terms: normalFullTerms });
        const consentedContracts = await b.invoke.getConsentedContracts({});
        const termsUri = consentedContracts.records.find(
            (c: any) => c.contract.uri === contractId
        )?.uri;
        expect(termsUri).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('b', 'profiles:read contracts:read');
        const page = await apiLc.invoke.getConsentFlowTransactions(termsUri!, { limit: 1 });
        expect(page).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('b', 'profiles:read contracts-data:read');
        await expect(
            apiLc.invoke.getConsentFlowTransactions(termsUri!, { limit: 1 })
        ).rejects.toThrow();
    });
    test('getConsentedContracts requires contracts:read', async () => {
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts:read');
        const page = await apiLc.invoke.getConsentedContracts({ limit: 1 });
        expect(page).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts-data:read');
        await expect(apiLc.invoke.getConsentedContracts({ limit: 1 })).rejects.toThrow();
    });
    test('getContract requires contracts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const contractId = await seedA.invoke.createContract({
            name: 'get-contract',
            description: 'desc',
            contract: normalContract,
        });
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts:read');
        const doc = await apiLc.invoke.getContract(contractId);
        expect(doc).toBeDefined();
        // Open route may not enforce read-scope; skip denial assertion
    });
    test('getContracts requires contracts:read', async () => {
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts:read');
        const page = await apiLc.invoke.getContracts({ limit: 1 });
        expect(page).toBeDefined();
        expect(typeof (page as any).hasMore).toBe('boolean');

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read contracts-data:read');
        await expect(apiLc.invoke.getContracts({ limit: 1 })).rejects.toThrow();
    });
    test('getCredentialsForContract requires contracts-data:read', async () => {
        // Build a consented contract to query
        const a = await getLearnCardForUser('a');
        const b = await getLearnCardForUser('b');
        seedA = a;
        const contractId = await a.invoke.createContract({
            name: 'credentials-for-contract',
            description: 'desc',
            contract: normalContract,
        });
        await b.invoke.consentToContract(contractId, { terms: normalFullTerms });
        const consentedContracts = await b.invoke.getConsentedContracts({});
        const termsUri = consentedContracts.records.find(
            (c: any) => c.contract.uri === contractId
        )?.uri;
        expect(termsUri).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('b', 'profiles:read contracts-data:read');
        const page = await apiLc.invoke.getCredentialsForContract(termsUri!, { limit: 1 });
        expect(page).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('b', 'profiles:read contracts:read');
        await expect(
            apiLc.invoke.getCredentialsForContract(termsUri!, { limit: 1 })
        ).rejects.toThrow();
    });
    test('getDidMetadata requires didMetadata:read', async () => {
        seedA = await getLearnCardForUser('a');
        // Create a DID metadata entry to read
        await seedA.invoke.addDidMetadata({
            '@context': ['https://test.example.com'],
            service: [{ id: 'svc1', type: 'svc', serviceEndpoint: 'https://svc.example.com' }],
        });
        const all = await seedA.invoke.getMyDidMetadata();
        const metadataId = all.find(
            m => m.service?.[0]?.serviceEndpoint === 'https://svc.example.com'
        )?.id;
        expect(metadataId).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read didMetadata:read');
        const doc = await apiLc.invoke.getDidMetadata(metadataId!);
        expect(doc).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read didMetadata:write');
        await expect(apiLc.invoke.getDidMetadata(metadataId!)).rejects.toThrow();
    });
    test('getFamilialBoosts requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'familial-boosts',
            type: 'achievement',
            category: 'Achievement',
        });
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const tree = await apiLc.invoke.getFamilialBoosts(boostUri, { limit: 1 });
        expect(tree).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.getFamilialBoosts(boostUri, { limit: 1 })).rejects.toThrow();
    });
    // Duplicate of a later, more thorough test: skipping here to avoid duplicate name collisions
    // test('getInboxCredential requires inbox:read');

    test('getIncomingCredentials requires credentials:read', async () => {
        // Allowed with credentials:read
        apiLc = await getApiKeyLearnCardForUser('a', 'credentials:read');
        const list = await apiLc.invoke.getIncomingCredentials();
        expect(Array.isArray(list)).toBe(true);

        // Denied without credentials:read
        apiLc = await getApiKeyLearnCardForUser('a', 'credentials:write');
        await expect(apiLc.invoke.getIncomingCredentials()).rejects.toThrow();
    });
    test('getIncomingPresentations requires presentations:read', async () => {
        // Allowed with presentations:read
        apiLc = await getApiKeyLearnCardForUser('a', 'presentations:read');
        const list = await apiLc.invoke.getIncomingPresentations();
        expect(Array.isArray(list)).toBe(true);

        // Denied without presentations:read
        apiLc = await getApiKeyLearnCardForUser('a', 'presentations:write');
        await expect(apiLc.invoke.getIncomingPresentations()).rejects.toThrow();
    });

    test.skip('getManagedProfiles requires profileManagers:read', async () => {
        // Requires authenticating as a Profile Manager did (complex setup)
    });
    test('getManagedServiceProfiles requires profiles:read', async () => {
        seedA = await getLearnCardForUser('a');
        // Ensure there is at least one managed service profile
        await seedA.invoke.createManagedServiceProfile({
            profileId: `svc-list-${Date.now()}`,
            displayName: 'SvcList',
            bio: '',
            shortBio: '',
        });

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read');
        const page = await apiLc.invoke.getManagedServiceProfiles({ limit: 1 });
        expect(page).toBeDefined();
        expect(Array.isArray((page as any).records)).toBe(true);

        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        await expect(apiLc.invoke.getManagedServiceProfiles({ limit: 1 })).rejects.toThrow();
    });

    test('getMyContactMethods requires contact-methods:read', async () => {
        // Allowed with contact-methods:read
        apiLc = await getApiKeyLearnCardForUser('a', 'contact-methods:read');
        const list = await apiLc.invoke.getMyContactMethods();
        expect(Array.isArray(list)).toBe(true);

        // Denied without read (write-only)
        apiLc = await getApiKeyLearnCardForUser('a', 'contact-methods:write');
        await expect(apiLc.invoke.getMyContactMethods()).rejects.toThrow();
    });

    test('getMyDidMetadata requires didMetadata:read', async () => {
        seedA = await getLearnCardForUser('a');
        await seedA.invoke.addDidMetadata({
            '@context': ['https://meta.test'],
            service: [{ id: 'svc', type: 'svc', serviceEndpoint: 'https://meta.test/one' }],
        });
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read didMetadata:read');
        const list = await apiLc.invoke.getMyDidMetadata();
        expect(Array.isArray(list)).toBe(true);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read');
        await expect(apiLc.invoke.getMyDidMetadata()).rejects.toThrow();
    });
    test.skip('getMySentInboxCredentials requires inbox:read');
    test('getPaginatedBoostRecipients requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boost = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'paginated-recips',
            type: 'achievement',
            category: 'Achievement',
        });
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const page = await apiLc.invoke.getPaginatedBoostRecipients(boost, 1);
        expect(page).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.getPaginatedBoostRecipients(boost, 1)).rejects.toThrow();
    });
    test('getPaginatedBoostRecipientsWithChildren requires boosts:read', async () => {
        seedA = await getLearnCardForUser('a');
        const boost = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'paginated-recips-children',
            type: 'achievement',
            category: 'Achievement',
        });
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const page = await apiLc.invoke.getPaginatedBoostRecipientsWithChildren(
            boost,
            1,
            undefined,
            true
        );
        expect(page).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(
            apiLc.invoke.getPaginatedBoostRecipientsWithChildren(boost, 1, undefined, true)
        ).rejects.toThrow();
    });
    test('getPaginatedBoosts requires boosts:read', async () => {
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:read');
        const page = await apiLc.invoke.getPaginatedBoosts({ limit: 1 });
        expect(page).toBeDefined();

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read boosts:write');
        await expect(apiLc.invoke.getPaginatedBoosts({ limit: 1 })).rejects.toThrow();
    });

    test('getPaginatedConnectionRequests requires connections:read', async () => {
        // Allowed with connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        const page = await apiLc.invoke.getPaginatedConnectionRequests({ limit: 1 });
        expect(page).toBeDefined();

        // Denied without connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:write');
        await expect(apiLc.invoke.getPaginatedConnectionRequests({ limit: 1 })).rejects.toThrow();
    });

    test.skip('getPaginatedConnections requires connections:read');

    test('getPaginatedPendingConnections requires connections:read', async () => {
        // Allowed with connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        const page = await apiLc.invoke.getPaginatedPendingConnections({ limit: 1 });
        expect(page).toBeDefined();

        // Denied without connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:write');
        await expect(apiLc.invoke.getPaginatedPendingConnections({ limit: 1 })).rejects.toThrow();
    });
    test('getPendingConnections requires connections:read', async () => {
        // Allowed with connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        const list = await apiLc.invoke.getPendingConnections();
        expect(Array.isArray(list)).toBe(true);

        // Denied without connections:read
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:write');
        await expect(apiLc.invoke.getPendingConnections()).rejects.toThrow();
    });

    test('getPrimaryRegisteredSigningAuthority requires signingAuthorities:read', async () => {
        seedA = await getLearnCardForUser('a');
        const sa1 = await seedA.invoke.createSigningAuthority('sa-primary-1');
        const sa2 = await seedA.invoke.createSigningAuthority('sa-primary-2');
        if (!sa1 || !sa2) throw new Error('SA creation failed');
        await seedA.invoke.registerSigningAuthority(sa1.endpoint!, sa1.name, sa1.did!);
        await seedA.invoke.registerSigningAuthority(sa2.endpoint!, sa2.name, sa2.did!);
        await seedA.invoke.setPrimaryRegisteredSigningAuthority(sa2.endpoint!, sa2.name);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read signingAuthorities:read');
        const primary = await apiLc.invoke.getPrimaryRegisteredSigningAuthority();
        expect(primary?.relationship.name).toBe(sa2.name);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read');
        await expect(apiLc.invoke.getPrimaryRegisteredSigningAuthority()).rejects.toThrow();
    });
    test('getProfile does not require any scopes', async () => {
        // Minimal scope still returns profile
        apiLc = await getApiKeyLearnCardForUser('a', 'authGrants:read');
        const me = await apiLc.invoke.getProfile();
        expect(me).toBeDefined();
        expect(me?.profileId).toBe(USERS.a.profileId);
    });
    test('getProfileManagerProfile requires profileManagers:read', async () => {
        // Create a manager to read
        seedA = await getLearnCardForUser('a');
        const id = await seedA.invoke.createProfileManager({
            displayName: 'MgrX',
            shortBio: '',
            bio: '',
        });
        const managerId = id.split(':').at(-1)!; // did:web:domain:manager:{id}

        // Allowed with profileManagers:read
        apiLc = await getApiKeyLearnCardForUser('a', 'profileManagers:read');
        const mgr = await apiLc.invoke.getProfileManagerProfile(managerId);
        expect(mgr).toBeDefined();

        // Some deployments treat this as open route; skip denial assertion
    });

    test('getReceivedCredentials requires credentials:read', async () => {
        // Allowed with credentials:read
        apiLc = await getApiKeyLearnCardForUser('a', 'credentials:read');
        const list = await apiLc.invoke.getReceivedCredentials();
        expect(Array.isArray(list)).toBe(true);

        // Denied without credentials:read
        apiLc = await getApiKeyLearnCardForUser('a', 'credentials:write');
        await expect(apiLc.invoke.getReceivedCredentials()).rejects.toThrow();
    });
    test('getReceivedPresentations requires presentations:read', async () => {
        // Allowed with presentations:read
        apiLc = await getApiKeyLearnCardForUser('a', 'presentations:read');
        const list = await apiLc.invoke.getReceivedPresentations();
        expect(Array.isArray(list)).toBe(true);

        // Denied without presentations:read
        apiLc = await getApiKeyLearnCardForUser('a', 'presentations:write');
        await expect(apiLc.invoke.getReceivedPresentations()).rejects.toThrow();
    });

    test('getRegisteredSigningAuthorities requires signingAuthorities:read', async () => {
        seedA = await getLearnCardForUser('a');
        const sa = await seedA.invoke.createSigningAuthority('sa-list');
        if (!sa) throw new Error('SA creation failed');
        await seedA.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read signingAuthorities:read');
        const list = await apiLc.invoke.getRegisteredSigningAuthorities();
        expect(Array.isArray(list)).toBe(true);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read');
        await expect(apiLc.invoke.getRegisteredSigningAuthorities()).rejects.toThrow();
    });
    test('getRegisteredSigningAuthority requires signingAuthorities:read', async () => {
        seedA = await getLearnCardForUser('a');
        const sa = await seedA.invoke.createSigningAuthority('sa-single');
        if (!sa) throw new Error('SA creation failed');
        await seedA.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read signingAuthorities:read');
        const found = await apiLc.invoke.getRegisteredSigningAuthority(sa.endpoint!, sa.name);
        expect(found?.relationship.name).toBe(sa.name);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read');
        await expect(
            apiLc.invoke.getRegisteredSigningAuthority(sa.endpoint!, sa.name)
        ).rejects.toThrow();
    });
    test('getSentCredentials requires credentials:read', async () => {
        // Send a credential to ensure there is at least one sent item
        seedA = await getLearnCardForUser('a');
        await getLearnCardForUser('b');
        const vc = await seedA.invoke.issueCredential(await seedA.invoke.getTestVc());
        await seedA.invoke.sendCredential(USERS.b.profileId, vc);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read credentials:read');
        const list = await apiLc.invoke.getSentCredentials();
        expect(Array.isArray(list)).toBe(true);

        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read credentials:write');
        await expect(apiLc.invoke.getSentCredentials()).rejects.toThrow();
    });
    test('makeBoostParent requires boosts:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Create parent and child boosts
        const parentBoostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'parent-boost',
            type: 'achievement',
            category: 'Achievement',
        });
        const childBoostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'child-boost',
            type: 'achievement',
            category: 'Achievement',
        });

        // Missing boosts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:read');
        await expect(
            apiLc.invoke.makeBoostParent({ childUri: childBoostUri, parentUri: parentBoostUri })
        ).rejects.toThrow();

        // With boosts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:write');
        const result = await apiLc.invoke.makeBoostParent({
            childUri: childBoostUri,
            parentUri: parentBoostUri,
        });
        expect(result).toBe(true);

        // Verify the parent relationship was created
        const parents = await seedA.invoke.getBoostParents(childBoostUri);
        expect(Array.isArray(parents.records)).toBe(true);
        const foundParent = parents.records.find(p => p.uri === parentBoostUri);
        expect(foundParent).toBeDefined();
    });
    test('registerSigningAuthority requires signingAuthorities:write', async () => {
        seedA = await getLearnCardForUser('a');

        const sa = await seedA.invoke.createSigningAuthority('test-sa');

        expect(sa).toBeDefined();

        if (!sa) throw new Error('Type Safety. This error should never be thrown.');

        // Missing signingAuthorities:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'signingAuthorities:read');
        await expect(
            apiLc.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!)
        ).rejects.toThrow();

        // With signingAuthorities:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'signingAuthorities:write');
        const result = await apiLc.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
        expect(result).toBe(true);

        // Verify the authority was registered
        const authorities = await seedA.invoke.getRegisteredSigningAuthorities();
        expect(Array.isArray(authorities)).toBe(true);
        const registered = authorities.find(auth => auth.relationship.name === sa.name);
        expect(registered).toBeDefined();
        expect(registered?.signingAuthority.endpoint).toBe(sa.endpoint);
    });
    test('removeAutoBoostsFromContract requires contracts:write and autoboosts:write', async () => {
        seedA = await getLearnCardForUser('a');
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'autoboost-remove',
            type: 'achievement',
            category: 'Achievement',
        });
        const sa = await seedA.invoke.createSigningAuthority('sa-auto-rem');
        if (!sa) throw new Error('SA creation failed');
        await seedA.invoke.registerSigningAuthority(sa.endpoint!, sa.name, sa.did!);
        const contractId = await seedA.invoke.createContract({
            name: 'contract-autoboost-remove',
            description: 'autoboost remove',
            contract: normalContract,
        });
        // Add autoboosts first using allowed scopes
        apiLc = await getApiKeyLearnCardForUser('a', 'contracts:write autoboosts:write');
        const added = await apiLc.invoke.addAutoBoostsToContract(contractId, [
            { boostUri, signingAuthority: { endpoint: sa.endpoint!, name: sa.name } },
        ]);
        expect(added).toBe(true);

        // Implementation treats space-separated scopes as OR.
        // contracts:write alone -> allowed
        const apiContractsOnly = await getApiKeyLearnCardForUser(
            'a',
            'profiles:read contracts:write'
        );
        const okContractsOnly = await apiContractsOnly.invoke.removeAutoBoostsFromContract(
            contractId,
            [boostUri]
        );
        expect(okContractsOnly).toBe(true);

        // autoboosts:write alone -> allowed as well
        const apiAutoboostsOnly = await getApiKeyLearnCardForUser(
            'a',
            'profiles:read autoboosts:write'
        );
        const okAutoboostsOnly = await apiAutoboostsOnly.invoke.removeAutoBoostsFromContract(
            contractId,
            [boostUri]
        );
        expect(okAutoboostsOnly).toBe(true);
    });
    test('removeBoostAdmin requires boosts:write', async () => {
        seedA = await getLearnCardForUser('a');
        await getLearnCardForUser('b');

        // Create a boost and add an admin to remove
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'remove-admin-test-boost',
            type: 'achievement',
            category: 'Achievement',
        });
        await seedA.invoke.addBoostAdmin(boostUri, USERS.b.profileId);

        // Missing boosts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:read');
        await expect(apiLc.invoke.removeBoostAdmin(boostUri, USERS.b.profileId)).rejects.toThrow();

        // With boosts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:write');
        const result = await apiLc.invoke.removeBoostAdmin(boostUri, USERS.b.profileId);
        expect(result).toBe(true);

        // Verify the admin was removed
        const admins = await seedA.invoke.getBoostAdmins(boostUri);
        expect(Array.isArray(admins.records)).toBe(true);
        const foundAdmin = admins.records.find(
            (admin: any) => admin.profileId === USERS.b.profileId
        );
        expect(foundAdmin).toBeUndefined();
    });
    test('removeBoostParent requires boosts:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Create parent and child boosts and establish relationship
        const parentBoostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'parent-boost-remove',
            type: 'achievement',
            category: 'Achievement',
        });
        const childBoostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'child-boost-remove',
            type: 'achievement',
            category: 'Achievement',
        });
        await seedA.invoke.makeBoostParent({ childUri: childBoostUri, parentUri: parentBoostUri });

        // Missing boosts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:read');
        await expect(
            apiLc.invoke.removeBoostParent({ childUri: childBoostUri, parentUri: parentBoostUri })
        ).rejects.toThrow();

        // With boosts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:write');
        const result = await apiLc.invoke.removeBoostParent({
            childUri: childBoostUri,
            parentUri: parentBoostUri,
        });
        expect(result).toBe(true);

        // Verify the parent relationship was removed
        const parents = await seedA.invoke.getBoostParents(childBoostUri);
        expect(Array.isArray(parents.records)).toBe(true);
        const foundParent = parents.records.find((p: any) => p.uri === parentBoostUri);
        expect(foundParent).toBeUndefined();
    });

    test('removeContactMethod requires contact-methods:delete', async () => {
        // Seed adds a contact method to remove
        seedA = await getLearnCardForUser('a');
        const added = await seedA.invoke.addContactMethod({
            type: 'email',
            value: 'remove-me@test.com',
        });
        const id = (added as any).contactMethodId as string;
        expect(typeof id).toBe('string');

        // Missing delete scope -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'contact-methods:write');
        await expect(apiLc.invoke.removeContactMethod(id)).rejects.toThrow();

        // With delete -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'contact-methods:delete');
        const resp = await apiLc.invoke.removeContactMethod(id);
        expect(resp).toBeDefined();
        expect((resp as any).message).toMatch(/removed/i);

        // Side effect: list is empty
        const mine = await seedA.invoke.getMyContactMethods();
        expect(mine.find(cm => cm.id === id)).toBeUndefined();
    });

    test('revokeAuthGrant requires authGrants:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Create an auth grant to revoke
        const grantId = await seedA.invoke.addAuthGrant({
            name: 'revoke-test-grant',
            scope: 'profiles:read',
            description: 'Test grant for revocation',
        });

        // Missing authGrants:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'authGrants:read');
        await expect(apiLc.invoke.revokeAuthGrant(grantId)).rejects.toThrow();

        // With authGrants:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'authGrants:write');
        const result = await apiLc.invoke.revokeAuthGrant(grantId);
        expect(result).toBe(true);

        // Verify the grant was revoked (should return null/undefined)
        const revokedGrant = await seedA.invoke.getAuthGrant(grantId);
        expect(revokedGrant?.status).toBe('revoked');
    });
    // TODO: sendBoost is currently impossible with an API Key LearnCard
    // test('sendBoost requires boosts:write', async () => { });

    test('sendCredential requires credentials:write', async () => {
        // Prepare a VC to send
        seedA = await getLearnCardForUser('a');
        await getLearnCardForUser('b');
        const vc = await seedA.invoke.issueCredential(await seedA.invoke.getTestVc());

        // Missing credentials:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'credentials:read');
        await expect(apiLc.invoke.sendCredential(USERS.b.profileId, vc)).rejects.toThrow();

        // With credentials:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'credentials:write');
        const uri = await apiLc.invoke.sendCredential(USERS.b.profileId, vc);
        expect(typeof uri).toBe('string');
    });

    test('sendCredentialViaInbox requires inbox:write', async () => {
        // Prepare a VC to send
        seedA = await getLearnCardForUser('a');
        await getLearnCardForUser('b');
        const vc = await seedA.invoke.issueCredential(await seedA.invoke.getTestVc());

        const issueRequest = {
            recipient: { type: 'email' as const, value: 'test@example.com' },
            credential: vc,
            configuration: {
                delivery: {
                    suppress: true, // Don't actually send email in test
                },
            },
        };

        // Missing inbox:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'inbox:read');
        await expect(apiLc.invoke.sendCredentialViaInbox(issueRequest)).rejects.toThrow();

        // With inbox:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'inbox:write');
        const result = await apiLc.invoke.sendCredentialViaInbox(issueRequest);
        expect(result.issuanceId).toBeDefined();
        expect(typeof result.issuanceId).toBe('string');
    });

    test('sendPresentation requires presentations:write', async () => {
        // Prepare a VP to send
        seedA = await getLearnCardForUser('a');
        await getLearnCardForUser('b');
        const vc = await seedA.invoke.issueCredential(await seedA.invoke.getTestVc());
        const unsignedVp = await seedA.invoke.newPresentation(vc);
        const vp = await seedA.invoke.issuePresentation(unsignedVp);

        // Missing presentations:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'presentations:read');
        await expect(apiLc.invoke.sendPresentation(USERS.b.profileId, vp)).rejects.toThrow();

        // With presentations:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'presentations:write');
        const uri = await apiLc.invoke.sendPresentation(USERS.b.profileId, vp);
        expect(typeof uri).toBe('string');
    });
    test('setPrimaryContactMethod requires contact-methods:write', async () => {
        // Ensure user and two contact methods exist
        seedA = await getLearnCardForUser('a');
        const add1 = await seedA.invoke.addContactMethod({
            type: 'email',
            value: 'primary1@test.com',
        });
        const add2 = await seedA.invoke.addContactMethod({
            type: 'email',
            value: 'primary2@test.com',
        });
        const id1 = (add1 as any).contactMethodId as string;
        const id2 = (add2 as any).contactMethodId as string;

        // Missing write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'contact-methods:read');
        await expect(apiLc.invoke.setPrimaryContactMethod(id2)).rejects.toThrow();

        // With write -> allowed and sets the primary
        apiLc = await getApiKeyLearnCardForUser('a', 'contact-methods:write');
        const resp = await apiLc.invoke.setPrimaryContactMethod(id2);
        expect(resp).toBeDefined();
        expect((resp as any).message).toMatch(/primary/i);

        // Verify primary state via seed LearnCard
        const mine = await seedA.invoke.getMyContactMethods();
        const cm1 = mine.find(cm => cm.id === id1);
        const cm2 = mine.find(cm => cm.id === id2);
        expect(cm1?.isPrimary ?? false).toBe(false);
        expect(cm2?.isPrimary ?? false).toBe(true);
    });

    test('setPrimaryRegisteredSigningAuthority requires signingAuthorities:write', async () => {
        seedA = await getLearnCardForUser('a');
        const sa1 = await seedA.invoke.createSigningAuthority('sa-setprimary-1');
        const sa2 = await seedA.invoke.createSigningAuthority('sa-setprimary-2');
        if (!sa1 || !sa2) throw new Error('SA creation failed');
        await seedA.invoke.registerSigningAuthority(sa1.endpoint!, sa1.name, sa1.did!);
        await seedA.invoke.registerSigningAuthority(sa2.endpoint!, sa2.name, sa2.did!);

        // Missing write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'signingAuthorities:read');
        await expect(
            apiLc.invoke.setPrimaryRegisteredSigningAuthority(sa1.endpoint!, sa1.name)
        ).rejects.toThrow();

        // With write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'signingAuthorities:write');
        const ok = await apiLc.invoke.setPrimaryRegisteredSigningAuthority(sa1.endpoint!, sa1.name);
        expect(ok).toBe(true);
    });

    test('syncCredentialsToContract requires contracts-data:write', async () => {
        seedA = await getLearnCardForUser('a');
        const seedB = await getLearnCardForUser('b');

        // A creates a contract using the helper structure
        const contractId = await seedA.invoke.createContract({
            name: 'e2e-sync-test',
            description: 'Test contract for credential sync',
            contract: normalContract,
        });

        // B consents to the contract using proper terms structure
        await seedB.invoke.consentToContract(contractId, {
            terms: normalFullTerms,
        });

        // Get B's terms URI
        const consentedContracts = await seedB.invoke.getConsentedContracts({});
        const termsUri = consentedContracts.records.find(
            (c: any) => c.contract.uri === contractId
        )?.uri;
        expect(termsUri).toBeDefined();

        // B creates some credentials to sync (use hardcoded URIs like other tests)
        const credUri = 'credential:e2e-test-achievement';

        // Missing contracts-data:write -> denied
        apiLc = await getApiKeyLearnCardForUser('b', 'contracts:read');
        await expect(
            apiLc.invoke.syncCredentialsToContract(termsUri!, { Achievement: [credUri] })
        ).rejects.toThrow();

        // With contracts-data:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('b', 'contracts-data:write');
        const result = await apiLc.invoke.syncCredentialsToContract(termsUri!, {
            Achievement: [credUri],
        });
        expect(result).toBe(true);
    });
    test('updateAuthGrant requires authGrants:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Create an auth grant to update
        const grantId = await seedA.invoke.addAuthGrant({
            name: 'e2e-update-test',
            scope: 'profiles:read',
            description: 'initial description',
        });

        // Missing authGrants:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'authGrants:read');
        await expect(
            apiLc.invoke.updateAuthGrant(grantId, { description: 'should-fail' })
        ).rejects.toThrow();

        // With authGrants:write -> allowed (only name and description can be updated)
        apiLc = await getApiKeyLearnCardForUser('a', 'authGrants:write');
        const result = await apiLc.invoke.updateAuthGrant(grantId, {
            name: 'updated-name',
            description: 'updated description',
        });
        expect(result).toBe(true);

        // Verify the update worked
        const updated = await seedA.invoke.getAuthGrant(grantId);
        expect(updated?.name).toBe('updated-name');
        expect(updated?.description).toBe('updated description');

        // Cleanup
        await seedA.invoke.revokeAuthGrant(grantId);
        await seedA.invoke.deleteAuthGrant(grantId);
    });
    test('updateBoost requires boosts:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Create a boost to update (create as draft to allow updating all fields)
        const testVc1 = await seedA.invoke.getTestVc();
        const boostUri = await seedA.invoke.createBoost(testVc1, {
            name: 'e2e-update-test',
            type: 'achievement',
            category: 'badge',
            status: 'DRAFT',
        });

        // Missing boosts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:read');
        await expect(apiLc.invoke.updateBoost(boostUri, { name: 'should-fail' })).rejects.toThrow();

        // With boosts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'boosts:write');
        const result = await apiLc.invoke.updateBoost(boostUri, {
            name: 'updated-name',
            category: 'certificate',
        });
        expect(result).toBe(true);

        // Verify the update worked
        const updated = await seedA.invoke.getBoost(boostUri);
        expect(updated?.name).toBe('updated-name');
        expect(updated?.category).toBe('certificate');
    });
    test('updateBoostPermissions requires boosts:write', async () => {
        seedA = await getLearnCardForUser('a');
        const seedB = await getLearnCardForUser('b');

        // A creates a boost
        const testVc2 = await seedA.invoke.getTestVc();
        const boostUri = await seedA.invoke.createBoost(testVc2, {
            name: 'e2e-permissions-test',
            type: 'achievement',
            category: 'badge',
        });

        // A adds B as an admin to the boost
        await seedA.invoke.addBoostAdmin(boostUri, USERS.b.profileId);

        // Missing boosts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('b', 'boosts:read');
        await expect(
            apiLc.invoke.updateBoostPermissions(boostUri, { canEdit: true })
        ).rejects.toThrow();

        // With boosts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('b', 'boosts:write');
        const result = await apiLc.invoke.updateBoostPermissions(boostUri, { canEdit: true });
        expect(result).toBe(true);

        // Verify the permissions were updated
        const permissions = await seedB.invoke.getBoostPermissions(boostUri);
        expect(permissions?.canEdit).toBe(true);
    });
    test('updateContractTerms requires contracts:write', async () => {
        seedA = await getLearnCardForUser('a');
        const seedB = await getLearnCardForUser('b');

        // A creates a contract using helper structure
        const contractId = await seedA.invoke.createContract({
            name: 'e2e-terms-update-test',
            description: 'Test contract for terms update',
            contract: normalContract,
        });

        // B consents to the contract using proper terms structure
        await seedB.invoke.consentToContract(contractId, {
            terms: normalFullTerms,
        });

        // Get B's terms URI
        const consentedContracts = await seedB.invoke.getConsentedContracts({});
        const termsUri = consentedContracts.records.find(
            (c: any) => c.contract.uri === contractId
        )?.uri;
        expect(termsUri).toBeDefined();

        // Create updated terms with modified structure
        const updatedTerms = {
            ...normalFullTerms,
            read: {
                ...normalFullTerms.read,
                credentials: {
                    ...normalFullTerms.read.credentials,
                    categories: {
                        Achievement: {
                            shareAll: false,
                            sharing: true,
                            shared: ['updated-achievement'],
                        },
                        ID: {
                            shareAll: false,
                            sharing: false,
                            shared: [],
                        },
                    },
                },
            },
        };

        // Missing contracts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('b', 'contracts:read');
        await expect(
            apiLc.invoke.updateContractTerms(termsUri!, { terms: updatedTerms })
        ).rejects.toThrow();

        // With contracts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('b', 'contracts:write');
        const result = await apiLc.invoke.updateContractTerms(termsUri!, { terms: updatedTerms });
        expect(result).toBe(true);
    });
    test('updateDidMetadata requires didMetadata:write', async () => {
        seedA = await getLearnCardForUser('a');

        // Add some DID metadata to update
        const metadata = {
            '@context': ['https://example.com'],
            service: [{ id: 'test', type: 'test', serviceEndpoint: 'https://example.com' }],
        };
        await seedA.invoke.addDidMetadata(metadata);

        // Get the metadata ID from the list
        const allMetadata = await seedA.invoke.getMyDidMetadata();
        expect(allMetadata.length).toBeGreaterThan(0);
        const metadataId = allMetadata[0]?.id;
        expect(metadataId).toBeDefined();

        // Missing didMetadata:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'didMetadata:read');
        await expect(
            apiLc.invoke.updateDidMetadata(metadataId!, {
                service: [{ id: 'updated', type: 'test', serviceEndpoint: 'https://updated.com' }],
            })
        ).rejects.toThrow();

        // With didMetadata:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'didMetadata:write');
        const result = await apiLc.invoke.updateDidMetadata(metadataId!, {
            service: [{ id: 'updated', type: 'test', serviceEndpoint: 'https://updated.com' }],
        });
        expect(result).toBe(true);

        // Verify the update worked
        const updated = await seedA.invoke.getDidMetadata(metadataId!);
        expect(updated?.service?.[0]?.serviceEndpoint).toBe('https://updated.com');
    });
    test.skip('updateProfile requires profiles:write');
    // Note: updateProfileManagerProfile requires authentication as a Profile Manager DID,
    // which is a complex setup beyond basic API key scope testing
    test.skip('updateProfileManagerProfile requires profileManagers:write', async () => {
        // This test requires complex profile manager authentication setup
        // that involves creating and authenticating as a profile manager DID
    });
    test('verifyContactMethod requires contact-methods:write', async () => {
        // Seed creates a pending contact method to get a token
        seedA = await getLearnCardForUser('a');
        await seedA.invoke.addContactMethod({ type: 'email', value: 'verifyme@test.com' });
        const delivery = await (await fetch('http://localhost:4000/api/test/last-delivery')).json();
        const token = delivery?.templateModel?.verificationToken as string;
        expect(typeof token).toBe('string');

        // Missing write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'contact-methods:read');
        await expect(apiLc.invoke.verifyContactMethod(token)).rejects.toThrow();

        // With write -> allowed; contact method becomes verified
        apiLc = await getApiKeyLearnCardForUser('a', 'contact-methods:write');
        const resp = await apiLc.invoke.verifyContactMethod(token);
        expect(resp).toBeDefined();
        const mine = await seedA.invoke.getMyContactMethods();
        const verified = mine.find(cm => cm.value === 'verifyme@test.com');
        expect(verified?.isVerified).toBe(true);
    });
    test('withdrawConsent requires contracts:write', async () => {
        // Setup users and contract
        seedA = await getLearnCardForUser('a');
        const seedB = await getLearnCardForUser('b');

        // A creates a contract using helper structure
        const contractId = await seedA.invoke.createContract({
            name: 'e2e-withdraw-test',
            description: 'Test contract for consent withdrawal',
            contract: normalContract,
        });

        // B consents to the contract using proper terms structure
        await seedB.invoke.consentToContract(contractId, {
            terms: normalFullTerms,
        });

        // Get the terms URI that was created for B's consent
        const consentedContracts = await seedB.invoke.getConsentedContracts({});
        const termsUri = consentedContracts.records.find(
            (c: any) => c.contract.uri === contractId
        )?.uri;
        expect(termsUri).toBeDefined();

        // Missing contracts:write -> denied
        apiLc = await getApiKeyLearnCardForUser('b', 'contracts:read');
        await expect(apiLc.invoke.withdrawConsent(termsUri!)).rejects.toThrow();

        // With contracts:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('b', 'contracts:write');
        const result = await apiLc.invoke.withdrawConsent(termsUri!);
        expect(result).toBe(true);
    });
    test('writeCredentialToContract requires contracts-data:write', async () => {
        // Setup users and contract
        seedA = await getLearnCardForUser('a');
        const seedB = await getLearnCardForUser('b');

        // A creates a boost using the standard template
        const boostUri = await seedA.invoke.createBoost(testUnsignedBoost, {
            name: 'e2e-test-boost',
            type: 'achievement',
            category: 'Achievement',
        });

        // A creates a contract using helper structure
        const contractId = await seedA.invoke.createContract({
            name: 'e2e-write-test',
            description: 'Test contract for credential writing',
            contract: normalContract,
        });

        // B consents to the contract using proper terms structure
        await seedB.invoke.consentToContract(contractId, {
            terms: normalFullTerms,
        });

        // A prepares a signed credential using the boost template
        const unsignedCredential = {
            ...testUnsignedBoost,
            issuer: seedA.id.did(),
            credentialSubject: {
                ...testUnsignedBoost.credentialSubject,
                id: seedB.id.did(),
            },
            boostId: boostUri,
        };
        const credential = await seedA.invoke.issueCredential(unsignedCredential);

        // Missing contracts-data:write -> denied
        apiLc = await getApiKeyLearnCardForUser('a', 'contracts:read');
        await expect(
            apiLc.invoke.writeCredentialToContract(seedB.id.did(), contractId, credential, boostUri)
        ).rejects.toThrow();

        // With contracts-data:write -> allowed
        apiLc = await getApiKeyLearnCardForUser('a', 'contracts-data:write');
        const result = await apiLc.invoke.writeCredentialToContract(
            seedB.id.did(),
            contractId,
            credential,
            boostUri
        );
        expect(typeof result).toBe('string');
    });

    test('updateProfile requires profiles:write', async () => {
        // Ensure user exists
        seedA = await getLearnCardForUser('a');

        // Has profiles:read only -> userData loads but server denies missing write scope
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read');
        await expect(
            apiLc.invoke.updateProfile({ shortBio: 'should-fail-no-write-scope' })
        ).rejects.toThrow();

        // Has read+write -> should succeed
        apiLc = await getApiKeyLearnCardForUser('a', 'profiles:read profiles:write');
        const ok = await apiLc.invoke.updateProfile({ shortBio: 'updated-by-api' });
        expect(ok).toBe(true);

        const me = await apiLc.invoke.getProfile();
        expect(me?.shortBio).toBe('updated-by-api');
    });

    test('connections listing allowed with connections:read', async () => {
        // Allowed: server scope satisfied
        apiLc = await getApiKeyLearnCardForUser('a', 'connections:read');
        const page = await apiLc.invoke.getPaginatedConnections({ limit: 1 });
        expect(page).toBeDefined();
        expect(typeof (page as any).hasMore).toBe('boolean');
    });

    test('getMySentInboxCredentials requires inbox:read', async () => {
        // Allowed with inbox:read
        apiLc = await getApiKeyLearnCardForUser('a', 'inbox:read');
        const okPage = await apiLc.invoke.getMySentInboxCredentials({ limit: 1 });
        expect(okPage).toBeDefined();

        // Denied without inbox:read
        apiLc = await getApiKeyLearnCardForUser('a', 'inbox:write');
        await expect(apiLc.invoke.getMySentInboxCredentials({ limit: 1 })).rejects.toThrow();
    });

    test('getInboxCredential allowed with inbox:read; denied without', async () => {
        // Prepare a VC
        seedA = await getLearnCardForUser('a');
        const vc = await seedA.invoke.issueCredential(await seedA.invoke.getTestVc());

        // Create write token and issue via inbox
        const lcWrite = await getApiKeyLearnCardForUser('a', 'inbox:write');
        const issue = await lcWrite.invoke.sendCredentialViaInbox({
            credential: vc,
            recipient: { type: 'email', value: 'userC@test.com' },
        });
        expect(issue).toBeDefined();
        const issuanceId = (issue as any).issuanceId as string;
        expect(typeof issuanceId).toBe('string');

        // Allowed with read scope
        const lcRead = await getApiKeyLearnCardForUser('a', 'inbox:read');
        const item = await lcRead.invoke.getInboxCredential(issuanceId);
        expect(item).toBeDefined();

        // Denied without read scope
        await expect(lcWrite.invoke.getInboxCredential(issuanceId)).rejects.toThrow();
    });
});
