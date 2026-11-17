import { describe, expect, it } from 'vitest';

import {
    IntegrationEventCursorMismatchError,
    decodeIntegrationEventCursor,
    encodeIntegrationEventCursor,
} from './integration-event-cursor.helpers';

const ID = 'integration-1';

describe('integration event cursor', () => {
    it.each([0, 1, 42, 1_000_000, Number.MAX_SAFE_INTEGER])('round-trips %d', sequence => {
        expect(decodeIntegrationEventCursor(encodeIntegrationEventCursor(ID, sequence), ID)).toBe(
            sequence
        );
    });

    it('round-trips an integration id that contains colons', () => {
        const id = 'a:b:c';

        expect(decodeIntegrationEventCursor(encodeIntegrationEventCursor(id, 7), id)).toBe(7);
    });

    it('is opaque base64url and carries the integration id', () => {
        const cursor = encodeIntegrationEventCursor(ID, 42);

        expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(Buffer.from(cursor, 'base64url').toString('utf8')).toBe(`iev2:${ID}:42`);
    });

    it('refuses a cursor issued for another integration with a distinct error', () => {
        const cursor = encodeIntegrationEventCursor('integration-a', 3);

        expect(() => decodeIntegrationEventCursor(cursor, 'integration-b')).toThrow(
            IntegrationEventCursorMismatchError
        );
    });

    it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
        'refuses to encode %d',
        sequence => {
            expect(() => encodeIntegrationEventCursor(ID, sequence)).toThrow(
                'Invalid integration event sequence'
            );
        }
    );

    it('refuses to encode an empty integration id', () => {
        expect(() => encodeIntegrationEventCursor('', 1)).toThrow(
            'Invalid integration event sequence'
        );
    });

    it.each([
        '',
        '42',
        'not-a-cursor',
        Buffer.from('42').toString('base64url'),
        Buffer.from('iev1:42').toString('base64url'),
        Buffer.from('iev2:').toString('base64url'),
        Buffer.from('iev2:42').toString('base64url'),
        Buffer.from(`iev2::42`).toString('base64url'),
        Buffer.from(`iev2:${ID}:`).toString('base64url'),
        Buffer.from(`iev2:${ID}:-1`).toString('base64url'),
        Buffer.from(`iev2:${ID}:1.5`).toString('base64url'),
        Buffer.from(`iev2:${ID}:01`).toString('base64url'),
        Buffer.from(`iev2:${ID}:1e3`).toString('base64url'),
        Buffer.from(`iev2:${ID}:99999999999999999999`).toString('base64url'),
    ])('refuses to decode %j as malformed', cursor => {
        const attempt = (): number => decodeIntegrationEventCursor(cursor, ID);

        expect(attempt).toThrow('Invalid integration event cursor');
        expect(attempt).not.toThrow(IntegrationEventCursorMismatchError);
    });
});
