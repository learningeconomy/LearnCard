import { z } from 'zod';

import { getCurrentProfile } from '@helpers/currentProfile';
import { isAnalyticsRestricted } from '@helpers/analyticsEligibility';

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
    theme: z.enum([ThemeEnum.Colorful, ThemeEnum.Formal]).optional(),
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
            const profile = await getCurrentProfile(ctx);
            const restricted = profile !== null && isAnalyticsRestricted(profile);
            // Age-derived metadata is server-owned, not a caller assertion.
            const safeInput: typeof input = { ...input };
            if (profile !== null) {
                safeInput.isMinor = restricted;
                safeInput.analyticsAutoDisabled = restricted;
                if (restricted) safeInput.analyticsEnabled = false;
            } else {
                // Unknown authority cannot grant opt-in or persist fabricated age
                // metadata; an explicit opt-out remains safe to save.
                delete safeInput.isMinor;
                delete safeInput.analyticsAutoDisabled;
                if (safeInput.analyticsEnabled === true) delete safeInput.analyticsEnabled;
            }
            const success = await updatePreferences(ctx.user.did, safeInput);

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
            const profile = await getCurrentProfile(ctx);
            const restricted = profile !== null && isAnalyticsRestricted(profile);
            const preferences = await getPreferencesForDid(ctx.user.did);

            if (
                preferences &&
                profile !== null &&
                ((restricted && preferences.analyticsEnabled === true) ||
                    preferences.isMinor !== restricted ||
                    (restricted && preferences.analyticsAutoDisabled !== true))
            ) {
                await updatePreferences(ctx.user.did, {
                    ...(restricted ? { analyticsEnabled: false } : {}),
                    isMinor: restricted,
                    ...(restricted ? { analyticsAutoDisabled: true } : {}),
                });
            }

            return {
                theme: preferences?.theme,
                aiEnabled: preferences?.aiEnabled,
                aiAutoDisabled: preferences?.aiAutoDisabled,
                analyticsEnabled:
                    profile === null || restricted ? false : preferences?.analyticsEnabled,
                analyticsAutoDisabled:
                    profile === null
                        ? preferences?.analyticsAutoDisabled
                        : restricted
                          ? true
                          : preferences?.analyticsAutoDisabled,
                bugReportsEnabled: preferences?.bugReportsEnabled,
                ...(profile === null ? {} : { isMinor: restricted }),
            };
        }),
});
export type preferencesRouter = typeof preferencesRouter;
