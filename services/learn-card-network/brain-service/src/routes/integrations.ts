import { randomUUID } from 'node:crypto';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { t, profileRoute } from '@routes';

import { createIntegration } from '@accesslayer/integration/create';
import {
    readIntegrationById,
    getIntegrationsForProfile,
    countIntegrationsForProfile,
} from '@accesslayer/integration/read';
import { updateIntegration as updateIntegrationAccess } from '@accesslayer/integration/update';
import { deleteIntegration as deleteIntegrationAccess } from '@accesslayer/integration/delete';
import { associateIntegrationWithProfile } from '@accesslayer/integration/relationships/create';
import { isIntegrationAssociatedWithProfile } from '@accesslayer/integration/relationships/read';
import {
    getIntegrationWebhookDeliveryConfig,
    rotateWebhookSecretForIntegration,
    setIntegrationWebhookConfig,
} from '@accesslayer/integration/webhook';
import { sendSignedIntegrationWebhook } from '@helpers/integration-events.helpers';
import { constructUri } from '@helpers/uri.helpers';
import { readIntegrationEventPage } from '@accesslayer/integration-event/read';
import {
    IntegrationEventCursorMismatchError,
    decodeIntegrationEventCursor,
    encodeIntegrationEventCursor,
} from '@helpers/integration-event-cursor.helpers';
import { CURSOR_EXPIRED_MESSAGE, CURSOR_EXPIRED_TRPC_CODE } from 'src/constants/integration-events';
import {
    LCNIntegrationValidator,
    LCNIntegrationCreateValidator,
    LCNIntegrationUpdateValidator,
    LCNIntegrationQueryValidator,
    PaginatedLCNIntegrationsValidator,
    IntegrationWebhookRegistrationValidator,
    IntegrationWebhookSecretRotationValidator,
    IntegrationWebhookUrlValidator,
    IntegrationEventsResponseValidator,
    IntegrationTestEventResultValidator,
    type IntegrationEvent,
} from '@learncard/types';

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

            const { contractEventsEnabled } = input.updates;

            // The general update runs first and the switch only after it succeeded, so a failed
            // field update never leaves the switch changed. A failed switch after a successful
            // update is reported as an error and is safe to retry: both writes are idempotent.
            const updated = await updateIntegrationAccess(integration, input.updates);

            // The webhook URL has its own route (setIntegrationWebhook), which can return the
            // signing secret once. Only the contract-events switch is written here.
            if (contractEventsEnabled !== undefined) {
                await setIntegrationWebhookConfig({
                    integrationId: input.id,
                    contractEventsEnabled,
                });
            }

            return updated;
        }),

    setIntegrationWebhook: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/integration/{id}/webhook',
                tags: ['Integrations'],
                summary: 'Set Integration Webhook',
                description:
                    'Set, replace or remove (`null`) the webhook URL that receives signed contract events for an Integration. The first time a URL is set, a signing secret is created and returned once in `secret`; store it then, it cannot be read again. Replacing or removing the URL keeps the existing secret and returns none. Setting a URL also enables contract events if they are not enabled yet.',
            },
            requiredScope: 'integrations:write',
        })
        .input(z.object({ id: z.string(), webhookUrl: IntegrationWebhookUrlValidator.nullable() }))
        .output(IntegrationWebhookRegistrationValidator)
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

            const registration = await setIntegrationWebhookConfig({
                integrationId: input.id,
                webhookUrl: input.webhookUrl,
            });

            if (!registration) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
            }

            return registration;
        }),

    rotateIntegrationWebhookSecret: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/integration/{id}/webhook-secret/rotate',
                tags: ['Integrations'],
                summary: 'Rotate Integration Webhook Secret',
                description:
                    'Create a new webhook signing secret for an Integration and return it once. The previous secret stays valid for 24 hours. The first secret is returned by Set Integration Webhook when the webhook URL is first set; a secret cannot be read again later, only replaced here.',
            },
            requiredScope: 'integrations:write',
        })
        .input(z.object({ id: z.string() }))
        .output(IntegrationWebhookSecretRotationValidator)
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

            const rotation = await rotateWebhookSecretForIntegration(input.id);

            if (!rotation) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
            }

            return rotation;
        }),

    sendIntegrationTestEvent: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/integration/{id}/webhook/test',
                tags: ['Integrations'],
                summary: 'Send Integration Test Event',
                description:
                    'Send one signed `integration.test` event to the webhook URL of an Integration and report the result. The test event is not written to the change feed. It is sent whenever the Integration has a webhook URL and a signing secret, also while contract events are disabled, so a receiver can be checked before events are enabled.',
            },
            requiredScope: 'integrations:write',
        })
        .input(z.object({ id: z.string() }))
        .output(IntegrationTestEventResultValidator)
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

            // Deliberately not gated on contractEventsEnabledAt: only feed records stop on disable.
            const config = await getIntegrationWebhookDeliveryConfig(input.id);

            if (!config) return { delivered: false, error: 'no_webhook' };

            const eventId = `test_${randomUUID()}`;
            const event: IntegrationEvent = {
                eventId,
                deliveryKey: `${eventId}:${input.id}`,
                sequence: 0,
                type: 'integration.test',
                contractUri: constructUri('contract', 'integration-test', ctx.domain),
                role: 'owner',
                occurredAt: new Date().toISOString(),
            };

            const result = await sendSignedIntegrationWebhook({
                webhookUrl: config.webhookUrl,
                secrets: config.secrets,
                event,
            });

            return {
                delivered: result.delivered,
                ...(result.status !== undefined ? { status: result.status } : {}),
                ...(result.error ? { error: result.error } : {}),
            };
        }),

    getIntegrationEvents: profileRoute
        .meta({
            openapi: {
                protect: true,
                method: 'GET',
                path: '/integrations/{id}/events',
                tags: ['Integrations'],
                summary: 'Get Integration Events',
                description:
                    'Read the ordered change feed of contract events for an Integration. Pass the returned cursor as `since` to continue. Records are kept for 30 days; an older cursor is rejected with CURSOR_EXPIRED (HTTP 409) and the client must take a new connections snapshot.',
            },
            requiredScope: 'integrations:read',
        })
        .input(
            z.object({
                id: z.string(),
                since: z.string().optional(),
                limit: z.number().int().min(1).max(200).optional(),
            })
        )
        .output(IntegrationEventsResponseValidator)
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

            let afterSequence = 0;

            if (input.since !== undefined) {
                try {
                    afterSequence = decodeIntegrationEventCursor(input.since, input.id);
                } catch (error) {
                    throw new TRPCError({
                        code: 'BAD_REQUEST',
                        message:
                            error instanceof IntegrationEventCursorMismatchError
                                ? 'This cursor belongs to a different integration'
                                : 'Invalid cursor',
                    });
                }
            }

            // One statement: the purge watermark and the page must come from the same state,
            // or retention could remove unseen records between the check and the read.
            const limit = input.limit ?? 100;
            const state = await readIntegrationEventPage({
                integrationId: input.id,
                afterSequence,
                limit: limit + 1,
            });

            if (!state) {
                throw new TRPCError({ code: 'NOT_FOUND', message: 'Integration not found' });
            }

            // A cursor past the newest sequence would silently skip the events that come next.
            if (input.since !== undefined && afterSequence > state.eventSeq) {
                throw new TRPCError({
                    code: 'BAD_REQUEST',
                    message: "This cursor is ahead of this integration's feed",
                });
            }

            if (input.since !== undefined && afterSequence < state.eventPurgedThroughSeq) {
                throw new TRPCError({
                    code: CURSOR_EXPIRED_TRPC_CODE,
                    message: CURSOR_EXPIRED_MESSAGE,
                });
            }

            const results = state.records;
            const hasMore = results.length > limit;
            const records = hasMore ? results.slice(0, limit) : results;
            const last = records[records.length - 1];
            const cursor = last
                ? encodeIntegrationEventCursor(input.id, last.sequence)
                : input.since;

            return {
                records,
                ...(cursor !== undefined ? { cursor } : {}),
                latestCursor: encodeIntegrationEventCursor(input.id, state.eventSeq),
                hasMore,
            };
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
});

export type IntegrationsRouter = typeof integrationsRouter;
