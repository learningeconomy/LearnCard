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

    it('uses the UTC day of the supplied clock', () => {
        expect(calculateAgeFromISODate('2008-10-29', new Date('2026-10-29T00:00:00Z'))).toBe(18);
        expect(calculateAgeFromISODate('2008-10-29', new Date('2026-10-28T23:59:59.999Z'))).toBe(
            17
        );
    });

    it('preserves a calendar date skipped by the host time zone', () => {
        // Pacific/Apia skipped this day. The DOB still means December 30.
        const now = new Date('2029-12-30T00:00:00Z');
        expect(calculateAgeFromISODate('2011-12-30', now)).toBe(18);
    });

    it('counts a leap-day birthday on March 1 in a non-leap year', () => {
        expect(calculateAgeFromISODate('2000-02-29', new Date('2018-02-28T23:59:59Z'))).toBe(17);
        expect(calculateAgeFromISODate('2000-02-29', new Date('2018-03-01T00:00:00Z'))).toBe(18);
    });

    it.each([
        '2008-10-29T12:30',
        '20081029',
        '2008-W44-3',
        '2008-303',
        '2008-10-29T23:30:00-12:00',
        '2008-10-29 23:30-12:00',
        '2008-10-29T00:15+14',
    ])('preserves legacy ISO DOB %s without timezone-dependent age changes', dob => {
        expect(calculateAgeFromISODate(dob, new Date('2026-10-29T12:00:00Z'))).toBe(18);
        expect(calculateAgeFromISODate(dob, new Date('2026-10-28T12:00:00Z'))).toBe(17);
    });
});
