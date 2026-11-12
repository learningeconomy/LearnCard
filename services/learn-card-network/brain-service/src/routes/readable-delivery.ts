import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import {
    CreateReadableDeliveryRecipientValidator,
    ReadableDeliveryRecipientValidator,
    ReadableDeliveryReadInputValidator,
    ReadableDeliveryPageValidator,
} from '@learncard/types';
import { t, profileRouteWithoutInputCapture } from '@routes';
import { userHasRequiredScopes } from '@helpers/auth-grant.helpers';
import {
    provisionReadableDelivery,
    disableReadableDelivery,
    readReadableDelivery,
} from '@helpers/readable-delivery.helpers';
import { enforceRateLimits } from '@helpers/rateLimit.helpers';
import { auditDeliveryRead } from '@accesslayer/readable-delivery';

export const readableDeliveryRouter = t.router({
    createRecipient: profileRouteWithoutInputCapture
        .meta({
            requiredScope: 'readableDelivery:write',
            openapi: {
                protect: true,
                method: 'POST',
                path: '/readable-delivery/recipients',
                tags: ['Readable Delivery'],
                summary: 'Create an explicitly delegated readable recipient',
            },
        })
        .input(CreateReadableDeliveryRecipientValidator)
        .output(ReadableDeliveryRecipientValidator)
        .mutation(async ({ ctx, input }) => {
            await enforceRateLimits([
                {
                    key: `readable-delivery:provision:${ctx.user.profile.profileId}`,
                    limit: 10,
                    windowSeconds: 3600,
                    description: 'recipient provisioning',
                },
            ]);
            return provisionReadableDelivery(ctx.user.profile.profileId, ctx.domain, input);
        }),
    disable: profileRouteWithoutInputCapture
        .meta({
            requiredScope: 'readableDelivery:write',
            openapi: {
                protect: true,
                method: 'POST',
                path: '/readable-delivery/disable',
                tags: ['Readable Delivery'],
                summary: 'Disable readable delivery for a recipient you created',
            },
        })
        .input(z.object({ profileId: z.string().min(3).max(40) }))
        .output(z.boolean())
        .mutation(async ({ ctx, input }) => {
            await disableReadableDelivery(input.profileId, ctx.domain, ctx.user.profile.profileId);
            return true;
        }),
    read: profileRouteWithoutInputCapture
        // Both scopes are checked below, inside the audit boundary. The shared
        // requiredScope helper treats a space-separated list as OR, not AND.
        .meta({
            openapi: {
                protect: true,
                method: 'POST',
                path: '/readable-delivery/data',
                tags: ['Readable Delivery'],
                summary: 'Read currently consented credentials with read AND decrypt permission',
            },
        })
        .input(ReadableDeliveryReadInputValidator)
        .output(ReadableDeliveryPageValidator)
        .mutation(async ({ ctx, input }) => {
            const recipient = ctx.user.profile.profileId;
            const actor = ctx.user.onBehalfOf ?? recipient;
            try {
                await auditDeliveryRead(actor, recipient, 'started');
                if (
                    !['contracts-data:read', 'contracts-data:decrypt'].every(scope =>
                        userHasRequiredScopes(ctx.user.scope ?? '', scope)
                    )
                )
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: 'Read and decrypt permissions are required.',
                    });
                await enforceRateLimits([
                    {
                        key: `readable-delivery:read:${recipient}`,
                        limit: 60,
                        windowSeconds: 60,
                        description: 'readable delivery',
                    },
                ]);
                const result = await readReadableDelivery(recipient, ctx.domain, input);
                await auditDeliveryRead(actor, recipient, 'allowed', result.records.length);
                return result;
            } catch (error) {
                try {
                    await auditDeliveryRead(actor, recipient, 'denied');
                } catch {
                    throw new TRPCError({
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'Readable delivery is temporarily unavailable.',
                    });
                }
                if (error instanceof TRPCError) throw error;
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'Readable delivery is temporarily unavailable.',
                });
            }
        }),
});
export type ReadableDeliveryRouter = typeof readableDeliveryRouter;
