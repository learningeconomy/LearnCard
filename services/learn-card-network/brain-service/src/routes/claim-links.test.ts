import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { resolveTenantFromRequest } from '@learncard/email-templates';

const mocks = vi.hoisted(() => ({
    availability: vi.fn(),
    recover: vi.fn(),
    reserve: vi.fn(),
    release: vi.fn(),
    issue: vi.fn(),
    use: vi.fn(),
    failed: vi.fn(),
    claimed: vi.fn(),
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
    useClaimLinkForBoost: mocks.use,
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
    logCredentialFailed: mocks.failed,
    logCredentialClaimed: mocks.claimed,
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
    mocks.use.mockResolvedValue(undefined);
    mocks.failed.mockResolvedValue(undefined);
    mocks.claimed.mockResolvedValue('activity');
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

    it.each([
        {
            failure: new TypeError('private redis payload'),
            diagnostics: { name: 'TypeError' },
        },
        {
            failure: new TRPCError({
                code: 'TIMEOUT',
                message: 'private redis payload',
                cause: Object.assign(new Error('private signing seed'), {
                    credential: 'private credential payload',
                }),
            }),
            diagnostics: { name: 'TRPCError', code: 'TIMEOUT' },
        },
    ])(
        'returns a legacy credential URI with safe $diagnostics.name accounting diagnostics',
        async ({ failure, diagnostics }) => {
            const credentialUri = 'lc:credential:issued';
            mocks.issue.mockResolvedValue(credentialUri);
            mocks.use.mockRejectedValue(failure);
            const log = vi.spyOn(console, 'error').mockImplementation(() => {});
            const result = await boostsRouter.createCaller(context()).claimBoostWithLink({
                boostUri: input.boostUri,
                challenge: input.challenge,
            });
            expect(result).toBe(credentialUri);
            expect(mocks.claimed).toHaveBeenCalledOnce();
            expect(mocks.failed).not.toHaveBeenCalled();
            expect(log).toHaveBeenCalledWith(expect.any(String), diagnostics);
            expect(JSON.stringify(log.mock.calls)).not.toContain('private');
        }
    );

    it('records a correlated failure for definite issuance rejection', async () => {
        const issuanceFailure = new Error('signing authority unavailable');
        mocks.issue.mockRejectedValue(issuanceFailure);
        await expect(
            boostsRouter.createCaller(context()).claimBoostWithLink(input)
        ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR', cause: issuanceFailure });
        expect(mocks.failed).toHaveBeenCalledWith(
            expect.objectContaining({
                activityId: 'activity',
                actorProfileId: 'learner',
                recipientProfileId: 'learner',
                boostUri: input.boostUri,
                source: 'claimLink',
            })
        );
    });

    it.each(['legacy', 'recoverable'] as const)(
        'classifies an uncertain %s storage outcome without falsely terminating recoverable work',
        async mode => {
            mocks.issue.mockImplementation(
                async (_boost, _domain, _issuer, _profile, _sa, _id, started) => {
                    started();
                    throw new Error('storage outcome uncertain');
                }
            );
            await expect(
                boostsRouter.createCaller(context()).claimBoostWithLink({
                    ...input,
                    requestId: mode === 'recoverable' ? input.requestId : undefined,
                })
            ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
            expect(mocks.failed).toHaveBeenCalledTimes(mode === 'legacy' ? 1 : 0);
        }
    );

    it('records failure for rejected storage and preserves error on cleanup failure', async () => {
        const { ClaimLinkStorageRejectedError } = await import('@helpers/boost.helpers');
        const rejection = new ClaimLinkStorageRejectedError(
            Object.assign(new Error('private storage details'), {
                credential: 'private credential payload',
            })
        );
        const log = vi.spyOn(console, 'error').mockImplementation(() => {});
        mocks.issue.mockImplementation(
            async (_boost, _domain, _issuer, _profile, _sa, _id, started) => {
                started();
                throw rejection;
            }
        );
        mocks.release.mockRejectedValue(new Error('private cleanup details'));
        await expect(
            boostsRouter.createCaller(context()).claimBoostWithLink(input)
        ).rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR', cause: rejection });
        expect(mocks.failed).toHaveBeenCalledWith(
            expect.objectContaining({ activityId: 'activity', source: 'claimLink' })
        );
        expect(log).toHaveBeenCalledWith(expect.any(String), {
            name: 'ClaimLinkStorageRejectedError',
            message: rejection.message,
        });
        expect(JSON.stringify(log.mock.calls)).not.toContain('private');
    });
});
