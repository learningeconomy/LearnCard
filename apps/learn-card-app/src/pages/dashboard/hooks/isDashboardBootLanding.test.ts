import { describe, expect, it } from 'vitest';

import { isDashboardBootLanding } from './isDashboardBootLanding';

describe('isDashboardBootLanding', () => {
    it('is true for a direct /dashboard visit regardless of the home flag', () => {
        expect(isDashboardBootLanding('/dashboard', false)).toBe(true);
        expect(isDashboardBootLanding('/dashboard', true)).toBe(true);
    });

    it('is true for `/` only when dashboard-as-home is on', () => {
        expect(isDashboardBootLanding('/', true)).toBe(true);
        expect(isDashboardBootLanding('/', false)).toBe(false);
    });

    it('is false for other entry paths', () => {
        expect(isDashboardBootLanding('/wallet', true)).toBe(false);
        expect(isDashboardBootLanding('/login', true)).toBe(false);
    });
});
