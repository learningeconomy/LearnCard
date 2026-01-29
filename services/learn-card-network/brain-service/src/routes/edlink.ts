import { z } from 'zod';
import { EdlinkConnectionValidator, EdlinkConnection } from '@learncard/types';

import { t, openRoute } from '@routes';
import {
    createEdlinkConnection,
    getEdlinkConnections,
    deleteEdlinkConnection,
} from '@accesslayer/edlink-connection';

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
});

export type EdlinkRouter = typeof edlinkRouter;
