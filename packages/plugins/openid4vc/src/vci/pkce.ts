/**
 * Slice 4 — **PKCE (Proof Key for Code Exchange, RFC 7636)**.
 *
 * The authorization-code flow in OID4VCI is vulnerable to authorization
 * code interception attacks unless the wallet proves possession of a
 * secret at token-exchange time. PKCE is the standard mitigation:
 *
 *   1. Wallet generates a high-entropy `code_verifier`.
 *   2. Wallet derives `code_challenge = BASE64URL(SHA-256(verifier))`.
 *   3. Wallet sends `code_challenge` + `code_challenge_method=S256`
 *      on the authorization request.
 *   4. Wallet sends the original `code_verifier` on the token request.
 *   5. AS compares the hashed verifier with the stored challenge.
 *
 * We only implement the `S256` method — `plain` is spec-allowed but
 * provides no security benefit, and OpenID4VCI §6.2 mandates `S256`
 * when PKCE is used.
 *
 * Purely synchronous + self-contained: uses `node:crypto`
 * (`randomBytes` + `createHash`) so no dependency on `jose` or the
 * Web Crypto API. Works identically in Node and in browsers via
 * bundler polyfills.
 */
import { createHash, randomBytes } from 'node:crypto';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/**
 * PKCE code challenge method. OID4VCI permits only `S256`; we pin the
 * literal type so callers get compile-time noise if they try `plain`.
 */
export type PkceCodeChallengeMethod = 'S256';

export interface PkcePair {
    /**
     * High-entropy secret kept by the wallet. Sent verbatim on the
     * token request to prove possession of the original challenge.
     */
    verifier: string;

    /**
     * `BASE64URL(SHA-256(verifier))`. Sent on the authorization
     * request (along with `code_challenge_method`) so the AS can
     * later check the verifier matches.
     */
    challenge: string;

    method: PkceCodeChallengeMethod;
}

export interface GeneratePkceOptions {
    /**
     * Byte length of the random verifier source. The spec allows
     * 43–128 *characters* of base64url-encoded entropy; our default
     * of 32 bytes encodes to ~43 base64url chars, matching the
     * minimum. Bump this if your threat model demands more.
     */
    byteLength?: number;
}

/* -------------------------------------------------------------------------- */
/*                                  errors                                    */
/* -------------------------------------------------------------------------- */

export type PkceErrorCode = 'invalid_verifier' | 'unsupported_method';

export class PkceError extends Error {
    readonly code: PkceErrorCode;
    constructor(code: PkceErrorCode, message: string) {
        super(message);
        this.name = 'PkceError';
        this.code = code;
    }
}

/* -------------------------------------------------------------------------- */
/*                               public surface                               */
/* -------------------------------------------------------------------------- */

/**
 * Generate a fresh PKCE verifier + S256 challenge.
 *
 * The verifier is produced by base64url-encoding `byteLength` bytes of
 * `node:crypto.randomBytes` — which satisfies RFC 7636 §4.1's
 * "unreserved characters only" requirement without extra normalization.
 */
export const generatePkcePair = async (
    options: GeneratePkceOptions = {}
): Promise<PkcePair> => {
    const byteLength = options.byteLength ?? 32;
    if (byteLength < 24 || byteLength > 96) {
        throw new PkceError(
            'invalid_verifier',
            `PKCE byteLength must be between 24 and 96 (got ${byteLength})`
        );
    }

    const verifier = toB64url(randomBytes(byteLength));
    const challenge = computeS256Challenge(verifier);

    return { verifier, challenge, method: 'S256' };
};

/**
 * Derive the S256 challenge for a given verifier. Separated from
 * {@link generatePkcePair} so callers that round-trip a verifier
 * through a redirect (the common case — wallet stores verifier,
 * extracts it later at token-exchange time) can re-derive the
 * challenge for assertions and logs.
 */
export const computeS256Challenge = (verifier: string): string => {
    if (typeof verifier !== 'string' || verifier.length < 24) {
        throw new PkceError(
            'invalid_verifier',
            'PKCE verifier must be a base64url string with ≥24 chars'
        );
    }

    const digest = createHash('sha256').update(verifier, 'utf8').digest();
    return toB64url(digest);
};

/**
 * Verify a challenge matches a given verifier. Used by the
 * authorization server, not the wallet — but we expose it so the
 * in-process test server can validate challenges the same way real
 * ASes do.
 */
export const verifyPkce = (args: {
    verifier: string;
    challenge: string;
    method?: PkceCodeChallengeMethod;
}): boolean => {
    const method = args.method ?? 'S256';
    if (method !== 'S256') {
        throw new PkceError('unsupported_method', `PKCE method ${method} not supported`);
    }

    return computeS256Challenge(args.verifier) === args.challenge;
};

/* -------------------------------------------------------------------------- */
/*                                 internals                                  */
/* -------------------------------------------------------------------------- */

const toB64url = (input: Buffer | Uint8Array): string => {
    const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
    return buf
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};
