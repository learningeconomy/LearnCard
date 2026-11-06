import { z } from 'zod';

import { t, didAndChallengeRoute } from '@routes';
import { createPreferences } from '@accesslayer/preferences/create';
import { TRPCError } from '@trpc/server';
import { getPreferencesForDid } from '@accesslayer/preferences/read';
import { updatePreferences } from '@accesslayer/preferences/update';

import { ThemeEnum } from '../types/preferences';
import { getPrivacyLockState } from '@accesslayer/preferences/privacyLock';
import { enforceMinorPreferences, MINOR_PREFERENCE_VALUES } from '../models/Preferences';

const preferencesInputSchema = z.object({
    theme: z.enum([ThemeEnum.Colorful, ThemeEnum.Formal]).optional(),
    aiEnabled: z.boolean().optional(),
    aiAutoDisabled: z.boolean().optional(),
    analyticsEnabled: z.boolean().optional(),
    analyticsAutoDisabled: z.boolean().optional(),
    bugReportsEnabled: z.boolean().optional(),
    bugReportsAutoDisabled: z.boolean().optional(),
    isMinor: z.boolean().optional(),
});

// Without knowing whether the account is a ClassLink student, refuse writes so a lookup
// failure can neither unlock a student's settings nor lock an adult's.
const studentLookupFailed = () =>
    new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Your settings could not be saved right now. Please try again.',
    });

const preferencesOutputSchema = z.object({
    theme: z.enum([ThemeEnum.Colorful, ThemeEnum.Formal]).optional(),
    aiEnabled: z.boolean().optional(),
    aiAutoDisabled: z.boolean().optional(),
    analyticsEnabled: z.boolean().optional(),
    analyticsAutoDisabled: z.boolean().optional(),
    bugReportsEnabled: z.boolean().optional(),
    bugReportsAutoDisabled: z.boolean().optional(),
    isMinor: z.boolean().optional(),
    /** True when a server-owned privacy lock keeps AI, analytics and bug reports off. */
    locked: z.boolean().optional(),
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
            const stored = await getPreferencesForDid(ctx.user.did);
            const lock = await getPrivacyLockState(ctx.user.did, stored);
            if (lock === 'unknown') throw studentLookupFailed();
            const success = await createPreferences(ctx.user.did, input.theme);
            // ClassLink student accounts always get locked minor settings, whatever the client sends.
            if (success && lock === 'student') await enforceMinorPreferences(ctx.user.did);

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
            const stored = await getPreferencesForDid(ctx.user.did);
            const lock = await getPrivacyLockState(ctx.user.did, stored);
            if (lock === 'unknown') throw studentLookupFailed();
            // Persist the lock first so later calls skip the student lookup entirely.
            if (lock === 'student') await enforceMinorPreferences(ctx.user.did);
            const locked = lock === 'locked' || lock === 'student';
            const success = await updatePreferences(
                ctx.user.did,
                locked ? { ...input, ...MINOR_PREFERENCE_VALUES } : input
            );

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
            const stored = await getPreferencesForDid(ctx.user.did);
            const lock = await getPrivacyLockState(ctx.user.did, stored);
            // Locks (and repairs) a student account once; later reads find the stored lock.
            if (lock === 'student') await enforceMinorPreferences(ctx.user.did);
            const preferences =
                lock === 'student' ? await getPreferencesForDid(ctx.user.did) : stored;
            // Locked values always win; on a failed lookup they are reported without being saved.
            const isLocked = lock !== 'unlocked';
            const locked = isLocked ? MINOR_PREFERENCE_VALUES : {};

            return {
                theme: preferences?.theme,
                aiEnabled: preferences?.aiEnabled,
                aiAutoDisabled: preferences?.aiAutoDisabled,
                analyticsEnabled: preferences?.analyticsEnabled,
                analyticsAutoDisabled: preferences?.analyticsAutoDisabled,
                bugReportsEnabled: preferences?.bugReportsEnabled,
                bugReportsAutoDisabled: preferences?.bugReportsAutoDisabled,
                isMinor: preferences?.isMinor,
                ...locked,
                ...(isLocked ? { locked: true } : {}),
            };
        }),
});
export type preferencesRouter = typeof preferencesRouter;
