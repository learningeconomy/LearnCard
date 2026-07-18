import { beforeEach, describe, expect, it, vi } from 'vitest';

let locale = 'en';

vi.mock('../paraglide/runtime.js', () => ({
    getLocale: () => locale,
}));

import { formatLocaleDate, formatLocaleNumber } from './formatters';

describe('locale-aware formatters', () => {
    beforeEach(() => {
        locale = 'en';
    });

    it('formats dates using the active French locale', () => {
        locale = 'fr';

        expect(
            formatLocaleDate(new Date('2026-01-05T12:00:00Z'), {
                timeZone: 'UTC',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            })
        ).toContain('janvier');
    });

    it('formats numbers using the active Arabic locale', () => {
        locale = 'ar';

        expect(formatLocaleNumber(1234)).toBe(new Intl.NumberFormat('ar').format(1234));
    });
});
