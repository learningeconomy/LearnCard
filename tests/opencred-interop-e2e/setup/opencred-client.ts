/**
 * Tiny admin-API client for the OpenCred verifier.
 *
 * Mirrors the shape of walt-id-client.ts in tests/openid4vc-interop-e2e
 * so specs read symmetrically across vendors. The OpenCred HTTP API
 * surface is documented at /api-docs on a running instance; routes used
 * here are the ones the relying-party-backend half of an OID4VP flow
 * actually exercises.
 *
 * Tests target OpenCred over HTTP (port 22080) rather than HTTPS
 * (22443) because the upstream config sets
 * `config.express.httpOnly = true`, which makes the express app
 * attach to the HTTP listener only — HTTPS returns 503 from the
 * bedrock-server placeholder. See compose.yaml for the full
 * rationale.
 *
 * NOTE: OpenCred uses HTTP Basic auth on POST /workflows/:id/exchanges.
 * The clientSecret in opencred.yaml is `lc-interop-secret` for every
 * workflow — a test fixture, not a deployment secret.
 */

export interface OpencredExchangeResponse {
    exchangeId: string;
    accessToken: string;
    /** OID4VP authorization request URI for the workflow's default profile. */
    OID4VP?: string;
    /** VC-API exchange URL. */
    vcapi?: string;
    /** Same-device interaction URL. */
    interact?: string;
    /** Optional base64 data: URI of QR code image. */
    QR?: string;
    /**
     * Per-profile OID4VP URIs. OpenCred populates this with one entry
     * per protocol it supports for the workflow (`OID4VP-draft18`,
     * `OID4VP-1.0`, `OID4VP-combined`, `interact`, `vcapi`, ...).
     * Tests targeting a specific OID4VP profile (e.g. DCQL via
     * `OID4VP-1.0`) should index into this map rather than `OID4VP`.
     */
    protocols?: Record<string, string>;
    [k: string]: unknown;
}

export interface CreateExchangeOptions {
    /** Base URL of OpenCred — typically `http://localhost:22080`. */
    opencredBaseUrl: string;
    /** Workflow `clientId` from opencred.yaml */
    workflowId: string;
    /** Workflow `clientSecret` from opencred.yaml */
    clientSecret: string;
    /**
     * Optional `qr` query param. Set to a protocol name (e.g.
     * `OID4VP-draft18`, `OID4VP-1.0`) to have OpenCred encode that
     * protocol's URI into a QR; pass `false` to disable QR generation
     * entirely. Defaults to the workflow's configured OID4VPdefault.
     */
    qrProtocol?: string | false;
}

export interface ExchangeStatus {
    state: 'pending' | 'active' | 'complete' | 'invalid';
    /** Raw exchange payload from OpenCred. */
    exchange: Record<string, unknown>;
    /** Errors when state === 'invalid'. */
    errors?: unknown[];
}

const buildAuthHeader = (clientId: string, clientSecret: string): string =>
    'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

/**
 * Initiate an OID4VP exchange against a configured OpenCred workflow.
 * Throws on non-2xx — the most common failure mode is "workflow not
 * configured" or "basic auth mismatch", both of which are config
 * errors worth surfacing loudly.
 */
export const createExchange = async (
    opts: CreateExchangeOptions
): Promise<OpencredExchangeResponse> => {
    const { opencredBaseUrl, workflowId, clientSecret, qrProtocol } = opts;

    const url = new URL(`${opencredBaseUrl}/workflows/${workflowId}/exchanges`);
    if (qrProtocol !== undefined) {
        url.searchParams.set('qr', qrProtocol === false ? 'false' : qrProtocol);
    }

    const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            Authorization: buildAuthHeader(workflowId, clientSecret),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '<unreadable>');
        throw new Error(
            `OpenCred POST /workflows/${workflowId}/exchanges failed ${res.status}: ${body}`
        );
    }

    const raw = (await res.json()) as Record<string, unknown> & {
        id?: string;
        exchangeId?: string;
    };

    const exchangeId = (raw.exchangeId ?? raw.id) as string | undefined;
    if (!exchangeId) {
        throw new Error(
            `OpenCred exchange response missing id/exchangeId: ${JSON.stringify(raw)}`
        );
    }
    return { ...raw, exchangeId } as OpencredExchangeResponse;
};

/**
 * Poll a single exchange status check. Pair with `waitForExchangeComplete`
 * for the loop-with-deadline pattern.
 */
export const getExchangeStatus = async (
    opencredBaseUrl: string,
    workflowId: string,
    exchangeId: string,
    accessToken: string
): Promise<ExchangeStatus> => {
    const res = await fetch(
        `${opencredBaseUrl}/workflows/${workflowId}/exchanges/${exchangeId}`,
        {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: 'application/json',
            },
        }
    );

    if (!res.ok) {
        const body = await res.text().catch(() => '<unreadable>');
        throw new Error(
            `OpenCred GET exchange ${exchangeId} failed ${res.status}: ${body}`
        );
    }

    const json = (await res.json()) as {
        exchange?: Record<string, unknown>;
        errors?: unknown[];
    };
    const exchange = json.exchange ?? {};
    const rawState = (exchange.state as string | undefined) ?? 'pending';

    return {
        state: rawState as ExchangeStatus['state'],
        exchange,
        errors: json.errors,
    };
};

/**
 * Poll until the exchange resolves to `complete` or `invalid`. OpenCred
 * resolves an exchange within a few hundred ms of the wallet POSTing
 * its presentation, so a short interval keeps test runtime down.
 */
export const waitForExchangeComplete = async (
    opencredBaseUrl: string,
    workflowId: string,
    exchangeId: string,
    accessToken: string,
    timeoutMs = 15_000,
    intervalMs = 200
): Promise<ExchangeStatus> => {
    const deadline = Date.now() + timeoutMs;

    while (Date.now() < deadline) {
        const status = await getExchangeStatus(
            opencredBaseUrl,
            workflowId,
            exchangeId,
            accessToken
        );
        if (status.state === 'complete' || status.state === 'invalid') {
            return status;
        }
        await new Promise(r => setTimeout(r, intervalMs));
    }

    throw new Error(
        `OpenCred exchange ${exchangeId} did not resolve within ${timeoutMs}ms`
    );
};

/**
 * Fetch OpenCred's published did:web document for sanity checks.
 * Useful in tests that want to assert the verifier's signing identity
 * matches the configured signing key.
 */
export const getOpencredDidDocument = async (
    opencredBaseUrl: string
): Promise<Record<string, unknown>> => {
    const res = await fetch(`${opencredBaseUrl}/.well-known/did.json`);
    if (!res.ok) {
        throw new Error(
            `OpenCred GET /.well-known/did.json failed: ${res.status}`
        );
    }
    return (await res.json()) as Record<string, unknown>;
};

/**
 * Inline OpenCred's by-reference signed Request Object into the
 * Authorization Request URI.
 *
 * Rewrites `?...&request_uri=<http-url>` into `?...&request=<jws>`.
 * The openid4vc plugin enforces `https://` on `request_uri` (correct
 * for production — a signed JAR over an insecure URI is a man-in-the-
 * middle vector), so for local HTTP testing we fetch the JWS ourselves
 * and hand the plugin a by-value request instead. The plugin still
 * verifies the JWS signature against OpenCred's published DID doc.
 */
export const inlineRequestUri = async (
    authRequestUri: string
): Promise<string> => {
    const queryStart = authRequestUri.indexOf('?');
    if (queryStart === -1) return authRequestUri;

    const base = authRequestUri.slice(0, queryStart);
    const params = new URLSearchParams(authRequestUri.slice(queryStart + 1));

    if (params.get('request')) return authRequestUri;

    const requestUri = params.get('request_uri');
    if (!requestUri) return authRequestUri;

    const method = params.get('request_uri_method')?.toLowerCase() === 'post' ? 'POST' : 'GET';
    const headers: Record<string, string> = {
        Accept: 'application/oauth-authz-req+jwt',
    };
    let body: string | undefined;
    if (method === 'POST') {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
        // OpenCred parses the profile / response_mode / client_id_scheme
        // from req.body on POST (req.query on GET). Forward whatever
        // query params live on request_uri as form fields so the
        // OID4VP-1.0 (`profile=OID4VP-1.0`) hint isn't lost in transit.
        const requestUriParams = new URLSearchParams(
            requestUri.split('?')[1] ?? ''
        );
        body = requestUriParams.toString();
    }
    const res = await fetch(requestUri, {
        method,
        headers,
        ...(body !== undefined && { body }),
    });
    if (!res.ok) {
        throw new Error(
            `Failed to fetch request_uri ${requestUri}: HTTP ${res.status}`
        );
    }

    const jws = (await res.text()).trim();
    params.delete('request_uri');
    params.delete('request_uri_method');
    params.set('request', jws);

    return `${base}?${params.toString()}`;
};
