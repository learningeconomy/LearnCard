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
});
