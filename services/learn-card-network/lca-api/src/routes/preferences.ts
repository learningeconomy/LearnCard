import { z } from 'zod';

import { t, didAndChallengeRoute } from '@routes';
import { createPreferences } from '@accesslayer/preferences/create';
import { TRPCError } from '@trpc/server';
import { getPreferencesForDid } from '@accesslayer/preferences/read';
import { updatePreferences } from '@accesslayer/preferences/update';

import { ThemeEnum } from '../types/preferences';

export const preferencesRouter = t.router({
    createPreferences: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/preferences/create',
                tags: ['Preferences'],
                summary: 'Create Preferences',
                description: 'Creates preferences associated with the current user DID.',
            },
        })
        .input(
            z.object({
                theme: z.enum([ThemeEnum.Colorful, ThemeEnum.Formal]),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const success = await createPreferences(ctx.user.did, input.theme);

            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occured, unable to create PIN',
                });
            }

            return true;
        }),

    updatePreferences: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'POST',
                path: '/preferences/update',
                tags: ['Preferences'],
                summary: 'Update Preferences',
                description: 'Updates the preferences associated with the current user DID.',
            },
        })
        .input(
            z.object({
                theme: z.enum([ThemeEnum.Colorful, ThemeEnum.Formal]),
            })
        )
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const { theme } = input;
            const success = await updatePreferences(ctx.user.did, theme);

            if (!success) {
                throw new TRPCError({
                    code: 'INTERNAL_SERVER_ERROR',
                    message: 'An unexpected error occured, unable to update preferences',
                });
            }

            return true;
        }),

    getPreferencesForDid: didAndChallengeRoute
        .meta({
            openapi: {
                method: 'GET',
                path: '/preferences/get',
                tags: ['Preferences'],
                summary: 'Get Preferences',
                description: 'Retrieves the preferences associated with the current user DID.',
            },
        })
        .input(z.void())
        .output(
            z.object({
                theme: z.enum([ThemeEnum.Colorful, ThemeEnum.Formal]),
            })
        )
        .query(async ({ ctx }) => {
            const preferences = await getPreferencesForDid(ctx.user.did);

            return { theme: preferences?.theme ?? ThemeEnum.Colorful };
        }),
});
export type preferencesRouter = typeof preferencesRouter;
