import { z } from 'zod';

import { t, profileRoute } from '@routes';

import { getBoostsForProfile } from '@accesslayer/boost/read';

import { getBoostUri } from '@helpers/boost.helpers';

export const boostsRouter = t.router({
    getBoosts: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/boost',
                tags: ['Boosts'],
                summary: 'Get boosts',
                description: "This endpoint gets the current user's boosts",
            },
        })
        .input(z.void())
        .output(z.object({ uri: z.string(), name: z.string().optional() }).array())
        .query(async ({ ctx }) => {
            const { profile } = ctx.user;

            const boosts = await getBoostsForProfile(profile);

            return boosts.map(boost => ({
                name: boost.name,
                uri: getBoostUri(boost.id, ctx.domain),
            }));
        }),
});
export type BoostsRouter = typeof boostsRouter;
