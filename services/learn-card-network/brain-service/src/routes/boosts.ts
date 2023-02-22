import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';

import { getBoostByUri, getBoostsForProfile } from '@accesslayer/boost/read';

import { getBoostUri } from '@helpers/boost.helpers';
import { BoostValidator } from 'types/boost';
import { getBoostOwner } from '@accesslayer/boost/relationships/read';
import { deleteBoost } from '@accesslayer/boost/delete';

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

    updateBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/boost/{uri}',
                tags: ['Boosts'],
                summary: 'Update a boost',
                description: 'This route updates a boost',
            },
        })
        .input(
            z.object({
                uri: z.string(),
                updates: BoostValidator.partial().omit({ id: true, boost: true }),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { profile } = ctx.user;

            const { uri, updates } = input;
            const { name } = updates;

            const boost = await getBoostByUri(uri);

            if (!boost) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find boost',
                });
            }

            const owner = await getBoostOwner(boost);

            if (owner?.profileId !== profile.profileId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own boost',
                });
            }

            if (name) boost.name = name;

            await boost.save();

            return true;
        }),

    deleteBoost: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/boost/{uri}',
                tags: ['Boosts'],
                summary: 'Delete a boost',
                description: 'This route deletes a boost',
            },
        })
        .input(z.object({ uri: z.string() }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            const { profile } = ctx.user;

            const { uri } = input;

            const boost = await getBoostByUri(uri);

            if (!boost) {
                throw new TRPCError({
                    code: 'NOT_FOUND',
                    message: 'Could not find boost',
                });
            }

            const owner = await getBoostOwner(boost);

            if (owner?.profileId !== profile.profileId) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Profile does not own boost',
                });
            }

            await deleteBoost(boost);

            return true;
        }),
});
export type BoostsRouter = typeof boostsRouter;
