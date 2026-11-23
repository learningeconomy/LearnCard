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

import { DELEGATE_GRANT_CHALLENGE_PREFIX } from '@helpers/delegate-auth-grant.schema';
import { getLearnCard } from '@helpers/learnCard.helpers';
import type { SeedLearnCard } from '@helpers/learnCard.helpers';

import { appRouter } from '../app';
import {
    createContext,
    DELEGATE_REQUEST_REFUSED_MESSAGE,
    didRoute,
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
        'every procedure of the service refuses a request that carries a delegate token, with the one fixed message (%s)',
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
        },
        60_000
    );
});
