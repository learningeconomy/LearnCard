import { describe, expect, it } from 'vitest';
import {
    formatExpectedDelivery,
    getDeliveryPace,
    getDeliveryProgress,
    getNextDeliveryCheck,
    getStaleAt,
    getTimeLeftLabel,
    isTimedBarCurrent,
} from './transcriptDelivery';

const REQUESTED = '2026-11-10T12:00:00.000Z';
const at = (offsetMs: number): string => new Date(Date.parse(REQUESTED) + offsetMs).toISOString();
const ms = (iso: string): number => Date.parse(iso);

describe('getDeliveryPace', () => {
    it('treats no estimate or 30 seconds or less as quick', () => {
        expect(getDeliveryPace(REQUESTED)).toBe('quick');
        expect(getDeliveryPace(REQUESTED, at(30_000))).toBe('quick');
        expect(getDeliveryPace(REQUESTED, 'garbage')).toBe('quick');
    });

    it('times waits up to five minutes and defers anything longer', () => {
        expect(getDeliveryPace(REQUESTED, at(31_000))).toBe('timed');
        expect(getDeliveryPace(REQUESTED, at(5 * 60_000))).toBe('timed');
        expect(getDeliveryPace(REQUESTED, at(5 * 60_000 + 1))).toBe('later');
        expect(getDeliveryPace(REQUESTED, at(2 * 24 * 60 * 60_000))).toBe('later');
    });
});

describe('getDeliveryProgress', () => {
    const expected = at(120_000);

    it('starts empty, eases out, and stops short of full at the estimate', () => {
        expect(getDeliveryProgress(REQUESTED, expected, ms(REQUESTED))).toBeCloseTo(0.04);
        const half = getDeliveryProgress(REQUESTED, expected, ms(at(60_000)));
        expect(half).toBeGreaterThan(0.45);
        expect(getDeliveryProgress(REQUESTED, expected, ms(expected))).toBeCloseTo(0.9);
    });

    it('keeps creeping after the estimate without ever completing', () => {
        const late = getDeliveryProgress(REQUESTED, expected, ms(at(180_000)));
        const veryLate = getDeliveryProgress(REQUESTED, expected, ms(at(3_600_000)));
        expect(late).toBeGreaterThan(0.9);
        expect(veryLate).toBeGreaterThan(late);
        expect(veryLate).toBeLessThan(0.97 + 1e-9);
    });

    it('only moves forward over time', () => {
        let previous = -1;
        for (let t = 0; t <= 600_000; t += 5_000) {
            const p = getDeliveryProgress(REQUESTED, expected, ms(at(t)));
            expect(p).toBeGreaterThanOrEqual(previous);
            previous = p;
        }
    });
});

describe('getTimeLeftLabel', () => {
    const expected = at(150_000);

    it('rounds to the nearest minute, then seconds in tens, then says almost there', () => {
        expect(getTimeLeftLabel(expected, ms(REQUESTED))).toBe('About 3 minutes left');
        expect(getTimeLeftLabel(expected, ms(at(90_000)))).toBe('About a minute left');
        expect(getTimeLeftLabel(expected, ms(at(81_000)))).toBe('About a minute left');
        expect(getTimeLeftLabel(expected, ms(at(118_000)))).toBe('About 40 seconds left');
        expect(getTimeLeftLabel(expected, ms(at(148_000)))).toBe('Almost there');
        expect(getTimeLeftLabel(expected, ms(at(300_000)))).toBe('Almost there');
    });
});

describe('formatExpectedDelivery', () => {
    const now = ms(REQUESTED);

    it('phrases minutes and hours relatively', () => {
        expect(formatExpectedDelivery(at(20 * 60_000), now, 'en')).toBe('in 20 minutes');
        expect(formatExpectedDelivery(at(150 * 60_000), now, 'en')).toBe('in 3 hours');
    });

    it('phrases days relatively and a week or more as a date', () => {
        const day = 24 * 60 * 60_000;
        expect(formatExpectedDelivery(at(day + 60_000), now, 'en')).toMatch(
            /^(tomorrow|in 2 days)$/
        );
        expect(formatExpectedDelivery(at(3 * day), now, 'en')).toMatch(/^in (3|4) days$/);
        expect(formatExpectedDelivery(at(10 * day), now, 'en')).toBe('by November 20');
    });
});

describe('isTimedBarCurrent', () => {
    it('keeps the bar up to a minute past the estimate', () => {
        expect(isTimedBarCurrent(at(120_000), ms(at(150_000)))).toBe(true);
        expect(isTimedBarCurrent(at(120_000), ms(at(180_000)))).toBe(true);
        expect(isTimedBarCurrent(at(120_000), ms(at(181_000)))).toBe(false);
    });
});

describe('getNextDeliveryCheck', () => {
    const day = 24 * 60 * 60_000;

    it('refreshes a relative estimate each minute, then wakes at the estimate and its grace', () => {
        const expected = at(60 * 60_000);
        expect(getNextDeliveryCheck(REQUESTED, expected, day, ms(REQUESTED))).toBe(ms(at(60_000)));
        expect(getNextDeliveryCheck(REQUESTED, expected, day, ms(at(59 * 60_000 + 30_000)))).toBe(
            ms(expected)
        );
        expect(getNextDeliveryCheck(REQUESTED, expected, day, ms(expected))).toBe(
            ms(expected) + 60_000
        );
    });

    it('wakes at the stale time once the estimate has passed, then stops', () => {
        expect(getNextDeliveryCheck(REQUESTED, at(60_000), day, ms(at(5 * 60_000)))).toBe(
            ms(at(60_000)) + day
        );
        expect(getNextDeliveryCheck(REQUESTED, undefined, day, ms(REQUESTED))).toBe(
            ms(REQUESTED) + day
        );
        expect(
            getNextDeliveryCheck(REQUESTED, undefined, day, ms(REQUESTED) + day + 1)
        ).toBeUndefined();
    });
});

describe('getStaleAt', () => {
    const day = 24 * 60 * 60_000;

    it('is a day after the request, or a day after a later estimate', () => {
        expect(getStaleAt(REQUESTED, undefined, day)).toBe(ms(REQUESTED) + day);
        expect(getStaleAt(REQUESTED, at(60_000), day)).toBe(ms(REQUESTED) + 60_000 + day);
        expect(getStaleAt(REQUESTED, at(3 * day), day)).toBe(ms(REQUESTED) + 4 * day);
    });
});
