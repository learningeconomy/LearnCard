import type { VC } from '@learncard/types';
import { describe, expect, it } from 'vitest';
import { getCredentialExpirationDate, hasCredentialExpired } from './credentialExpiration';

const expiry = '2025-06-01T00:00:00Z';
const now = Date.parse(expiry);

describe('credential expiration', () => {
    it.each([
        { expirationDate: expiry },
        { validUntil: expiry },
        { validUntil: { value: expiry } },
        { boostCredential: { validUntil: expiry } },
    ])('normalizes the credential expiration boundary without changing it: %j', credential => {
        const before = structuredClone(credential);
        expect(getCredentialExpirationDate(credential as VC)).toBe(expiry);
        expect(hasCredentialExpired(credential as VC, now - 1)).toBe(false);
        expect(hasCredentialExpired(credential as VC, now)).toBe(true);
        expect(credential).toEqual(before);
    });

    it.each([undefined, {}, { validUntil: 'not a date' }])(
        'does not mark a missing or invalid expiration as expired: %j',
        credential => {
            expect(getCredentialExpirationDate(credential as VC)).toBeUndefined();
            expect(hasCredentialExpired(credential as VC, now)).toBe(false);
        }
    );
});
