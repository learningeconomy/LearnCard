import { describe, expect, it } from 'vitest';
import { isAlreadyConsentedError, isConsentConflict } from './consentErrors';

describe('consent conflict classification', () => {
    it.each([
        { message: 'The sharing audience changed', data: { code: 'CONFLICT', httpStatus: 409 } },
        { message: 'The consent changed', shape: { data: { code: 'CONFLICT' } } },
        { message: 'Request rejected', response: { status: 409 } },
    ])('does not interpret a general conflict as consent success: %j', error => {
        expect(isAlreadyConsentedError(error)).toBe(false);
        expect(isConsentConflict(error)).toBe(true);
    });
    it('recognizes the explicit existing-consent message', () => {
        expect(
            isAlreadyConsentedError(new Error("You've already consented to this contract!"))
        ).toBe(true);
    });
    it.each([null, undefined, {}, new Error('Network unavailable')])(
        'handles non-conflicts %s',
        error => {
            expect(isConsentConflict(error)).toBe(false);
            expect(isAlreadyConsentedError(error)).toBe(false);
        }
    );
});
