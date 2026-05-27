import {
    AuthorizationServerMetadata,
    CredentialIssuerMetadata,
} from './types';
import { VciError } from './errors';

const ISSUER_WELL_KNOWN = '/.well-known/openid-credential-issuer';
const OAUTH_AS_WELL_KNOWN = '/.well-known/oauth-authorization-server';
const OIDC_WELL_KNOWN = '/.well-known/openid-configuration';

/**
 * Fetch and validate the Credential Issuer Metadata for a given issuer URL.
 *
 * @throws {VciError} with code `metadata_fetch_failed` for network / HTTP
 *   errors, `metadata_invalid` for shape issues, and `metadata_issuer_mismatch`
 *   when the returned `credential_issuer` doesn't match the requested one.
 */
export const fetchCredentialIssuerMetadata = async (
    credentialIssuer: string,
    fetchImpl: typeof fetch = globalThis.fetch
): Promise<CredentialIssuerMetadata> => {
    if (typeof fetchImpl !== 'function') {
        throw new VciError(
            'metadata_fetch_failed',
            'No fetch implementation available for issuer metadata'
        );
    }

    const url = joinWellKnown(credentialIssuer, ISSUER_WELL_KNOWN);

    const json = await getJson(url, fetchImpl, 'metadata_fetch_failed');

    if (!isObject(json)) {
        throw new VciError('metadata_invalid', 'Issuer metadata response was not a JSON object', {
            body: json,
        });
    }

    if (typeof json.credential_issuer !== 'string' || json.credential_issuer.length === 0) {
        throw new VciError(
            'metadata_invalid',
            'Issuer metadata is missing `credential_issuer`',
            { body: json }
        );
    }

    if (typeof json.credential_endpoint !== 'string' || json.credential_endpoint.length === 0) {
        throw new VciError(
            'metadata_invalid',
            'Issuer metadata is missing `credential_endpoint`',
            { body: json }
        );
    }

    if (!originsMatch(json.credential_issuer, credentialIssuer)) {
        throw new VciError(
            'metadata_issuer_mismatch',
            `Issuer metadata advertises \`credential_issuer\` as ${json.credential_issuer} but was fetched for ${credentialIssuer}`,
            { body: json }
        );
    }

    return json as CredentialIssuerMetadata;
};

/**
 * Fetch and validate Authorization Server metadata. Tries the
 * OAuth 2.0 well-known path first and falls back to the OpenID Connect one.
 */
export const fetchAuthorizationServerMetadata = async (
    authServer: string,
    fetchImpl: typeof fetch = globalThis.fetch
): Promise<AuthorizationServerMetadata> => {
    if (typeof fetchImpl !== 'function') {
        throw new VciError(
            'metadata_fetch_failed',
            'No fetch implementation available for authorization-server metadata'
        );
    }

    const oauthUrl = joinWellKnown(authServer, OAUTH_AS_WELL_KNOWN);

    const tryUrl = async (url: string): Promise<unknown | null> => {
        let response: Response;

        try {
            response = await fetchImpl(url, { method: 'GET' });
        } catch {
            return null;
        }

        if (!response.ok) return null;

        try {
            return await response.json();
        } catch {
            return null;
        }
    };

    let json = await tryUrl(oauthUrl);

    if (json == null) {
        const oidcUrl = joinWellKnown(authServer, OIDC_WELL_KNOWN);
        json = await tryUrl(oidcUrl);
    }

    if (json == null) {
        throw new VciError(
            'metadata_fetch_failed',
            `Authorization server metadata not reachable at ${oauthUrl} or the OIDC fallback`
        );
    }

    if (!isObject(json)) {
        throw new VciError(
            'metadata_invalid',
            'Authorization server metadata was not a JSON object',
            { body: json }
        );
    }

    if (typeof json.token_endpoint !== 'string' || json.token_endpoint.length === 0) {
        throw new VciError(
            'metadata_invalid',
            'Authorization server metadata is missing `token_endpoint`',
            { body: json }
        );
    }

    return json as AuthorizationServerMetadata;
};

/**
 * Resolve the authorization server metadata that should be used for a given
 * credential offer / issuer metadata pair.
 *
 * Preference order:
 * 1. `authorization_server` explicitly named on the pre-authorized grant.
 * 2. First entry of `issuerMetadata.authorization_servers`.
 * 3. The issuer itself (many small deployments are their own AS).
 */
export const resolveAuthorizationServer = (
    issuerMetadata: CredentialIssuerMetadata,
    grantAuthServer?: string
): string => {
    if (grantAuthServer && grantAuthServer.length > 0) return grantAuthServer;

    if (
        Array.isArray(issuerMetadata.authorization_servers) &&
        issuerMetadata.authorization_servers.length > 0 &&
        typeof issuerMetadata.authorization_servers[0] === 'string'
    ) {
        return issuerMetadata.authorization_servers[0];
    }

    return issuerMetadata.credential_issuer;
};

// ---------- helpers ----------

const joinWellKnown = (base: string, path: string): string => {
    // Strip any trailing slashes from the base, then append the well-known path.
    // Implemented as a loop rather than `base.replace(/\/+$/, '')` to silence
    // CodeQL's polynomial-ReDoS heuristic (the regex is linear, but static
    // analyzers flag any `+` quantifier on network-sourced input).
    let end = base.length;
    while (end > 0 && base.charCodeAt(end - 1) === 0x2f /* '/' */) end--;
    return `${base.slice(0, end)}${path}`;
};

const originsMatch = (a: string, b: string): boolean => {
    // Compare canonicalized forms — strip trailing slashes and lower-case
    // the scheme. Host is compared case-sensitively and the path (if any)
    // is preserved, matching the previous regex-based normalizer.
    return normalizeIssuerId(a) === normalizeIssuerId(b);
};

const normalizeIssuerId = (s: string): string => {
    // 1. Trim trailing slashes (character-wise loop — linear, no regex).
    let end = s.length;
    while (end > 0 && s.charCodeAt(end - 1) === 0x2f /* '/' */) end--;
    const trimmed = s.slice(0, end);

    // 2. Lower-case the scheme if present. A URL scheme is
    //    `<scheme>://`, where `<scheme>` is ASCII letters only and
    //    terminates at the first `://`. We split on the literal `://`
    //    rather than a regex to keep the analysis straightforwardly
    //    linear.
    const schemeEnd = trimmed.indexOf('://');
    if (schemeEnd <= 0) return trimmed;

    const scheme = trimmed.slice(0, schemeEnd);
    if (!isAsciiAlpha(scheme)) return trimmed;

    return `${scheme.toLowerCase()}${trimmed.slice(schemeEnd)}`;
};

const isAsciiAlpha = (s: string): boolean => {
    if (s.length === 0) return false;
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        const isUpper = c >= 0x41 && c <= 0x5a;
        const isLower = c >= 0x61 && c <= 0x7a;
        if (!isUpper && !isLower) return false;
    }
    return true;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const getJson = async (
    url: string,
    fetchImpl: typeof fetch,
    failCode: 'metadata_fetch_failed'
): Promise<unknown> => {
    let response: Response;

    try {
        response = await fetchImpl(url, { method: 'GET' });
    } catch (e) {
        throw new VciError(
            failCode,
            `Failed to fetch ${url}: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    if (!response.ok) {
        throw new VciError(failCode, `Fetch of ${url} returned ${response.status} ${response.statusText}`, {
            status: response.status,
        });
    }

    try {
        return await response.json();
    } catch (e) {
        throw new VciError(failCode, `Response from ${url} was not valid JSON`, { cause: e });
    }
};
