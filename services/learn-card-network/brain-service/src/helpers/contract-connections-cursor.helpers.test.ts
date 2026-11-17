import { describe, expect, it } from 'vitest';

import {
    decodeContractConnectionsCursor,
    encodeContractConnectionsCursor,
} from './contract-connections-cursor.helpers';

describe('contract connections cursor', () => {
    it('round-trips a terms id through an opaque base64url cursor', () => {
        const termsId = '0b9f6c1e-7a52-4d0c-9a53-2f4f1f1f8a10';
        const cursor = encodeContractConnectionsCursor(termsId);

        expect(cursor).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(cursor).not.toContain(termsId);
        expect(decodeContractConnectionsCursor(cursor)).toBe(termsId);
    });

    it.each(['', 'not-a-cursor', Buffer.from('ccv1:').toString('base64url'), 'Y2N2MTphYmM='])(
        'rejects %j',
        cursor => {
            expect(() => decodeContractConnectionsCursor(cursor)).toThrow(
                'Invalid contract connections cursor'
            );
        }
    );
});
