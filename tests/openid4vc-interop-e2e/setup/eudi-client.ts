/**
 * Test helpers for the EU Digital Identity Wallet **reference verifier**
 * (`ghcr.io/eu-digital-identity-wallet/eudi-srv-verifier-endpoint`).
 *
 * # Why this exists alongside `walt-id-client.ts`
 *
 * The EUDI verifier is the OID4VP 1.0 reference implementation maintained
 * by the European Commission's DG-Connect / Joinup wallet effort. It's
 * the closest thing to "what production EU wallets actually integrate
 * with" we have access to.
 *
 * **Critical scope difference**: EUDI's verifier supports ONLY
 * `mso_mdoc` and `dc+sd-jwt` credential formats. It does NOT accept
 * `jwt_vc_json` or `ldp_vc` (returns `{"error":"UnsupportedFormat"}`).
 * Our plugin currently only emits the W3C JWT-VC formats — there's a
 * format gap that prevents a full credential round-trip against EUDI.
 *
 * What this harness DOES exercise:
 *
 *   - **Auth-request resolution**: EUDI emits a *signed Request Object*
 *     (JAR) per OID4VP §6.1. We can prove the plugin parses it
 *     correctly (signature is checked when `unsafeAllowSelfSigned` is
 *     enabled, since EUDI uses an embedded self-signed test cert).
 *   - **DCQL query parsing**: the parsed Request Object's `dcql_query`
 *     claim must round-trip through `parseDcqlQuery` and reach the
 *     plugin's selector unscathed.
 *   - **Selector behavior**: when no held credential matches the EUDI
 *     query's format (because we hold `jwt_vc_json` and EUDI asked
 *     for `mso_mdoc`), the selector reports `canSatisfy: false`
 *     cleanly rather than throwing. This proves the format-gap is
 *     detected, not papered over.
 *
 * What this harness does NOT exercise (until SD-JWT-VC plugin support
 * lands in a follow-up slice):
 *
 *   - Sending a wallet response to EUDI's `/wallet/direct_post`.
 *   - EUDI accepting / rejecting the response (we never get there).
 *
 * # API Surface
 *
 * Mirrors `walt-id-client.ts` shape so test specs can read
 * symmetrically. Two helpers:
 *
 *   - `createEudiVerifySession({ verifierBaseUrl, dcqlQuery, ... })`
 *     posts to EUDI's `/ui/presentations` and returns the parsed
 *     response (transaction_id, request, state, nonce).
 *   - `getEudiVerifyStatus(verifierBaseUrl, transactionId)` polls the
 *     transaction state. Surfaces "not yet submitted" cleanly.
 */

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

export interface CreateEudiVerifySessionInput {
    /** Base URL of the EUDI verifier — typically `http://localhost:7004` in tests. */
    verifierBaseUrl: string;
    /**
     * Parsed + validated DCQL query. Pass via the plugin's `requestW3cVc`
     * (or hand-rolled `parseDcqlQuery`) to ensure spec compliance.
     * Note: EUDI rejects W3C VC formats — use `dc+sd-jwt` or `mso_mdoc`
     * in `format`.
     */
    dcqlQuery: Record<string, unknown>;
    /**
     * Optional explicit nonce. EUDI auto-generates one when omitted,
     * which is the recommended pattern.
     */
    nonce?: string;
    /**
     * Embed the Authorization Request inline (JAR by-value) vs. by
     * reference. We default to `by_value` because by_reference would
     * require the plugin to fetch back to EUDI from the test process,
     * adding round-trip complexity for no extra coverage.
     */
    jarMode?: 'by_value' | 'by_reference';
}

export interface EudiVerifySession {
    transactionId: string;
    /** EUDI's verifier-id string. Mirrors what walt.id calls `client_id`. */
    clientId: string;
    /**
     * The signed Authorization Request, transported per `jar_mode`:
     *  - `by_value` → `request` is the compact JWS string (inline)
     *  - `by_reference` → `requestUri` points to a URL the wallet
     *                     fetches to retrieve the JWS
     */
    request?: string;
    requestUri?: string;
    /**
     * Plugin-ready Authorization Request URI built from the response.
     * Direct callers normally feed this straight into
     * `plugin.resolveAuthorizationRequest(...)`.
     */
    authorizationRequestUri: string;
    /** Echo of the input nonce, when one was supplied. */
    nonce?: string;
}

export interface EudiVerifyStatus {
    /** Verifier's verdict, or null when the wallet hasn't submitted yet. */
    verificationResult: boolean | null;
    /** Raw status payload — keeps walt.id-style debug parity. */
    raw: unknown;
}

/* -------------------------------------------------------------------------- */
/*                              public surface                                */
/* -------------------------------------------------------------------------- */

/**
 * Mint a verify session against the EUDI reference verifier.
 *
 * Throws on non-2xx — the caller's failure mode here is "EUDI wasn't
 * up" or "DCQL query was malformed" (e.g. unsupported format). Both
 * are configuration errors worth surfacing loudly.
 */
export const createEudiVerifySession = async (
    input: CreateEudiVerifySessionInput
): Promise<EudiVerifySession> => {
    const jarMode = input.jarMode ?? 'by_value';

    // EUDI rejects requests without a `nonce` (HTTP 400
    // `{"error":"MissingNonce"}`). The OID4VP spec leaves nonce
    // generation to the verifier when omitted, but EUDI's reference
    // impl requires the caller to supply one. We pick a 16-byte
    // random hex when the test didn't pin one.
    const nonce =
        input.nonce ??
        Array.from(
            crypto.getRandomValues(new Uint8Array(16)),
            (b: number) => b.toString(16).padStart(2, '0')
        ).join('');

    const body: Record<string, unknown> = {
        dcql_query: input.dcqlQuery,
        jar_mode: jarMode,
        nonce,
    };

    const res = await fetch(`${input.verifierBaseUrl}/ui/presentations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `EUDI /ui/presentations returned ${res.status} ${res.statusText}: ${text}`
        );
    }

    const json = (await res.json()) as {
        transaction_id?: string;
        client_id?: string;
        request?: string;
        request_uri?: string;
    };

    if (!json.transaction_id || !json.client_id) {
        throw new Error(
            `EUDI /ui/presentations response missing transaction_id / client_id: ${JSON.stringify(json)}`
        );
    }

    // Build the plugin-ready URI. EUDI's response is what the wallet
    // would receive over a deep-link / QR scan — we just have to
    // assemble it into the canonical openid4vp:// shape since EUDI
    // doesn't return one directly when called over its admin API.
    const params = new URLSearchParams();
    params.set('client_id', json.client_id);

    if (jarMode === 'by_value') {
        if (!json.request) {
            throw new Error(
                'EUDI returned no `request` field for jar_mode=by_value'
            );
        }
        params.set('request', json.request);
    } else {
        if (!json.request_uri) {
            throw new Error(
                'EUDI returned no `request_uri` for jar_mode=by_reference'
            );
        }
        params.set('request_uri', json.request_uri);
    }

    return {
        transactionId: json.transaction_id,
        clientId: json.client_id,
        request: json.request,
        requestUri: json.request_uri,
        authorizationRequestUri: `openid4vp://authorize?${params.toString()}`,
        nonce,
    };
};

/**
 * Poll a transaction's status. EUDI returns 404 when no wallet has
 * submitted yet; we surface that as `verificationResult: null` to
 * match the walt.id helper's contract.
 */
export const getEudiVerifyStatus = async (
    verifierBaseUrl: string,
    transactionId: string
): Promise<EudiVerifyStatus> => {
    const res = await fetch(
        `${verifierBaseUrl}/ui/presentations/${encodeURIComponent(transactionId)}`,
        { method: 'GET', headers: { Accept: 'application/json' } }
    );

    if (res.status === 404) {
        return { verificationResult: null, raw: undefined };
    }

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `EUDI /ui/presentations/${transactionId} returned ${res.status} ${res.statusText}: ${text}`
        );
    }

    const raw = (await res.json().catch(() => undefined)) as unknown;
    // EUDI doesn't (yet) emit a top-level boolean. Presence of the
    // payload is "submitted but not necessarily verified". For now we
    // surface raw and let callers branch.
    return { verificationResult: null, raw };
};
