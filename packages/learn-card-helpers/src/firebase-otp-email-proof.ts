/**
 * Maximum time after an email OTP during which its signed proof can be used.
 * This bounds a Firebase custom-token claim even if an authenticated session
 * and its refreshed ID tokens outlive the custom token that started it. A user
 * taking more than one hour to finish onboarding may need a fresh email-code
 * sign-in to prove control again.
 */
export const FIREBASE_OTP_EMAIL_PROOF_MAX_AGE_SECONDS = 60 * 60;
const ALLOWED_FUTURE_CLOCK_SKEW_SECONDS = 30;

/**
 * Check an email OTP proof in an already signature-verified Firebase ID token.
 * This function does not verify a JWT or establish trust in an issuer; callers
 * must first validate the token against their configured Firebase project.
 * Firebase custom-token extra claims are expected to appear in the resulting
 * ID token. A missing or lost claim fails closed; real-provider propagation
 * across forced refreshes must be verified separately during rollout.
 */
export const hasFirebaseOtpEmailProof = (
    claims: Record<string, unknown>,
    nowSeconds: number = Math.floor(Date.now() / 1000)
): boolean => {
    const { iss, aud, email, firebase, lc_otp_verified_email, lc_otp_verified_at } = claims;
    if (
        typeof iss !== 'string' ||
        typeof aud !== 'string' ||
        !/^[a-z0-9][a-z0-9-]*$/i.test(aud) ||
        iss !== `https://securetoken.google.com/${aud}` ||
        typeof email !== 'string' ||
        typeof lc_otp_verified_email !== 'string' ||
        !email.trim() ||
        email.trim().toLowerCase() !== lc_otp_verified_email ||
        typeof lc_otp_verified_at !== 'number' ||
        !Number.isSafeInteger(lc_otp_verified_at) ||
        typeof firebase !== 'object' ||
        firebase === null ||
        !('sign_in_provider' in firebase) ||
        firebase.sign_in_provider !== 'custom'
    ) {
        return false;
    }

    return (
        lc_otp_verified_at <= nowSeconds + ALLOWED_FUTURE_CLOCK_SKEW_SECONDS &&
        lc_otp_verified_at >= nowSeconds - FIREBASE_OTP_EMAIL_PROOF_MAX_AGE_SECONDS
    );
};
