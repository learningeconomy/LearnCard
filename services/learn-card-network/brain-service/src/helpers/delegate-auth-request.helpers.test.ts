import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProfileType } from 'types/profile';

const mocks = vi.hoisted(() => ({
    getDelegateAuthGrantByChallenge: vi.fn(),
    getDelegateGrantAudience: vi.fn(),
}));

// The stored grant and the configured audience are the inputs under test. The policy that
// compares them with the presentation stays real.
vi.mock('@accesslayer/delegate-auth-grant/read', () => ({
    getDelegateAuthGrantByChallenge: mocks.getDelegateAuthGrantByChallenge,
}));
vi.mock('@helpers/delegate-auth-grant.helpers', async importOriginal => ({
    ...(await importOriginal<typeof import('@helpers/delegate-auth-grant.helpers')>()),
    getDelegateGrantAudience: mocks.getDelegateGrantAudience,
}));

import type { DelegateAuthGrant } from './delegate-auth-grant.schema';
import type { DelegatePresentation } from './delegate-auth-presentation.helpers';
import { DELEGATE_ROUTE_ALLOWLIST, resolveDelegateRequest } from './delegate-auth-request.helpers';

const HOUR = 60 * 60 * 1000;
const AUDIENCE = 'did:web:network.example.com';
const DELEGATE_DID = 'did:key:z6Mkg49NtQR2LyYRDCQFK4w1VVHqhypZSSRo7HsyuN7SV7v5';
const OTHER_KEY_DID = 'did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH';
const INBOX_ISSUE = 'inbox.issue';
const CONTRACT_WRITE = 'contracts.writeCredentialToContractViaSigningAuthority';

const owner: ProfileType = {
    profileId: 'issuer',
    did: 'did:key:z6MkOwner',
    displayName: 'Issuing organisation',
    shortBio: '',
    bio: '',
};

/** A stored grant that the policy allows right now, for both issuance scopes. */
const storedGrant = (overrides: Partial<DelegateAuthGrant> = {}): DelegateAuthGrant => ({
    id: 'grant-1',
    name: 'Issuance delegate',
    challenge: 'delegate-grant:opaque-challenge',
    status: 'active',
    scope: 'inbox:write contracts-data:write',
    createdAt: new Date(Date.now() - HOUR).toISOString(),
    expiresAt: new Date(Date.now() + HOUR).toISOString(),
    delegateDid: DELEGATE_DID,
    ownerProfileId: owner.profileId,
    effectiveProfileId: owner.profileId,
    audience: AUDIENCE,
    createdBy: owner.did,
    ...overrides,
});

/** What `readDelegatePresentation` hands over for a token the delegate signed for that grant. */
const presentationFor = (
    grant: DelegateAuthGrant,
    overrides: Partial<DelegatePresentation> = {}
): DelegatePresentation => ({
    signerDid: grant.delegateDid,
    issuerDid: grant.delegateDid,
    holderDid: grant.delegateDid,
    audience: grant.audience,
    challenge: grant.challenge,
    ...overrides,
});

const store = (grant: DelegateAuthGrant, ownerProfile: ProfileType = owner) =>
    mocks.getDelegateAuthGrantByChallenge.mockResolvedValue({ grant, ownerProfile });

const issueRequest = (presentation: DelegatePresentation | undefined) =>
    resolveDelegateRequest({ presentation, path: INBOX_ISSUE, requiredScope: 'inbox:write' });

beforeEach(() => {
    vi.resetAllMocks();
    mocks.getDelegateGrantAudience.mockReturnValue(AUDIENCE);
});

describe('resolveDelegateRequest', () => {
    it('the allowlist is exactly the two issuance routes, each with one scope, and is frozen', () => {
        expect(DELEGATE_ROUTE_ALLOWLIST).toStrictEqual({
            [INBOX_ISSUE]: 'inbox:write',
            [CONTRACT_WRITE]: 'contracts-data:write',
        });
        expect(Object.isFrozen(DELEGATE_ROUTE_ALLOWLIST)).toBe(true);
    });

    it('allows inbox.issue with inbox:write and the contract route with contracts-data:write, and returns the owner as profile, only the pinned scope, and the delegate attribution', async () => {
        const grant = storedGrant();
        store(grant);

        const delegate = { actorDid: DELEGATE_DID, grantId: 'grant-1', ownerProfileId: 'issuer' };

        // toStrictEqual: no further key, so no `onBehalfOf` and no `actAsPolicy` either.
        expect(await issueRequest(presentationFor(grant))).toStrictEqual({
            did: owner.did,
            profile: owner,
            isChallengeValid: true,
            scope: 'inbox:write',
            isAuthGrant: true,
            delegate,
        });
        expect(
            await resolveDelegateRequest({
                presentation: presentationFor(grant),
                path: CONTRACT_WRITE,
                requiredScope: 'contracts-data:write',
            })
        ).toStrictEqual({
            did: owner.did,
            profile: owner,
            isChallengeValid: true,
            scope: 'contracts-data:write',
            isAuthGrant: true,
            delegate,
        });
    });

    it("refuses inbox.finalize, inbox.issueBatch, contracts.syncCredentialsToContract and contracts.writeCredentialToContract although the grant's scope covers them", async () => {
        const grant = storedGrant();
        store(grant);

        // Each with the scope the route really declares, which the grant holds.
        const closed = [
            ['inbox.finalize', 'inbox:write'],
            ['inbox.issueBatch', 'inbox:write'],
            ['contracts.syncCredentialsToContract', 'contracts-data:write'],
            ['contracts.writeCredentialToContract', 'contracts-data:write'],
            // Not own keys of the allowlist, only of every object's prototype.
            ['constructor', 'inbox:write'],
            ['__proto__', 'inbox:write'],
        ] as const;

        for (const [path, requiredScope] of closed) {
            expect(
                await resolveDelegateRequest({
                    presentation: presentationFor(grant),
                    path,
                    requiredScope,
                }),
                path
            ).toBeNull();
        }

        expect(mocks.getDelegateAuthGrantByChallenge).not.toHaveBeenCalled();
    });

    it('refuses an allowlisted path whose requiredScope is missing, is another scope, or is an array', async () => {
        const grant = storedGrant();
        store(grant);

        const notThePinnedScope: unknown[] = [
            undefined,
            '',
            'inbox:read',
            'contracts-data:write',
            'inbox:write contracts-data:write',
            ['inbox:write'],
        ];

        for (const requiredScope of notThePinnedScope) {
            expect(
                await resolveDelegateRequest({
                    presentation: presentationFor(grant),
                    path: INBOX_ISSUE,
                    requiredScope,
                }),
                JSON.stringify(requiredScope)
            ).toBeNull();
        }

        expect(mocks.getDelegateAuthGrantByChallenge).not.toHaveBeenCalled();
    });

    it('refuses when there is no presentation', async () => {
        store(storedGrant());

        expect(await issueRequest(undefined)).toBeNull();
        expect(mocks.getDelegateAuthGrantByChallenge).not.toHaveBeenCalled();
    });

    it('reads the grant on every call', async () => {
        const grant = storedGrant();
        store(grant);

        expect(await issueRequest(presentationFor(grant))).not.toBeNull();
        expect(await issueRequest(presentationFor(grant))).not.toBeNull();

        expect(mocks.getDelegateAuthGrantByChallenge.mock.calls).toEqual([
            [grant.challenge],
            [grant.challenge],
        ]);
    });

    it('refuses on the call after the stored status becomes revoked', async () => {
        const grant = storedGrant();
        const presentation = presentationFor(grant);

        store(grant);
        expect(await issueRequest(presentation)).not.toBeNull();

        store({ ...grant, status: 'revoked' });
        expect(await issueRequest(presentation)).toBeNull();
    });

    it("refuses an expired grant, a grant for another delegate key, another challenge, and a grant that lacks the route's scope", async () => {
        const valid = storedGrant();
        const expired = storedGrant({
            createdAt: new Date(Date.now() - 2 * HOUR).toISOString(),
            expiresAt: new Date(Date.now() - 1000).toISOString(),
        });
        const forAnotherKey = storedGrant({ delegateDid: OTHER_KEY_DID });
        const withAnotherChallenge = storedGrant({ challenge: 'delegate-grant:another-challenge' });
        const inboxOnly = storedGrant({ scope: 'inbox:write' });

        const refusedByThePolicy = [
            ['expired', expired, presentationFor(expired), INBOX_ISSUE],
            ['another delegate key', forAnotherKey, presentationFor(valid), INBOX_ISSUE],
            ['another challenge', withAnotherChallenge, presentationFor(valid), INBOX_ISSUE],
            ['lacks the scope', inboxOnly, presentationFor(inboxOnly), CONTRACT_WRITE],
        ] as const;

        for (const [name, grant, presentation, path] of refusedByThePolicy) {
            mocks.getDelegateAuthGrantByChallenge.mockClear();
            store(grant);

            expect(
                await resolveDelegateRequest({
                    presentation,
                    path,
                    requiredScope: DELEGATE_ROUTE_ALLOWLIST[path],
                }),
                name
            ).toBeNull();
            // The refusal is the policy's answer about the stored grant, not an earlier one.
            expect(mocks.getDelegateAuthGrantByChallenge, name).toHaveBeenCalledTimes(1);
        }

        // The same grants are allowed once the one deviation is gone: each refusal above had
        // that deviation as its only cause.
        store(forAnotherKey);
        expect(await issueRequest(presentationFor(forAnotherKey))).not.toBeNull();
        store(withAnotherChallenge);
        expect(await issueRequest(presentationFor(withAnotherChallenge))).not.toBeNull();
        store(inboxOnly);
        expect(await issueRequest(presentationFor(inboxOnly))).not.toBeNull();
    });

    it('refuses when the configured audience no longer equals the stored audience', async () => {
        const grant = storedGrant();
        store(grant);

        expect(await issueRequest(presentationFor(grant))).not.toBeNull();

        mocks.getDelegateGrantAudience.mockReturnValue('did:web:renamed.example.com');

        expect(await issueRequest(presentationFor(grant))).toBeNull();
        expect(mocks.getDelegateAuthGrantByChallenge).toHaveBeenCalledTimes(2);
    });

    it('refuses when the linked profile is not the stored owner', async () => {
        const grant = storedGrant();
        store(grant, { ...owner, profileId: 'someone-else' });

        expect(await issueRequest(presentationFor(grant))).toBeNull();
        expect(mocks.getDelegateAuthGrantByChallenge).toHaveBeenCalledTimes(1);
    });

    it('refuses when no grant is stored for the challenge', async () => {
        mocks.getDelegateAuthGrantByChallenge.mockResolvedValue(null);

        expect(await issueRequest(presentationFor(storedGrant()))).toBeNull();
        expect(mocks.getDelegateAuthGrantByChallenge).toHaveBeenCalledTimes(1);
    });

    it('an error from the grant read propagates and is not a refusal', async () => {
        mocks.getDelegateAuthGrantByChallenge.mockRejectedValue(new Error('neo4j unavailable'));

        await expect(issueRequest(presentationFor(storedGrant()))).rejects.toThrow(
            'neo4j unavailable'
        );
    });
});
