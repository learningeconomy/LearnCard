import { createHash } from 'node:crypto';

/**
 * A digest of the recovery contact an escrow copy seals (LC-2409). `contactMethod` already
 * stores the plaintext; the digest only lets `getAccountContinuity` tell whether the sealed
 * contact still matches the sign-in email without storing another copy of the address.
 */
export const contactDigest = (email: string): string =>
    createHash('sha256')
        .update(`lc-escrow-contact-v1\0${email.trim().toLowerCase()}`)
        .digest('hex');
