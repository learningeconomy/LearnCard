import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { GroupValidator } from '@learncard/types';

import { t, didAndChallengeRoute } from '@routes';
import { getGroupById, getGroupsOwnedByEcosystem, getChildGroups } from '@accesslayer/group/read';

export const groupsRouter = t.router({
    getGroup: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/group/{id}',
                tags: ['Groups'],
                summary: 'Get a Group by ID',
                description: 'Retrieves a single Group aggregate by its ID.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(GroupValidator.optional())
        .query(async ({ input }) => {
            const group = await getGroupById(input.id);

            if (!group) throw new TRPCError({ code: 'NOT_FOUND' });

            return group;
        }),

    getGroupsOwnedByEcosystem: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/group/owned-by/{ecosystemId}',
                tags: ['Groups'],
                summary: 'List Groups owned by an Ecosystem',
                description: 'Lists all Groups whose owner Ecosystem is the given ID (D12 rule 1).',
            },
        })
        .input(z.object({ ecosystemId: z.string() }))
        .output(z.array(GroupValidator))
        .query(async ({ input }) => {
            return getGroupsOwnedByEcosystem(input.ecosystemId);
        }),

    getChildGroups: didAndChallengeRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/group/{id}/children',
                tags: ['Groups'],
                summary: 'List child Groups',
                description: 'Lists the direct child Groups of the given parent Group.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(z.array(GroupValidator))
        .query(async ({ input }) => {
            return getChildGroups(input.id);
        }),
});

export type GroupsRouter = typeof groupsRouter;
