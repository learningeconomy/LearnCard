import { describe, it, expect, vi, beforeEach } from 'vitest';
import { observable } from '@trpc/server/observable';

import { callbackLink } from '../src/callbackLink';
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
    failChallengeNetwork?: boolean;
    failHealthNetwork?: boolean;
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
                if (options?.failChallengeNetwork)
                    throw new Error('Challenge network unavailable.');
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
            if (options?.failHealthNetwork) throw new Error('Network unavailable.');

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

    it('defers challenge requests until the first authenticated operation', async () => {
        const { challengeCalls } = stubFetch();
        const client = await getClient(
            'https://example.com/api',
            async challenge => `jwt:${challenge ?? ''}`
        );

        expect(challengeCalls()).toHaveLength(0);

        await client.utilities.healthCheck.query();

        expect(challengeCalls()).toHaveLength(1);
    });

    it('shares the lazy in-flight refill with the first request', async () => {
        const challengeGate = Promise.withResolvers<void>();
        const { challengeCalls, challengeRequested } = stubFetch({
            challengeGate: challengeGate.promise,
        });
        const didAuthFunction = vi.fn(async (challenge?: string) => `jwt:${challenge ?? 'none'}`);
        const client = await getClient('https://example.com/api', didAuthFunction);

        const firstRequest = client.utilities.healthCheck.query();
        await challengeRequested;

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

        const first = client.utilities.healthCheck.query();
        const second = client.utilities.healthCheck.query();
        await challengeRequested;
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

        const first = client.utilities.healthCheck.query();
        await challengeRequested;
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

        const request = client.utilities.healthCheck.query();
        await challengeRequested;
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

    it('owns challenge transport failures while preparing authenticated headers', async () => {
        const { challengeRequested } = stubFetch({ failChallengeNetwork: true });
        const unhandledRejection = vi.fn();
        process.on('unhandledRejection', unhandledRejection);

        try {
            const client = await getClient(
                'https://example.com/api',
                async challenge => `jwt:${challenge ?? ''}`
            );
            const request = client.utilities.healthCheck.query();
            await challengeRequested;

            await expect(request).rejects.toThrow('Challenge network unavailable.');
            const { promise: nextEventLoopTurn, resolve } = Promise.withResolvers<void>();
            setImmediate(resolve);
            await nextEventLoopTurn;

            expect(unhandledRejection).not.toHaveBeenCalled();
        } finally {
            process.off('unhandledRejection', unhandledRejection);
        }
    });

    it('propagates transport failures without creating an unhandled rejection', async () => {
        const { challengeRequested } = stubFetch({ failHealthNetwork: true });
        const unhandledRejection = vi.fn();
        process.on('unhandledRejection', unhandledRejection);

        try {
            const client = await getClient(
                'https://example.com/api',
                async challenge => `jwt:${challenge ?? ''}`
            );
            const request = client.utilities.healthCheck.query();
            await challengeRequested;

            await expect(request).rejects.toThrow('Network unavailable.');
            const { promise: nextEventLoopTurn, resolve } = Promise.withResolvers<void>();
            setImmediate(resolve);
            await nextEventLoopTurn;

            expect(unhandledRejection).not.toHaveBeenCalled();
        } finally {
            process.off('unhandledRejection', unhandledRejection);
        }
    });
    it('forwards completion and tears down the upstream subscription once', () => {
        const upstreamCleanup = vi.fn();
        const complete = vi.fn();
        const next = vi.fn(() =>
            observable(observer => {
                observer.next({ result: { data: 'OK' } } as never);
                observer.complete();

                return upstreamCleanup;
            })
        );
        const link = callbackLink(async () => undefined)({} as never);
        const subscription = link({
            op: {} as never,
            next,
        }).subscribe({
            next: vi.fn(),
            error: vi.fn(),
            complete,
        });

        expect(complete).toHaveBeenCalledOnce();

        subscription.unsubscribe();

        expect(upstreamCleanup).toHaveBeenCalledOnce();
    });
});
