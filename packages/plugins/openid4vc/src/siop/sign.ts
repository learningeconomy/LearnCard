/**
 * Slice 8 — **SIOPv2 ID token signing**.
 *
 * OpenID for Verifiable Presentations combined flows
 * (`response_type=vp_token id_token`) require the wallet to return a
 * Self-Issued OpenID Provider v2 (SIOPv2) ID token alongside the VP
 * token. The ID token proves the holder controls the DID the VP was
 * bound to.
 *
 * This module builds + signs the ID token per §9 of the SIOPv2 spec:
 *   - `iss` = the holder DID (or `https://self-issued.me/v2` when the
 *      spec-reserved form is requested; we default to the DID because
 *      that's what every real verifier expects).
 *   - `sub` = the holder DID.
 *   - `aud` = verifier's `client_id` (from the Authorization Request).
 *   - `nonce` = verifier's nonce.
 *   - `iat` / `exp` = now / now+5min.
 *
 * Purely dependency-injected: the signer is the same
 * {@link ProofJwtSigner} shape used by VCI proof-of-possession and VP
 * signing. Plugin wires in the Ed25519 signer built from the host
 * LearnCard's keypair.
 */
import { ProofJwtSigner } from '../vci/types';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

export interface SignIdTokenOptions {
    /** Holder DID — becomes both `iss` and `sub`. */
    holder: string;

    /** Verifier's `client_id` — becomes `aud`. */
    audience: string;

    /** Verifier's `nonce` — must match between vp_token and id_token. */
    nonce: string;

    /**
     * Optional. When the verifier's Authorization Request requested a
     * `_vp_token` hash binding, the caller can pre-compute it and
     * pass it here. We just stamp the claim unchanged — calculation
     * of the JWT-VP hash belongs in the caller.
     */
    vpTokenHash?: string;

    /** Override `iat` for deterministic tests. Defaults to `Math.floor(Date.now() / 1000)`. */
    iat?: number;

    /**
     * Override token lifetime in seconds. Defaults to 300 (5 min) —
     * enough for the verifier to receive and validate before expiry
     * even over slow networks, short enough that a leaked token
     * won't linger.
     */
    lifetimeSeconds?: number;

    /**
     * SIOPv2 §9 allows `iss` to be either the holder DID or the
     * reserved value `https://self-issued.me/v2`. Default: holder DID
     * (matches what EUDI + Sphereon + walt.id all expect). Flip to
     * `'self-issued.me'` for spec-purity test cases.
     */
    issuerMode?: 'did' | 'self-issued.me';
}

export interface SignIdTokenHelpers {
    signer: ProofJwtSigner;
}

export interface SignIdTokenResult {
    /** Compact JWS suitable for submission as the `id_token` form field. */
    idToken: string;
}

/* -------------------------------------------------------------------------- */
/*                                  errors                                    */
/* -------------------------------------------------------------------------- */

export type SiopSignErrorCode =
    | 'invalid_input'
    | 'missing_signer'
    | 'id_token_sign_failed';

export class SiopSignError extends Error {
    readonly code: SiopSignErrorCode;

    constructor(
        code: SiopSignErrorCode,
        message: string,
        options?: { cause?: unknown }
    ) {
        super(message);
        this.name = 'SiopSignError';
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
 * Build + sign a SIOPv2 ID token. See module doc for claim shape.
 *
 * Typed `SiopSignError`s on every failure so UIs can surface
 * "couldn't prove holder identity" distinctly from "verifier
 * rejected the VP".
 */
export const signIdToken = async (
    options: SignIdTokenOptions,
    helpers: SignIdTokenHelpers
): Promise<SignIdTokenResult> => {
    validateInput(options, helpers);

    const { holder, audience, nonce } = options;
    const now = options.iat ?? Math.floor(Date.now() / 1000);
    const exp = now + (options.lifetimeSeconds ?? 300);
    const issuerMode = options.issuerMode ?? 'did';

    const header = {
        alg: helpers.signer.alg,
        kid: helpers.signer.kid,
        typ: 'JWT',
    };

    const payload: Record<string, unknown> = {
        iss: issuerMode === 'did' ? holder : 'https://self-issued.me/v2',
        sub: holder,
        aud: audience,
        nonce,
        iat: now,
        exp,
    };

    if (options.vpTokenHash) {
        payload._vp_token = { vp_token_hash: options.vpTokenHash };
    }

    let idToken: string;
    try {
        idToken = await helpers.signer.sign(header, payload);
    } catch (e) {
        throw new SiopSignError(
            'id_token_sign_failed',
            `Failed to sign SIOPv2 id_token: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    return { idToken };
};

/* -------------------------------------------------------------------------- */
/*                                 internals                                  */
/* -------------------------------------------------------------------------- */

const validateInput = (
    options: SignIdTokenOptions,
    helpers: SignIdTokenHelpers
): void => {
    if (!helpers.signer) {
        throw new SiopSignError(
            'missing_signer',
            'signIdToken requires helpers.signer'
        );
    }

    if (typeof options.holder !== 'string' || options.holder.length === 0) {
        throw new SiopSignError(
            'invalid_input',
            'signIdToken requires a non-empty `holder`'
        );
    }

    if (typeof options.audience !== 'string' || options.audience.length === 0) {
        throw new SiopSignError(
            'invalid_input',
            'signIdToken requires a non-empty `audience`'
        );
    }

    if (typeof options.nonce !== 'string' || options.nonce.length === 0) {
        throw new SiopSignError(
            'invalid_input',
            'signIdToken requires a non-empty `nonce`'
        );
    }
};

/* -------------------------------------------------------------------------- */
/*                        response_type helpers                               */
/* -------------------------------------------------------------------------- */

/**
 * Parse a space-separated `response_type` value into a set. Handy for
 * plugin consumers that need to decide whether to emit an id_token:
 *
 *   responseTypeSet(req.response_type).has('id_token')
 */
export const responseTypeSet = (value: string | undefined): Set<string> => {
    if (!value) return new Set();
    return new Set(value.split(/\s+/).filter(Boolean));
};

/**
 * Convenience predicate mirroring OID4VP spec intent:
 *   - `vp_token` alone → VP only.
 *   - `id_token` alone → SIOPv2 identity only, no VP.
 *   - `vp_token id_token` → combined flow, both.
 */
export const requiresIdToken = (responseType: string | undefined): boolean =>
    responseTypeSet(responseType).has('id_token');
