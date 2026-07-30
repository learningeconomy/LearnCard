import { describe, expect, it } from 'vitest';

import { calculateAge, isValidISOString } from '../dateHelpers';

describe('calculateAge', () => {
    it('returns the age in whole years for a past DOB', () => {
        expect(calculateAge('2000-01-01', new Date('2020-01-01T00:00:00Z'))).toBe(20);
    });

    it('returns NaN for a future DOB', () => {
        expect(calculateAge('2030-01-01', new Date('2020-01-01T00:00:00Z'))).toBeNaN();
    });
});

describe('isValidISOString', () => {
    it('accepts a valid ISO date string', () => {
        expect(isValidISOString('2020-01-01T00:00:00.000Z')).toBe(true);
    });

    it('rejects an invalid date string', () => {
        expect(isValidISOString('not-a-date')).toBe(false);
    });
});
