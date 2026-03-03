import { z } from 'zod';

import { t, didAndChallengeRoute } from '@routes';
import { createPin } from '@accesslayer/pins/create';
import { TRPCError } from '@trpc/server';
import { didHasPin, verifyPin } from '@accesslayer/pins/read';
import {
    generatePinUpdateToken,
    updatePin,
    updatePinWithToken,
    validatePinUpdateToken,
} from '@accesslayer/pins/update';

export const pinsRouter = t.router({
    createPin: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/pin/create',
                tags: ['Pins'],
                summary: 'Create Pin',
                description: 'Creates a pin associated with the current user DID.',
            },
        })
        .input(
            z.object({
                pin: z.string(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const success = await createPin(ctx.user.did, input.pin);

            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occured, unable to create PIN',
                });
            }

            return true;
        }),

    hasPin: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/pin/has-pin',
                tags: ['Pins'],
                summary: 'Pin exists check',
                description: 'Checks if a pin exists for the current user DID',
            },
        })
        .input(
            z.object({
                did: z.string().optional(),
            })
        )
        .output(z.boolean())
        .query(async ({ input, ctx }) => {
            const { did } = input;
            const hasPin = await didHasPin(did || ctx.user.did);

            return hasPin;
        }),

    verifyPin: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/pin/verify',
                tags: ['Pins'],
                summary: 'Verify Pin',
                description: 'Verifies the pin entered is associated with the current user DID.',
            },
        })
        .input(
            z.object({
                pin: z.string(),
                did: z.string().optional(),
            })
        )
        .output(z.boolean())
        .query(async ({ input, ctx }) => {
            const { pin, did } = input;
            const success = await verifyPin(did || ctx.user.did, pin);

            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occured, unable to verify PIN',
                });
            }

            return true;
        }),

    updatePin: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/pin/update',
                tags: ['Pins'],
                summary: 'Update Pin',
                description: 'Updates the PIN associated with the current user DID.',
            },
        })
        .input(
            z.object({
                currentPin: z.string(),
                newPin: z.string(),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { currentPin, newPin } = input;
            const success = await updatePin(ctx.user.did, currentPin, newPin);

            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occured, unable to update PIN',
                });
            }

            return true;
        }),

    generatePinUpdateToken: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/pin/generate-pin-update-token',
                tags: ['Pins'],
                summary: 'Generate PIN update token',
                description: 'Generates a token for updating a PIN',
            },
        })
        .input(z.void())
        .output(
            z.union([
                z.object({
                    token: z.string(),
                    tokenExpire: z.date(),
                }),
                z.null(),
            ])
        )
        .mutation(async ({ ctx }) => {
            const result = await generatePinUpdateToken(ctx.user.did);

            if (!result) return null;

            return result;
        }),

    validatePinUpdateToken: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/pin/validate-pin-update-token',
                tags: ['Pins'],
                summary: 'Validate pin token',
                description: 'Validates the update pin token',
            },
        })
        .input(z.object({ token: z.string() }))
        .output(z.boolean())
        .query(async ({ input, ctx }) => {
            const { token } = input;
            const isValidToken = await validatePinUpdateToken(ctx.user.did, token);

            return isValidToken;
        }),

    updatePinWithToken: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/pin/update-pin-with-token',
                tags: ['Pins'],
                summary: 'Update pin with token',
                description: 'Allows updating a pin with a token',
            },
        })
        .input(z.object({ token: z.string(), newPin: z.string() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { token, newPin } = input;
            const result = await updatePinWithToken(ctx.user.did, token, newPin);

            return result;
        }),
});
export type pinsRouter = typeof pinsRouter;
