import { PresentationSubmission } from './select';
import { VpToken } from './sign';

/**
 * Slice 7c — **`direct_post` transport**.
 *
 * POST a signed `vp_token` + `presentation_submission` to the verifier's
 * `response_uri` per OID4VP §8 "direct_post Response Mode". Pure
 * transport — no signing, no PEX evaluation, no request-object parsing.
 *
 * ## Encoding
 *
 * OID4VP requires `application/x-www-form-urlencoded`, even though
 * `vp_token` and `presentation_submission` are structured values.
 * Stringification rules:
 *
 * - `vp_token` as a `string` (jwt_vp_json compact JWS) → used verbatim.
 * - `vp_token` as an object (ldp_vp signed VP, or an `{ "...": … }`
 *   wrapper for multi-credential jwt submissions) → `JSON.stringify`.
 * - `presentation_submission` → always `JSON.stringify`.
 * - `state` → echoed verbatim if present.
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

    /** Signed VP token — compact JWS for jwt_vp_json, signed VP object for ldp_vp. */
    vpToken: VpToken;

    /** DIF PEX v2 Presentation Submission produced by {@link buildPresentation}. */
    submission: PresentationSubmission;

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
    | 'server_error';

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

    if (!submission || typeof submission !== 'object') {
        throw new VpSubmitError('invalid_input', '`submission` must be a PresentationSubmission');
    }

    const fetchImpl = options.fetchImpl ?? globalThis.fetch;
    if (typeof fetchImpl !== 'function') {
        throw new VpSubmitError(
            'no_fetch',
            'No fetch implementation available; pass `fetchImpl` or configure the plugin with one'
        );
    }

    const body = encodeFormBody({
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
    submission: PresentationSubmission;
    state?: string;
    idToken?: string;
}): string => {
    const params = new URLSearchParams();

    params.set('vp_token', stringifyVpToken(args.vpToken));
    params.set('presentation_submission', JSON.stringify(args.submission));

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
