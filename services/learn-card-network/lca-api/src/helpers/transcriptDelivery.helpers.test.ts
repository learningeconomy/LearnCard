import { describe, expect, it } from 'vitest';
import { MAX_EXPECTED_DELIVERY_MS, parseExpectedDelivery } from './transcriptDelivery.helpers';

const SENT = new Date('2026-11-10T12:00:00.000Z');

describe('parseExpectedDelivery', () => {
    it('counts expectedInSeconds from when the request was sent', () => {
        expect(
            parseExpectedDelivery({ status: 'accepted', expectedInSeconds: 90 }, SENT, SENT)
        ).toEqual(new Date('2026-11-10T12:01:30.000Z'));
        // A slow issuer response doesn't stretch the estimate.
        const respondedAt = new Date(SENT.getTime() + 10_000);
        expect(parseExpectedDelivery({ expectedInSeconds: 25 }, SENT, respondedAt)).toEqual(
            new Date('2026-11-10T12:00:25.000Z')
        );
    });

    it('reads an ISO expectedBy with an offset', () => {
        expect(
            parseExpectedDelivery(
                { status: 'accepted', expectedBy: '2026-11-12T00:00:00Z' },
                SENT,
                SENT
            )
        ).toEqual(new Date('2026-11-12T00:00:00.000Z'));
        expect(
            parseExpectedDelivery(
                { expectedBy: '2026-11-11T09:00:00-05:00' },
                SENT,
                SENT
            )?.toISOString()
        ).toBe('2026-11-11T14:00:00.000Z');
    });

    it('prefers expectedInSeconds when both are valid', () => {
        expect(
            parseExpectedDelivery(
                { expectedInSeconds: 60, expectedBy: '2026-11-12T00:00:00Z' },
                SENT,
                SENT
            )
        ).toEqual(new Date('2026-11-10T12:01:00.000Z'));
    });

    it('keeps the valid field when the other one is malformed', () => {
        expect(
            parseExpectedDelivery({ expectedInSeconds: 120, expectedBy: 'tomorrow' }, SENT, SENT)
        ).toEqual(new Date('2026-11-10T12:02:00.000Z'));
        expect(
            parseExpectedDelivery(
                { expectedInSeconds: 120, expectedBy: '2026-11-12T00:00:00' },
                SENT,
                SENT
            )
        ).toEqual(new Date('2026-11-10T12:02:00.000Z'));
        expect(
            parseExpectedDelivery(
                { expectedInSeconds: '90', expectedBy: '2026-11-12T00:00:00Z' },
                SENT,
                SENT
            )
        ).toEqual(new Date('2026-11-12T00:00:00.000Z'));
        expect(
            parseExpectedDelivery(
                { expectedInSeconds: null, expectedBy: '2026-11-12T00:00:00Z' },
                SENT,
                SENT
            )
        ).toEqual(new Date('2026-11-12T00:00:00.000Z'));
    });

    it('ignores a missing, malformed, past or too-distant hint', () => {
        expect(parseExpectedDelivery({ status: 'accepted' }, SENT, SENT)).toBeUndefined();
        expect(parseExpectedDelivery(undefined, SENT, SENT)).toBeUndefined();
        expect(parseExpectedDelivery('accepted', SENT, SENT)).toBeUndefined();
        expect(parseExpectedDelivery({ expectedInSeconds: -5 }, SENT, SENT)).toBeUndefined();
        expect(parseExpectedDelivery({ expectedInSeconds: 0 }, SENT, SENT)).toBeUndefined();
        expect(parseExpectedDelivery({ expectedBy: 'tomorrow' }, SENT, SENT)).toBeUndefined();
        expect(
            parseExpectedDelivery({ expectedBy: '2026-11-09T00:00:00Z' }, SENT, SENT)
        ).toBeUndefined();
        expect(
            parseExpectedDelivery({ expectedInSeconds: 5 }, SENT, new Date(SENT.getTime() + 10_000))
        ).toBeUndefined();
        expect(
            parseExpectedDelivery(
                { expectedInSeconds: MAX_EXPECTED_DELIVERY_MS / 1000 + 1 },
                SENT,
                SENT
            )
        ).toBeUndefined();
    });
});
