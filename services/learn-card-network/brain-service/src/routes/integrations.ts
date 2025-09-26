import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';

import { createIntegration } from '@accesslayer/integration/create';
import { readIntegrationById, getIntegrationsForProfile, countIntegrationsForProfile } from '@accesslayer/integration/read';
import { updateIntegration as updateIntegrationAccess } from '@accesslayer/integration/update';
import { deleteIntegration as deleteIntegrationAccess } from '@accesslayer/integration/delete';
import { associateIntegrationWithProfile, associateIntegrationWithSigningAuthority } from '@accesslayer/integration/relationships/create';
import { isIntegrationAssociatedWithProfile } from '@accesslayer/integration/relationships/read';
import {
    LCNIntegrationValidator,
    LCNIntegrationCreateValidator,
    LCNIntegrationUpdateValidator,
    LCNIntegrationQueryValidator,
    PaginatedLCNIntegrationsValidator,
} from '@learncard/types';
import { getSigningAuthoritiesForIntegration, getSigningAuthorityForUserByName } from '@accesslayer/signing-authority/relationships/read';

export const integrationsRouter = t.router({
    addIntegration: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/integration/create',
                tags: ['Integrations'],
                summary: 'Create Integration',
                description: 'Create a new Integration for your profile',
            },
            requiredScope: 'integrations:write',
        })
        .input(LCNIntegrationCreateValidator)
        .output(z.string())
        .mutation(async ({ input, ctx }) => {
            try {
                const integration = await createIntegration(input);

                await associateIntegrationWithProfile(integration.id, ctx.user.profile.profileId);

                return integration.id;
            } catch (error) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Failed to create Integration',
                });
            }
        }),

    getIntegration: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/integration/{id}',
                tags: ['Integrations'],
                summary: 'Get Integration',
                description: 'Get an Integration by id',
            },
            requiredScope: 'integrations:read',
        })
        .input(z.object({ id: z.string() }))
        .output(LCNIntegrationValidator.optional())
        .query(async ({ input, ctx }) => {
            const associated = await isIntegrationAssociatedWithProfile(
                input.id,
                ctx.user.profile.profileId
            );

            if (!associated) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'This Integration is not associated with you!',
                });
            }

            const integration = await readIntegrationById(input.id);

            return integration ?? undefined;
        }),

    getIntegrations: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/integrations',
                tags: ['Integrations'],
                summary: 'Get My Integrations',
                description: 'Get your Integrations with cursor-based pagination',
            },
            requiredScope: 'integrations:read',
        })
        .input(
            z
                .object({
                    limit: z.number().optional(),
                    cursor: z.string().optional(),
                    query: LCNIntegrationQueryValidator.optional(),
                })
                .optional()
        )
        .output(PaginatedLCNIntegrationsValidator)
        .query(async ({ ctx, input }) => {
            const limit = input?.limit ?? 100;
            const cursor = input?.cursor;
            const query = input?.query ?? {};

            const results = await getIntegrationsForProfile(ctx.user.profile, {
                limit: limit + 1,
                cursor,
                query,
            });

            const hasMore = results.length > limit;
            const records = hasMore ? results.slice(0, limit) : results;
            const nextCursor = hasMore ? records[records.length - 1]?.id : undefined;

            return { hasMore, cursor: nextCursor, records };
        }),

    countIntegrations: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/profile/integrations/count',
                tags: ['Integrations'],
                summary: 'Count My Integrations',
                description: 'Get a count of your Integrations matching a query',
            },
            requiredScope: 'integrations:read',
        })
        .input(z.object({ query: LCNIntegrationQueryValidator.optional() }).optional())
        .output(z.number())
        .query(async ({ ctx, input }) => {
            return countIntegrationsForProfile(ctx.user.profile, { query: input?.query ?? {} });
        }),

    updateIntegration: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/integration/update/{id}',
                tags: ['Integrations'],
                summary: 'Update Integration',
                description: 'Update an Integration by id',
            },
            requiredScope: 'integrations:write',
        })
        .input(
            z.object({
                id: z.string(),
                updates: LCNIntegrationUpdateValidator,
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const associated = await isIntegrationAssociatedWithProfile(
                input.id,
                ctx.user.profile.profileId
            );

            if (!associated) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'This Integration is not associated with you!',
                });
            }

            const integration = await readIntegrationById(input.id);

            if (!integration) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
            }

            return updateIntegrationAccess(integration, input.updates);
        }),

    deleteIntegration: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'DELETE',
                path: '/integration/{id}',
                tags: ['Integrations'],
                summary: 'Delete Integration',
                description: 'Delete an Integration by id',
            },
            requiredScope: 'integrations:delete',
        })
        .input(z.object({ id: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const associated = await isIntegrationAssociatedWithProfile(
                input.id,
                ctx.user.profile.profileId
            );

            if (!associated) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'This Integration is not associated with you!',
                });
            }

            const integration = await readIntegrationById(input.id);

            if (!integration) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
            }

            await deleteIntegrationAccess(input.id);

            return true;
        }),

     associateIntegrationWithSigningAuthority: profileRoute
        .meta({ 
            openapi: {  
                protect: true,
                method: 'POST',
                path: '/integration/{integrationId}/associate-with-signing-authority',
                tags: ['Integrations'],
                summary: 'Associate Integration with Signing Authority',
                description: 'Associate an Integration with a Signing Authority',
            },
            requiredScope: 'integrations:write',
        })
        .input(
            z.object({
                integrationId: z.string(),
                endpoint: z.string(),
                name: z
                    .string()
                    .max(15)
                    .regex(/^[a-z0-9-]+$/, {
                        message:
                            'The input string must contain only lowercase letters, numbers, and hyphens.',
                    }),
                did: z.string(),
                isPrimary: z.boolean().optional(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { integrationId, endpoint, name, did, isPrimary } = input;
            const associated = await isIntegrationAssociatedWithProfile(
                integrationId,
                ctx.user.profile.profileId
            );

            if (!associated) {
                throw new TRPCError({
                    code: 'UNAUTHORIZED',
                    message: 'Integration does not exist or is not associated with your profile.',
                });
            }

            const integration = await readIntegrationById(integrationId);

            if (!integration) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
            }


             const existingSa = await getSigningAuthorityForUserByName(ctx.user.profile, endpoint, name);
             if (!existingSa) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Signing Authority not found or owned by user. Please register the signing authority with your profile before associating with an integration.' });
             }
            const existingSas = await getSigningAuthoritiesForIntegration(integration);
            const setAsPrimary = isPrimary ?? existingSas.length === 0;
            await associateIntegrationWithSigningAuthority(integration.id, input.endpoint, { name, did, isPrimary: setAsPrimary });

            return true;
        }),


});

export type IntegrationsRouter = typeof integrationsRouter;
