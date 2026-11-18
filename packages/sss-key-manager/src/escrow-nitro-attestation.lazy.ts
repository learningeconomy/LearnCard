import type { verifyNitroAttestationDocument as Verify } from './escrow-nitro-attestation';

/** Public entry for `verifyNitroAttestationDocument` that loads the X.509/CBOR verifier on first call. */
export const verifyNitroAttestationDocument: typeof Verify = async (...args) =>
    (await import('./escrow-nitro-attestation')).verifyNitroAttestationDocument(...args);
