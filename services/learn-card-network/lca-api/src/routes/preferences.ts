import { z } from 'zod';

import { t, didAndChallengeRoute } from '@routes';
import { createPreferences } from '@accesslayer/preferences/create';
import { TRPCError } from '@trpc/server';
import { getPreferencesForDid } from '@accesslayer/preferences/read';
import { updatePreferences } from '@accesslayer/preferences/update';

import { ThemeEnum } from '../types/preferences';

const preferencesInputSchema = z.object({
    theme: z.enum([ThemeEnum.Colorful, ThemeEnum.Formal]).optional(),
    aiEnabled: z.boolean().optional(),
    aiAutoDisabled: z.boolean().optional(),
    analyticsEnabled: z.boolean().optional(),
    analyticsAutoDisabled: z.boolean().optional(),
    bugReportsEnabled: z.boolean().optional(),
    isMinor: z.boolean().optional(),
});

const preferencesOutputSchema = z.object({
    theme: z.enum([ThemeEnum.Colorful, ThemeEnum.Formal]),
    aiEnabled: z.boolean().optional(),
    aiAutoDisabled: z.boolean().optional(),
    analyticsEnabled: z.boolean().optional(),
    analyticsAutoDisabled: z.boolean().optional(),
    bugReportsEnabled: z.boolean().optional(),
    isMinor: z.boolean().optional(),
});

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
        .input(preferencesInputSchema)
        .output(z.boolean())
        .mutation(async ({ input, ctx }) => {
            const success = await updatePreferences(ctx.user.did, input);

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
        .output(preferencesOutputSchema)
        .query(async ({ ctx }) => {
            const preferences = await getPreferencesForDid(ctx.user.did);

            return {
                theme: preferences?.theme ?? ThemeEnum.Colorful,
                aiEnabled: preferences?.aiEnabled,
                aiAutoDisabled: preferences?.aiAutoDisabled,
                analyticsEnabled: preferences?.analyticsEnabled,
                analyticsAutoDisabled: preferences?.analyticsAutoDisabled,
                bugReportsEnabled: preferences?.bugReportsEnabled,
                isMinor: preferences?.isMinor,
            };
        }),
});
export type preferencesRouter = typeof preferencesRouter;
