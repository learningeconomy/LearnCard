import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { TRPCError } from '@trpc/server';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveTenantFromRequest } from '@learncard/email-templates';
import { ACT_AS_HEADER, AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX } from '@learncard/types';

const mocks = vi.hoisted(() => ({
    isAuthGrantChallengeValidForDID: vi.fn(),
    isChallengeValidForDid: vi.fn(),
    invalidateChallengeForDid: vi.fn(),
    getProfileByDid: vi.fn(),
    getProfileByProfileId: vi.fn(),
    getProfilesThatManageAProfile: vi.fn(),
    getDelegateAuthGrantByChallenge: vi.fn(),
    getDelegateGrantAudience: vi.fn(),
    issueToInbox: vi.fn(),
    assertInboxRefreshEnabled: vi.fn(),
    getInboxRefreshReplay: vi.fn(),
    resumeInboxRefreshDelivery: vi.fn(),
    getInboxRefreshReceipt: vi.fn(),
    createDelegateGrantAudit: vi.fn(),
    completeDelegateGrantAudit: vi.fn(),
}));

// Only the collaborators whose calls are counted are replaced. Every other export stays real,
// because the walk at the end of this file imports the whole router. Tokens are signed with real
// keys and checked by the real verifier.
vi.mock('@accesslayer/auth-grant/read', async importOriginal => ({
    ...(await importOriginal<typeof import('@accesslayer/auth-grant/read')>()),
    isAuthGrantChallengeValidForDID: mocks.isAuthGrantChallengeValidForDID,
}));
vi.mock('@cache/challenges', async importOriginal => ({
    ...(await importOriginal<typeof import('@cache/challenges')>()),
    isChallengeValidForDid: mocks.isChallengeValidForDid,
    invalidateChallengeForDid: mocks.invalidateChallengeForDid,
}));
vi.mock('@accesslayer/profile/read', async importOriginal => ({
    ...(await importOriginal<typeof import('@accesslayer/profile/read')>()),
    getProfileByDid: mocks.getProfileByDid,
    getProfileByProfileId: mocks.getProfileByProfileId,
}));
vi.mock('@accesslayer/profile/relationships/read', async importOriginal => ({
    ...(await importOriginal<typeof import('@accesslayer/profile/relationships/read')>()),
    getProfilesThatManageAProfile: mocks.getProfilesThatManageAProfile,
}));
vi.mock('@accesslayer/delegate-auth-grant/read', async importOriginal => ({
    ...(await importOriginal<typeof import('@accesslayer/delegate-auth-grant/read')>()),
    getDelegateAuthGrantByChallenge: mocks.getDelegateAuthGrantByChallenge,
}));
// The configured audience is replaced so that it is the one the test tokens are signed for.
vi.mock('@helpers/delegate-auth-grant.helpers', async importOriginal => ({
    ...(await importOriginal<typeof import('@helpers/delegate-auth-grant.helpers')>()),
    getDelegateGrantAudience: mocks.getDelegateGrantAudience,
}));

// The record of a delegated request: whether it is written, with what, and when, is asserted.
vi.mock('@accesslayer/delegate-grant-audit/create', () => ({
    createDelegateGrantAudit: mocks.createDelegateGrantAudit,
    completeDelegateGrantAudit: mocks.completeDelegateGrantAudit,
}));

// `inbox.issue` runs up to this call: whether it is made, and with what, is what is counted.
vi.mock('@helpers/inbox.helpers', async importOriginal => ({
    ...(await importOriginal<typeof import('@helpers/inbox.helpers')>()),
    issueToInbox: mocks.issueToInbox,
}));

// The paths of `inbox.issue` that can answer before a credential is issued: a delegated request
// must be refused without any of them being consulted.
vi.mock('@helpers/inbox-refresh.helpers', async importOriginal => ({
    ...(await importOriginal<typeof import('@helpers/inbox-refresh.helpers')>()),
    assertInboxRefreshEnabled: mocks.assertInboxRefreshEnabled,
    getInboxRefreshReplay: mocks.getInboxRefreshReplay,
    resumeInboxRefreshDelivery: mocks.resumeInboxRefreshDelivery,
    getInboxRefreshReceipt: mocks.getInboxRefreshReceipt,
}));

import {
    DELEGATE_GRANT_CHALLENGE_PREFIX,
    type DelegateAuthGrant,
} from '@helpers/delegate-auth-grant.schema';
import { getLearnCard } from '@helpers/learnCard.helpers';
import type { SeedLearnCard } from '@helpers/learnCard.helpers';
import type { ProfileType } from 'types/profile';

import { appRouter } from '../app';
import {
    createContext,
    DELEGATE_REQUEST_REFUSED_MESSAGE,
    didRoute,
    profileRoute,
    t,
    type Context,
} from './index';

const DELEGATE_SEED = 'a'.repeat(64);
const AUDIENCE = 'did:web:network.example.com';
const CHALLENGE = `${DELEGATE_GRANT_CHALLENGE_PREFIX}7f3c9a52-0b1e-4c7d-9a41-5d2e8f6b1c90`;
const GUARDIAN_HEADER = 'x-guardian-approval';

const inspectionRouter = t.router({ context: didRoute.query(({ ctx }) => ctx.user) });

let signer: SeedLearnCard;
let tokens: {
    validDelegate: string;
    invalidDelegate: string;
    delegateWithoutAudience: string;
    delegateContainingLegacyPrefix: string;
    delegateContainingLegacyPrefixWithoutAudience: string;
    legacyGrant: string;
    cachedChallenge: string;
};

/**
 * What a delegate sends: a DID-auth presentation over challenge and audience, as a JWT whose
 * signed payload says until when it is valid. Passing `validUntil: undefined` leaves the bound out.
 */
const delegateToken = async (
    learnCard: SeedLearnCard,
    options: { challenge: string; audience: string; validUntil?: string }
): Promise<string> => {
    const validUntil =
        'validUntil' in options ? options.validUntil : new Date(Date.now() + 60_000).toISOString();

    const jwt: unknown = await learnCard.invoke.issuePresentation(
        {
            '@context': ['https://www.w3.org/ns/credentials/v2'],
            type: ['VerifiablePresentation'],
            holder: learnCard.id.did(),
            ...(validUntil === undefined ? {} : { validUntil }),
        },
        {
            proofPurpose: 'authentication',
            challenge: options.challenge,
            domain: options.audience,
            proofFormat: 'jwt',
        }
    );

    if (typeof jwt !== 'string') throw new Error('Expected the presentation as a JWT');

    return jwt;
};

/**
 * What every other caller sends: a DID-auth presentation over the challenge alone, with no
 * time bound. Only such a token passes the legacy verification: the tokens `WithoutAudience`
 * are the delegate-prefixed ones the legacy path would accept.
 */
const sign = async (challenge: string): Promise<string> => {
    const jwt = await signer.invoke.getDidAuthVp({ challenge, proofFormat: 'jwt' });

    if (typeof jwt !== 'string') throw new Error('Expected the presentation as a JWT');

    return jwt;
};

// The first character always carries signature bits; the last may be base64 padding bits.
const changeOneSignatureCharacter = (jwt: string): string => {
    const [header, payload, signature = ''] = jwt.split('.');
    const replacement = signature.startsWith('A') ? 'B' : 'A';

    return [header, payload, `${replacement}${signature.slice(1)}`].join('.');
};

const request = (jwt?: string, otherHeaders: [string, string][] = []) => {
    const headers = new Map<string, string>(otherHeaders);

    if (jwt) headers.set('authorization', `Bearer ${jwt}`);

    return { req: { headers } };
};

beforeAll(async () => {
    signer = await getLearnCard(DELEGATE_SEED);

    const validDelegate = await delegateToken(signer, { challenge: CHALLENGE, audience: AUDIENCE });
    const bothPrefixes = `${DELEGATE_GRANT_CHALLENGE_PREFIX}${AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX}7f3c9a52`;

    tokens = {
        validDelegate,
        invalidDelegate: changeOneSignatureCharacter(validDelegate),
        delegateWithoutAudience: await sign(CHALLENGE),
        delegateContainingLegacyPrefix: await delegateToken(signer, {
            challenge: bothPrefixes,
            audience: AUDIENCE,
        }),
        delegateContainingLegacyPrefixWithoutAudience: await sign(bothPrefixes),
        legacyGrant: await sign(`${AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX}7f3c9a52`),
        cachedChallenge: await sign('7f3c9a52-0b1e-4c7d-9a41-5d2e8f6b1c90'),
    };
}, 60_000);

beforeEach(() => {
    vi.resetAllMocks();
    // Answers of the legacy checks, so that a token that wrongly reaches one of them fails on
    // the call count and not on a missing return value.
    mocks.isAuthGrantChallengeValidForDID.mockResolvedValue({
        isChallengeValid: true,
        scope: 'inbox:write',
    });
    mocks.isChallengeValidForDid.mockResolvedValue(true);
    // Nothing is stored unless a test stores a grant: the boundary then refuses everything.
    mocks.getDelegateAuthGrantByChallenge.mockResolvedValue(null);
    mocks.getDelegateGrantAudience.mockReturnValue(AUDIENCE);
    mocks.createDelegateGrantAudit.mockResolvedValue('audit-1');
    mocks.completeDelegateGrantAudit.mockResolvedValue(true);
});

describe('createContext for a bearer token that carries the delegate prefix', () => {
    it('a valid delegate token gives a context with delegateRequest.presentation and no user', async () => {
        const ctx = await createContext(request(tokens.validDelegate));

        expect(ctx.delegateRequest?.presentation).toEqual({
            signerDid: signer.id.did(),
            issuerDid: signer.id.did(),
            holderDid: signer.id.did(),
            audience: AUDIENCE,
            challenge: CHALLENGE,
        });
        expect(ctx.user).toBeUndefined();
        expect(ctx.contactMethod).toBeUndefined();
        expect(ctx.tenant).toEqual(resolveTenantFromRequest({}));
        expect(ctx.domain).toBe((await createContext(request())).domain);
    });

    it('an invalid delegate-prefixed token gives delegateRequest without a presentation and no user', async () => {
        const ctx = await createContext(request(tokens.invalidDelegate));

        expect(ctx.delegateRequest).toBeDefined();
        expect(ctx.delegateRequest?.presentation).toBeUndefined();
        expect(ctx.user).toBeUndefined();
    });

    it.each(['validDelegate', 'invalidDelegate', 'delegateWithoutAudience'] as const)(
        'the legacy grant check and the cached-challenge check are not called for a delegate-prefixed token, valid or not (%s)',
        async token => {
            const ctx = await createContext(request(tokens[token]));

            expect(ctx.delegateRequest).toBeDefined();
            expect(mocks.isAuthGrantChallengeValidForDID).not.toHaveBeenCalled();
            expect(mocks.isChallengeValidForDid).not.toHaveBeenCalled();
            expect(mocks.invalidateChallengeForDid).not.toHaveBeenCalled();
        }
    );

    it.each([
        'delegateContainingLegacyPrefix',
        'delegateContainingLegacyPrefixWithoutAudience',
    ] as const)(
        'a nonce that starts with the delegate prefix and also contains auth-grant: is still handled as a delegate token (%s)',
        async token => {
            const ctx = await createContext(request(tokens[token]));

            expect(mocks.isAuthGrantChallengeValidForDID).not.toHaveBeenCalled();
            expect(mocks.isChallengeValidForDid).not.toHaveBeenCalled();
            expect(ctx.delegateRequest).toBeDefined();
            expect(ctx.user).toBeUndefined();
        }
    );

    it('the act-as header is ignored for a delegate token', async () => {
        const ctx = await createContext(
            request(tokens.validDelegate, [
                [ACT_AS_HEADER, 'the-id'],
                [GUARDIAN_HEADER, 'guardian-token'],
            ])
        );

        expect(ctx.delegateRequest?.presentation).toBeDefined();
        expect(ctx.actAs).toBeUndefined();
        expect(ctx._guardianApprovalToken).toBeUndefined();
        // `onBehalfOf` lives on the user, and a delegate request has none.
        expect(ctx.user).toBeUndefined();

        await expect(inspectionRouter.createCaller(ctx).context()).rejects.toMatchObject({
            code: 'UNAUTHORIZED',
            message: DELEGATE_REQUEST_REFUSED_MESSAGE,
        });
        expect(mocks.getProfilesThatManageAProfile).not.toHaveBeenCalled();
        expect(mocks.getProfileByProfileId).not.toHaveBeenCalled();
        expect(mocks.getProfileByDid).not.toHaveBeenCalled();
    });
});

describe('createContext for every other request', () => {
    it('a legacy auth-grant token still takes the legacy branch', async () => {
        const ctx = await createContext(
            request(tokens.legacyGrant, [
                [ACT_AS_HEADER, 'the-id'],
                [GUARDIAN_HEADER, 'guardian-token'],
            ])
        );

        expect(mocks.isAuthGrantChallengeValidForDID).toHaveBeenCalledTimes(1);
        expect(mocks.isAuthGrantChallengeValidForDID).toHaveBeenCalledWith(
            `${AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX}7f3c9a52`,
            signer.id.did()
        );
        expect(mocks.isChallengeValidForDid).not.toHaveBeenCalled();
        expect(ctx.delegateRequest).toBeUndefined();
        expect(ctx.user).toEqual({
            did: signer.id.did(),
            isChallengeValid: true,
            scope: 'inbox:write',
            isAuthGrant: true,
            actAsPolicy: undefined,
        });
        expect(ctx.actAs).toBe('the-id');
        expect(ctx._guardianApprovalToken).toBe('guardian-token');
    });

    it('a token over an ordinary challenge still takes the one-use cached-challenge branch', async () => {
        const ctx = await createContext(request(tokens.cachedChallenge));

        expect(mocks.isChallengeValidForDid).toHaveBeenCalledTimes(1);
        expect(mocks.invalidateChallengeForDid).toHaveBeenCalledTimes(1);
        expect(mocks.isAuthGrantChallengeValidForDID).not.toHaveBeenCalled();
        expect(ctx.delegateRequest).toBeUndefined();
        expect(ctx.user).toMatchObject({ did: signer.id.did(), isChallengeValid: true });
    });

    it('a request without a token is unchanged', async () => {
        const ctx = await createContext(request(undefined, [[ACT_AS_HEADER, 'the-id']]));

        expect(ctx).toEqual({
            domain: ctx.domain,
            tenant: resolveTenantFromRequest({}),
            _guardianApprovalToken: undefined,
            sourceIp: undefined,
            actAs: 'the-id',
        });
        expect(ctx.delegateRequest).toBeUndefined();
        expect(ctx.user).toBeUndefined();
    });
});

describe('the delegate boundary', () => {
    const paths = Object.keys(appRouter._def.procedures);
    const refused = `UNAUTHORIZED: ${DELEGATE_REQUEST_REFUSED_MESSAGE}`;

    /** Calls one procedure of the whole router, by its dotted path, with an empty input. */
    const outcomeOf = async (ctx: Context, path: string): Promise<string> => {
        const procedure = path
            .split('.')
            .reduce<unknown>(
                (node, key) => Reflect.get(Object(node), key),
                appRouter.createCaller(ctx)
            );

        if (typeof procedure !== 'function') return 'is not callable';

        try {
            await Reflect.apply(procedure, undefined, [{}]);

            return 'answered';
        } catch (error) {
            return error instanceof TRPCError ? `${error.code}: ${error.message}` : String(error);
        }
    };

    it('the walk covers the whole service', () => {
        expect(paths.length).toBeGreaterThan(200);
        // A route that needs a user already answers a bare UNAUTHORIZED: the boundary's message
        // has to differ from it, or the walk could not tell the two apart.
        expect(DELEGATE_REQUEST_REFUSED_MESSAGE).not.toBe('UNAUTHORIZED');
    });

    it.each([
        ['a verified presentation', true],
        ['no presentation', false],
    ] as const)(
        'every procedure of the service refuses a delegate token for which no grant is stored, with the one fixed message, and writes no record (%s)',
        async (_name, verified) => {
            const { delegateRequest, domain, tenant } = await createContext(
                request(verified ? tokens.validDelegate : tokens.invalidDelegate)
            );
            const ctx: Context = {
                delegateRequest: { presentation: delegateRequest?.presentation },
                domain,
                tenant,
            };

            expect(Boolean(ctx.delegateRequest?.presentation)).toBe(verified);

            const notRefused: string[] = [];

            for (const path of paths) {
                const outcome = await outcomeOf(ctx, path);

                if (outcome !== refused) notRefused.push(`${path} -> ${outcome}`);
            }

            expect(notRefused).toEqual([]);
            // A verified presentation is looked up on every procedure, an unverified one never.
            // Nothing is stored, so no refusal can be attributed to a grant: nothing is recorded.
            expect(mocks.getDelegateAuthGrantByChallenge.mock.calls).toEqual(
                verified ? paths.map(() => [CHALLENGE]) : []
            );
            expect(mocks.createDelegateGrantAudit).not.toHaveBeenCalled();
            expect(mocks.completeDelegateGrantAudit).not.toHaveBeenCalled();
        },
        60_000
    );

    it('a token that does not verify, and a verified token whose challenge names no grant, write nothing', async () => {
        for (const token of [tokens.invalidDelegate, tokens.validDelegate]) {
            const { delegateRequest, domain, tenant } = await createContext(request(token));
            const ctx: Context = {
                delegateRequest: { presentation: delegateRequest?.presentation },
                domain,
                tenant,
            };

            await expect(
                appRouter.createCaller(ctx).inbox.issue({
                    recipient: { type: 'email', value: 'learner@example.com' },
                    credential: signer.invoke.getTestVc(),
                })
            ).rejects.toMatchObject({
                code: 'UNAUTHORIZED',
                message: DELEGATE_REQUEST_REFUSED_MESSAGE,
            });
        }

        // Only the verified token names a challenge to look up, and nothing is stored for it.
        expect(mocks.getDelegateAuthGrantByChallenge.mock.calls).toEqual([[CHALLENGE]]);
        expect(mocks.createDelegateGrantAudit).not.toHaveBeenCalled();
        expect(mocks.completeDelegateGrantAudit).not.toHaveBeenCalled();
        expect(mocks.issueToInbox).not.toHaveBeenCalled();
    });

    describe('with a stored grant that matches the token', () => {
        const openToADelegate = [
            'inbox.issue',
            'contracts.writeCredentialToContractViaSigningAuthority',
        ];
        const owner: ProfileType = {
            profileId: 'issuer',
            did: 'did:key:z6MkOwner',
            displayName: 'Issuing organisation',
            shortBio: '',
            bio: '',
        };

        /** Stores a grant for the valid delegate token and gives the context of its request. */
        const delegateContext = async (otherHeaders: [string, string][] = []): Promise<Context> => {
            const grant: DelegateAuthGrant = {
                id: 'grant-1',
                name: 'Issuance delegate',
                challenge: CHALLENGE,
                status: 'active',
                scope: 'inbox:write contracts-data:write',
                createdAt: new Date(Date.now() - 60_000).toISOString(),
                expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
                delegateDid: signer.id.did(),
                ownerProfileId: owner.profileId,
                effectiveProfileId: owner.profileId,
                audience: AUDIENCE,
                createdBy: owner.did,
            };

            mocks.getDelegateAuthGrantByChallenge.mockResolvedValue({ grant, ownerProfile: owner });

            const { delegateRequest, domain, tenant } = await createContext(
                request(tokens.validDelegate, otherHeaders)
            );
            const ctx: Context = {
                delegateRequest: { presentation: delegateRequest?.presentation },
                domain,
                tenant,
            };

            expect(ctx.delegateRequest?.presentation).toBeDefined();

            return ctx;
        };

        /** The scope a procedure declares in its own metadata, whatever its type. */
        const declaredScope = (path: string): unknown => {
            const procedure: unknown = Reflect.get(appRouter._def.procedures, path);
            const meta: unknown = Reflect.get(
                Object(Reflect.get(Object(procedure), '_def')),
                'meta'
            );

            return Reflect.get(Object(meta), 'requiredScope');
        };

        const expectNoProfileLookup = () => {
            expect(mocks.getProfileByDid).not.toHaveBeenCalled();
            expect(mocks.getProfileByProfileId).not.toHaveBeenCalled();
            expect(mocks.getProfilesThatManageAProfile).not.toHaveBeenCalled();
        };

        it('the two issuance routes pass the boundary, withDid, the challenge check and the scope check, and fail only on their empty input', async () => {
            const ctx = await delegateContext();

            for (const path of openToADelegate) {
                expect(paths).toContain(path);
                expect(await outcomeOf(ctx, path), path).toMatch(/^BAD_REQUEST: /);
            }

            expect(mocks.getDelegateAuthGrantByChallenge.mock.calls).toEqual([
                [CHALLENGE],
                [CHALLENGE],
            ]);
            expectNoProfileLookup();
            expect(mocks.isAuthGrantChallengeValidForDID).not.toHaveBeenCalled();
            expect(mocks.isChallengeValidForDid).not.toHaveBeenCalled();
            // Allowed by the boundary, so recorded; the empty input then fails before the handler.
            expect(
                mocks.createDelegateGrantAudit.mock.calls.map(([record]) => [
                    record.decision,
                    record.route,
                ])
            ).toEqual(openToADelegate.map(path => ['allowed', path]));
            expect(mocks.completeDelegateGrantAudit.mock.calls).toEqual(
                openToADelegate.map(() => ['audit-1', 'failed', undefined])
            );
        });

        it("every other procedure of the service still refuses, with the one fixed message, and writes exactly one denied record with stage 'route' and its own path", async () => {
            const ctx = await delegateContext();
            const others = paths.filter(path => !openToADelegate.includes(path));
            const notRefused: string[] = [];

            for (const path of others) {
                const outcome = await outcomeOf(ctx, path);

                if (outcome !== refused) notRefused.push(`${path} -> ${outcome}`);
            }

            expect(others.length).toBe(paths.length - openToADelegate.length);
            expect(others.length).toBeGreaterThan(200);
            expect(notRefused).toEqual([]);
            // The grant is read before the route decides, so every refusal is attributed to it.
            expect(mocks.getDelegateAuthGrantByChallenge).toHaveBeenCalledTimes(others.length);

            const records = mocks.createDelegateGrantAudit.mock.calls.map(([record]) => record);

            expect(records.map(record => record.route)).toEqual(others);
            for (const { route, requiredScope, ...rest } of records) {
                const declared = declaredScope(route);

                expect(rest, route).toStrictEqual({
                    decision: 'denied',
                    stage: 'route',
                    actorDid: signer.id.did(),
                    grantId: 'grant-1',
                    ownerProfileId: 'issuer',
                });
                expect(requiredScope, route).toBe(
                    typeof declared === 'string' ? declared : undefined
                );
            }
            expect(mocks.completeDelegateGrantAudit).not.toHaveBeenCalled();
        }, 60_000);

        describe('inbox.issue for a delegate', () => {
            const recipient = { type: 'email' as const, value: 'learner@example.com' };

            it('a delegated inbox.issue with a signed credential is refused with BAD_REQUEST before issueToInbox is called', async () => {
                const ctx = await delegateContext();
                // Signed with the only key a delegate holds: its own.
                const credential = await signer.invoke.issueCredential(signer.invoke.getTestVc());

                await expect(
                    appRouter.createCaller(ctx).inbox.issue({ recipient, credential })
                ).rejects.toMatchObject({
                    code: 'BAD_REQUEST',
                    message: expect.stringContaining('unsigned credential content'),
                });
                expect(mocks.issueToInbox).not.toHaveBeenCalled();
            });

            // The same input without the proof: the refusal above is not the input validator's.
            it('the same request with unsigned content reaches issueToInbox as the owner of the grant', async () => {
                const ctx = await delegateContext();
                const credential = signer.invoke.getTestVc();

                mocks.issueToInbox.mockResolvedValue({
                    status: 'PENDING',
                    inboxCredential: { id: 'inbox-credential-1' },
                });

                await expect(
                    appRouter.createCaller(ctx).inbox.issue({ recipient, credential })
                ).resolves.toEqual({
                    issuanceId: 'inbox-credential-1',
                    status: 'PENDING',
                    recipient,
                });
                expect(mocks.issueToInbox).toHaveBeenCalledTimes(1);
                expect(mocks.issueToInbox.mock.calls[0]?.slice(0, 3)).toEqual([
                    owner,
                    recipient,
                    credential,
                ]);
            });

            // An `idempotencyKey` is only valid with `refresh: true`, so this is also the keyed
            // request. A stored replay is waiting: answered first, it would hand the delegate the
            // organisation's earlier issuance.
            it('a delegated refresh request with an idempotencyKey is refused with BAD_REQUEST before the replay helpers are consulted', async () => {
                const ctx = await delegateContext();
                const credential = signer.invoke.getTestVc();

                mocks.getInboxRefreshReplay.mockResolvedValue({
                    claimUrl: 'https://network.example.com/claim/earlier',
                    inbox: { id: 'inbox-credential-0', currentStatus: 'ISSUED', refreshId: 'r-0' },
                });
                mocks.getInboxRefreshReceipt.mockResolvedValue({ holderDid: 'did:key:z6Mkholder' });

                await expect(
                    appRouter.createCaller(ctx).inbox.issue({
                        recipient,
                        credential,
                        refresh: true,
                        idempotencyKey: 'key-1',
                    })
                ).rejects.toMatchObject({
                    code: 'BAD_REQUEST',
                    message: expect.stringContaining('managed refresh'),
                });

                expect(mocks.assertInboxRefreshEnabled).not.toHaveBeenCalled();
                expect(mocks.getInboxRefreshReplay).not.toHaveBeenCalled();
                expect(mocks.resumeInboxRefreshDelivery).not.toHaveBeenCalled();
                expect(mocks.getInboxRefreshReceipt).not.toHaveBeenCalled();
                expect(mocks.issueToInbox).not.toHaveBeenCalled();
            });

            describe('the source of the inbox.issue mutation', () => {
                const ASSERTION = 'assertDelegatedInboxIssuance(';
                const MUTATION = '.mutation(async ({ ctx, input }) => {';
                const DELEGATE_BLOCK = 'if (ctx.user.delegate !== undefined) {';
                const OWN_RESOLUTION = 'await resolveInboxCredentialInput(input, ctx)';

                /**
                 * Everything in the body of `inbox.issue` that could answer, read or branch before
                 * the delegate assertion, other than the assertion's own block and the one read it
                 * needs. An empty list means the delegate assertion is decided first.
                 */
                const pathsBeforeDelegateAssertion = (source: string): string[] => {
                    const route = source.indexOf('    issue: profileRoute');
                    const body = source.indexOf(MUTATION, route) + MUTATION.length;
                    const assertion = source.indexOf(ASSERTION, body);
                    const nextMutation = source.indexOf('.mutation(', body);

                    if (route < 0 || body < MUTATION.length || assertion < 0) {
                        return ['inbox.issue or its delegate assertion was not found'];
                    }
                    if (nextMutation >= 0 && assertion > nextMutation) {
                        return ['the delegate assertion is not in the inbox.issue mutation'];
                    }

                    const before = source
                        .slice(body, assertion)
                        .replace(/\/\/.*$/gm, '')
                        .replace(/\/\*[\s\S]*?\*\//g, '');

                    if (!before.includes(DELEGATE_BLOCK) || !before.includes(OWN_RESOLUTION)) {
                        return ['the delegate block does not open the mutation'];
                    }

                    return (
                        before
                            .replace(DELEGATE_BLOCK, '')
                            .replace(OWN_RESOLUTION, '')
                            .match(/\b(return|await|throw|if|switch|for|while|try)\b[^\n]*/g) ?? []
                    );
                };

                const source = readFileSync(
                    fileURLToPath(new URL('./inbox.ts', import.meta.url)),
                    'utf8'
                );

                it('nothing returns, awaits another path or branches before the delegate assertion', () => {
                    expect(pathsBeforeDelegateAssertion(source)).toEqual([]);
                });

                // Control: the same check on the same source with a keyed path merged in above it.
                it('an earlier path added above the delegate assertion is reported', () => {
                    const earlier =
                        'if (input.idempotencyKey) return await replayKeyedIssue(input);';
                    const body =
                        source.indexOf(MUTATION, source.indexOf('    issue: profileRoute')) +
                        MUTATION.length;
                    const merged = `${source.slice(0, body)}\n            ${earlier}${source.slice(
                        body
                    )}`;

                    expect(pathsBeforeDelegateAssertion(merged)).toEqual([earlier]);
                });
            });
        });

        describe('the record of a delegated request', () => {
            const recipient = { type: 'email' as const, value: 'learner@example.com' };
            const issued = { status: 'PENDING', inboxCredential: { id: 'inbox-credential-1' } };
            const allowedRecord = () => ({
                decision: 'allowed',
                route: 'inbox.issue',
                requiredScope: 'inbox:write',
                actorDid: signer.id.did(),
                grantId: 'grant-1',
                ownerProfileId: 'issuer',
            });
            const issue = (ctx: Context) =>
                appRouter
                    .createCaller(ctx)
                    .inbox.issue({ recipient, credential: signer.invoke.getTestVc() });

            it('an allowed request writes its record before the handler runs', async () => {
                const ctx = await delegateContext();
                const order: string[] = [];

                mocks.createDelegateGrantAudit.mockImplementation(async () => {
                    // Stored only after a turn of the event loop: the handler must wait for it.
                    await Promise.resolve();
                    order.push('record stored');

                    return 'audit-1';
                });
                mocks.issueToInbox.mockImplementation(async () => {
                    order.push('handler');

                    return issued;
                });

                await issue(ctx);

                expect(order).toEqual(['record stored', 'handler']);
                // toStrictEqual: no token, no challenge, no credential content, no recipient.
                expect(mocks.createDelegateGrantAudit.mock.calls).toStrictEqual([
                    [allowedRecord()],
                ]);
            });

            it('an allowed request does not reach the handler when the audit write fails', async () => {
                const ctx = await delegateContext();
                const failure = new Error('neo4j unavailable');

                mocks.createDelegateGrantAudit.mockRejectedValue(failure);
                mocks.issueToInbox.mockResolvedValue(issued);

                // tRPC wraps an error that is not its own; the cause is the write's error itself.
                await expect(issue(ctx)).rejects.toMatchObject({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'neo4j unavailable',
                    cause: failure,
                });
                expect(mocks.createDelegateGrantAudit).toHaveBeenCalledTimes(1);
                expect(mocks.issueToInbox).not.toHaveBeenCalled();
                expect(mocks.completeDelegateGrantAudit).not.toHaveBeenCalled();
            });

            it('the record is completed with succeeded and the issued reference', async () => {
                const ctx = await delegateContext();

                mocks.issueToInbox.mockResolvedValue(issued);

                await expect(issue(ctx)).resolves.toEqual({
                    issuanceId: 'inbox-credential-1',
                    status: 'PENDING',
                    recipient,
                });
                expect(mocks.completeDelegateGrantAudit.mock.calls).toEqual([
                    ['audit-1', 'succeeded', 'inbox-credential-1'],
                ]);
            });

            it("the record is completed with failed when the handler throws, and the handler's own error reaches the caller unchanged", async () => {
                const ctx = await delegateContext();
                const failure = new TRPCError({ code: 'CONFLICT', message: 'Already issued' });
                // The path and scope of an open route, with a handler that throws its own error.
                const throwing = t.router({
                    inbox: t.router({
                        issue: profileRoute.meta({ requiredScope: 'inbox:write' }).query(() => {
                            throw failure;
                        }),
                    }),
                });

                await expect(throwing.createCaller(ctx).inbox.issue()).rejects.toBe(failure);

                expect(mocks.createDelegateGrantAudit.mock.calls).toStrictEqual([
                    [allowedRecord()],
                ]);
                expect(mocks.completeDelegateGrantAudit.mock.calls).toEqual([
                    ['audit-1', 'failed', undefined],
                ]);
            });

            it("a failing completion does not change the caller's answer", async () => {
                const ctx = await delegateContext();
                const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);

                mocks.issueToInbox.mockResolvedValue(issued);
                mocks.completeDelegateGrantAudit.mockRejectedValue(new Error('neo4j unavailable'));

                await expect(issue(ctx)).resolves.toEqual({
                    issuanceId: 'inbox-credential-1',
                    status: 'PENDING',
                    recipient,
                });
                expect(mocks.completeDelegateGrantAudit).toHaveBeenCalledTimes(1);
                expect(errorLog).toHaveBeenCalledTimes(1);

                errorLog.mockRestore();
            });

            it('a denial is still the fixed refusal when the audit write fails', async () => {
                const ctx = await delegateContext();
                const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);

                mocks.createDelegateGrantAudit.mockRejectedValue(new Error('neo4j unavailable'));

                expect(await outcomeOf(ctx, 'inbox.finalize')).toBe(refused);
                expect(mocks.createDelegateGrantAudit.mock.calls).toStrictEqual([
                    [
                        {
                            ...allowedRecord(),
                            decision: 'denied',
                            stage: 'route',
                            route: 'inbox.finalize',
                        },
                    ],
                ]);
                expect(errorLog).toHaveBeenCalledTimes(1);
                expect(mocks.completeDelegateGrantAudit).not.toHaveBeenCalled();

                errorLog.mockRestore();
            });
        });

        it('the act-as header changes nothing: the handler runs as the owner of the grant', async () => {
            // The path and scope of an open route, with a handler that shows what it is given.
            const asSeenByTheHandler = t.router({
                inbox: t.router({
                    issue: profileRoute
                        .meta({ requiredScope: 'inbox:write' })
                        .query(({ ctx }) => ctx.user),
                }),
            });
            const ownerOfTheGrant = {
                did: owner.did,
                profile: owner,
                isChallengeValid: true,
                scope: 'inbox:write',
                isAuthGrant: true,
                delegate: {
                    actorDid: signer.id.did(),
                    grantId: 'grant-1',
                    ownerProfileId: 'issuer',
                },
            };

            const plain = await delegateContext();
            const withHeader = await delegateContext([[ACT_AS_HEADER, 'managed-profile']]);
            // createContext drops the header for a delegate token; withDid must not rely on that.
            const withActAs: Context = { ...withHeader, actAs: 'managed-profile' };

            for (const ctx of [plain, withHeader, withActAs]) {
                expect(await asSeenByTheHandler.createCaller(ctx).inbox.issue()).toStrictEqual(
                    ownerOfTheGrant
                );
            }

            for (const path of openToADelegate) {
                expect(await outcomeOf(withActAs, path), path).toMatch(/^BAD_REQUEST: /);
            }

            expectNoProfileLookup();
        });
    });
});
