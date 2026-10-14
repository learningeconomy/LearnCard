import { describe, expect, it } from 'vitest';
import {
    materializeCredentialFields,
    normalizeCredentialAwardDate,
    parseCredentialNumber,
} from './credential-materialization';

describe('standard credential materialization', () => {
    it('converts only declared numeric paths, preserving zero, result text and identifiers', () => {
        const input = {
            type: ['VerifiableCredential', 'OpenBadgeCredential'],
            credentialSubject: {
                id: '0012',
                creditsEarned: '0',
                achievement: { creditsAvailable: '12.5' },
                result: [{ value: '95' }],
            },
            awardedDate: '2024-02-29',
        };
        expect(materializeCredentialFields(input)).toEqual({
            ...input,
            credentialSubject: {
                ...input.credentialSubject,
                creditsEarned: 0,
                achievement: { creditsAvailable: 12.5 },
            },
            awardedDate: '2024-02-29T00:00:00.000Z',
        });
        expect(input.credentialSubject.creditsEarned).toBe('0');
    });
    it('does not modify signed credentials or embedded signed credentials', () => {
        const signed = {
            type: ['OpenBadgeCredential'],
            proof: { proofValue: 'signature' },
            credentialSubject: { creditsEarned: '3' },
        };
        expect(materializeCredentialFields(signed)).toBe(signed);
        const clr = {
            type: ['ClrCredential'],
            credentialSubject: {
                achievement: [{ creditsAvailable: '3' }],
                verifiableCredential: [signed],
            },
        };
        expect(materializeCredentialFields(clr)).toMatchObject({
            credentialSubject: { verifiableCredential: [signed] },
        });
    });
    it.each(['', '12 hours', '0x10', '1,000', 'Infinity', 'NaN', '1e999'])(
        'rejects incomplete or ambiguous numeric input %s',
        value => expect(() => parseCredentialNumber(value)).toThrow()
    );
    it('normalizes explicit offsets without changing the represented instant', () =>
        expect(normalizeCredentialAwardDate('2024-03-01T01:30:00+02:00')).toBe(
            '2024-02-29T23:30:00.000Z'
        ));
    it('preserves submillisecond precision while normalizing an explicit offset', () => {
        expect(normalizeCredentialAwardDate('2024-03-01T01:30:00.123456+02:00')).toBe(
            '2024-02-29T23:30:00.123456Z'
        );
    });
    it.each(['02/03/2024', '2023-02-29', '2024-04-31', '2024-01-01T12:00:00'])(
        'rejects ambiguous or invalid dates %s',
        value => expect(() => normalizeCredentialAwardDate(value)).toThrow('awardedDate')
    );
});
