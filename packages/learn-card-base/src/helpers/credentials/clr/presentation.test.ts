import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatClrDate, formatClrGpa } from './presentation';

afterEach(() => vi.unstubAllGlobals());

describe('CLR locale-safe formatting', () => {
    it('formats dates and quantities with English when the persisted locale is malformed', () => {
        vi.stubGlobal('localStorage', { getItem: () => 'en--US' });
        expect(formatClrDate('2026-05-10')).toBe('May 10, 2026');
        expect(formatClrGpa(3.5)).toBe('3.5');
    });
    it('validates an explicitly supplied locale and preserves regional formatting', () => {
        expect(formatClrDate('2026-05-10', 'en--US')).toBe('May 10, 2026');
        expect(formatClrDate('2026-05-10', 'es-MX')).toBe(
            new Date('2026-05-10').toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })
        );
        expect(formatClrDate('source-supplied date', 'en--US')).toBe('source-supplied date');
    });
});
