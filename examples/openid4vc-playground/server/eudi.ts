/**
 * Server-side EUDI verifier client used by the playground middleware.
 *
 * Curated lift of the helpers proven by the interop test suite at
 * `tests/openid4vc-interop-e2e/setup/eudi-client.ts`. The playground
 * only depends on the surface a UI scenario actually needs (mint a
 * verify session, poll status), plus a small URI-shaping convenience
 * to match the `rawAuthRequestUri` contract the api.ts dispatcher
 * already uses for walt.id.
 *
 * # Scope
 *
 * The EUDI reference verifier (`eudi-srv-verifier-endpoint`) is the
 * European Commission's OID4VP 1.0 reference impl. It supports ONLY:
 *
 *   - `dc+sd-jwt` (IETF SD-JWT VC, the EU-favored format)
 *   - `mso_mdoc`  (ISO 18013-7 mobile driver license / mDoc)
 *
 * It does NOT accept `jwt_vc_json` / `vc+sd-jwt` / `ldp_vc`. The
 * playground wallet currently issues `jwt_vc_json` and `vc+sd-jwt`
 * via walt.id, neither of which EUDI matches — so the wallet will
 * report `canSatisfy: false` on the consent screen rather than
 * presenting a credential. That's intentionally still a high-value
 * scenario: it exercises the wallet's JAR (signed Request Object)
 * parser and DCQL routing layer end-to-end, which walt.id's
 * verifier-api can't reach (walt.id silently ignores `dcql_query` and never emits a signed
 * Request Object).
 */

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

export interface CreateEudiVerifySessionOptions {
    /** Base URL of the EUDI verifier — `http://localhost:7004` in the playground. */
    verifierBaseUrl: string;
    /**
     * Parsed DCQL query. EUDI rejects W3C VC formats — the inner
     * `format` must be `dc+sd-jwt` or `mso_mdoc`.
     */
    dcqlQuery: Record<string, unknown>;
    /**
     * Optional explicit nonce. EUDI rejects requests without a nonce
     * (`MissingNonce`). We auto-generate one when not provided.
     */
    nonce?: string;
    /**
     * Embed the Authorization Request inline (JAR by-value) vs. by
     * reference. Default `by_value` so the wallet doesn't need to
     * fetch back to EUDI from the LCA host (avoids container DNS).
     */
    jarMode?: 'by_value' | 'by_reference';
}

export interface EudiVerifySession {
    transactionId: string;
    /** EUDI's verifier-id string (mirrors walt.id's `client_id`). */
    clientId: string;
    /** Compact JWS string (jar_mode=by_value), or undefined. */
    request?: string;
    /** Pointer URL (jar_mode=by_reference), or undefined. */
    requestUri?: string;
    /**
     * Plugin-ready Authorization Request URI built from the response.
     * Follows the same `rawAuthRequestUri` contract the api.ts
     * dispatcher consumes from `mintWaltidOffer`-style helpers.
     */
    authorizationRequestUri: string;
    /** Echo of the input nonce. */
    nonce: string;
}

export interface EudiVerifyStatus {
    /** EUDI's verdict, or null when the wallet hasn't submitted yet. */
    verificationResult: boolean | null;
    /** Raw status payload — keeps walt.id-style debug parity. */
    raw: unknown;
}

/* -------------------------------------------------------------------------- */
/*                              public surface                                */
/* -------------------------------------------------------------------------- */

/**
 * Mint a verify session against EUDI. Returns a JAR-bearing
 * `openid4vp://authorize?client_id=...&request=<JWS>` URI.
 *
 * Throws on non-2xx — typical failure modes are "EUDI not running"
 * or "DCQL query was malformed / used unsupported format".
 */
export const createEudiVerifySession = async (
    opts: CreateEudiVerifySessionOptions
): Promise<EudiVerifySession> => {
    const jarMode = opts.jarMode ?? 'by_value';

    // EUDI rejects requests without a `nonce` (HTTP 400
    // `{"error":"MissingNonce"}`). Pre-generate a 16-byte hex when
    // the caller didn't pin one.
    const nonce =
        opts.nonce ??
        Array.from(
            crypto.getRandomValues(new Uint8Array(16)),
            (b: number) => b.toString(16).padStart(2, '0')
        ).join('');

    const body: Record<string, unknown> = {
        dcql_query: opts.dcqlQuery,
        jar_mode: jarMode,
        nonce,
    };

    const res = await fetch(`${opts.verifierBaseUrl}/ui/presentations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `EUDI /ui/presentations failed ${res.status}: ${text}`
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
            `EUDI /ui/presentations response missing transaction_id / client_id: ${JSON.stringify(
                json
            )}`
        );
    }

    // Build the canonical openid4vp:// URI a wallet would receive
    // from a deep link / QR scan. EUDI gives us the JAR + client_id
    // separately on the admin API.
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
 * submitted yet — surfaced as `verificationResult: null` to match
 * the walt.id helper's contract.
 *
 * EUDI's reference verifier doesn't (yet) emit a top-level boolean
 * on a successful submission either; we keep `verificationResult`
 * null until upstream adds one and let the caller branch on `raw`
 * if richer logic is needed.
 */
export const getEudiVerifyStatus = async (
    verifierBaseUrl: string,
    transactionId: string
): Promise<EudiVerifyStatus> => {
    const res = await fetch(
        `${verifierBaseUrl}/ui/presentations/${encodeURIComponent(transactionId)}`,
        { method: 'GET', headers: { Accept: 'application/json' } }
    );

    // EUDI's reference verifier surfaces "not yet submitted" as either
    // 404 (transaction id never existed) OR 400 (transaction exists
    // but the wallet hasn't POSTed a response yet). Both map to
    // `pending` from the playground UI's perspective \u2014 we observed
    // 400-with-empty-body empirically against the running container.
    if (res.status === 404 || res.status === 400) {
        return { verificationResult: null, raw: undefined };
    }

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(
            `EUDI /ui/presentations/${transactionId} failed ${res.status}: ${text}`
        );
    }

    const raw = (await res.json().catch(() => undefined)) as unknown;
    return { verificationResult: null, raw };
};
