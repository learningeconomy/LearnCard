/**
 * Reverse proxy for the hosted EUDI reference issuer
 * (https://issuer.eudiw.dev/), narrowed to the endpoints the wallet
 * actually hits during an `authorization_code` issuance flow.
 *
 * # Why this exists
 *
 * EUDI's nginx config has CORS configured per-path \u2014 the well-known
 * metadata endpoints and the credential endpoint allow `localhost:3000`
 * explicitly, but the **token endpoint** at
 * `https://issuer.eudiw.dev/oidc/token` is missing
 * `Access-Control-Allow-Origin` headers entirely. A browser-based
 * wallet hits a CORS wall during the auth-code \u2192 access-token
 * exchange.
 *
 * Rather than ask EUDI to fix their nginx config (out of our hands)
 * or rely on browser CORS-unblock extensions, the playground server
 * acts as a transparent reverse proxy. The wallet's plugin sees
 * a `credential_issuer` of `http://localhost:5173/api/eudi-proxy`,
 * fetches well-known metadata from there, and posts to the proxy's
 * token / credential endpoints \u2014 all same-origin from the
 * playground's perspective and CORS-friendly to the wallet.
 *
 * # What we proxy (and what we don't)
 *
 * Proxied:
 *   - `GET  /.well-known/openid-credential-issuer`
 *   - `GET  /.well-known/oauth-authorization-server`
 *   - `POST /token`
 *   - `POST /credential`
 *
 * NOT proxied:
 *   - `authorization_endpoint` is left pointing at real EUDI. The
 *     browser navigates there top-level (full page redirect), which
 *     CORS doesn't apply to. Proxying it would require staging the
 *     entire EUDI login UI, which is impractical.
 *   - `issuer` field in the AS metadata is left as the real EUDI
 *     value so RFC 9207 `iss` parameter validation in the redirect
 *     response keeps working.
 *
 * # Trust model
 *
 * The wallet's plugin enforces that the `credential_issuer` claimed
 * in the metadata matches the offer's `credential_issuer`. Both are
 * the proxy URL here. The plugin does NOT verify the credential
 * JWT's `iss` claim against the metadata's `credential_issuer`
 * (`packages/plugins/openid4vc/src/vci/decode.ts:56-59` calls this
 * out explicitly), so the issued credential's real EUDI `iss` claim
 * is preserved end-to-end into the wallet store.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

/* -------------------------------------------------------------------------- */
/*                                   config                                   */
/* -------------------------------------------------------------------------- */

const REAL_ISSUER_BASE =
    process.env.EUDI_HOSTED_ISSUER_BASE_URL ?? 'https://issuer.eudiw.dev';
const REAL_CREDENTIAL_ENDPOINT =
    process.env.EUDI_HOSTED_CREDENTIAL_ENDPOINT ??
    'https://backend.issuer.eudiw.dev/credential';

/**
 * The base URL the wallet sees in metadata + offers. Defaults to the
 * Vite dev server's localhost address; override only if you're
 * running the playground on a non-default host/port.
 */
export const EUDI_PROXY_PUBLIC_BASE_URL =
    process.env.EUDI_PROXY_PUBLIC_BASE_URL ??
    'http://localhost:5173/api/eudi-proxy';

const PROXY_PATH_PREFIX = '/api/eudi-proxy';

/* -------------------------------------------------------------------------- */
/*                              public middleware                             */
/* -------------------------------------------------------------------------- */

/**
 * Returns `true` if the request was handled (response written),
 * `false` otherwise. Lets the calling middleware fall through to
 * Vite's static handlers without an explicit `return`.
 */
export const handleEudiProxy = async (
    req: IncomingMessage,
    res: ServerResponse
): Promise<boolean> => {
    const rawUrl = req.url ?? '';

    if (!rawUrl.startsWith(PROXY_PATH_PREFIX)) return false;

    const subPath = rawUrl.slice(PROXY_PATH_PREFIX.length) || '/';

    // Always set CORS up front \u2014 the wallet at localhost:3000 is
    // the canonical caller, but allow any localhost origin for dev
    // ergonomics (multiple LCA dev ports, Storybook, etc.).
    setCorsHeaders(req, res);

    if (req.method === 'OPTIONS') {
        res.statusCode = 204;
        res.end();
        return true;
    }

    try {
        if (
            req.method === 'GET' &&
            subPath === '/.well-known/openid-credential-issuer'
        ) {
            await proxyCredentialIssuerMetadata(res);
            return true;
        }

        if (
            req.method === 'GET' &&
            subPath === '/.well-known/oauth-authorization-server'
        ) {
            await proxyAuthorizationServerMetadata(res);
            return true;
        }

        if (req.method === 'POST' && subPath === '/token') {
            await proxyPost(
                req,
                res,
                `${REAL_ISSUER_BASE}/oidc/token`,
                /* allowedHeaders */ ['content-type', 'authorization', 'dpop']
            );
            return true;
        }

        if (req.method === 'POST' && subPath === '/credential') {
            await proxyPost(
                req,
                res,
                REAL_CREDENTIAL_ENDPOINT,
                /* allowedHeaders */ ['content-type', 'authorization', 'dpop']
            );
            return true;
        }

        // Unknown path under the proxy prefix \u2014 explicit 404 (rather
        // than falling through to Vite, which would 200 the SPA index).
        res.statusCode = 404;
        res.setHeader('content-type', 'application/json');
        res.end(
            JSON.stringify({
                error: `EUDI proxy has no route for ${req.method ?? '?'} ${subPath}`,
            })
        );
        return true;
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[eudi-proxy] upstream error', err);
        res.statusCode = 502;
        res.setHeader('content-type', 'application/json');
        res.end(
            JSON.stringify({
                error: `EUDI proxy upstream error: ${
                    err instanceof Error ? err.message : String(err)
                }`,
            })
        );
        return true;
    }
};

/* -------------------------------------------------------------------------- */
/*                              metadata handlers                             */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the real EUDI credential-issuer metadata and rewrite the two
 * fields the wallet's plugin will validate against the offer:
 * `credential_issuer` and `credential_endpoint`. Everything else
 * (formats, claims, display) passes through unchanged.
 */
const proxyCredentialIssuerMetadata = async (
    res: ServerResponse
): Promise<void> => {
    const upstream = await fetch(
        `${REAL_ISSUER_BASE}/.well-known/openid-credential-issuer`,
        { method: 'GET' }
    );
    if (!upstream.ok) {
        throw new Error(
            `Upstream EUDI credential-issuer metadata returned ${upstream.status}`
        );
    }
    const json = (await upstream.json()) as Record<string, unknown>;

    json.credential_issuer = EUDI_PROXY_PUBLIC_BASE_URL;
    json.credential_endpoint = `${EUDI_PROXY_PUBLIC_BASE_URL}/credential`;

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(json));
};

/**
 * Fetch the real EUDI authorization-server metadata. Rewrite the
 * `token_endpoint` to point at our proxy (this is the CORS-blocked
 * one). Leave `issuer` and `authorization_endpoint` pointing at
 * real EUDI:
 *   - `issuer`: preserves RFC 9207 `iss` parameter validation on
 *     the auth-code redirect response.
 *   - `authorization_endpoint`: top-level browser navigation, no
 *     CORS involved.
 */
const proxyAuthorizationServerMetadata = async (
    res: ServerResponse
): Promise<void> => {
    const upstream = await fetch(
        `${REAL_ISSUER_BASE}/.well-known/oauth-authorization-server`,
        { method: 'GET' }
    );
    if (!upstream.ok) {
        throw new Error(
            `Upstream EUDI authorization-server metadata returned ${upstream.status}`
        );
    }
    const json = (await upstream.json()) as Record<string, unknown>;

    json.token_endpoint = `${EUDI_PROXY_PUBLIC_BASE_URL}/token`;

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(json));
};

/* -------------------------------------------------------------------------- */
/*                            generic POST proxy                              */
/* -------------------------------------------------------------------------- */

const proxyPost = async (
    req: IncomingMessage,
    res: ServerResponse,
    upstreamUrl: string,
    allowedHeaders: string[]
): Promise<void> => {
    const body = await readRaw(req);

    const headers: Record<string, string> = {};
    for (const name of allowedHeaders) {
        const v = req.headers[name];
        if (typeof v === 'string') headers[name] = v;
    }

    // OID4VCI bodies are always text (form-urlencoded for token, JSON
    // for credential). Forwarding as a UTF-8 string sidesteps a
    // longstanding @types/node \u00d7 lib.dom mismatch where neither
    // Buffer nor Uint8Array satisfies the strict `BodyInit` union.
    const upstream = await fetch(upstreamUrl, {
        method: 'POST',
        headers,
        body: body.toString('utf-8'),
    });

    res.statusCode = upstream.status;

    // Forward content-type so the wallet parses correctly. Skip
    // hop-by-hop and transport-y headers \u2014 those can confuse the
    // wallet (e.g. `transfer-encoding: chunked` reaching a fetch()
    // consumer).
    const upstreamCt = upstream.headers.get('content-type');
    if (upstreamCt) res.setHeader('content-type', upstreamCt);

    const text = await upstream.text();
    res.end(text);
};

/* -------------------------------------------------------------------------- */
/*                                   helpers                                  */
/* -------------------------------------------------------------------------- */

const setCorsHeaders = (req: IncomingMessage, res: ServerResponse): void => {
    const origin = (req.headers.origin as string | undefined) ?? '';
    // Echo any localhost origin back; default to a permissive `*` for
    // non-localhost callers (rare in practice and never sensitive
    // here \u2014 the proxy's only job is to relay public OID4VCI calls).
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        res.setHeader('access-control-allow-origin', origin);
        res.setHeader('vary', 'Origin');
    } else {
        res.setHeader('access-control-allow-origin', '*');
    }
    res.setHeader(
        'access-control-allow-methods',
        'GET, POST, OPTIONS'
    );
    res.setHeader(
        'access-control-allow-headers',
        'content-type, authorization, dpop'
    );
    // Preflight result can be cached for 10 minutes \u2014 keeps the
    // wallet from re-OPTIONS-ing every credential request.
    res.setHeader('access-control-max-age', '600');
};

const readRaw = (req: IncomingMessage): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        req.on('data', (c: Buffer) => chunks.push(c));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
