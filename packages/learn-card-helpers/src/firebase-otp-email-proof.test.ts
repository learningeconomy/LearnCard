import { describe, expect, it } from 'vitest';

import { hasFirebaseOtpEmailProof } from './firebase-otp-email-proof';

describe('Firebase OTP email proof', () => {
    const now = 1_700_000_000;
    const claims = {
        iss: 'https://securetoken.google.com/learncard',
        aud: 'learncard',
        email: 'Person@Example.com',
        firebase: { sign_in_provider: 'custom' },
        lc_otp_verified_email: 'person@example.com',
        lc_otp_verified_at: now,
    };

    it('accepts the proof at its age and clock-skew boundaries', () => {
        expect(hasFirebaseOtpEmailProof({ ...claims, lc_otp_verified_at: now - 3600 }, now)).toBe(
            true
        );
        expect(hasFirebaseOtpEmailProof({ ...claims, lc_otp_verified_at: now + 30 }, now)).toBe(
            true
        );
    });

    it('rejects proof just outside those boundaries', () => {
        expect(hasFirebaseOtpEmailProof({ ...claims, lc_otp_verified_at: now - 3601 }, now)).toBe(
            false
        );
        expect(hasFirebaseOtpEmailProof({ ...claims, lc_otp_verified_at: now + 31 }, now)).toBe(
            false
        );
    });

    it('does not extend an old OTP proof when the ID token is refreshed', () => {
        expect(
            hasFirebaseOtpEmailProof({ ...claims, iat: now, lc_otp_verified_at: now - 3601 }, now)
        ).toBe(false);
    });

    it.each([undefined, null, '1700000000', 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
        'rejects an invalid proof time: %s',
        value => {
            expect(hasFirebaseOtpEmailProof({ ...claims, lc_otp_verified_at: value }, now)).toBe(
                false
            );
        }
    );
});
