import { afterEach, describe, expect, it, vi } from 'vitest';
import { initTRPC } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { BoostExclusionValidator, PaginationOptionsValidator } from '@learncard/types';

import { RegExpTransformer } from '../../../learn-card-helpers/src';
import { getApiTokenClient } from '../src';

describe('boost exclusions over tRPC', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('preserves literal slash-delimited strings while still accepting regex exclusions', async () => {
        const received: unknown[] = [];
        const t = initTRPC.create({
            transformer: {
                input: RegExpTransformer,
                output: { serialize: value => value, deserialize: value => value },
            },
        });
        const router = t.router({
            boost: t.router({
                getPaginatedBoosts: t.procedure
                    .input(
                        PaginationOptionsValidator.extend({
                            limit: PaginationOptionsValidator.shape.limit.default(25),
                            exclude: BoostExclusionValidator.optional(),
                        })
                    )
                    .query(({ input }) => {
                        received.push(input.exclude);
                        return { records: [], hasMore: false };
                    }),
            }),
        });

        vi.stubGlobal('fetch', (url: string | URL, init?: RequestInit) =>
            fetchRequestHandler({
                endpoint: '/api',
                req: new Request(url, init),
                router,
                createContext: () => ({}),
                allowMethodOverride: true,
            })
        );

        const client = await getApiTokenClient('https://example.com/api', 'token');
        await client.boost.getPaginatedBoosts.query({
            exclude: { name: '/Math/ig', category: { $in: ['/Art/', '/Music/i'] } },
        });
        await client.boost.getPaginatedBoosts.query({
            exclude: { name: { $regex: /Math/i } },
        });

        expect(received).toEqual([
            { name: '/Math/ig', category: { $in: ['/Art/', '/Music/i'] } },
            { name: { $regex: /Math/i } },
        ]);
    });
});
