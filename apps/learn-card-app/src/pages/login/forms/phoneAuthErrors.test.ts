import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../paraglide/messages.js', () => ({}));

import { classifyPhoneAuthError } from './phoneAuthErrors';

describe('classifyPhoneAuthError', () => {
    it.each([
        ['auth/too-many-requests', 'tooManyRequests'],
        ['Firebase: Error (auth/too-many-requests).', 'tooManyRequests'],
        [
            'We have blocked all requests from this device due to unusual activity. Try again later.',
            'tooManyRequests',
        ],
        ['auth/invalid-verification-code', 'invalidCode'],
        ['Firebase: Error (auth/invalid-verification-code).', 'invalidCode'],
        ['auth/code-expired', 'invalidCode'],
        [
            'The SMS code has expired. Please re-send the verification code to try again.',
            'invalidCode',
        ],
        ['auth/invalid-phone-number', 'invalidPhoneNumber'],
        ['auth/quota-exceeded', 'quotaExceeded'],
        ['auth/network-request-failed', 'network'],
        ['Request a phone code before confirming', 'generic'],
        ['auth/captcha-check-failed', 'generic'],
        ['Phone verification cancelled', 'cancelled'],
        ['something unexpected', 'generic'],
        [undefined, 'generic'],
    ])('maps %s to %s', (input, expected) => {
        expect(classifyPhoneAuthError(input)).toBe(expected);
    });

    it('reads code and message from error objects', () => {
        expect(classifyPhoneAuthError({ code: 'auth/too-many-requests' })).toBe('tooManyRequests');
        expect(classifyPhoneAuthError(new Error('auth/invalid-verification-code'))).toBe(
            'invalidCode'
        );
    });
});
