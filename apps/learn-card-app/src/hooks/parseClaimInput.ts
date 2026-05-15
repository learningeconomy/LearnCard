export type ClaimSurface =
    | 'oid4vci'
    | 'oid4vp'
    | 'vc-api-custom-scheme'
    | 'lcw-https'
    | 'boost-claim'
    | 'connection-request'
    | 'raw-vc'
    | 'interaction';

export type UnrecognizedReason =
    | 'empty'
    | 'malformed_url'
    | 'unknown_scheme'
    | 'invalid_vc'
    | 'unknown_format';

/**
 * The disambiguated meaning of a credential-claim input string. Pure
 * output of `parseClaimInput` — no React, no side effects, no
 * network. The router hook (`useClaimInputRouter`) consumes this and
 * decides what UI side effect to trigger.
 */
export type ParsedClaimInput =
    | { kind: 'oid4vci'; offerUrl: string }
    | { kind: 'oid4vp'; requestUrl: string }
    | { kind: 'vc-api-custom-scheme'; path: string }
    | { kind: 'lcw-https'; path: string }
    | { kind: 'boost-claim'; boostUri: string; challenge: string }
    | { kind: 'interaction-url'; url: string }
    | { kind: 'connection-request'; did: string; profileId: string }
    | { kind: 'raw-vc-candidate'; raw: string; parsed: unknown }
    | { kind: 'unrecognized'; reason: UnrecognizedReason };

/**
 * Tenant-aware overrides for which custom URL schemes and HTTPS
 * hostnames the wallet recognizes. Sourced from the tenant config so
 * each LearnCard-derived app (LearnCard, VetPass, ScoutPass, …)
 * routes its own deep links without forking the parser.
 *
 * Both lists are normalized: schemes are matched case-insensitively;
 * hosts may be supplied as bare hostnames (`learncard.app`) OR full
 * origins (`https://learncard.app`) and we'll handle either form.
 */
export interface ParseClaimInputConfig {
    customSchemes?: string[];
    httpsDomains?: string[];
}

/**
 * Last-resort defaults when no tenant config is plumbed in. These
 * mirror `DEFAULT_LEARNCARD_TENANT_CONFIG.native.{customSchemes,
 * deepLinkDomains}` so the parser-only fallback path (early bootstrap,
 * unit tests, any code that forgets to thread `ParseClaimInputConfig`)
 * doesn't silently disagree with the canonical config.
 *
 * Production code always resolves tenant config explicitly via
 * `resolveTenantParseConfig()`; these constants are the safety net,
 * not the source of truth — the canonical source for native build
 * artifacts AND runtime parsing is `tenantDefaults.ts`. If you change
 * one, change the other.
 *
 * `openid-credential-offer` and `openid4vp` are intentionally OMITTED
 * from `DEFAULT_CUSTOM_SCHEMES` because they're short-circuited at
 * lines ~145 below into dedicated `oid4vci` / `oid4vp` discriminants
 * before the custom-scheme list is consulted. They live in
 * `tenantDefaults.customSchemes` only for build-time OS scheme
 * registration; see the comment over there.
 */
export const DEFAULT_CUSTOM_SCHEMES = ['dccrequest', 'msprequest', 'asuprequest'];
export const DEFAULT_HTTPS_DOMAINS = [
    'learncard.app',
    'learncardapp.netlify.app',
    'learncardapp.netlify.com',
    'lcw.app',
];

export const normalizeClaimInputHost = (host: string): string => {
    try {
        return new URL(host.includes('://') ? host : `https://${host}`).host.toLowerCase();
    } catch {
        return host.toLowerCase();
    }
};

/**
 * Returns true if `url` resolves to one of the recognized tenant
 * HTTPS hostnames (per `parseClaimInput`'s config / defaults).
 * Exported so AppUrlListener can restore its legacy "trust the
 * tenant domain, push the URL as-is" behavior for query-classified
 * kinds that the parser would otherwise hide as `boost-claim` etc.
 */
export const isTenantHttpsUrl = (
    url: string,
    config: ParseClaimInputConfig = {}
): boolean => {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return false;
    }
    if (parsed.protocol !== 'https:') return false;
    const hostnames = (config.httpsDomains ?? DEFAULT_HTTPS_DOMAINS).map(normalizeClaimInputHost);
    return hostnames.includes(parsed.host.toLowerCase());
};

/**
 * Pure disambiguator: any string in → discriminated kind out.
 *
 * Mirrors the format detection that lived inside
 * `QRCodeScannerListener.handleScan` so the camera scanner, paste
 * field, and uploaded-QR-image path all share the same routing
 * truth. Order of checks matters and is tested:
 *
 *  1. Custom-scheme URLs (`openid-credential-offer://`,
 *     `openid4vp://`, `dccrequest://`, …) — matched first because
 *     they're unambiguous.
 *  2. HTTPS URLs whose query string declares a boost claim
 *     (`?boostUri=&challenge=`), interaction (`?iuv=1`), or
 *     connection request (`?did=did:web:…:users:<id>`).
 *  3. HTTPS URLs to known LCW domains.
 *  4. JSON-shaped strings — checked last so a raw VC pasted in works.
 *
 * Empty / whitespace-only input returns `{ kind: 'unrecognized',
 * reason: 'empty' }` so callers can disable a Continue button.
 */
export const parseClaimInput = (
    input: string,
    config: ParseClaimInputConfig = {}
): ParsedClaimInput => {
    const trimmed = input.trim();
    if (!trimmed) return { kind: 'unrecognized', reason: 'empty' };

    const customSchemes = (config.customSchemes ?? DEFAULT_CUSTOM_SCHEMES).map(s =>
        s.toLowerCase()
    );
    const httpsHostnames = (config.httpsDomains ?? DEFAULT_HTTPS_DOMAINS).map(normalizeClaimInputHost);

    let parsedUrl: URL | null = null;
    try {
        parsedUrl = new URL(trimmed);
    } catch {
        parsedUrl = null;
    }

    if (!parsedUrl && /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
        return { kind: 'unrecognized', reason: 'malformed_url' };
    }

    if (parsedUrl) {
        const scheme = parsedUrl.protocol.replace(':', '').toLowerCase();

        if (scheme === 'openid-credential-offer') {
            return { kind: 'oid4vci', offerUrl: trimmed };
        }
        if (scheme === 'openid4vp') {
            return { kind: 'oid4vp', requestUrl: trimmed };
        }

        if (customSchemes.includes(scheme)) {
            const tail = (parsedUrl.pathname || '') + parsedUrl.search + parsedUrl.hash;
            const path = parsedUrl.pathname ? tail : `/request${tail}`;
            return { kind: 'vc-api-custom-scheme', path };
        }

        const queryClassification = classifyQueryParams(parsedUrl.searchParams, trimmed);
        if (queryClassification) return queryClassification;

        if (httpsHostnames.includes(parsedUrl.host.toLowerCase())) {
            const pathname = parsedUrl.pathname || '/';
            const hasMeaningfulPath =
                pathname !== '/' || Boolean(parsedUrl.search) || Boolean(parsedUrl.hash);
            if (!hasMeaningfulPath) {
                return { kind: 'unrecognized', reason: 'unknown_format' };
            }
            return { kind: 'lcw-https', path: pathname + parsedUrl.search + parsedUrl.hash };
        }

        return { kind: 'unrecognized', reason: 'unknown_scheme' };
    }

    const bareQueryClassification = classifyBareQueryString(trimmed);
    if (bareQueryClassification) return bareQueryClassification;

    const vcJsonMatch = parseAsVcCandidate(trimmed);
    if (vcJsonMatch) {
        return { kind: 'raw-vc-candidate', raw: trimmed, parsed: vcJsonMatch };
    }

    return { kind: 'unrecognized', reason: 'unknown_format' };
};

const classifyQueryParams = (
    query: URLSearchParams,
    fullInput: string
): ParsedClaimInput | null => {
    const boostUri = query.get('boostUri');
    const challenge = query.get('challenge');
    if (boostUri && challenge) {
        return { kind: 'boost-claim', boostUri, challenge };
    }

    if (query.get('iuv') === '1') {
        return { kind: 'interaction-url', url: fullInput };
    }

    const userDid = query.get('did') ?? '';
    if (userDid.includes('did:web')) {
        const profileId = userDid.match(/(users:)(.*)/)?.[2];
        if (profileId) return { kind: 'connection-request', did: userDid, profileId };
    }

    return null;
};

const classifyBareQueryString = (input: string): ParsedClaimInput | null => {
    const questionIndex = input.indexOf('?');
    const queryString = questionIndex !== -1 ? input.substring(questionIndex) : input;
    try {
        const query = new URLSearchParams(queryString);
        return classifyQueryParams(query, input);
    } catch {
        return null;
    }
};

const parseAsVcCandidate = (input: string): unknown | null => {
    const head = input[0];
    if (head !== '{' && head !== '[') return null;
    try {
        const parsed: unknown = JSON.parse(input);
        if (!parsed || typeof parsed !== 'object') return null;
        const obj = parsed as Record<string, unknown>;
        const hasContext = Boolean(obj['@context']);
        const type = obj.type;
        const hasVcType =
            (typeof type === 'string' && type.includes('VerifiableCredential')) ||
            (Array.isArray(type) && type.includes('VerifiableCredential'));
        return hasContext && hasVcType ? parsed : null;
    } catch {
        return null;
    }
};
