import { describe, expect, it } from 'vitest';

import { formatDateForLocale } from './datePicker.helpers';

describe('formatDateForLocale', () => {
    it('formats dates using the active locale', () => {
        expect(formatDateForLocale('1982-01-01', 'ar')).toContain('يناير');
        expect(formatDateForLocale('1982-01-01', 'es')).toContain('enero');
    });

    it('preserves invalid values', () => {
        expect(formatDateForLocale('not-a-date', 'ar')).toBe('not-a-date');
    });
});
