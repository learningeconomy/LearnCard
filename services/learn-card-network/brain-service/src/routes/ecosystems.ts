import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { EcosystemValidator } from '@learncard/types';

import { t, didAndChallengeRoute } from '@routes';
import {
    getEcosystemById,
    getChildEcosystems,
    getRootEcosystemsForTenant,
} from '@accesslayer/ecosystem/read';

export const ecosystemsRouter = t.router({
    getEcosystem: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/ecosystem/{id}',
                tags: ['Ecosystems'],
                summary: 'Get an Ecosystem by ID',
                description: 'Retrieves a single Ecosystem aggregate by its ID.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(EcosystemValidator.optional())
        .query(async ({ input }) => {
            const ecosystem = await getEcosystemById(input.id);

            if (!ecosystem) throw new TRPCError({ code: 'NOT_FOUND' });

            return ecosystem;
        }),

    getChildEcosystems: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/ecosystem/{id}/children',
                tags: ['Ecosystems'],
                summary: 'List child Ecosystems',
                description: 'Lists the direct child Ecosystems of the given parent.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(z.array(EcosystemValidator))
        .query(async ({ input }) => {
            return getChildEcosystems(input.id);
        }),

    getRootEcosystems: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/ecosystem/root/{rootEcosystemId}',
                tags: ['Ecosystems'],
                summary: 'List Ecosystems within a tenant root tree',
                description: 'Lists all Ecosystems sharing the given root Ecosystem ID.',
            },
        })
        .input(z.object({ rootEcosystemId: z.string() }))
        .output(z.array(EcosystemValidator))
        .query(async ({ input }) => {
            return getRootEcosystemsForTenant(input.rootEcosystemId);
        }),
});

export type EcosystemsRouter = typeof ecosystemsRouter;
