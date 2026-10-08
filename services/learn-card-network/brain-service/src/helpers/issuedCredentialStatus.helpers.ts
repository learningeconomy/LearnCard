import type { JWE, UnsignedVC, VC } from '@learncard/types';
import type { IssuedCredential } from '../types/credential';

/** Internal envelopes never have the top-level fields of a wire-format VC or JWE. */
export const isIssuedCredential = (
    value: UnsignedVC | VC | JWE | IssuedCredential
): value is IssuedCredential =>
    !('@context' in value) && !('ciphertext' in value) && value.kind === 'issued-credential';

export const getIssuedCredentialPayload = (value: VC | JWE | IssuedCredential): VC | JWE =>
    isIssuedCredential(value) ? value.credential : value;
