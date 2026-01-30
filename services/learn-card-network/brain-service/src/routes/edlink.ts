import { z } from 'zod';
import {
    EdlinkConnectionValidator,
    EdlinkConnection,
    EdlinkCompletionsResponseValidator,
} from '@learncard/types';

import { t, openRoute } from '@routes';
import {
    createEdlinkConnection,
    getEdlinkConnections,
    getEdlinkConnectionById,
    deleteEdlinkConnection,
} from '@accesslayer/edlink-connection';
import { getEdlinkCompletions } from '@helpers/edlink.helpers';

export const edlinkRouter = t.router({
    createConnection: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/edlink/connections',
                tags: ['Edlink'],
                summary: 'Create an Ed.link connection',
            },
        })
        .input(EdlinkConnectionValidator)
        .output(EdlinkConnectionValidator)
        .mutation(async ({ input }) => {
            const connection = await createEdlinkConnection(input);
            return connection.dataValues as EdlinkConnection;
        }),

    getConnections: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/edlink/connections',
                tags: ['Edlink'],
                summary: 'Get all Ed.link connections',
            },
        })
        .input(z.void())
        .output(EdlinkConnectionValidator.array())
        .query(async () => {
            const connections = await getEdlinkConnections();
            return connections.map(c => c.dataValues as EdlinkConnection);
        }),

    deleteConnection: openRoute
        .meta({
            openapi: {
                method: 'DELETE',
                path: '/edlink/connections/{id}',
                tags: ['Edlink'],
                summary: 'Delete an Ed.link connection',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input }) => {
            return deleteEdlinkConnection(input.id);
        }),

    getCompletions: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/edlink/connections/{connectionId}/completions',
                tags: ['Edlink'],
                summary: 'Get assignment and course completions for a connection',
            },
        })
        .input(z.object({ connectionId: z.string() }))
        .output(EdlinkCompletionsResponseValidator)
        .query(async ({ input }) => {
            const connection = await getEdlinkConnectionById(input.connectionId);
            if (!connection) {
                throw new Error('Connection not found');
            }

            return getEdlinkCompletions(connection.dataValues.accessToken);
        }),
});

export type EdlinkRouter = typeof edlinkRouter;
