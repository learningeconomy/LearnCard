import { z } from 'zod';

import { t, openRoute } from '@routes';
import cache from '@cache';

import { E2E_PUSH_ATTEMPT_CACHE_PREFIX } from './notifications';

/**
 * E2E-only observability routes (LC-2117/LC-2136). Registered on the app router only
 * when IS_E2E_TEST is set — mirrors the brain-service `testRouter` pattern. Lets
 * cross-service tests assert push-delivery throttling decisions without real FCM
 * delivery.
 */
export const testRouter = t.router({
    pushAttempts: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/test/push-attempts',
                tags: ['Test'],
                summary: 'Get recorded E2E push attempts',
                description:
                    'Returns the push attempts recorded by the E2E probe in the notifications route.',
            },
        })
        .input(z.void())
        .output(
            z.array(
                z.object({
                    type: z.string(),
                    toDid: z.string(),
                    at: z.string(),
                    refreshId: z.string().optional(),
                    routeKey: z.string().optional(),
                    deliveryKey: z.string().optional(),
                    version: z.number().optional(),
                })
            )
        )
        .query(async () => {
            const keys = await cache.keys(`${E2E_PUSH_ATTEMPT_CACHE_PREFIX}*`);

            if (!keys) return [];

            const attempts = await Promise.all(
                keys.map(async key => {
                    const raw = await cache.get(key);

                    if (!raw) return null;

                    try {
                        return JSON.parse(raw) as {
                            type: string;
                            toDid: string;
                            at: string;
                            refreshId?: string;
                            routeKey?: string;
                            deliveryKey?: string;
                            version?: number;
                        };
                    } catch {
                        return null;
                    }
                })
            );

            return attempts.filter(
                (attempt): attempt is NonNullable<typeof attempt> => attempt !== null
            );
        }),
});

export type TestRouter = typeof testRouter;
