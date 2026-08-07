import { beforeEach, describe, expect, it, vi } from 'vitest';

let locale = 'en';

vi.mock('../paraglide/runtime.js', () => ({
    getLocale: () => locale,
}));

import { formatLocaleDate, formatLocaleNumber, selectLocalePlural } from './formatters';

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

    it('selects plural forms using the active locale rules', () => {
        locale = 'fr';
        expect(selectLocalePlural(0, { one: 'contact', other: 'contacts' })).toBe('contact');

        locale = 'ar';
        expect(
            selectLocalePlural(2, {
                one: 'member',
                two: 'two members',
                other: 'members',
            })
        ).toBe('two members');
    });

    it('falls back to the other form when a locale-specific category is absent', () => {
        locale = 'ar';
        expect(selectLocalePlural(3, { one: 'member', other: 'members' })).toBe('members');
    });
});
