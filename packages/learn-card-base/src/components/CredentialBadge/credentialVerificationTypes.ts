export const VERIFIER_STATES = {
    selfVerified: 'Self Issued',
    trustedVerifier: 'Trusted Issuer',
    unknownVerifier: 'Unknown Issuer',
    appIssuer: 'App Issuer',
    untrustedVerifier: 'Untrusted Issuer',
} as const;

export type VerifierState = (typeof VERIFIER_STATES)[keyof typeof VERIFIER_STATES];
