import { describe, expect, it } from 'vitest';

import { rendersBeforeAuth } from './authGate';

describe('rendersBeforeAuth', () => {
    it('lets the public content pages skip the start-up loader', () => {
        expect(rendersBeforeAuth('/legal/terms')).toBe(true);
        expect(rendersBeforeAuth('/legal/privacy')).toBe(true);
        expect(rendersBeforeAuth('/app/f784d9ad-9d0a-4d3a-b964-22d057fd71df')).toBe(true);
    });

    it('keeps pages that branch on sign-in state behind it', () => {
        for (const path of [
            '/',
            '/login',
            '/wallet',
            '/consent-flow',
            '/claim/boost',
            '/connect/some-profile',
            '/app',
            '/apps/some-slug',
        ]) {
            expect(rendersBeforeAuth(path)).toBe(false);
        }
    });
});
