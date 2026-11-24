import { TRPCError } from '@trpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { UnsignedVC, VC, VP } from '@learncard/types';
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
import { userHasRequiredScopes } from './auth-grant.helpers';
import {
    assertDelegatedInboxIssuance,
    DELEGATE_ROUTE_ALLOWLIST,
    delegateAuditRecord,
    delegateResultRef,
    resolveDelegateRequest,
} from './delegate-auth-request.helpers';
import { isSignedInboxCredential } from './inbox.helpers';

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

/** A refusal that found a stored grant: the stage, who signed, and under which grant. */
const refusedAt = (stage: 'route' | 'policy' | 'owner', grantId = 'grant-1') => ({
    allowed: false,
    attribution: { stage, actorDid: DELEGATE_DID, grantId, ownerProfileId: owner.profileId },
});

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
            allowed: true,
            user: {
                did: owner.did,
                profile: owner,
                isChallengeValid: true,
                scope: 'inbox:write',
                isAuthGrant: true,
                delegate,
            },
        });
        expect(
            await resolveDelegateRequest({
                presentation: presentationFor(grant),
                path: CONTRACT_WRITE,
                requiredScope: 'contracts-data:write',
            })
        ).toStrictEqual({
            allowed: true,
            user: {
                did: owner.did,
                profile: owner,
                isChallengeValid: true,
                scope: 'contracts-data:write',
                isAuthGrant: true,
                delegate,
            },
        });
    });

    it("refuses inbox.finalize, inbox.issueBatch, contracts.syncCredentialsToContract and contracts.writeCredentialToContract although the grant's scope covers them: the grant is read and the refusal carries stage 'route' with the verified signer, the grant id and the owner", async () => {
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
            ).toStrictEqual(refusedAt('route'));
        }

        // Read before the route decides: an attempt on a closed route is attributed to its grant.
        expect(mocks.getDelegateAuthGrantByChallenge.mock.calls).toEqual(
            closed.map(() => [grant.challenge])
        );
    });

    it("refuses an allowlisted path whose requiredScope is missing, is another scope, or is an array: the grant is read and the refusal carries stage 'route' with the verified signer, the grant id and the owner", async () => {
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
            ).toStrictEqual(refusedAt('route'));
        }

        expect(mocks.getDelegateAuthGrantByChallenge.mock.calls).toEqual(
            notThePinnedScope.map(() => [grant.challenge])
        );
    });

    it('refuses when there is no presentation, without attribution and without a read', async () => {
        store(storedGrant());

        expect(await issueRequest(undefined)).toStrictEqual({ allowed: false });
        expect(mocks.getDelegateAuthGrantByChallenge).not.toHaveBeenCalled();
    });

    it('reads the grant on every call', async () => {
        const grant = storedGrant();
        store(grant);

        expect(await issueRequest(presentationFor(grant))).toMatchObject({ allowed: true });
        expect(await issueRequest(presentationFor(grant))).toMatchObject({ allowed: true });

        expect(mocks.getDelegateAuthGrantByChallenge.mock.calls).toEqual([
            [grant.challenge],
            [grant.challenge],
        ]);
    });

    it('refuses on the call after the stored status becomes revoked', async () => {
        const grant = storedGrant();
        const presentation = presentationFor(grant);

        store(grant);
        expect(await issueRequest(presentation)).toMatchObject({ allowed: true });

        store({ ...grant, status: 'revoked' });
        expect(await issueRequest(presentation)).toStrictEqual(refusedAt('policy'));
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

        // Signed by the key the grant names, so the refusal is recorded; a token another key
        // signed is refused all the same and leaves no attribution.
        const recorded = refusedAt('policy');
        const notRecorded = { allowed: false };

        const refusedByThePolicy = [
            ['expired', expired, presentationFor(expired), INBOX_ISSUE, recorded],
            [
                'another delegate key',
                forAnotherKey,
                presentationFor(valid),
                INBOX_ISSUE,
                notRecorded,
            ],
            [
                'another challenge',
                withAnotherChallenge,
                presentationFor(valid),
                INBOX_ISSUE,
                recorded,
            ],
            ['lacks the scope', inboxOnly, presentationFor(inboxOnly), CONTRACT_WRITE, recorded],
        ] as const;

        for (const [name, grant, presentation, path, refusal] of refusedByThePolicy) {
            mocks.getDelegateAuthGrantByChallenge.mockClear();
            store(grant);

            expect(
                await resolveDelegateRequest({
                    presentation,
                    path,
                    requiredScope: DELEGATE_ROUTE_ALLOWLIST[path],
                }),
                name
            ).toStrictEqual(refusal);
            // The refusal is the policy's answer about the stored grant, not an earlier one.
            expect(mocks.getDelegateAuthGrantByChallenge, name).toHaveBeenCalledTimes(1);
        }

        // The same grants are allowed once the one deviation is gone: each refusal above had
        // that deviation as its only cause.
        store(forAnotherKey);
        expect(await issueRequest(presentationFor(forAnotherKey))).toMatchObject({ allowed: true });
        store(withAnotherChallenge);
        expect(await issueRequest(presentationFor(withAnotherChallenge))).toMatchObject({
            allowed: true,
        });
        store(inboxOnly);
        expect(await issueRequest(presentationFor(inboxOnly))).toMatchObject({ allowed: true });
    });

    it('refuses when the configured audience no longer equals the stored audience', async () => {
        const grant = storedGrant();
        store(grant);

        expect(await issueRequest(presentationFor(grant))).toMatchObject({ allowed: true });

        mocks.getDelegateGrantAudience.mockReturnValue('did:web:renamed.example.com');

        expect(await issueRequest(presentationFor(grant))).toStrictEqual(refusedAt('policy'));
        expect(mocks.getDelegateAuthGrantByChallenge).toHaveBeenCalledTimes(2);
    });

    it('refuses when the linked profile is not the stored owner', async () => {
        const grant = storedGrant();
        store(grant, { ...owner, profileId: 'someone-else' });

        expect(await issueRequest(presentationFor(grant))).toStrictEqual(refusedAt('owner'));
        expect(mocks.getDelegateAuthGrantByChallenge).toHaveBeenCalledTimes(1);
    });

    it('refuses when no grant is stored for the challenge, without attribution, on an open and on a closed route', async () => {
        mocks.getDelegateAuthGrantByChallenge.mockResolvedValue(null);

        const presentation = presentationFor(storedGrant());

        expect(await issueRequest(presentation)).toStrictEqual({ allowed: false });
        expect(
            await resolveDelegateRequest({
                presentation,
                path: 'inbox.finalize',
                requiredScope: 'inbox:write',
            })
        ).toStrictEqual({ allowed: false });
        expect(mocks.getDelegateAuthGrantByChallenge).toHaveBeenCalledTimes(2);
    });

    it('an error from the grant read propagates and is not a refusal', async () => {
        mocks.getDelegateAuthGrantByChallenge.mockRejectedValue(new Error('neo4j unavailable'));

        await expect(issueRequest(presentationFor(storedGrant()))).rejects.toThrow(
            'neo4j unavailable'
        );
    });

    it("another key signing a known grant's challenge is refused without attribution on an allowlisted route", async () => {
        const grant = storedGrant();
        store(grant);

        // The stored challenge and audience, signed by a key the grant does not name.
        const byAnotherKey = presentationFor(grant, {
            signerDid: OTHER_KEY_DID,
            issuerDid: OTHER_KEY_DID,
            holderDid: OTHER_KEY_DID,
        });

        expect(await issueRequest(byAnotherKey)).toStrictEqual({ allowed: false });
        // The grant was found: the missing attribution is about the key, not about the read.
        expect(mocks.getDelegateAuthGrantByChallenge.mock.calls).toEqual([[grant.challenge]]);
        // The same request signed by the grant's own key is allowed: the key was the only cause.
        expect(await issueRequest(presentationFor(grant))).toMatchObject({ allowed: true });
    });

    it("another key signing a known grant's challenge is refused without attribution on a closed route", async () => {
        const grant = storedGrant();
        store(grant);

        const byAnotherKey = presentationFor(grant, {
            signerDid: OTHER_KEY_DID,
            issuerDid: OTHER_KEY_DID,
            holderDid: OTHER_KEY_DID,
        });

        expect(
            await resolveDelegateRequest({
                presentation: byAnotherKey,
                path: 'inbox.finalize',
                requiredScope: 'inbox:write',
            })
        ).toStrictEqual({ allowed: false });
        expect(mocks.getDelegateAuthGrantByChallenge.mock.calls).toEqual([[grant.challenge]]);
    });

    it("the grant's own delegate key refused by the policy carries stage 'policy' and that key as actorDid", async () => {
        const revoked = storedGrant({ status: 'revoked' });
        const expired = storedGrant({
            createdAt: new Date(Date.now() - 2 * HOUR).toISOString(),
            expiresAt: new Date(Date.now() - 1000).toISOString(),
        });
        // A grant that names another key, asked by that key: the record names it.
        const forAnotherKey = storedGrant({
            id: 'grant-2',
            status: 'revoked',
            delegateDid: OTHER_KEY_DID,
        });

        store(revoked);
        expect(await issueRequest(presentationFor(revoked))).toStrictEqual(refusedAt('policy'));
        store(expired);
        expect(await issueRequest(presentationFor(expired))).toStrictEqual(refusedAt('policy'));

        store(forAnotherKey);
        expect(await issueRequest(presentationFor(forAnotherKey))).toStrictEqual({
            allowed: false,
            attribution: {
                stage: 'policy',
                actorDid: OTHER_KEY_DID,
                grantId: 'grant-2',
                ownerProfileId: owner.profileId,
            },
        });
    });

    it("the grant's own delegate key on a closed route carries stage 'route'", async () => {
        const grant = storedGrant();
        store(grant);

        expect(
            await resolveDelegateRequest({
                presentation: presentationFor(grant),
                path: 'inbox.finalize',
                requiredScope: 'inbox:write',
            })
        ).toStrictEqual(refusedAt('route'));
    });

    it("a refusal for a linked-profile mismatch carries stage 'owner' and names the stored owner", async () => {
        const grant = storedGrant();
        store(grant, { ...owner, profileId: 'someone-else' });

        const refusal = await issueRequest(presentationFor(grant));

        expect(refusal).toStrictEqual(refusedAt('owner'));
        expect(JSON.stringify(refusal)).not.toContain('someone-else');
    });

    it("the route decides before the policy: a revoked grant on a closed route is refused with stage 'route'", async () => {
        const revoked = storedGrant({ status: 'revoked' });
        store(revoked);

        expect(
            await resolveDelegateRequest({
                presentation: presentationFor(revoked),
                path: 'inbox.finalize',
                requiredScope: 'inbox:write',
            })
        ).toStrictEqual(refusedAt('route'));
    });
});

describe('delegateResultRef', () => {
    it('takes the issuance id of inbox.issue and the returned string of the contract route', () => {
        expect(
            delegateResultRef(INBOX_ISSUE, {
                issuanceId: 'inbox-credential-1',
                status: 'PENDING',
                recipient: { type: 'email', value: 'learner@example.com' },
                claimUrl: 'https://network.example.com/claim/abc',
            })
        ).toBe('inbox-credential-1');
        expect(delegateResultRef(CONTRACT_WRITE, 'lc:network:example/credential/abc')).toBe(
            'lc:network:example/credential/abc'
        );
    });

    it('gives undefined for an unknown shape or another route, and never throws', () => {
        const throwing = Object.defineProperty({}, 'issuanceId', {
            get: () => {
                throw new Error('not readable');
            },
        });
        const unknownShapes: [string, unknown][] = [
            [INBOX_ISSUE, undefined],
            [INBOX_ISSUE, null],
            [INBOX_ISSUE, 'inbox-credential-1'],
            [INBOX_ISSUE, {}],
            [INBOX_ISSUE, { issuanceId: 7 }],
            [INBOX_ISSUE, { issuanceId: '' }],
            [INBOX_ISSUE, throwing],
            [CONTRACT_WRITE, undefined],
            [CONTRACT_WRITE, ''],
            [CONTRACT_WRITE, { issuanceId: 'inbox-credential-1' }],
            ['inbox.finalize', { issuanceId: 'inbox-credential-1' }],
            ['constructor', 'lc:network:example/credential/abc'],
        ];

        for (const [path, data] of unknownShapes) {
            expect(
                delegateResultRef(path, data),
                `${path} ${JSON.stringify(data)}`
            ).toBeUndefined();
        }
    });
});

describe('delegateAuditRecord', () => {
    const who = { actorDid: DELEGATE_DID, grantId: 'grant-1', ownerProfileId: 'issuer' };

    it('an allowed request: the route, its declared scope and who asked under which grant, and nothing else', () => {
        expect(
            delegateAuditRecord({ ...who, path: INBOX_ISSUE, requiredScope: 'inbox:write' })
        ).toStrictEqual({
            decision: 'allowed',
            route: INBOX_ISSUE,
            requiredScope: 'inbox:write',
            ...who,
        });
    });

    it('a denial carries its stage, and a declared scope that is not a string is left out', () => {
        expect(
            delegateAuditRecord({
                ...who,
                stage: 'route',
                path: 'profile.getProfile',
                requiredScope: undefined,
            })
        ).toStrictEqual({
            decision: 'denied',
            stage: 'route',
            route: 'profile.getProfile',
            ...who,
        });
        expect(
            delegateAuditRecord({
                ...who,
                stage: 'policy',
                path: INBOX_ISSUE,
                requiredScope: ['inbox:write'],
            })
        ).toStrictEqual({ decision: 'denied', stage: 'policy', route: INBOX_ISSUE, ...who });
    });
});

describe('assertDelegatedInboxIssuance', () => {
    const delegated = {
        delegate: { actorDid: DELEGATE_DID, grantId: 'grant-1', ownerProfileId: owner.profileId },
    };
    const notDelegated = {};

    const unsigned: UnsignedVC = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: owner.did,
        issuanceDate: '2026-01-01T00:00:00Z',
        credentialSubject: { id: 'did:example:learner' },
    };
    // What a delegate could produce itself: a proof made with its own key.
    const proof = {
        type: 'Ed25519Signature2020',
        created: '2026-01-01T00:00:00Z',
        proofPurpose: 'assertionMethod',
        verificationMethod: `${DELEGATE_DID}#key`,
        proofValue: 'z58DAdFfa9SkqZMVPxAQp',
    };
    const signed: VC = { ...unsigned, proof };
    const presentation: VP = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiablePresentation'],
        holder: DELEGATE_DID,
        proof: { ...proof, proofPurpose: 'authentication' },
    };

    /** The refusal as `CODE: message`, or `undefined` when the request passes. */
    const refusalOf = (
        ...args: Parameters<typeof assertDelegatedInboxIssuance>
    ): string | undefined => {
        try {
            assertDelegatedInboxIssuance(...args);

            return undefined;
        } catch (error) {
            if (error instanceof TRPCError) return `${error.code}: ${error.message}`;

            throw error;
        }
    };

    const unsignedContentRule =
        "BAD_REQUEST: A delegate submits unsigned credential content; the organisation's signing authority signs it.";

    it('does nothing for a request that is not delegated', () => {
        expect(refusalOf(notDelegated, {}, signed)).toBeUndefined();
        expect(refusalOf(notDelegated, { refresh: true }, unsigned)).toBeUndefined();
        expect(refusalOf(notDelegated, { refresh: true }, signed)).toBeUndefined();
    });

    it('passes unsigned credential content for a delegated request', () => {
        expect(refusalOf(delegated, {}, unsigned)).toBeUndefined();
        expect(refusalOf(delegated, { refresh: false }, unsigned)).toBeUndefined();
    });

    it('refuses a credential that already carries a proof', () => {
        expect(refusalOf(delegated, {}, signed)).toBe(unsignedContentRule);
    });

    // A proof is the only signed form `issueToInbox` knows, and the input validator admits
    // objects only. These are the other shapes in which a proof can arrive.
    it('refuses a credential with a list of proofs and a presentation, which always has a proof', () => {
        expect(refusalOf(delegated, {}, { ...unsigned, proof: [proof] })).toBe(unsignedContentRule);
        expect(refusalOf(delegated, {}, presentation)).toBe(unsignedContentRule);
    });

    it('refuses a managed refresh for a delegated request', () => {
        const refusal = refusalOf(delegated, { refresh: true }, unsigned);

        expect(refusal).toMatch(/^BAD_REQUEST: /);
        expect(refusal).toContain('managed refresh');
    });

    it('says nothing about the grant in a refusal', () => {
        for (const refusal of [
            refusalOf(delegated, {}, signed),
            refusalOf(delegated, { refresh: true }, unsigned),
        ]) {
            expect(refusal).not.toMatch(/grant/i);
            expect(refusal).not.toContain(delegated.delegate.grantId);
            expect(refusal).not.toContain(DELEGATE_DID);
        }
    });

    it('uses the same predicate as issueToInbox', () => {
        const shapes: [string, VC | UnsignedVC | VP, boolean][] = [
            ['unsigned content', unsigned, false],
            ['a proof that is undefined', { ...unsigned, proof: undefined }, false],
            ['one proof', signed, true],
            ['a list of proofs', { ...unsigned, proof: [proof] }, true],
            // `issueToInbox` takes an empty list as signed too, so a delegate may not send it.
            ['an empty list of proofs', { ...unsigned, proof: [] }, true],
            ['a presentation', presentation, true],
        ];

        for (const [name, credential, isSigned] of shapes) {
            expect(isSignedInboxCredential(credential), name).toBe(isSigned);
            expect(refusalOf(delegated, {}, credential) !== undefined, name).toBe(isSigned);
        }
    });

    // In `inbox.issue` the refresh block runs before the credential is resolved, and so before
    // this check. It asks for `credentials:write`, which the scope pinned for a delegate lacks.
    it('the scope pinned for inbox.issue does not open the refresh block of the route', () => {
        const pinnedScope = DELEGATE_ROUTE_ALLOWLIST[INBOX_ISSUE];

        expect(pinnedScope).toBe('inbox:write');
        expect(userHasRequiredScopes(pinnedScope ?? '', 'credentials:write')).toBe(false);
    });
});
