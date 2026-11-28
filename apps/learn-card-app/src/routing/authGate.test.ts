import { describe, expect, it } from 'vitest';

import { rendersBeforeAuth } from './authGate';

describe('rendersBeforeAuth', () => {
    it('lets the public content pages skip the start-up loader', () => {
        expect(rendersBeforeAuth('/legal/terms')).toBe(true);
        expect(rendersBeforeAuth('/legal/privacy')).toBe(true);
        expect(rendersBeforeAuth('/app/f784d9ad-9d0a-4d3a-b964-22d057fd71df')).toBe(true);
        expect(rendersBeforeAuth('/consent-flow')).toBe(true);
        expect(rendersBeforeAuth('/claim/boost')).toBe(true);
        expect(rendersBeforeAuth('/connect')).toBe(true);
        expect(rendersBeforeAuth('/connect/some-profile')).toBe(true);
    });

    it('keeps signed-in and sign-in pages behind it', () => {
        for (const path of [
            '/',
            '/login',
            '/wallet',
            '/consent-flow-login',
            '/consent-flow/review',
            '/app',
            '/apps/some-slug',
        ]) {
            expect(rendersBeforeAuth(path)).toBe(false);
        }
    });
});
