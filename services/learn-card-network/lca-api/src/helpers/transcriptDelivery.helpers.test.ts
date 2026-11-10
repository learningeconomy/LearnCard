import { describe, expect, it } from 'vitest';
import { MAX_EXPECTED_DELIVERY_MS, parseExpectedDelivery } from './transcriptDelivery.helpers';

const NOW = new Date('2026-11-10T12:00:00.000Z');

describe('parseExpectedDelivery', () => {
    it('reads expectedInSeconds relative to now', () => {
        expect(parseExpectedDelivery({ status: 'accepted', expectedInSeconds: 90 }, NOW)).toEqual(
            new Date('2026-11-10T12:01:30.000Z')
        );
    });

    it('reads an ISO expectedBy with an offset', () => {
        expect(
            parseExpectedDelivery({ status: 'accepted', expectedBy: '2026-11-12T00:00:00Z' }, NOW)
        ).toEqual(new Date('2026-11-12T00:00:00.000Z'));
        expect(
            parseExpectedDelivery({ expectedBy: '2026-11-11T09:00:00-05:00' }, NOW)?.toISOString()
        ).toBe('2026-11-11T14:00:00.000Z');
    });

    it('prefers expectedInSeconds when both are present', () => {
        expect(
            parseExpectedDelivery(
                { expectedInSeconds: 60, expectedBy: '2026-11-12T00:00:00Z' },
                NOW
            )
        ).toEqual(new Date('2026-11-10T12:01:00.000Z'));
    });

    it('ignores a missing, malformed, past or too-distant hint', () => {
        expect(parseExpectedDelivery({ status: 'accepted' }, NOW)).toBeUndefined();
        expect(parseExpectedDelivery(undefined, NOW)).toBeUndefined();
        expect(parseExpectedDelivery('accepted', NOW)).toBeUndefined();
        expect(parseExpectedDelivery({ expectedInSeconds: -5 }, NOW)).toBeUndefined();
        expect(parseExpectedDelivery({ expectedInSeconds: 0 }, NOW)).toBeUndefined();
        expect(parseExpectedDelivery({ expectedInSeconds: '90' }, NOW)).toBeUndefined();
        expect(parseExpectedDelivery({ expectedBy: 'tomorrow' }, NOW)).toBeUndefined();
        expect(parseExpectedDelivery({ expectedBy: '2026-11-09T00:00:00Z' }, NOW)).toBeUndefined();
        expect(
            parseExpectedDelivery({ expectedInSeconds: MAX_EXPECTED_DELIVERY_MS / 1000 + 1 }, NOW)
        ).toBeUndefined();
    });
});
