import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getClient } from '../src/index';

const CHALLENGES = ['challenge-1', 'challenge-2', 'challenge-3'];

type FetchCall = { url: string; init?: RequestInit };

/**
 * Stubs global fetch with a tRPC-compatible handler that serves
 * utilities.getChallenges and utilities.health responses, and counts calls.
 */
const stubFetch = (options?: {
    challengeGate?: Promise<void>;
    challenges?: string[];
    failHealthWith401Times?: number;
    healthGate?: Promise<void>;
}) => {
    const calls: FetchCall[] = [];
    const challenges = options?.challenges ?? CHALLENGES;
    let healthFailuresRemaining = options?.failHealthWith401Times ?? 0;
    const { promise: challengeRequested, resolve: markChallengeRequested } =
        Promise.withResolvers<void>();
    const { promise: secondChallengeRequested, resolve: markSecondChallengeRequested } =
        Promise.withResolvers<void>();
    const { promise: healthRequested, resolve: markHealthRequested } =
        Promise.withResolvers<void>();

    const challengeCalls = () => calls.filter(call => call.url.includes('getChallenges'));

    // tRPC batches procedures into one request as "proc1,proc2?batch=1" — one result per item
    const batchSize = (urlString: string): number => {
        const path = new URL(urlString).pathname.split('/').pop() ?? '';
        return path.split(',').length;
    };

    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
            const urlString = url.toString();
            calls.push({ url: urlString, init });

            const size = batchSize(urlString);

            if (urlString.includes('getChallenges')) {
                const challengeCallCount = challengeCalls().length;
                if (challengeCallCount === 1) markChallengeRequested();
                if (challengeCallCount === 2) markSecondChallengeRequested();
                if (options?.challengeGate) await options.challengeGate;

                return new Response(
                    JSON.stringify(
                        Array.from({ length: size }, () => ({ result: { data: challenges } }))
                    ),
                    { status: 200, headers: { 'content-type': 'application/json' } }
                );
            }

            markHealthRequested();
            if (options?.healthGate) await options.healthGate;

            if (healthFailuresRemaining > 0) {
                healthFailuresRemaining -= 1;

                return new Response(
                    JSON.stringify(
                        Array.from({ length: size }, () => ({
                            error: {
                                message: 'Unauthorized',
                                code: -32001,
                                data: {
                                    code: 'UNAUTHORIZED',
                                    httpStatus: 401,
                                    path: 'utilities.healthCheck',
                                },
                            },
                        }))
                    ),
                    { status: 401, headers: { 'content-type': 'application/json' } }
                );
            }

            return new Response(
                JSON.stringify(Array.from({ length: size }, () => ({ result: { data: 'OK' } }))),
                { status: 200, headers: { 'content-type': 'application/json' } }
            );
        })
    );

    return {
        calls,
        challengeCalls,
        challengeRequested,
        healthRequested,
        secondChallengeRequested,
    };
};

describe('getClient challenge fetching', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    it('prefetches challenges at construction', async () => {
        const { challengeCalls, challengeRequested } = stubFetch();

        await getClient('https://example.com/api', async challenge => `jwt:${challenge ?? ''}`);
        await challengeRequested;

        expect(challengeCalls()).toHaveLength(1);
    });

    it('shares the eager in-flight prefetch with the first request', async () => {
        const challengeGate = Promise.withResolvers<void>();
        const { challengeCalls, challengeRequested } = stubFetch({
            challengeGate: challengeGate.promise,
        });
        const didAuthFunction = vi.fn(async (challenge?: string) => `jwt:${challenge ?? 'none'}`);
        const client = await getClient('https://example.com/api', didAuthFunction);

        await challengeRequested;
        const firstRequest = client.utilities.healthCheck.query();

        expect(challengeCalls()).toHaveLength(1);

        challengeGate.resolve();
        await firstRequest;

        expect(didAuthFunction).toHaveBeenLastCalledWith(CHALLENGES[CHALLENGES.length - 1]);

        await client.utilities.healthCheck.query();

        expect(challengeCalls()).toHaveLength(1);
    });

    it('only fetches challenges once for concurrent first requests', async () => {
        const challengeGate = Promise.withResolvers<void>();
        const { challengeCalls, challengeRequested } = stubFetch({
            challengeGate: challengeGate.promise,
        });
        const client = await getClient(
            'https://example.com/api',
            async challenge => `jwt:${challenge ?? ''}`
        );

        await challengeRequested;
        const first = client.utilities.healthCheck.query();
        const second = client.utilities.healthCheck.query();
        challengeGate.resolve();

        await Promise.all([first, second]);

        expect(challengeCalls()).toHaveLength(1);
    });

    it('refills when concurrent requests exhaust the shared pool', async () => {
        const healthGate = Promise.withResolvers<void>();
        const { challengeCalls, challengeRequested, healthRequested, secondChallengeRequested } =
            stubFetch({
                challenges: ['only-challenge'],
                healthGate: healthGate.promise,
            });
        const didAuthFunction = vi.fn(async (challenge?: string) => `jwt:${challenge ?? 'none'}`);
        const client = await getClient('https://example.com/api', didAuthFunction);

        await challengeRequested;
        const first = client.utilities.healthCheck.query();
        await healthRequested;
        const second = client.utilities.healthCheck.query();
        await secondChallengeRequested;
        healthGate.resolve();

        await Promise.all([first, second]);

        expect(challengeCalls()).toHaveLength(2);
        expect(didAuthFunction.mock.calls.slice(1).map(([challenge]) => challenge)).toEqual([
            'only-challenge',
            'only-challenge',
        ]);
    });

    it('rejects an empty shared refill explicitly', async () => {
        const challengeGate = Promise.withResolvers<void>();
        const { challengeRequested } = stubFetch({
            challengeGate: challengeGate.promise,
            challenges: [],
        });
        const client = await getClient(
            'https://example.com/api',
            async challenge => `jwt:${challenge ?? ''}`
        );

        await challengeRequested;
        const request = client.utilities.healthCheck.query();
        challengeGate.resolve();

        await expect(request).rejects.toThrow('Challenge refill returned no challenges');
    });

    it('refetches challenges after a 401 and retries the request', async () => {
        const { calls, challengeCalls } = stubFetch({ failHealthWith401Times: 1 });

        const client = await getClient(
            'https://example.com/api',
            async challenge => `jwt:${challenge ?? ''}`
        );

        const result = await client.utilities.healthCheck.query();

        expect(result).toEqual('OK');
        expect(challengeCalls()).toHaveLength(2);

        const healthCalls = calls.filter(call => call.url.includes('healthCheck'));
        expect(healthCalls).toHaveLength(2);
    });
});
