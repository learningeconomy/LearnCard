import { z } from 'zod';

import { getChallenges } from '@helpers/challenges.helpers';
import { getCache } from '@helpers/redis.helpers';

import { t, openRoute, didRoute } from '@routes';

const cache = getCache();

export const utilitiesRouter = t.router({
    healthCheck: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/health-check',
                tags: ['Utilities'],
                summary: 'Check health of endpoint',
                description: 'Check if the endpoint is healthy and well',
            },
        })
        .input(z.void())
        .output(z.string())
        .query(async () => {
            return 'Healthy and well!';
        }),

    getChallenges: didRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/challenges',
                tags: ['Utilities'],
                summary: 'Request a list of valid challenges',
                description:
                    'Generates an arbitrary number of valid challenges for a did, then returns them',
            },
        })
        .input(z.object({ amount: z.number().int().positive().lte(100).default(100) }).default({}))
        .output(z.string().array())
        .query(async ({ input, ctx }) => {
            const challenges = getChallenges(input.amount);

            const did = ctx.user.did;

            await Promise.all(
                challenges.map(async challenge => cache.set(`${did}|${challenge}`, 'valid'))
            );

            return challenges;
        }),
});
export type UtilitiesRouter = typeof utilitiesRouter;