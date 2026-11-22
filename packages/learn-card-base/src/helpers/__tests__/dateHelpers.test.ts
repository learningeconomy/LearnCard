import { describe, expect, it } from 'vitest';

import { calculateAge, isFutureDate, isValidISOString } from '../dateHelpers';

describe('calculateAge', () => {
    it('returns the age in whole years for a past DOB', () => {
        expect(calculateAge('2000-01-01', new Date(2020, 0, 1))).toBe(20);
    });

    it('uses the local birthday and time for age comparisons', () => {
        const now = new Date(2026, 9, 29, 0, 0, 0);
        expect(calculateAge('2008-10-29', now)).toBe(18);
        expect(calculateAge('2008-10-29T00:00:01', now)).toBe(17);
    });

    it('uses the instant for an offset-bearing date of birth', () => {
        const dob = '2008-10-29T23:30:00-12:00';
        expect(calculateAge(dob, new Date('2026-10-30T00:15:00Z'))).toBe(17);
        expect(calculateAge(new Date(dob), new Date('2026-10-30T17:00:00Z'))).toBe(18);
    });

    it('counts a leap-day birthday on February 28 in a non-leap year', () => {
        expect(calculateAge('2000-02-29', new Date(2018, 1, 27, 23, 59))).toBe(17);
        expect(calculateAge('2000-02-29', new Date(2018, 1, 28))).toBe(18);
    });

    it('returns NaN for invalid dates', () => {
        expect(calculateAge('2000-02-30')).toBeNaN();
        expect(calculateAge(new Date(NaN))).toBeNaN();
    });

    it('returns NaN for a future DOB', () => {
        expect(calculateAge('2030-01-01', new Date('2020-01-01T00:00:00Z'))).toBeNaN();
    });
});

describe('isValidISOString', () => {
    it.each([
        '2020-01-01T00:00:00.000Z',
        '2026-10-29',
        '20261029',
        '2026-W44-4',
        '2026-302',
        '2026-10',
        '2026-W44',
        '2026',
        '2026-10-29T23:30:00,005-08',
        '2026-10-29 23:30-12:00',
        '20261029 2330Z',
        '2026-10-29T24:00Z',
        '+002026-10-29T23:30Z',
    ])('accepts %s', value => {
        expect(isValidISOString(value)).toBe(true);
    });

    it.each([
        'not-a-date',
        '2026-02-30',
        '2026-10-29T24:01Z',
        '12:30',
        '2026-10-29T12:30z',
        '2026-10-29T1230',
        '2026-10T12:30',
        '2026-W44T12:30',
        ' 2026-10-29',
        '2026-10-29 ',
    ])('rejects %s', value => {
        expect(isValidISOString(value)).toBe(false);
    });
});

describe('isFutureDate', () => {
    it('compares offset timestamps by instant and excludes equality', () => {
        const now = new Date('2026-10-30T00:30:00Z');
        expect(isFutureDate('2026-10-29 23:30-12:00', now)).toBe(true);
        expect(isFutureDate('2026-10-29T23:30-01:00', now)).toBe(false);
        expect(isFutureDate(new Date(now.getTime() + 1), now)).toBe(true);
    });

    it.each([
        ['2024-03-10T02:30', new Date(2024, 2, 10, 2, 30)],
        ['2024-11-03T01:30', new Date(2024, 10, 3, 1, 30)],
    ])('uses the local clock interpretation for %s at DST transitions', (value, instant) => {
        expect(isFutureDate(value, new Date(instant.getTime() - 1))).toBe(true);
        expect(isFutureDate(value, instant)).toBe(false);
    });

    it('uses local midnight for a calendar date and rejects invalid inputs', () => {
        const now = new Date(2026, 9, 29);
        expect(isFutureDate('2026-10-29', now)).toBe(false);
        expect(isFutureDate('2026-10-30', now)).toBe(true);
        expect(isFutureDate('2026-02-30', now)).toBe(false);
        expect(isFutureDate(new Date(NaN), now)).toBe(false);
    });
});
