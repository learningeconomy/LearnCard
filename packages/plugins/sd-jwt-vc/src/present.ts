import { SDJwtVcInstance } from '@sd-jwt/sd-jwt-vc';
import type { HashAlgorithm, PresentationFrame, Signer as SdJwtLibSigner } from '@sd-jwt/types';
import type { VerificationCheck } from '@learncard/types';

import { sha256Hasher } from './hasher';
import { randomSalt } from './salt';
import { parseSdJwtVc } from './parse';
import { SdJwtVcError, type ParsedSdJwtVc } from './types';

/**
 * Slice 3 — **Holder-side SD-JWT-VC presentation.**
 *
 * Takes a stored compact SD-JWT-VC, the user's per-claim disclosure
 * choices, and (when the credential has a `cnf` binding) the holder's
 * KB-JWT signer + replay parameters from the verifier. Returns the
 * compact presentation that goes straight into the OID4VP `vp_token`.
 *
 * # Wire shape produced
 *
 * `<Issuer-JWT>~<disclosure-1>~...~<disclosure-N>~<KB-JWT>?`
 *
 * The KB-JWT is present whenever the credential carries `cnf` (RFC 9901
 * §4.3, draft-ietf-oauth-sd-jwt-vc-16 §3.5). It binds the presentation
 * to the verifier (`aud`), to a single response window (`nonce`), and
 * cryptographically attests over the exact set of disclosures the holder
 * is releasing (via `sd_hash` over the compact form up to the final
 * `~`). When the credential has no `cnf`, the KB-JWT is omitted and the
 * compact form ends with the final `~` separator.
 *
 * # Why this lives in `sd-jwt-vc/` and not `openid4vc/`
 *
 * SD-JWT-VC is a credential format family, not a transport. The
 * `openid4vc` plugin delegates SD-JWT presentation through
 * `learnCard.invoke.presentSdJwtVc(...)` so the same code paths serve
 * future VC-API and CHAPI integrations without rewrite.
 *
 * # Key binding signer injection (callers' responsibility)
 *
 * The signer for the KB-JWT is **always** supplied by the caller. The
 * sd-jwt-vc plugin doesn't reach into the host LearnCard's `id` plane
 * for keys; the `openid4vc` plugin (and any future transport plugin)
 * is responsible for resolving the holder's keypair and constructing
 * the signer via the exported `createEd25519KbSigner` utility. This
 * keeps key-management decisions (which DID, which kid, HSM vs. local)
 * exactly where the host plugin already makes them for OID4VCI proofs.
 */

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/**
 * `@sd-jwt/types` Signer contract: takes the JWS signing input
 * (`<headerB64url>.<payloadB64url>`) and returns the base64url
 * signature **segment only** (the third segment of a compact JWS, no
 * dots, no envelope). The library splices it onto the encoded header
 * + payload it already built and emits the final compact JWS.
 */
export type KbJwtSigner = SdJwtLibSigner;

export interface PresentSdJwtVcOptions {
    /**
     * Per-claim presentation frame controlling which disclosable
     * claims are released. Keys map to the credential's disclosure
     * keys; values are `true` to include or `false`/omitted to hide.
     * Nested objects mirror nested disclosures (see
     * `@sd-jwt/types.PresentationFrame`).
     *
     * When omitted, the @sd-jwt/sd-jwt-vc library defaults to releasing
     * every disclosable claim — equivalent to "no selective disclosure".
     * Callers driving a per-claim consent UI MUST pass the frame the
     * user chose so hidden claims are actually dropped from the wire.
     */
    disclose?: PresentationFrame<Record<string, unknown>>;

    /**
     * Verifier's `aud` for the KB-JWT (OID4VP §6.1 `client_id`).
     * REQUIRED when the credential has a `cnf` binding. Ignored when
     * the credential has no `cnf`.
     */
    audience?: string;

    /**
     * Verifier's `nonce` for the KB-JWT (replay protection per
     * draft-ietf-oauth-sd-jwt-vc-16 §3.5). REQUIRED when the
     * credential has a `cnf` binding.
     */
    nonce?: string;

    /**
     * Holder signer for the KB-JWT. REQUIRED when the credential has
     * a `cnf` binding. Build via {@link createEd25519KbSigner} (or a
     * custom signer satisfying the `@sd-jwt/types.Signer` contract).
     */
    kbSigner?: KbJwtSigner;

    /**
     * JOSE `alg` for the KB-JWT header. Defaults to `EdDSA` to match
     * the Ed25519 keypair LearnCard issues at init. Override for
     * verifiers / wallets using a different key type — the alg must
     * be compatible with `kbSigner`.
     */
    kbSignAlg?: string;

    /**
     * Override `iat` for deterministic tests. Defaults to
     * `Math.floor(Date.now() / 1000)`.
     */
    now?: () => number;

    /**
     * Optional re-verifier injected by the plugin surface. When
     * provided, presentation fails closed unless the compact still
     * passes issuer-signature + disclosure-integrity verification.
     */
    verify?: (compact: string) => Promise<VerificationCheck>;

    /**
     * Active holder public JWK injected by the host before signing.
     * Required only for cnf.jwk-bound credentials so we can fail closed
     * when the wallet's active signing key no longer matches the
     * credential's bound holder key.
     */
    activeHolderPublicJwk?: Record<string, unknown>;
}

export interface SdJwtPresentation {
    /**
     * Compact presentation: `<Issuer-JWT>~<disclosure-1>~...~<KB-JWT>?`.
     * Pass directly as the OID4VP `vp_token` value (DCQL inner value
     * or a single-string PEX `vp_token`).
     */
    compact: string;

    /**
     * Disclosure keys actually released to the verifier. The
     * intersection of the credential's disclosure set with the
     * caller-supplied `disclose` frame, in the same order as the
     * credential. Useful for telling the user "you shared X, Y, Z"
     * after the fact.
     */
    disclosedKeys: string[];

    /** True iff the compact form includes a KB-JWT. */
    hasKeyBinding: boolean;
}

/* -------------------------------------------------------------------------- */
/*                              public surface                                */
/* -------------------------------------------------------------------------- */

/**
 * Allowlisted `_sd_alg` values (RFC 9901 §4.2.4).
 *
 * Only `sha-256` is supported today because that is the only digest
 * algorithm `sha256Hasher` implements. Extend this set (and swap in a
 * multi-alg hasher) when sha-384 / sha-512 support lands.
 */
const SUPPORTED_SD_ALGS = new Set<string>(['sha-256']);

/**
 * Build a holder-bound, selectively-disclosing SD-JWT-VC presentation.
 *
 * Throws `SdJwtVcError` (typed `code` field) on:
 * - `invalid_compact_form` — the input fails to parse as SD-JWT-VC.
 * - `kb_jwt_invalid` — the credential has `cnf` but the caller didn't
 *   supply `audience`, `nonce`, or `kbSigner`, or the underlying
 *   @sd-jwt/sd-jwt-vc library rejected the KB-JWT.
 * - `unsupported_sd_alg` — the credential's `_sd_alg` is not in the
 *   {@link SUPPORTED_SD_ALGS} allowlist.
 *
 * Pure: no network, no LearnCard plane access. Caller is responsible
 * for resolving the holder's keypair upstream.
 */
export const presentSdJwtVc = async (
    compact: string,
    options: PresentSdJwtVcOptions = {}
): Promise<SdJwtPresentation> => {
    let parsed: ParsedSdJwtVc;
    try {
        parsed = await parseSdJwtVc(compact);
    } catch (e) {
        // Re-wrap so callers always see a typed SdJwtVcError code from
        // the present path even when parse fails. The cause chain
        // preserves the original error.
        if (e instanceof SdJwtVcError) throw e;
        throw new SdJwtVcError(
            'invalid_compact_form',
            `Cannot present an SD-JWT-VC that fails to parse: ${
                e instanceof Error ? e.message : String(e)
            }`,
            { cause: e }
        );
    }

    if (typeof options.verify === 'function') {
        const verification = await options.verify(compact);
        const errors = Array.isArray(verification.errors) ? verification.errors : [];
        if (errors.length > 0) {
            throw new SdJwtVcError(
                'presentation_verification_failed',
                `Refusing to present an SD-JWT-VC that failed re-verification: ${errors.join('; ')}`
            );
        }
    }

    const cnf = parsed.rawPayload.cnf;
    if (cnf !== undefined) {
        if (!cnf || typeof cnf !== 'object') {
            throw new SdJwtVcError(
                'unsupported_cnf_confirmation_type',
                'SD-JWT-VC cnf must be an object when present'
            );
        }
        if (!('jwk' in cnf)) {
            const confirmationTypes = Object.keys(cnf);
            throw new SdJwtVcError(
                'unsupported_cnf_confirmation_type',
                `unsupported cnf confirmation type: ${confirmationTypes.join(', ') || 'unknown'}`
            );
        }
    }

    if (parsed.holderPublicKey && options.activeHolderPublicJwk) {
        const expectedX =
            typeof parsed.holderPublicKey.x === 'string' ? parsed.holderPublicKey.x : undefined;
        const expectedKty = parsed.holderPublicKey.kty;
        const expectedCrv = parsed.holderPublicKey.crv;
        const activeHolderPublicJwk = options.activeHolderPublicJwk;
        const activeX =
            activeHolderPublicJwk && typeof activeHolderPublicJwk.x === 'string'
                ? activeHolderPublicJwk.x
                : undefined;

        if (
            expectedKty !== 'OKP' ||
            expectedCrv !== 'Ed25519' ||
            !expectedX ||
            activeHolderPublicJwk.kty !== 'OKP' ||
            activeHolderPublicJwk.crv !== 'Ed25519' ||
            activeX !== expectedX
        ) {
            throw new SdJwtVcError(
                'key_binding_mismatch',
                'Active holder Ed25519 key does not match the credential\'s cnf.jwk binding'
            );
        }
    }

    const needsKeyBinding = Boolean(parsed.holderPublicKey);

    if (needsKeyBinding) {
        if (typeof options.audience !== 'string' || options.audience.length === 0) {
            throw new SdJwtVcError(
                'kb_jwt_invalid',
                'audience is required to present an SD-JWT-VC with a cnf binding (OID4VP §6.1)'
            );
        }
        if (typeof options.nonce !== 'string' || options.nonce.length === 0) {
            throw new SdJwtVcError(
                'kb_jwt_invalid',
                'nonce is required to present an SD-JWT-VC with a cnf binding (replay protection per draft-ietf-oauth-sd-jwt-vc-16 §3.5)'
            );
        }
        if (typeof options.kbSigner !== 'function') {
            throw new SdJwtVcError(
                'kb_jwt_invalid',
                'kbSigner is required to present an SD-JWT-VC with a cnf binding; build one via createEd25519KbSigner'
            );
        }
    }

    const kbSignAlg = options.kbSignAlg ?? 'EdDSA';
    const now = options.now ? options.now() : Math.floor(Date.now() / 1000);

    const rawSdAlg =
        typeof parsed.rawPayload._sd_alg === 'string' ? parsed.rawPayload._sd_alg : 'sha-256';

    if (!SUPPORTED_SD_ALGS.has(rawSdAlg)) {
        throw new SdJwtVcError(
            'unsupported_sd_alg',
            `Unsupported _sd_alg "${rawSdAlg}": this wallet only supports ${[...SUPPORTED_SD_ALGS].join(', ')}`
        );
    }

    const hashAlg = rawSdAlg as HashAlgorithm;

    const instance = new SDJwtVcInstance({
        hasher: sha256Hasher,
        hashAlg,
        saltGenerator: randomSalt,
        kbSigner: needsKeyBinding ? options.kbSigner : undefined,
        kbSignAlg: needsKeyBinding ? kbSignAlg : undefined,
    });

    let presented: string;
    try {
        presented = await instance.present(
            compact,
            options.disclose,
            needsKeyBinding
                ? {
                      kb: {
                          payload: {
                              aud: options.audience!,
                              nonce: options.nonce!,
                              iat: now,
                          },
                      },
                  }
                : undefined
        );
    } catch (e) {
        throw new SdJwtVcError(
            needsKeyBinding ? 'kb_jwt_invalid' : 'internal_error',
            `Failed to build SD-JWT-VC presentation: ${
                e instanceof Error ? e.message : String(e)
            }`,
            { cause: e }
        );
    }

    const disclosedKeys = resolveDisclosedKeys(parsed.disclosureKeys, options.disclose);

    return {
        compact: presented,
        disclosedKeys,
        hasKeyBinding: needsKeyBinding,
    };
};

/* -------------------------------------------------------------------------- */
/*                                  internals                                 */
/* -------------------------------------------------------------------------- */

/**
 * Compute which top-level disclosure keys the caller's frame intends
 * to release. This is a UI-facing summary only — the actual filtering
 * happens inside @sd-jwt/sd-jwt-vc — so we intentionally mirror its
 * "truthy = release" convention without re-implementing the nested
 * traversal. Nested disclosures still apply on the wire even if we
 * don't break them out here.
 */
const resolveDisclosedKeys = (
    available: string[],
    frame: PresentationFrame<Record<string, unknown>> | undefined
): string[] => {
    if (!frame) return [...available];
    const out: string[] = [];
    const frameObj = frame as Record<string, unknown>;
    for (const key of available) {
        const value = frameObj[key];
        // `true` and nested objects both count as "release this top-
        // level claim"; `false` and `undefined` drop it. Mirrors the
        // @sd-jwt/sd-jwt-vc presentation-frame semantics.
        if (value === true || (typeof value === 'object' && value !== null)) {
            out.push(key);
        }
    }
    return out;
};
