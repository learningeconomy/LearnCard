/**
 * Escrow recovery cancel-link token.
 *
 * Mirrors the resume-token primitive in `models/EscrowHold.ts`: a random,
 * high-entropy token whose SHA-256 hash is stored on the hold so the
 * plaintext never needs to be persisted. There is no HMAC key involved —
 * the token's own entropy is the secret, exactly like `resumeTokenHash`.
 *
 * The token is single-use (burned via `cancelTokenUsedAt`) and its
 * effective TTL is the hold's own lifetime: it stops matching the moment
 * the hold leaves the `pending` status (cancelled, completed, or expired),
 * so no separate expiry timestamp is needed.
 *
 * Never log the plaintext token.
 */

import { createHash, randomBytes, timingSafeEqual } from 'crypto';

import type { EscrowHold } from '@models';

/** 256 bits of entropy, hex-encoded — same shape as `generateEscrowResumeToken`. */
export const generateEscrowCancelToken = (): string => randomBytes(32).toString('hex');

/** Plain SHA-256, matching `hashEscrowResumeToken` — the token's own entropy is the secret. */
export const hashEscrowCancelToken = (token: string): string =>
    createHash('sha256').update(token).digest('hex');

/**
 * Timing-safe cancel-token check.
 *
 * Returns `false` (never throws) when the hold has no cancel token, the
 * token was already used, or the hold is no longer `pending` — a cancel
 * link's effective TTL is the hold's own lifetime, not a separate clock.
 */
export const escrowCancelTokenMatches = (hold: EscrowHold, token: string): boolean => {
    if (hold.status !== 'pending' || !hold.cancelTokenHash || hold.cancelTokenUsedAt) return false;
    const actual = Buffer.from(hashEscrowCancelToken(token), 'hex');
    const expected = Buffer.from(hold.cancelTokenHash, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
};
