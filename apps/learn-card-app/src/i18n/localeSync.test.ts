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
});
