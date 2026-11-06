import { calculateAgeFromISODate, getMinorAgeThreshold } from '../src/age-policy';

describe('shared age policy', () => {
    it.each([
        ['DE', 16],
        ['FR', 15],
        ['ES', 14],
        ['IE', 13],
        ['BE', 16],
        ['US', 18],
        [undefined, 18],
    ])('uses the existing threshold for %s', (country, threshold) => {
        expect(getMinorAgeThreshold(country)).toBe(threshold);
    });

    it('calculates the age boundary for ISO dates and timestamps, rejecting invalid/future DOBs', () => {
        const now = new Date('2026-10-29T12:00:00Z');
        expect(calculateAgeFromISODate('2008-10-29', now)).toBe(18);
        expect(calculateAgeFromISODate('2008-10-29T00:00:00Z', now)).toBe(18);
        expect(calculateAgeFromISODate('2008-10-30', now)).toBe(17);
        expect(Number.isNaN(calculateAgeFromISODate('2027-01-01', now))).toBe(true);
        expect(Number.isNaN(calculateAgeFromISODate('2008-02-30', now))).toBe(true);
        expect(Number.isNaN(calculateAgeFromISODate('2008-01-01T25:00:00Z', now))).toBe(true);
        expect(Number.isNaN(calculateAgeFromISODate('not-a-date', now))).toBe(true);
    });

    it.each([
        '2008-10-29T12:30',
        '20081029',
        '2008-W44-3',
        '2008-303',
        '2008-10-29T23:30:00-12:00',
    ])('preserves legacy ISO DOB %s without timezone-dependent age changes', dob => {
        expect(calculateAgeFromISODate(dob, new Date('2026-10-29T12:00:00Z'))).toBe(18);
        expect(calculateAgeFromISODate(dob, new Date('2026-10-28T12:00:00Z'))).toBe(17);
    });
});
