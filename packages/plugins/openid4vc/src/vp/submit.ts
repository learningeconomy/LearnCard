import { PresentationSubmission } from './select';
import { VpToken } from './sign';
import {
    encryptResponseObject,
    JarmEncryptError,
    type JarmClientMetadata,
    type ResponseObjectPayload,
} from './encrypt';
import type { ProofJwtSigner } from '../vci/types';

/**
 * Slice 7c / 7d — **direct_post + direct_post.jwt transport**.
 *
 * POST a signed `vp_token` (and, for PEX, a `presentation_submission`)
 * to the verifier's `response_uri` per OID4VP §8. Pure transport —
 * no signing, no PEX/DCQL evaluation, no request-object parsing.
 *
 * Two response modes are supported:
 *
 * - **`direct_post`** (§8.2) — form fields go on the wire as
 *   cleartext (`vp_token`, `presentation_submission`, `state`,
 *   `id_token` directly URL-encoded). What every walt.id-class
 *   verifier accepts today.
 *
 * - **`direct_post.jwt`** (§8.3) — the same fields are packed into
 *   a JSON payload, optionally signed by the wallet, then encrypted
 *   to the verifier's published encryption key. The single resulting
 *   compact JOSE string goes on the wire as one form field named
 *   `response`. What EUDI / EU pilot deployments require for
 *   production. Encryption is delegated to `./encrypt.ts`; this
 *   module just dispatches.
 *
 * ## PEX vs DCQL submissions
 *
 * OID4VP defines two distinct response shapes:
 *
 * - **PEX** (Draft 22 and earlier, still used by every walt.id-class
 *   verifier in the wild) → fields `vp_token` + `presentation_submission`.
 *   `vp_token` is a single signed VP; `presentation_submission`
 *   carries the descriptor_map that routes inner credentials.
 *
 * - **DCQL** (OID4VP 1.0 §6.4) → field `vp_token` only, valued
 *   as a JSON-encoded object whose keys are `credential_query_id`
 *   strings and whose values are signed presentations. NO
 *   `presentation_submission` field — the keying carries the routing
 *   implicitly. Callers using the DCQL pipeline (`dcql/respond.ts`)
 *   pass `submission: undefined` (or omit it) so this transport
 *   leaves the field off the response body.
 *
 * Both query-language splits work in either response mode. JARM
 * just wraps the same payload in a JOSE blob.
 *
 * ## Encoding (cleartext mode)
 *
 * OID4VP requires `application/x-www-form-urlencoded`, even though
 * `vp_token` and `presentation_submission` are structured values.
 * Stringification rules:
 *
 * - `vp_token` as a `string` (jwt_vp_json compact JWS) → used verbatim.
 * - `vp_token` as an object (ldp_vp signed VP, OR a DCQL vp_token
 *   object keyed by credential_query_id) → `JSON.stringify`.
 * - `presentation_submission` → always `JSON.stringify` when present.
 * - `state` → echoed verbatim if present.
 *
 * ## Encoding (JARM mode)
 *
 * Single form field: `response=<JOSE blob>`. Same form-urlencoded
 * content type so verifier servers don't need protocol-aware framing
 * — the JOSE blob is just one parameter value.
 *
 * ## Response handling
 *
 * Spec-compliant verifiers respond 200 OK with either an empty body
 * (success) or `{ "redirect_uri": "…" }` (wallet is asked to deep-link
 * back). We parse both shapes and surface anything else through
 * `SubmitResponse.body` unchanged so callers can debug vendor-specific
 * returns (e.g. walt.id's `{ success: true }`).
 *
 * HTTP-level failures become typed `VpSubmitError`s so UIs can render
 * "connection issue" vs "verifier rejected the VP" correctly.
 */

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

export interface SubmitPresentationOptions {
    /**
     * The `response_uri` from the verifier's Authorization Request. We
     * POST here, form-encoded, per OID4VP §8.
     */
    responseUri: string;

    /**
     * Signed VP token. Three shapes are accepted:
     *  - PEX `jwt_vp_json` → compact JWS string
     *  - PEX `ldp_vp`      → signed VP JSON object
     *  - DCQL response     → JSON object keyed by `credential_query_id`,
     *                        values are per-query signed presentations
     */
    vpToken: VpToken;

    /**
     * DIF PEX v2 Presentation Submission. Required for PEX flows;
     * MUST be omitted (or `undefined`) for DCQL flows — DCQL's
     * vp_token keying provides the routing implicitly. See the
     * module-level docstring for the full PEX-vs-DCQL split.
     */
    submission?: PresentationSubmission;

    /**
     * SIOPv2 ID token (Slice 8). Required when the verifier asked for
     * `response_type=vp_token id_token` or `response_type=id_token`;
     * must be omitted otherwise. Encoded as the `id_token` form field
     * alongside `vp_token`.
     */
    idToken?: string;

    /**
     * The verifier's `state` parameter (if present in the Auth
     * Request). Echoed back so the verifier can correlate the
     * response with the pending session. Omitted when absent.
     */
    state?: string;

    /**
     * Verifier's `response_mode` from the Authorization Request.
     * Defaults to `direct_post` (cleartext). Set to `direct_post.jwt`
     * to send a JARM (encrypted, optionally signed) response. Any
     * other value is treated as cleartext for forward-compat — the
     * caller can detect and reject unsupported modes upstream rather
     * than have the transport silently downgrade.
     */
    responseMode?: string;

    /**
     * Verifier's `client_metadata` from the Authorization Request.
     * Required when `responseMode === 'direct_post.jwt'` (carries
     * the JWE algorithms + verifier's encryption JWKS). Ignored in
     * cleartext mode.
     */
    clientMetadata?: JarmClientMetadata;

    /**
     * Verifier's `nonce` from the Authorization Request. Required
     * when `responseMode === 'direct_post.jwt'` (used as the JWE
     * `apv` ECDH-ES KDF input per OID4VP §8.3 ¶6). Ignored in
     * cleartext mode.
     */
    nonce?: string;

    /**
     * Wallet signer — same shape as VCI proof-of-possession + outer
     * VP signing. Required when JARM is in use AND the verifier
     * declared `authorization_signed_response_alg` (the wallet must
     * sign the response object before encrypting). Ignored otherwise.
     */
    signer?: ProofJwtSigner;

    /** Override fetch — defaults to `globalThis.fetch`. */
    fetchImpl?: typeof fetch;
}

/**
 * Shape of a successful `direct_post` response. `redirectUri` is
 * populated when the verifier requested wallet redirect (OID4VP §8.2).
 */
export interface SubmitPresentationResult {
    /** HTTP status (always 2xx for successful submissions; otherwise we throw). */
    status: number;

    /**
     * Redirect URI the wallet should deep-link to. Present when the
     * verifier wants the wallet to bounce the user back (e.g. to an
     * in-browser "success" page).
     */
    redirectUri?: string;

    /**
     * Raw parsed body. `object` when the verifier returned JSON,
     * `string` for plain text, `undefined` for empty. Preserved so
     * callers can debug vendor-specific fields.
     */
    body: unknown;
}

/* -------------------------------------------------------------------------- */
/*                                  errors                                    */
/* -------------------------------------------------------------------------- */

export type VpSubmitErrorCode =
    | 'invalid_input'
    | 'no_fetch'
    | 'network_error'
    | 'server_error'
    | 'jarm_encrypt_failed';

export class VpSubmitError extends Error {
    readonly code: VpSubmitErrorCode;
    readonly status?: number;
    readonly body?: unknown;

    constructor(
        code: VpSubmitErrorCode,
        message: string,
        extra: { status?: number; body?: unknown; cause?: unknown } = {}
    ) {
        super(message);
        this.name = 'VpSubmitError';
        this.code = code;
        this.status = extra.status;
        this.body = extra.body;
        if (extra.cause !== undefined) {
            (this as { cause?: unknown }).cause = extra.cause;
        }
    }
}

/* -------------------------------------------------------------------------- */
/*                               public surface                               */
/* -------------------------------------------------------------------------- */

export const submitPresentation = async (
    options: SubmitPresentationOptions
): Promise<SubmitPresentationResult> => {
    const { responseUri, vpToken, submission, state } = options;

    if (typeof responseUri !== 'string' || responseUri.length === 0) {
        throw new VpSubmitError('invalid_input', '`responseUri` must be a non-empty string');
    }

    if (vpToken === undefined || vpToken === null) {
        throw new VpSubmitError('invalid_input', '`vpToken` is required');
    }

    // `submission` is optional — DCQL responses don't carry one. When
    // present it MUST be a structured object so we know we can
    // round-trip it through `JSON.stringify` cleanly. PEX callers
    // always pass one; if it's a non-object truthy value somehow,
    // that's a typed error.
    if (submission !== undefined && (submission === null || typeof submission !== 'object')) {
        throw new VpSubmitError(
            'invalid_input',
            '`submission` must be a PresentationSubmission object when provided (omit it entirely for DCQL flows)'
        );
    }

    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
        throw new VpSubmitError(
            'no_fetch',
            'No fetch implementation available; pass `fetchImpl` or configure the plugin with one'
        );
    }

    // Pick transport mode. JARM (`direct_post.jwt`) wraps the same
    // payload in a JOSE blob; everything else falls through to the
    // cleartext form-fields path.
    const isJarm = options.responseMode === 'direct_post.jwt';

    const body = isJarm
        ? await encodeJarmBody({
              vpToken,
              submission,
              state,
              idToken: options.idToken,
              clientMetadata: options.clientMetadata,
              nonce: options.nonce,
              signer: options.signer,
              fetchImpl,
          })
        : encodeFormBody({
              vpToken,
              submission,
              state,
              idToken: options.idToken,
          });


    let response: Response;
    try {
        response = await fetchImpl(responseUri, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
            },
            body,
        });
    } catch (e) {
        throw new VpSubmitError(
            'network_error',
            `Failed to POST to ${responseUri}: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    const parsed = await parseResponseBody(response);

    if (!response.ok) {
        throw new VpSubmitError(
            'server_error',
            `Verifier returned ${response.status} ${response.statusText || ''}`.trim(),
            { status: response.status, body: parsed }
        );
    }

    return {
        status: response.status,
        redirectUri: extractRedirectUri(parsed),
        body: parsed,
    };
};

/* -------------------------------------------------------------------------- */
/*                                 internals                                  */
/* -------------------------------------------------------------------------- */

const encodeFormBody = (args: {
    vpToken: VpToken;
    submission?: PresentationSubmission;
    state?: string;
    idToken?: string;
}): string => {
    const params = new URLSearchParams();

    params.set('vp_token', stringifyVpToken(args.vpToken));

    // PEX flow includes `presentation_submission`; DCQL flow MUST NOT.
    // The verifier reads its own auth-request memory to decide which
    // shape to expect, so an extra/missing field on the wrong side is
    // an immediate 400 — keep this branch tight.
    if (args.submission) {
        params.set('presentation_submission', JSON.stringify(args.submission));
    }

    if (typeof args.idToken === 'string' && args.idToken.length > 0) {
        params.set('id_token', args.idToken);
    }

    if (typeof args.state === 'string' && args.state.length > 0) {
        params.set('state', args.state);
    }

    return params.toString();
};

const stringifyVpToken = (vpToken: VpToken): string =>
    typeof vpToken === 'string' ? vpToken : JSON.stringify(vpToken);

/**
 * Build the JARM (`direct_post.jwt`) body: a single `response`
 * form field whose value is the compact JWE / JWS-in-JWE blob built
 * by `./encrypt.ts`.
 *
 * The plaintext payload is structurally identical to the cleartext
 * mode's form fields — we just pack them into a JSON object first.
 * The verifier sees the same fields after decryption, which keeps
 * server-side parsing logic uniform across modes.
 */
const encodeJarmBody = async (args: {
    vpToken: VpToken;
    submission?: PresentationSubmission;
    state?: string;
    idToken?: string;
    clientMetadata?: JarmClientMetadata;
    nonce?: string;
    signer?: ProofJwtSigner;
    fetchImpl: typeof fetch;
}): Promise<string> => {
    if (!args.clientMetadata) {
        throw new VpSubmitError(
            'invalid_input',
            'response_mode=direct_post.jwt requires `clientMetadata` (verifier\'s JWKS + JWE algs)'
        );
    }

    if (typeof args.nonce !== 'string' || args.nonce.length === 0) {
        throw new VpSubmitError(
            'invalid_input',
            'response_mode=direct_post.jwt requires the verifier `nonce` for the JWE `apv` ECDH-ES KDF input'
        );
    }

    const payload: ResponseObjectPayload = {
        // vp_token is structured even in cleartext mode (it can be a
        // JSON object). We pass it through unchanged — JARM doesn't
        // need the URL-form stringification cleartext does.
        vp_token: args.vpToken,
    };

    if (args.submission) {
        // PresentationSubmission is a structured PEX type; widening
        // to `Record<string, unknown>` for JSON-encoding into the
        // JWE plaintext is safe (it stays a plain object on the
        // wire). Two-step cast through `unknown` to satisfy strict
        // structural-equality narrowing.
        payload.presentation_submission = args.submission as unknown as Record<
            string,
            unknown
        >;
    }

    if (typeof args.state === 'string' && args.state.length > 0) {
        payload.state = args.state;
    }

    if (typeof args.idToken === 'string' && args.idToken.length > 0) {
        payload.id_token = args.idToken;
    }

    let jose: string;
    try {
        jose = await encryptResponseObject({
            payload,
            clientMetadata: args.clientMetadata,
            verifierNonce: args.nonce,
            signer: args.signer,
            fetchImpl: args.fetchImpl,
        });
    } catch (e) {
        if (e instanceof JarmEncryptError) {
            throw new VpSubmitError(
                'jarm_encrypt_failed',
                `Failed to build JARM response (${e.code}): ${e.message}`,
                { cause: e }
            );
        }
        throw e;
    }

    const params = new URLSearchParams();
    params.set('response', jose);
    return params.toString();
};

const parseResponseBody = async (response: Response): Promise<unknown> => {
    // Empty body — many verifiers respond 200 with nothing.
    const text = await response.text().catch(() => '');
    if (!text) return undefined;

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    // Some verifiers (e.g. walt.id) return JSON with a non-JSON
    // content-type. Opportunistic parse, fallback to raw text.
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
};

const extractRedirectUri = (body: unknown): string | undefined => {
    if (body && typeof body === 'object') {
        const candidate = (body as { redirect_uri?: unknown }).redirect_uri;
        if (typeof candidate === 'string' && candidate.length > 0) return candidate;
    }
    return undefined;
};
