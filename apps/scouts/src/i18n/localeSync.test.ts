import { describe, expect, it } from 'vitest';

import { applyLocaleSyncAction, decideLocaleSync } from './localeSync';

describe('decideLocaleSync', () => {
    it('does nothing when the profile and UI locales already match', () => {
        expect(decideLocaleSync('es', 'es', false)).toEqual({ action: 'none' });
        expect(decideLocaleSync('en', 'en', true)).toEqual({ action: 'none' });
    });

    it('restores the saved profile locale when there is no manual local choice', () => {
        expect(decideLocaleSync('en', 'es', false)).toEqual({
            action: 'restore',
            locale: 'es',
        });
    });

    it('syncs an explicit local choice to the profile', () => {
        expect(decideLocaleSync('fr', 'es', true)).toEqual({ action: 'sync' });
    });

    it('captures the UI locale when the profile has no saved locale', () => {
        expect(decideLocaleSync('ar', undefined, false)).toEqual({ action: 'sync' });
    });

    it('preserves a saved profile locale that this client does not support', () => {
        expect(decideLocaleSync('en', undefined, false, false, true)).toEqual({
            action: 'none',
        });
        expect(decideLocaleSync('en', undefined, true, false, true)).toEqual({
            action: 'none',
        });
    });

    it('leaves a tenant-hidden profile locale alone', () => {
        expect(decideLocaleSync('en', 'fr', false, false)).toEqual({ action: 'none' });
        expect(decideLocaleSync('en', 'fr', true, false)).toEqual({ action: 'none' });
    });
});

describe('applyLocaleSyncAction', () => {
    it('restores the saved locale without writing the profile', async () => {
        const restored: string[] = [];
        const updated: string[] = [];

        await applyLocaleSyncAction({ action: 'restore', locale: 'es' }, 'en', {
            changeLocale: locale => restored.push(locale),
            updateProfile: async locale => {
                updated.push(locale);
            },
            invalidateProfile: async () => undefined,
            onError: () => undefined,
        });

        expect(restored).toEqual(['es']);
        expect(updated).toEqual([]);
    });

    it('persists an explicit locale before invalidating the profile query', async () => {
        const events: string[] = [];

        await applyLocaleSyncAction({ action: 'sync' }, 'fr', {
            changeLocale: () => undefined,
            updateProfile: async locale => {
                events.push(`update:${locale}`);
            },
            invalidateProfile: async () => {
                events.push('invalidate');
            },
            onError: () => undefined,
        });

        expect(events).toEqual(['update:fr', 'invalidate']);
    });

    it('reports profile write failures without rejecting', async () => {
        const errors: unknown[] = [];
        const failure = new Error('offline');

        await expect(
            applyLocaleSyncAction({ action: 'sync' }, 'ar', {
                changeLocale: () => undefined,
                updateProfile: async () => {
                    throw failure;
                },
                invalidateProfile: async () => undefined,
                onError: error => errors.push(error),
            })
        ).resolves.toBeUndefined();
        expect(errors).toEqual([failure]);
    });
});
