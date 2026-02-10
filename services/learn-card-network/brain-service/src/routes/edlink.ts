import { z } from 'zod';
import {
    EdlinkConnectionValidator,
    EdlinkConnection,
    EdlinkCompletionsResponseValidator,
    EdlinkIssuedCredentialValidator,
} from '@learncard/types';

import { t, openRoute } from '@routes';
import {
    createEdlinkConnection,
    getEdlinkConnections,
    getEdlinkConnectionById,
    deleteEdlinkConnection,
    updateEdlinkConnectionAutoIssue,
    updateEdlinkConnectionOwner,
} from '@accesslayer/edlink-connection';
import {
    getIssuedCredentialsForConnection,
    countIssuedCredentialsForConnection,
    deleteEdlinkIssuedCredential,
    deleteAllIssuedCredentialsForConnection,
} from '@accesslayer/edlink-issued-credential';
import { getEdlinkCompletions } from '@helpers/edlink.helpers';
import { processConnectionById } from '@services/edlink-polling.service';

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

    // =============================================================================
    // Auto-Issuance Management
    // =============================================================================

    setOwner: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/edlink/connections/{connectionId}/owner',
                tags: ['Edlink'],
                summary: 'Set the owner profile for a connection',
                description:
                    'Sets the owner profile ID for a connection. The owner must have a signing authority registered for auto-issuance to work.',
            },
        })
        .input(
            z.object({
                connectionId: z.string(),
                ownerProfileId: z.string(),
            })
        )
        .output(EdlinkConnectionValidator)
        .mutation(async ({ input }) => {
            const connection = await updateEdlinkConnectionOwner(
                input.connectionId,
                input.ownerProfileId
            );
            if (!connection) {
                throw new Error('Connection not found');
            }
            return connection.dataValues as EdlinkConnection;
        }),

    toggleAutoIssue: openRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/edlink/connections/{connectionId}/auto-issue',
                tags: ['Edlink'],
                summary: 'Toggle automatic credential issuance',
                description:
                    'Enables or disables automatic credential issuance for a connection.',
            },
        })
        .input(
            z.object({
                connectionId: z.string(),
                enabled: z.boolean(),
            })
        )
        .output(EdlinkConnectionValidator)
        .mutation(async ({ input }) => {
            // Verify connection exists
            const existing = await getEdlinkConnectionById(input.connectionId);
            if (!existing) {
                throw new Error('Connection not found');
            }

            const connection = await updateEdlinkConnectionAutoIssue(
                input.connectionId,
                input.enabled
            );
            if (!connection) {
                throw new Error('Failed to update connection');
            }

            // Trigger instant issuance when enabling auto-issue
            if (input.enabled) {
                try {
                    const result = await processConnectionById(input.connectionId);
                    console.log(
                        `[Edlink] Instant issuance triggered: issued=${result.issued}, skipped=${result.skipped}, failed=${result.failed}`
                    );
                } catch (error) {
                    console.error('[Edlink] Instant issuance failed:', error);
                    // Don't fail the toggle - just log the error
                }
            }

            return connection.dataValues as EdlinkConnection;
        }),

    getIssuedCredentials: openRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/edlink/connections/{connectionId}/issued-credentials',
                tags: ['Edlink'],
                summary: 'Get issued credentials for a connection',
                description: 'Lists all credentials that have been automatically issued for a connection.',
            },
        })
        .input(
            z.object({
                connectionId: z.string(),
                limit: z.number().min(1).max(100).optional().default(50),
                offset: z.number().min(0).optional().default(0),
            })
        )
        .output(
            z.object({
                records: EdlinkIssuedCredentialValidator.array(),
                count: z.number(),
                hasMore: z.boolean(),
            })
        )
        .query(async ({ input }) => {
            const { connectionId, limit, offset } = input;

            const [records, count] = await Promise.all([
                getIssuedCredentialsForConnection(connectionId, { limit, offset }),
                countIssuedCredentialsForConnection(connectionId),
            ]);

            return {
                records: records.map(r => r.dataValues),
                count,
                hasMore: offset + records.length < count,
            };
        }),

    // =============================================================================
    // Dev/Debug Routes
    // =============================================================================

    deleteIssuedCredential: openRoute
        .meta({
            openapi: {
                method: 'DELETE',
                path: '/edlink/issued-credentials/{id}',
                tags: ['Edlink'],
                summary: 'Delete an issued credential record (dev/debug)',
                description: 'Deletes an issued credential record to allow re-issuance. For development/debugging only.',
            },
        })
        .input(z.object({ id: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input }) => {
            return deleteEdlinkIssuedCredential(input.id);
        }),

    deleteAllIssuedCredentials: openRoute
        .meta({
            openapi: {
                method: 'DELETE',
                path: '/edlink/connections/{connectionId}/issued-credentials',
                tags: ['Edlink'],
                summary: 'Delete all issued credential records for a connection (dev/debug)',
                description: 'Deletes all issued credential records for a connection to allow re-issuance. For development/debugging only.',
            },
        })
        .input(z.object({ connectionId: z.string() }))
        .output(z.number())
        .mutation(async ({ input }) => {
            return deleteAllIssuedCredentialsForConnection(input.connectionId);
        }),
});

export type EdlinkRouter = typeof edlinkRouter;
