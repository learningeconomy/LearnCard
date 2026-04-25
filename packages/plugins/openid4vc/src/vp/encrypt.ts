/**
 * Slice 7d — **`direct_post.jwt` response encryption (JARM)**.
 *
 * OID4VP §8.3 lets the verifier ask the wallet to send the
 * Authorization Response as a single signed-and/or-encrypted JOSE
 * blob (JARM) instead of as cleartext form fields. The wire shape:
 *
 *     POST {response_uri}
 *     Content-Type: application/x-www-form-urlencoded
 *
 *     response={JOSE blob}
 *
 * where `{JOSE blob}` is one of:
 *
 *   - **JWE only** — the response object packed as a compact JWE.
 *   - **JWS only** — the response object signed as a compact JWS.
 *     Rare in practice; OID4VP §8.3 mandates encryption when the
 *     verifier publishes encryption keys.
 *   - **Nested JWS-in-JWE** — the response object is signed by the
 *     wallet (outer authorship binding), then the JWS is encrypted
 *     to the verifier's enc key (transport confidentiality). This
 *     is the EUDI-flavored production shape.
 *
 * The plaintext payload (whether the JWE plaintext or the JWS
 * payload) is a JSON object carrying the same fields that
 * `direct_post` cleartext would send as form parameters:
 *
 *     {
 *       "vp_token": "<jws>" | { "<query_id>": "..." },
 *       "presentation_submission": { ... },   // PEX only
 *       "state": "...",                        // when Auth Request had it
 *       "id_token": "..."                      // SIOPv2 only
 *     }
 *
 * # What this module does
 *
 * `encryptResponseObject` takes the plaintext payload + the
 * verifier's `client_metadata` and returns the compact JOSE string
 * suitable to put in the `response` form field.
 *
 *   - Picks an encryption key from `client_metadata.jwks` (or fetches
 *     `client_metadata.jwks_uri` when only the URL is supplied) per
 *     OID4VP §8.3 paragraphs 2-4: a key with `use: "enc"` (or no
 *     `use` claim) whose `alg` (or none) matches the verifier's
 *     `authorization_encrypted_response_alg`.
 *   - Negotiates the JWE algorithms from
 *     `authorization_encrypted_response_alg` (key wrap) and
 *     `authorization_encrypted_response_enc` (content encryption).
 *     Falls back to the spec-recommended `ECDH-ES` + `A256GCM` if the
 *     verifier didn't declare specific algorithms.
 *   - Sets the `apv` JWE protected header to the base64url-encoding
 *     of the verifier's `nonce` from the Authorization Request, per
 *     OID4VP §8.3 paragraph 6 (mandatory for ECDH-ES KDFs to bind
 *     the encryption to the session). Optionally sets `apu` if the
 *     caller provides a wallet-side nonce.
 *   - When the verifier ALSO declared
 *     `authorization_signed_response_alg`, signs the payload first
 *     with the wallet's signing key and encrypts the resulting JWS
 *     instead of the raw JSON. The inner JWS protected header
 *     carries the wallet's `kid`/`alg` so the verifier can identify
 *     who authored the response.
 *
 * # What this module does NOT do
 *
 *   - **Network I/O is injected.** When the verifier publishes its
 *     keys via `jwks_uri` (instead of inline `jwks`), the caller
 *     passes a `fetchImpl` so the module stays testable.
 *   - **Wallet signing is injected.** The optional inner JWS uses a
 *     caller-supplied signer (the same one that signs vp_token JWTs);
 *     this module never touches the wallet's keystore directly.
 *   - **Decryption.** Wallets only encrypt outbound responses; the
 *     verifier handles decryption. The Sphereon test harness has its
 *     own decryption shim mirroring this module's encrypt shape so
 *     interop tests can round-trip.
 *
 * # Why this is its own module
 *
 * Encryption is the security perimeter for response confidentiality —
 * a bug here leaks every claim the wallet ever discloses. Keeping it
 * in one tested module (rather than inlining JWE building inside
 * `submit.ts`) means:
 *
 *   1. The unit-test surface is one cohesive matrix of algorithm
 *      negotiations, key-selection edge cases, and nonce-binding
 *      assertions, not smeared across the transport's tests.
 *   2. The transport (`submit.ts`) stays a pure HTTP layer; whether
 *      the response is cleartext or JOSE is a one-line dispatch
 *      based on `response_mode`.
 *   3. Future work (e.g. signed-only JARM responses for low-privacy
 *      use cases, or post-quantum KEM algorithms) lands here without
 *      touching the wire layer.
 */
import { CompactEncrypt, importJWK, type JWK } from 'jose';

import type { ProofJwtSigner } from '../vci/types';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/**
 * The plaintext response object — same fields the cleartext
 * `direct_post` mode sends as form parameters, packed into a single
 * JSON object that becomes the JWE plaintext (or the JWS payload
 * when nested signing is in use).
 */
export interface ResponseObjectPayload {
    /**
     * Signed VP token. Three shapes are accepted (mirrors the
     * `submit.ts` `VpToken` discriminator):
     *  - PEX `jwt_vp_json` → compact JWS string
     *  - PEX `ldp_vp`      → signed VP JSON object
     *  - DCQL response     → JSON object keyed by credential_query_id
     */
    vp_token: string | Record<string, unknown>;

    /**
     * DIF PEX v2 Presentation Submission. Required for PEX flows;
     * MUST be omitted for DCQL flows (which embed routing in the
     * vp_token keying).
     */
    presentation_submission?: Record<string, unknown>;

    /**
     * Verifier's `state` echoed back so it can correlate the response
     * with the pending session. Omitted when the Auth Request didn't
     * carry one.
     */
    state?: string;

    /**
     * SIOPv2 ID token. Required when the verifier asked for
     * `response_type=vp_token id_token`; must be omitted otherwise.
     */
    id_token?: string;

    /**
     * Pass-through for any extension fields a future spec rev (or a
     * vendor-specific deployment) requires the wallet to echo. Kept
     * as `unknown` so we don't silently corrupt unfamiliar shapes.
     */
    [extra: string]: unknown;
}

/**
 * Subset of `client_metadata` (OID4VP §5.6) that JARM cares about.
 * Loose by design — the spec lets verifiers add fields, and we only
 * validate the ones that drive cryptographic decisions.
 */
export interface JarmClientMetadata {
    /** Inline JWKS — preferred over `jwks_uri` when both are present. */
    jwks?: { keys: JWK[] };

    /** URL form of `jwks` — fetched lazily when no inline jwks is set. */
    jwks_uri?: string;

    /**
     * JWE key-wrap algorithm the verifier expects. Common values:
     * `ECDH-ES`, `ECDH-ES+A256KW`, `RSA-OAEP-256`. When omitted the
     * spec recommends `ECDH-ES` (§8.3 paragraph 4).
     */
    authorization_encrypted_response_alg?: string;

    /**
     * JWE content-encryption algorithm. Common values: `A256GCM`,
     * `A128CBC-HS256`. Spec default: `A256GCM`.
     */
    authorization_encrypted_response_enc?: string;

    /**
     * Optional outer-JWS algorithm. When set, the wallet MUST sign
     * the payload first with this alg before encrypting. When unset,
     * the JWE plaintext is the raw JSON payload (no nested signing).
     */
    authorization_signed_response_alg?: string;
}

export interface EncryptResponseObjectOptions {
    /**
     * Plaintext response-object payload. Stringified (JSON) and
     * either signed-then-encrypted or encrypted directly depending
     * on `clientMetadata.authorization_signed_response_alg`.
     */
    payload: ResponseObjectPayload;

    /** Verifier's `client_metadata` from the Authorization Request. */
    clientMetadata: JarmClientMetadata;

    /**
     * Verifier's `nonce` from the Authorization Request — base64url-
     * encoded and placed in the JWE protected header's `apv` field
     * per OID4VP §8.3 paragraph 6. Required: omitting it produces a
     * JWE the verifier MUST reject for ECDH-ES key wrap.
     */
    verifierNonce: string;

    /**
     * Optional wallet-side nonce, base64url-encoded into the JWE's
     * `apu` field. Useful for ECDH-1PU flows where the wallet binds
     * its own key to the session; OID4VP doesn't mandate it.
     */
    walletNonce?: string;

    /**
     * Wallet's signer — reuses the same `ProofJwtSigner` shape used
     * by VCI proof-of-possession and outer VP signing, so callers can
     * thread their existing signer through unchanged. Required only
     * when `clientMetadata.authorization_signed_response_alg` is set
     * (nested JWS-in-JWE mode); ignored otherwise.
     */
    signer?: ProofJwtSigner;

    /**
     * Override fetch — defaults to `globalThis.fetch`. Only consulted
     * when the verifier supplied `jwks_uri` instead of inline `jwks`.
     */
    fetchImpl?: typeof fetch;
}

/* -------------------------------------------------------------------------- */
/*                                  errors                                    */
/* -------------------------------------------------------------------------- */

export type JarmEncryptErrorCode =
    | 'no_encryption_key'
    | 'invalid_jwks'
    | 'jwks_fetch_failed'
    | 'unsupported_alg'
    | 'missing_signer'
    | 'sign_failed'
    | 'encrypt_failed';

export class JarmEncryptError extends Error {
    readonly code: JarmEncryptErrorCode;

    constructor(
        code: JarmEncryptErrorCode,
        message: string,
        extra: { cause?: unknown } = {}
    ) {
        super(message);
        this.name = 'JarmEncryptError';
        this.code = code;
        if (extra.cause !== undefined) {
            (this as { cause?: unknown }).cause = extra.cause;
        }
    }
}

/* -------------------------------------------------------------------------- */
/*                               public surface                               */
/* -------------------------------------------------------------------------- */

/**
 * Default JWE algorithms when the verifier didn't declare any. The
 * spec leaves the choice to the verifier; we pick the
 * spec-recommended pair so a verifier that fails to advertise
 * algorithms still gets something it's likely to accept.
 */
export const DEFAULT_JWE_ALG = 'ECDH-ES';
export const DEFAULT_JWE_ENC = 'A256GCM';

/**
 * Build the JOSE blob to put in the `response` form field for a
 * `direct_post.jwt` submission. See the module docstring for the
 * full algorithm + edge-case matrix.
 */
export const encryptResponseObject = async (
    options: EncryptResponseObjectOptions
): Promise<string> => {
    const {
        payload,
        clientMetadata,
        verifierNonce,
        walletNonce,
        signer,
    } = options;

    const alg =
        clientMetadata.authorization_encrypted_response_alg ?? DEFAULT_JWE_ALG;
    const enc =
        clientMetadata.authorization_encrypted_response_enc ?? DEFAULT_JWE_ENC;
    const signAlg = clientMetadata.authorization_signed_response_alg;

    // Resolve the verifier's encryption key. Inline `jwks` wins over
    // `jwks_uri` (it's tamper-resistant — the JWS-signed Request Object
    // already authenticates inline metadata), and we only fetch when
    // forced to. This keeps offline / no-network test runs working.
    const jwks = await resolveVerifierJwks(clientMetadata, options.fetchImpl);
    const encKey = pickEncryptionKey(jwks, alg);

    // Build the plaintext bytes that will become the JWE plaintext.
    // When signing is requested we sign first and the JWE plaintext
    // is the resulting compact JWS string; otherwise the plaintext is
    // the raw JSON payload.
    let plaintext: Uint8Array;
    let cty: string | undefined;

    if (signAlg) {
        if (!signer) {
            throw new JarmEncryptError(
                'missing_signer',
                `Verifier requires authorization_signed_response_alg=${signAlg} but no wallet signer was supplied`
            );
        }

        const jws = await signResponse(payload, signAlg, signer);
        plaintext = new TextEncoder().encode(jws);
        // RFC 7516 §4.1.12: when a JWE wraps a JWS, the JWE protected
        // header SHOULD set `cty` so receivers know to JWS-decode the
        // plaintext rather than treat it as the raw JSON payload.
        cty = 'JWT';
    } else {
        plaintext = new TextEncoder().encode(JSON.stringify(payload));
        cty = undefined;
    }

    // Import the verifier's enc key for `jose`. Algorithms like
    // ECDH-ES need the recipient's public key, not a derived secret —
    // `importJWK` handles both EC and RSA shapes.
    let key: Awaited<ReturnType<typeof importJWK>>;
    try {
        key = await importJWK(encKey, alg);
    } catch (e) {
        throw new JarmEncryptError(
            'unsupported_alg',
            `Failed to import verifier encryption key (alg=${alg}, kty=${encKey.kty}): ${describe(e)}`,
            { cause: e }
        );
    }

    // Assemble the JWE protected header. NOTE: `apv` and `apu` are
    // NOT placed here directly — for ECDH-ES key agreement they're
    // KDF inputs (RFC 7518 §4.6, NIST SP 800-56A ConcatKDF), so jose
    // wires them via `setKeyManagementParameters` and lifts them
    // into the protected header itself once they've been factored
    // into the derived CEK. Putting them in the header manually here
    // would produce a JWE whose recipient can't decrypt: encrypt
    // side derives CEK without apv input, decrypt side reads apv
    // from header AND mixes it into KDF → mismatch → decryption
    // failure. The bug is silent and catastrophic, hence the long
    // comment to deter future regressions.
    const protectedHeader: Record<string, unknown> = { alg, enc };

    if (typeof encKey.kid === 'string' && encKey.kid.length > 0) {
        protectedHeader.kid = encKey.kid;
    }

    if (cty) protectedHeader.cty = cty;

    // OID4VP §8.3 paragraph 6: `apv` MUST equal base64url(verifier
    // nonce). jose's `setKeyManagementParameters` accepts the raw
    // nonce bytes and handles base64url encoding internally.
    const keyManagementParameters: { apv: Uint8Array; apu?: Uint8Array } = {
        apv: new TextEncoder().encode(verifierNonce),
    };

    if (typeof walletNonce === 'string' && walletNonce.length > 0) {
        keyManagementParameters.apu = new TextEncoder().encode(walletNonce);
    }

    try {
        const jwe = await new CompactEncrypt(plaintext)
            .setProtectedHeader(
                protectedHeader as Parameters<
                    CompactEncrypt['setProtectedHeader']
                >[0]
            )
            .setKeyManagementParameters(keyManagementParameters)
            .encrypt(key);

        return jwe;
    } catch (e) {
        throw new JarmEncryptError(
            'encrypt_failed',
            `JWE encryption failed (alg=${alg}, enc=${enc}): ${describe(e)}`,
            { cause: e }
        );
    }
};

/* -------------------------------------------------------------------------- */
/*                                 internals                                  */
/* -------------------------------------------------------------------------- */

/**
 * Resolve the verifier's JWKS from `client_metadata`. Inline `jwks`
 * wins; falls back to fetching `jwks_uri` only when no inline keys
 * are present. The fetch path is the smaller code path because the
 * spec encourages inline keys (they're already authenticated by the
 * outer signed Request Object).
 */
const resolveVerifierJwks = async (
    metadata: JarmClientMetadata,
    fetchImpl?: typeof fetch
): Promise<readonly JWK[]> => {
    if (metadata.jwks && Array.isArray(metadata.jwks.keys)) {
        return metadata.jwks.keys;
    }

    if (typeof metadata.jwks_uri === 'string' && metadata.jwks_uri.length > 0) {
        const fx = fetchImpl ?? globalThis.fetch;
        if (typeof fx !== 'function') {
            throw new JarmEncryptError(
                'jwks_fetch_failed',
                `client_metadata.jwks_uri=${metadata.jwks_uri} but no fetch implementation is available`
            );
        }

        let response: Response;
        try {
            response = await fx(metadata.jwks_uri, {
                headers: { Accept: 'application/json' },
            });
        } catch (e) {
            throw new JarmEncryptError(
                'jwks_fetch_failed',
                `Failed to fetch jwks_uri=${metadata.jwks_uri}: ${describe(e)}`,
                { cause: e }
            );
        }

        if (!response.ok) {
            throw new JarmEncryptError(
                'jwks_fetch_failed',
                `jwks_uri returned HTTP ${response.status} for ${metadata.jwks_uri}`
            );
        }

        let body: unknown;
        try {
            body = await response.json();
        } catch (e) {
            throw new JarmEncryptError(
                'invalid_jwks',
                `jwks_uri body was not valid JSON: ${describe(e)}`,
                { cause: e }
            );
        }

        if (
            !body ||
            typeof body !== 'object' ||
            !Array.isArray((body as { keys?: unknown }).keys)
        ) {
            throw new JarmEncryptError(
                'invalid_jwks',
                `jwks_uri body must be a JSON object with a \`keys\` array`
            );
        }

        return (body as { keys: JWK[] }).keys;
    }

    throw new JarmEncryptError(
        'no_encryption_key',
        'client_metadata declares neither inline `jwks` nor `jwks_uri` — verifier cannot receive encrypted responses'
    );
};

/**
 * Pick a key suitable for the requested key-wrap algorithm. OID4VP
 * §8.3 paragraph 3 says the verifier SHOULD declare `use: "enc"` on
 * encryption keys. We accept keys with no `use` (some verifiers omit
 * it) but reject keys explicitly tagged `use: "sig"` since using a
 * sig-only key for encryption would be a verifier configuration bug
 * we shouldn't paper over.
 *
 * When multiple candidates exist, prefer:
 *   1. one whose `alg` matches the requested key-wrap exactly
 *   2. one with no `alg` claim (algorithm-agnostic key)
 *   3. otherwise — first match wins
 */
const pickEncryptionKey = (jwks: readonly JWK[], requestedAlg: string): JWK => {
    if (jwks.length === 0) {
        throw new JarmEncryptError(
            'no_encryption_key',
            'Verifier JWKS contained no keys'
        );
    }

    const candidates = jwks.filter(k => k.use !== 'sig');

    if (candidates.length === 0) {
        throw new JarmEncryptError(
            'no_encryption_key',
            'Verifier JWKS contains only `use:"sig"` keys; no encryption-capable key advertised'
        );
    }

    const exact = candidates.find(k => k.alg === requestedAlg);
    if (exact) return exact;

    const algAgnostic = candidates.find(k => !k.alg);
    if (algAgnostic) return algAgnostic;

    return candidates[0]!;
};

/**
 * Sign the response payload with the wallet's signer, producing a
 * compact JWS suitable to be the JWE plaintext.
 *
 * The signer is the same `ProofJwtSigner` shape used elsewhere in
 * the plugin — it accepts `(header, payload)` and returns a compact
 * JWS. We let it merge our caller-supplied `alg`/`kid`/`typ` into
 * the protected header (per the `ProofJwtSigner` contract) rather
 * than constructing the JWS by hand, which keeps the cryptographic
 * surface narrow and audit-friendly.
 */
const signResponse = async (
    payload: ResponseObjectPayload,
    signAlg: string,
    signer: ProofJwtSigner
): Promise<string> => {
    try {
        return await signer.sign(
            { alg: signAlg, kid: signer.kid, typ: 'JWT' },
            payload as Record<string, unknown>
        );
    } catch (e) {
        throw new JarmEncryptError(
            'sign_failed',
            `Wallet signer failed during JARM inner-JWS signing: ${describe(e)}`,
            { cause: e }
        );
    }
};

const describe = (e: unknown): string =>
    e instanceof Error ? e.message : String(e);
