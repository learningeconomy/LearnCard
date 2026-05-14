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
    | { kind: 'raw-vc-candidate'; raw: string }
    | { kind: 'unrecognized'; reason: UnrecognizedReason };

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
export const parseClaimInput = (input: string): ParsedClaimInput => {
    const trimmed = input.trim();
    if (!trimmed) return { kind: 'unrecognized', reason: 'empty' };

    let parsedUrl: URL | null = null;
    try {
        parsedUrl = new URL(trimmed);
    } catch {
        parsedUrl = null;
    }

    if (parsedUrl) {
        const scheme = parsedUrl.protocol.replace(':', '').toLowerCase();

        if (scheme === 'openid-credential-offer') {
            return { kind: 'oid4vci', offerUrl: trimmed };
        }
        if (scheme === 'openid4vp') {
            return { kind: 'oid4vp', requestUrl: trimmed };
        }

        const CUSTOM_VC_API_SCHEMES = ['dccrequest', 'msprequest', 'asuprequest'];
        if (CUSTOM_VC_API_SCHEMES.includes(scheme)) {
            const tail = (parsedUrl.pathname || '') + parsedUrl.search + parsedUrl.hash;
            const path = parsedUrl.pathname ? tail : `/request${tail}`;
            return { kind: 'vc-api-custom-scheme', path };
        }

        const queryClassification = classifyQueryParams(parsedUrl.searchParams, trimmed);
        if (queryClassification) return queryClassification;

        const LCW_HTTPS_ORIGINS = ['https://lcw.app'];
        if (LCW_HTTPS_ORIGINS.includes(parsedUrl.origin)) {
            const path = parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
            return { kind: 'lcw-https', path };
        }

        return { kind: 'unrecognized', reason: 'unknown_scheme' };
    }

    const bareQueryClassification = classifyBareQueryString(trimmed);
    if (bareQueryClassification) return bareQueryClassification;

    if (looksLikeVcJson(trimmed)) {
        return { kind: 'raw-vc-candidate', raw: trimmed };
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

const looksLikeVcJson = (input: string): boolean => {
    const head = input.trimStart()[0];
    if (head !== '{' && head !== '[') return false;
    try {
        const parsed = JSON.parse(input);
        if (!parsed || typeof parsed !== 'object') return false;
        const ctx = (parsed as Record<string, unknown>)['@context'];
        const type = (parsed as Record<string, unknown>).type;
        const hasContext = Boolean(ctx);
        const hasVcType =
            (typeof type === 'string' && type.includes('VerifiableCredential')) ||
            (Array.isArray(type) && type.includes('VerifiableCredential'));
        return hasContext && hasVcType;
    } catch {
        return false;
    }
};
