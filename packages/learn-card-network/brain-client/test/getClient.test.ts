import { describe, it, expect, vi, beforeEach } from 'vitest';

import { getClient } from '../src/index';

const CHALLENGES = ['challenge-1', 'challenge-2', 'challenge-3'];

type FetchCall = { url: string; init?: RequestInit };

/**
 * Stubs global fetch with a tRPC-compatible handler that serves
 * utilities.getChallenges and utilities.health responses, and counts calls.
 */
const stubFetch = (options?: { failHealthWith401Times?: number }) => {
    const calls: FetchCall[] = [];
    let healthFailuresRemaining = options?.failHealthWith401Times ?? 0;

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
                // Delay so overlapping requests genuinely race on the challenge fetch
                await new Promise(resolve => setTimeout(resolve, 10));

                return new Response(
                    JSON.stringify(
                        Array.from({ length: size }, () => ({ result: { data: CHALLENGES } }))
                    ),
                    { status: 200, headers: { 'content-type': 'application/json' } }
                );
            }

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

    return { calls, challengeCalls };
};

describe('getClient challenge fetching', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
    });

    it('does not fetch challenges at construction', async () => {
        const { challengeCalls } = stubFetch();

        await getClient('https://example.com/api', async challenge => `jwt:${challenge ?? ''}`);

        // Give any stray eager prefetch a chance to fire
        await new Promise(resolve => setTimeout(resolve, 25));

        expect(challengeCalls()).toHaveLength(0);
    });

    it('fetches challenges once on first request and uses one per request', async () => {
        const { challengeCalls } = stubFetch();

        const didAuthFunction = vi.fn(async (challenge?: string) => `jwt:${challenge ?? 'none'}`);
        const client = await getClient('https://example.com/api', didAuthFunction);

        await client.utilities.healthCheck.query();

        expect(challengeCalls()).toHaveLength(1);
        expect(didAuthFunction).toHaveBeenLastCalledWith(CHALLENGES[CHALLENGES.length - 1]);

        // Second request should reuse the existing pool without refetching
        await client.utilities.healthCheck.query();

        expect(challengeCalls()).toHaveLength(1);
    });

    it('only fetches challenges once for concurrent first requests', async () => {
        const { challengeCalls } = stubFetch();

        const client = await getClient(
            'https://example.com/api',
            async challenge => `jwt:${challenge ?? ''}`
        );

        // Fire two requests in separate macrotasks so they land in separate HTTP batches,
        // both while the (delayed) challenge fetch is still in flight
        const first = client.utilities.healthCheck.query();
        await new Promise(resolve => setTimeout(resolve, 0));
        const second = client.utilities.healthCheck.query();

        await Promise.all([first, second]);

        expect(challengeCalls()).toHaveLength(1);
    });

    it('refetches challenges after a 401 and retries the request', async () => {
        const { calls, challengeCalls } = stubFetch({ failHealthWith401Times: 1 });

        const client = await getClient(
            'https://example.com/api',
            async challenge => `jwt:${challenge ?? ''}`
        );

        const result = await client.utilities.healthCheck.query();

        expect(result).toEqual('OK');

        // 1 initial fetch + 1 refetch triggered by the 401 retry path
        expect(challengeCalls()).toHaveLength(2);

        const healthCalls = calls.filter(call => call.url.includes('healthCheck'));
        expect(healthCalls).toHaveLength(2);
    });
});
