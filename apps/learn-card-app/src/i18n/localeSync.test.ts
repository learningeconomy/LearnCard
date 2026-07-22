import { describe, it, expect } from 'vitest';

import { decideLocaleSync } from './localeSync';

// Precedence rules for reconciling the active UI locale with the user's saved
// profile locale. The bug this guards: after logout clears localStorage, a
// re-login left the UI at the default ('en') and the old one-way sync OVERWROTE
// the saved profile locale ('es') with 'en'. The rule set:
//   - profile has a saved language + no explicit in-session pick → RESTORE it to
//     the UI (never write the default back).
//   - explicit in-session pick (localStorage set) → SYNC UI → profile.
//   - no saved language yet → SYNC (safe to capture the current UI locale).
describe('decideLocaleSync', () => {
    it('does nothing when profile and UI already match', () => {
        expect(decideLocaleSync('es', 'es', false)).toEqual({ action: 'none' });
        expect(decideLocaleSync('en', 'en', true)).toEqual({ action: 'none' });
    });

    it('restores the saved profile language when there is no manual pick (the re-login bug)', () => {
        expect(decideLocaleSync('en', 'es', false)).toEqual({ action: 'restore', locale: 'es' });
    });

    it('syncs UI → profile when the user made an explicit pick this session', () => {
        expect(decideLocaleSync('fr', 'es', true)).toEqual({ action: 'sync' });
    });

    it('syncs (captures) when the profile has no saved locale yet', () => {
        expect(decideLocaleSync('es', undefined, false)).toEqual({ action: 'sync' });
        expect(decideLocaleSync('en', undefined, false)).toEqual({ action: 'sync' });
    });

    // Tenant scoping (getEffectiveSupportedLanguages) can narrow the offered
    // language set below the compiled catalog. The profile locale is global
    // across tenants, so a saved language this tenant doesn't offer must be
    // left strictly alone — neither restored into the UI nor overwritten.
    describe('tenant-scoped languages', () => {
        it('leaves a tenant-unsupported profile locale alone instead of restoring it', () => {
            expect(decideLocaleSync('en', 'fr', false, false)).toEqual({ action: 'none' });
        });

        it('leaves a tenant-unsupported profile locale alone instead of clobbering it', () => {
            expect(decideLocaleSync('en', 'fr', true, false)).toEqual({ action: 'none' });
        });

        it('still syncs when the profile has no saved locale, whatever the tenant offers', () => {
            expect(decideLocaleSync('en', undefined, true, false)).toEqual({ action: 'sync' });
        });

        it('behaves as before when the tenant does support the profile locale', () => {
            expect(decideLocaleSync('en', 'es', false, true)).toEqual({
                action: 'restore',
                locale: 'es',
            });
            expect(decideLocaleSync('fr', 'es', true, true)).toEqual({ action: 'sync' });
        });
    });
});
