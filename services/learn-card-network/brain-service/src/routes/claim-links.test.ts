import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { resolveTenantFromRequest } from '@learncard/email-templates';

const mocks = vi.hoisted(() => ({
    availability: vi.fn(),
    recover: vi.fn(),
    reserve: vi.fn(),
    release: vi.fn(),
    issue: vi.fn(),
}));
const profile = {
    profileId: 'learner',
    did: 'did:key:learner',
    displayName: 'Learner',
    shortBio: '',
    bio: '',
};

vi.mock('@accesslayer/profile/read', async importOriginal => ({
    ...(await importOriginal<typeof import('@accesslayer/profile/read')>()),
    getProfileByDid: async () => profile,
}));
vi.mock('@cache/claim-links', async importOriginal => ({
    ...(await importOriginal<typeof import('@cache/claim-links')>()),
    getClaimLinkAvailability: mocks.availability,
    getClaimLinkSAInfoForBoost: async () => ({
        endpoint: 'https://signer.example.test',
        name: 'school',
    }),
    getClaimLinkGeneratorProfileId: async () => undefined,
    getClaimLinkGeneration: async () => 'generation',
}));
vi.mock('@accesslayer/claim-link-request', async importOriginal => ({
    ...(await importOriginal<typeof import('@accesslayer/claim-link-request')>()),
    recoverClaimLinkRequest: mocks.recover,
    reserveClaimLinkRequest: mocks.reserve,
    releaseClaimLinkRequestOwner: mocks.release,
}));
vi.mock('@accesslayer/boost/read', async importOriginal => ({
    ...(await importOriginal<typeof import('@accesslayer/boost/read')>()),
    getBoostByUri: async () => ({ dataValues: { id: 'one' } }),
}));
vi.mock('@accesslayer/boost/relationships/read', async importOriginal => ({
    ...(await importOriginal<typeof import('@accesslayer/boost/relationships/read')>()),
    getBoostOwner: async () => profile,
}));
vi.mock('@accesslayer/signing-authority/relationships/read', async importOriginal => ({
    ...(await importOriginal<typeof import('@accesslayer/signing-authority/relationships/read')>()),
    getSigningAuthorityForUserByName: async () => ({ relationship: { did: profile.did } }),
}));
vi.mock('@helpers/boost.helpers', async importOriginal => ({
    ...(await importOriginal<typeof import('@helpers/boost.helpers')>()),
    isBoostViewableByClaimLink: async () => true,
    issueClaimLinkBoost: mocks.issue,
}));
vi.mock('@helpers/activity.helpers', async importOriginal => ({
    ...(await importOriginal<typeof import('@helpers/activity.helpers')>()),
    logCredentialSent: async () => 'activity',
}));

import { boostsRouter } from './boosts';
import type { Context } from './index';

const input = {
    boostUri: 'lc:network:network.example.test/trpc:boost:one',
    challenge: 'controlled-challenge',
    requestId: 'operation-one',
};
const context = (): Context => ({
    domain: 'network.example.test',
    tenant: resolveTenantFromRequest({}),
    user: { did: profile.did, isChallengeValid: true, scope: '*:*' },
});
const request = (method: 'GET' | 'POST') =>
    new Request(
        `http://network.example.test/trpc/claimBoostWithLinkStatus${
            method === 'GET' ? `?input=${encodeURIComponent(JSON.stringify(input))}` : ''
        }`,
        {
            method,
            headers: { 'Content-Type': 'application/json' },
            ...(method === 'POST' ? { body: JSON.stringify(input) } : {}),
        }
    );

beforeEach(() => {
    vi.resetAllMocks();
    mocks.availability.mockResolvedValue('available');
    mocks.recover.mockResolvedValue({ status: 'absent' });
    mocks.reserve.mockResolvedValue({ acquired: true });
    mocks.release.mockResolvedValue(undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('claim-link reconciliation transport and compatibility', () => {
    it('rejects safe-method prefetch without finalizing, but allows authenticated POST finalization', async () => {
        let accepted = false;
        mocks.recover.mockImplementation(async () => {
            accepted = true;
            return { status: 'complete', credentialUri: 'lc:credential:existing' };
        });
        const handle = (req: Request) =>
            fetchRequestHandler({
                endpoint: '/trpc',
                req,
                router: boostsRouter,
                createContext: context,
            });
        expect((await handle(request('GET'))).status).toBe(405);
        expect(accepted).toBe(false);
        const posted = await handle(request('POST'));
        expect(posted.status).toBe(200);
        expect(accepted).toBe(true);
        expect(await posted.json()).toMatchObject({
            result: { data: { status: 'complete', credentialUri: 'lc:credential:existing' } },
        });
    });

    it('requires authentication before POST reconciliation', async () => {
        const response = await fetchRequestHandler({
            endpoint: '/trpc',
            req: request('POST'),
            router: boostsRouter,
            createContext: () => ({ ...context(), user: undefined }),
        });
        expect(response.status).toBe(401);
    });

    it.each(['exhausted', 'unavailable'])(
        'preserves legacy %s errors consumed by ScoutPass',
        async availability => {
            mocks.availability.mockResolvedValue(availability);
            await expect(
                boostsRouter.createCaller(context()).claimBoostWithLink({
                    boostUri: input.boostUri,
                    challenge: input.challenge,
                })
            ).rejects.toMatchObject({
                code: 'NOT_FOUND',
                // This prefix is a legacy consumer contract, not incidental UI wording.
                message: expect.stringContaining('Challenge not found'),
            });
        }
    );

    it('keeps explicit availability errors for recoverable operations', async () => {
        mocks.availability.mockResolvedValue('unavailable');
        await expect(
            boostsRouter.createCaller(context()).claimBoostWithLink(input)
        ).rejects.toMatchObject({ code: 'PRECONDITION_FAILED' });
    });

    it('preserves the original issuance error when ownership cleanup also fails', async () => {
        const issuanceFailure = new Error('signing authority unavailable');
        mocks.issue.mockRejectedValue(issuanceFailure);
        mocks.release.mockRejectedValue(new Error('cleanup connection lost'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        await expect(
            boostsRouter.createCaller(context()).claimBoostWithLink(input)
        ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR', cause: issuanceFailure });
    });
});
