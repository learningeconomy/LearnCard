import { describe, expect, it } from 'vitest';
import { formatVerification, isPresentation, verificationFailed } from './verify';

describe('verification output', () => {
    it('formats raw checks and errors', () => {
        const result = {
            checks: ['expiration'],
            errors: ['signature error: Bad signature'],
            warnings: ['Review issuer'],
        };
        expect(formatVerification(result)).toEqual([
            '✓ expiration',
            '! Review issuer',
            '✗ proof: Bad signature',
        ]);
        expect(verificationFailed(result)).toBe(true);
    });
    it('keeps warnings distinct from failures in prettified output', () => {
        const result = [
            { status: 'Success' as const, check: 'proof', message: 'Valid' },
            { status: 'Error' as const, check: 'issuer', message: 'Not checked' },
        ];
        expect(formatVerification(result)).toEqual(['✓ proof', '! issuer: Not checked']);
        expect(verificationFailed(result)).toBe(false);
        expect(verificationFailed([{ status: 'Failed', check: 'proof', details: 'Invalid' }])).toBe(
            true
        );
    });
    it('detects presentations by string or array type', () => {
        expect(isPresentation({ type: ['VerifiablePresentation'] })).toBe(true);
        expect(isPresentation({ type: 'VerifiablePresentation' })).toBe(true);
        expect(isPresentation({ type: ['VerifiableCredential'] })).toBe(false);
        expect(isPresentation(null)).toBe(false);
    });
});
