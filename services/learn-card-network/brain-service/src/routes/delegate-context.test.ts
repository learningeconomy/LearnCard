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

// `inbox.issue` runs up to this call: whether it is made, and with what, is what is counted.
vi.mock('@helpers/inbox.helpers', async importOriginal => ({
    ...(await importOriginal<typeof import('@helpers/inbox.helpers')>()),
    issueToInbox: mocks.issueToInbox,
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
 * A DID-auth presentation as a JWT. A delegate signs over challenge and audience. Every other
 * caller signs over the challenge alone, and only such a token passes the legacy verification:
 * the tokens `WithoutAudience` are the delegate-prefixed ones the legacy path would accept.
 */
const sign = async (challenge: string, domain?: string): Promise<string> => {
    const jwt = await signer.invoke.getDidAuthVp({ challenge, domain, proofFormat: 'jwt' });

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

    const validDelegate = await sign(CHALLENGE, AUDIENCE);
    const bothPrefixes = `${DELEGATE_GRANT_CHALLENGE_PREFIX}${AUTH_GRANT_AUDIENCE_DOMAIN_PREFIX}7f3c9a52`;

    tokens = {
        validDelegate,
        invalidDelegate: changeOneSignatureCharacter(validDelegate),
        delegateWithoutAudience: await sign(CHALLENGE),
        delegateContainingLegacyPrefix: await sign(bothPrefixes, AUDIENCE),
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
        'every procedure of the service refuses a delegate token for which no grant is stored, with the one fixed message (%s)',
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
            // Only the two issuance routes get as far as the grant read, and only with a
            // verified presentation. Nothing is stored, so they refuse like every other route.
            expect(mocks.getDelegateAuthGrantByChallenge.mock.calls).toEqual(
                verified ? [[CHALLENGE], [CHALLENGE]] : []
            );
        },
        60_000
    );

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
        });

        it('every other procedure of the service still refuses, with the one fixed message', async () => {
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
            // The route decides first: none of them got as far as the grant read.
            expect(mocks.getDelegateAuthGrantByChallenge).not.toHaveBeenCalled();
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
