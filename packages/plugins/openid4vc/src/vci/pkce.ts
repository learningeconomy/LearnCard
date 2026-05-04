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
 * We only implement the `S256` method \u2014 `plain` is spec-allowed but
 * provides no security benefit, and OpenID4VCI \u00a76.2 mandates `S256`
 * when PKCE is used.
 *
 * Cross-platform: uses the Web Crypto API (`crypto.getRandomValues` +
 * `crypto.subtle.digest`) which is available natively in browsers and
 * in Node \u2265 18. Async because `subtle.digest` is async by spec.
 */

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
 * Web Crypto random output — which satisfies RFC 7636 §4.1's
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

    const verifier = toB64url(getRandomBytes(byteLength));
    const challenge = await computeS256Challenge(verifier);

    return { verifier, challenge, method: 'S256' };
};

/**
 * Derive the S256 challenge for a given verifier. Separated from
 * {@link generatePkcePair} so callers that round-trip a verifier
 * through a redirect (the common case — wallet stores verifier,
 * extracts it later at token-exchange time) can re-derive the
 * challenge for assertions and logs.
 *
 * Async because Web Crypto's `subtle.digest` is async by spec.
 */
export const computeS256Challenge = async (verifier: string): Promise<string> => {
    if (typeof verifier !== 'string' || verifier.length < 24) {
        throw new PkceError(
            'invalid_verifier',
            'PKCE verifier must be a base64url string with ≥24 chars'
        );
    }

    const bytes = new TextEncoder().encode(verifier);
    const digest = await getSubtle().digest('SHA-256', bytes);
    return toB64url(new Uint8Array(digest));
};

/**
 * Verify a challenge matches a given verifier. Used by the
 * authorization server, not the wallet — but we expose it so the
 * in-process test server can validate challenges the same way real
 * ASes do.
 */
export const verifyPkce = async (args: {
    verifier: string;
    challenge: string;
    method?: PkceCodeChallengeMethod;
}): Promise<boolean> => {
    const method = args.method ?? 'S256';
    if (method !== 'S256') {
        throw new PkceError('unsupported_method', `PKCE method ${method} not supported`);
    }

    return (await computeS256Challenge(args.verifier)) === args.challenge;
};

/* -------------------------------------------------------------------------- */
/*                                 internals                                  */
/* -------------------------------------------------------------------------- */

const toB64url = (input: Uint8Array): string => {
    // Use Buffer where available (node) for speed; fall back to a
    // pure-JS path for browsers where Buffer is polyfilled but
    // hosts may have stripped it.
    if (typeof Buffer !== 'undefined') {
        return Buffer.from(input)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    }

    let binary = '';
    for (let i = 0; i < input.length; i++) binary += String.fromCharCode(input[i]!);
    return btoa(binary)
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
};

const getRandomBytes = (byteLength: number): Uint8Array => {
    const buf = new Uint8Array(byteLength);
    getCrypto().getRandomValues(buf);
    return buf;
};

const getCrypto = (): Crypto => {
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (!c) {
        throw new PkceError(
            'invalid_verifier',
            'Web Crypto API not available in this runtime'
        );
    }
    return c;
};

const getSubtle = (): SubtleCrypto => {
    const subtle = getCrypto().subtle;
    if (!subtle) {
        throw new PkceError(
            'invalid_verifier',
            'crypto.subtle not available in this runtime'
        );
    }
    return subtle;
};
