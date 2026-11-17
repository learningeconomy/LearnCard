import { describe, expect, it } from 'vitest';

import {
    decodeIntegrationEventCursor,
    encodeIntegrationEventCursor,
} from './integration-event-cursor.helpers';

describe('integration event cursor', () => {
    it.each([0, 1, 42, 1_000_000, Number.MAX_SAFE_INTEGER])('round-trips %d', sequence => {
        expect(decodeIntegrationEventCursor(encodeIntegrationEventCursor(sequence))).toBe(sequence);
    });

    it('is opaque base64url', () => {
        const cursor = encodeIntegrationEventCursor(42);

        expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(cursor).not.toBe('42');
        expect(Buffer.from(cursor, 'base64url').toString('utf8')).toBe('iev1:42');
    });

    it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
        'refuses to encode %d',
        sequence => {
            expect(() => encodeIntegrationEventCursor(sequence)).toThrow(
                'Invalid integration event sequence'
            );
        }
    );

    it.each([
        '',
        '42',
        'not-a-cursor',
        Buffer.from('42').toString('base64url'),
        Buffer.from('iev1:').toString('base64url'),
        Buffer.from('iev1:-1').toString('base64url'),
        Buffer.from('iev1:1.5').toString('base64url'),
        Buffer.from('iev1:01').toString('base64url'),
        Buffer.from('iev1:1e3').toString('base64url'),
        Buffer.from('iev2:1').toString('base64url'),
        Buffer.from('iev1:99999999999999999999').toString('base64url'),
    ])('refuses to decode %j', cursor => {
        expect(() => decodeIntegrationEventCursor(cursor)).toThrow(
            'Invalid integration event cursor'
        );
    });
});
