import { UnsignedVP, VP } from '@learncard/types';

import { ProofJwtSigner } from '../vci/types';
import { VpFormat } from './present';

/**
 * Slice 7b — **Verifiable Presentation signing**.
 *
 * Takes the unsigned VP produced by {@link buildPresentation} and turns
 * it into a signed `vp_token` ready for Slice 7c's `direct_post`
 * transport. Two envelope formats are supported, matching
 * {@link VpFormat}:
 *
 * - **`jwt_vp_json`** — wrap the VP as a JWT per VCDM §6.3.1:
 *     - `iss` = holder DID
 *     - `sub` = holder DID (VCDM §6.3.1.1 — "identifier of the
 *       expected holder")
 *     - `aud` = verifier's `client_id` (from the OID4VP Authorization
 *       Request)
 *     - `nonce` = verifier's nonce (replay-binding)
 *     - `jti` = VP id
 *     - `iat` = now (epoch seconds)
 *     - `vp`  = the unsigned VP JSON
 *   The JWS is signed with the holder's {@link ProofJwtSigner} — the
 *   same interface the VCI proof-of-possession path uses.
 *
 * - **`ldp_vp`** — delegate to the host's Linked-Data proof pipeline.
 *   The plugin wires this to `learnCard.invoke.issuePresentation` in
 *   Slice 7c, passing `domain = audience` and `challenge = nonce` per
 *   OID4VP §6.1 so the verifier can detect replay.
 *
 * Pure + dependency-injected: this module never talks to the network
 * and never accesses LearnCard directly. Tests supply trivial mock
 * signers; the plugin supplies real ones.
 */

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/**
 * The vp_token value ready for OID4VP `direct_post`:
 *
 * - `string` — compact JWS (used for `jwt_vp_json`).
 * - `VP`     — signed JSON-LD VP object (used for `ldp_vp`).
 *
 * The transport layer (Slice 7c) serializes these two shapes
 * uniformly: both go into `application/x-www-form-urlencoded` as the
 * `vp_token` field, with JSON objects JSON-stringified first.
 */
/**
 * Wire-shape of the OID4VP `vp_token` form field across BOTH query
 * languages:
 *
 * - `string` — PEX `jwt_vp_json` compact JWS, OR a single DCQL entry
 *   that's a `jwt_vc_json` presentation.
 * - `VP`    — PEX `ldp_vp` signed VP object.
 * - `Record<string, string | VP>` — DCQL response object keyed by
 *   `credential_query_id` (OID4VP 1.0 §6.4); values are
 *   per-query signed presentations.
 *
 * The submit layer JSON-encodes whichever non-string variant arrives
 * before form-urlencoding it.
 */
export type VpToken = string | VP | Record<string, string | VP>;

/**
 * Linked-Data VP signer contract. The plugin binds this to
 * `learnCard.invoke.issuePresentation`, passing through OID4VP's
 * replay-binding via `domain`/`challenge`.
 */
export interface LdpVpSigner {
    sign: (
        unsignedVp: UnsignedVP,
        options: { domain: string; challenge: string }
    ) => Promise<VP>;
}

export interface SignPresentationOptions {
    /** Unsigned VP from {@link buildPresentation}. */
    unsignedVp: UnsignedVP;

    /** Envelope format from {@link buildPresentation}. */
    vpFormat: VpFormat;

    /**
     * Verifier's `client_id` (from the Authorization Request). For
     * `jwt_vp_json` this becomes the JWT `aud`; for `ldp_vp` it
     * becomes the LD-proof `domain`.
     */
    audience: string;

    /**
     * Verifier's `nonce` (from the Authorization Request). For
     * `jwt_vp_json` this becomes the JWT `nonce`; for `ldp_vp` it
     * becomes the LD-proof `challenge`.
     */
    nonce: string;

    /**
     * Holder DID. Must equal `unsignedVp.holder`; we re-validate to
     * prevent the signer from silently signing a VP whose holder
     * field was tampered with between construction and signing.
     */
    holder: string;

    /** Override the JWT `jti`. Defaults to `unsignedVp.id`. */
    jti?: string;

    /** Override `iat` for deterministic tests. Defaults to `Math.floor(Date.now() / 1000)`. */
    iat?: number;
}

export interface SignPresentationHelpers {
    /** Required when `vpFormat === 'jwt_vp_json'`. */
    jwtSigner?: ProofJwtSigner;
    /** Required when `vpFormat === 'ldp_vp'`. */
    ldpVpSigner?: LdpVpSigner;
}

export interface SignPresentationResult {
    vpToken: VpToken;
    vpFormat: VpFormat;
}

/* -------------------------------------------------------------------------- */
/*                                  errors                                    */
/* -------------------------------------------------------------------------- */

export type VpSignErrorCode =
    | 'missing_jwt_signer'
    | 'missing_ldp_signer'
    | 'jwt_sign_failed'
    | 'ldp_sign_failed'
    | 'holder_mismatch'
    | 'invalid_input';

export class VpSignError extends Error {
    readonly code: VpSignErrorCode;

    constructor(code: VpSignErrorCode, message: string, options?: { cause?: unknown }) {
        super(message);
        this.name = 'VpSignError';
        this.code = code;
        if (options?.cause !== undefined) {
            (this as { cause?: unknown }).cause = options.cause;
        }
    }
}

/* -------------------------------------------------------------------------- */
/*                               public surface                               */
/* -------------------------------------------------------------------------- */

/**
 * Sign a prepared Verifiable Presentation. See module doc for
 * envelope semantics.
 *
 * All cryptographic work happens inside the injected signer(s) —
 * unsupported combinations (e.g. `jwt_vp_json` with no `jwtSigner`)
 * throw `VpSignError` with a typed code so callers can surface
 * actionable UI instead of a generic "signing failed".
 */
export const signPresentation = async (
    options: SignPresentationOptions,
    helpers: SignPresentationHelpers
): Promise<SignPresentationResult> => {
    validateInput(options);

    if (options.vpFormat === 'jwt_vp_json') {
        return signJwtVp(options, helpers);
    }

    return signLdpVp(options, helpers);
};

/* -------------------------------------------------------------------------- */
/*                                 internals                                  */
/* -------------------------------------------------------------------------- */

const validateInput = (options: SignPresentationOptions): void => {
    const { unsignedVp, holder, audience, nonce } = options;

    if (!unsignedVp || typeof unsignedVp !== 'object') {
        throw new VpSignError('invalid_input', 'signPresentation requires an unsignedVp object');
    }

    if (typeof audience !== 'string' || audience.length === 0) {
        throw new VpSignError('invalid_input', 'signPresentation requires a non-empty `audience`');
    }

    if (typeof nonce !== 'string' || nonce.length === 0) {
        throw new VpSignError('invalid_input', 'signPresentation requires a non-empty `nonce`');
    }

    if (typeof holder !== 'string' || holder.length === 0) {
        throw new VpSignError('invalid_input', 'signPresentation requires a non-empty `holder`');
    }

    if (unsignedVp.holder !== undefined && unsignedVp.holder !== holder) {
        throw new VpSignError(
            'holder_mismatch',
            `unsignedVp.holder (${unsignedVp.holder}) does not match options.holder (${holder})`
        );
    }
};

const signJwtVp = async (
    options: SignPresentationOptions,
    helpers: SignPresentationHelpers
): Promise<SignPresentationResult> => {
    if (!helpers.jwtSigner) {
        throw new VpSignError(
            'missing_jwt_signer',
            'vpFormat=jwt_vp_json requires helpers.jwtSigner'
        );
    }

    const now = options.iat ?? Math.floor(Date.now() / 1000);

    const header = {
        alg: helpers.jwtSigner.alg,
        kid: helpers.jwtSigner.kid,
        typ: 'JWT',
    };

    const jti = options.jti ?? (typeof options.unsignedVp.id === 'string' ? options.unsignedVp.id : undefined);

    const payload: Record<string, unknown> = {
        iss: options.holder,
        sub: options.holder,
        aud: options.audience,
        nonce: options.nonce,
        iat: now,
        vp: options.unsignedVp,
    };

    if (jti) payload.jti = jti;

    let vpToken: string;
    try {
        vpToken = await helpers.jwtSigner.sign(header, payload);
    } catch (e) {
        throw new VpSignError(
            'jwt_sign_failed',
            `Failed to sign jwt_vp_json: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    return { vpToken, vpFormat: 'jwt_vp_json' };
};

const signLdpVp = async (
    options: SignPresentationOptions,
    helpers: SignPresentationHelpers
): Promise<SignPresentationResult> => {
    if (!helpers.ldpVpSigner) {
        throw new VpSignError(
            'missing_ldp_signer',
            'vpFormat=ldp_vp requires helpers.ldpVpSigner'
        );
    }

    let vpToken: VP;
    try {
        vpToken = await helpers.ldpVpSigner.sign(options.unsignedVp, {
            domain: options.audience,
            challenge: options.nonce,
        });
    } catch (e) {
        throw new VpSignError(
            'ldp_sign_failed',
            `Failed to sign ldp_vp: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    return { vpToken, vpFormat: 'ldp_vp' };
};
