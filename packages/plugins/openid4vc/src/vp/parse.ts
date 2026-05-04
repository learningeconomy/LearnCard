import {
    AuthorizationRequest,
    ParsedAuthorizationRequest,
    PresentationDefinition,
    VpError,
} from './types';
import {
    verifyAndDecodeRequestObject,
    DidResolver,
} from './request-object';
import { deriveClientIdPrefix } from './client-id-prefix';
import { parseDcqlQuery } from '../dcql/parse';
import type { DcqlQuery } from '../dcql/types';

/**
 * Parse an OpenID4VP Authorization Request URI without hitting the network.
 *
 * Accepts every shape wallets see in the wild:
 * - `openid4vp://?client_id=...&presentation_definition=...`
 * - `haip://?client_id=...` (EUDI-flavored deeplinks)
 * - `openid-vc://?client_id=...` (Draft 11/13 legacy scheme)
 * - `https://verifier.example/authorize?client_id=...` (web flow)
 * - Signed Request Objects via `request=<JWS>` or `request_uri=<https url>`
 *   — both are returned as a `by_reference_*` variant for Slice 7 to
 *   verify + decode.
 *
 * When the request arrives with a signed Request Object, every other
 * parameter in the URI is spec-mandated to be ignored in favor of the
 * JWS claims, so we punt immediately without validating them here.
 */
export const parseAuthorizationRequestUri = (
    input: string
): ParsedAuthorizationRequest => {
    if (typeof input !== 'string' || input.trim().length === 0) {
        throw new VpError(
            'invalid_uri',
            'Authorization Request URI must be a non-empty string'
        );
    }

    const params = extractSearchParams(input);

    // Signed Request Object paths — Slice 7 surface. We keep the raw
    // params so the resolver in Slice 7 can still access things like
    // `client_id` for pre-verification metadata lookups if needed.
    const requestUri = params.get('request_uri');
    if (typeof requestUri === 'string' && requestUri.length > 0) {
        if (!isHttpsUrl(requestUri)) {
            throw new VpError(
                'invalid_uri',
                'request_uri must be an absolute https:// URL'
            );
        }

        return { kind: 'by_reference_request_uri', requestUri, rawParams: params };
    }

    const requestJwt = params.get('request');
    if (typeof requestJwt === 'string' && requestJwt.length > 0) {
        return { kind: 'by_reference_request_jwt', jwt: requestJwt, rawParams: params };
    }

    return { kind: 'by_value', request: buildRequestFromParams(params) };
};

/**
 * Fetch a `presentation_definition_uri` and parse it as a DIF PEX v2
 * Presentation Definition. Caller is responsible for validating the
 * returned shape against their own trust policy (allow-listed hosts,
 * size limits, etc.).
 */
export const resolvePresentationDefinitionByReference = async (
    uri: string,
    fetchImpl: typeof fetch = globalThis.fetch
): Promise<PresentationDefinition> => {
    if (typeof fetchImpl !== 'function') {
        throw new VpError(
            'presentation_definition_fetch_failed',
            'No fetch implementation available to resolve presentation_definition_uri'
        );
    }

    if (!isHttpsUrl(uri)) {
        throw new VpError(
            'invalid_uri',
            'presentation_definition_uri must be an absolute https:// URL'
        );
    }

    let response: Response;

    try {
        response = await fetchImpl(uri, { method: 'GET' });
    } catch (e) {
        throw new VpError(
            'presentation_definition_fetch_failed',
            `Failed to fetch presentation_definition_uri: ${describe(e)}`,
            { cause: e }
        );
    }

    if (!response.ok) {
        throw new VpError(
            'presentation_definition_fetch_failed',
            `presentation_definition_uri returned ${response.status} ${response.statusText}`
        );
    }

    let json: unknown;

    try {
        json = await response.json();
    } catch (e) {
        throw new VpError(
            'invalid_json',
            'presentation_definition_uri response was not valid JSON',
            { cause: e }
        );
    }

    return validatePresentationDefinition(json);
};

/**
 * Options consumed by {@link resolveAuthorizationRequest} for signed
 * Request Object verification (Slice 7.5). The caller (typically the
 * plugin) wires DID resolver + X.509 roots from plugin config.
 */
export interface ResolveAuthorizationRequestOptions {
    /** DID resolver for `client_id_scheme=did`. Defaults to built-in did:jwk + did:web. */
    didResolver?: DidResolver;
    /** Trust anchors for `client_id_scheme=x509_san_dns`. PEM-encoded. */
    trustedX509Roots?: readonly string[];
    /** **Dev-only.** Accept x509 chains without a trusted root. */
    unsafeAllowSelfSigned?: boolean;
    /**
     * **Dev-only escape hatch.** Skip JWS signature verification on
     * the Request Object entirely (still parses claims). For
     * interop testing against verifiers whose signing keys are
     * pre-shared out-of-band — production wallets MUST leave this
     * off. See `request-object.ts` for the full warning.
     */
    unsafeSkipRequestObjectSignatureVerification?: boolean;
}

/**
 * End-to-end: parse the URI, resolve signed Request Objects (per
 * Slice 7.5), and inline `presentation_definition_uri` if needed, so
 * the caller gets a single fully-resolved {@link AuthorizationRequest}.
 *
 * Signed Request Objects are verified according to their
 * `client_id_scheme` (`did`, `x509_san_dns`). Schemes we don't support
 * — or a `redirect_uri` scheme that illegitimately carries a signed
 * Request Object — bubble up as {@link RequestObjectError} with a
 * typed code.
 */
export const resolveAuthorizationRequest = async (
    input: string,
    fetchImpl: typeof fetch = globalThis.fetch,
    options: ResolveAuthorizationRequestOptions = {}
): Promise<AuthorizationRequest> => {
    const parsed = parseAuthorizationRequestUri(input);

    let request: AuthorizationRequest;

    if (parsed.kind === 'by_value') {
        request = parsed.request;
    } else {
        const urlClientId = parsed.rawParams.get('client_id') ?? undefined;
        const urlClientIdScheme =
            parsed.rawParams.get('client_id_scheme') ?? undefined;

        request = await verifyAndDecodeRequestObject({
            requestUri:
                parsed.kind === 'by_reference_request_uri'
                    ? parsed.requestUri
                    : undefined,
            inlineJwt:
                parsed.kind === 'by_reference_request_jwt' ? parsed.jwt : undefined,
            urlClientId,
            urlClientIdScheme,
            fetchImpl,
            didResolver: options.didResolver,
            trustedX509Roots: options.trustedX509Roots,
            unsafeAllowSelfSigned: options.unsafeAllowSelfSigned,
            unsafeSkipRequestObjectSignatureVerification:
                options.unsafeSkipRequestObjectSignatureVerification,
        });
    }

    // Inline PD wins; otherwise try to resolve by reference.
    if (request.presentation_definition) return request;

    if (request.presentation_definition_uri) {
        const pd = await resolvePresentationDefinitionByReference(
            request.presentation_definition_uri,
            fetchImpl
        );

        return { ...request, presentation_definition: pd };
    }

    return request;
};

/* -------------------------------------------------------------------------- */
/*                                  internals                                 */
/* -------------------------------------------------------------------------- */

/**
 * Mirror of {@link ../offer/parse.ts:extractSearchParams} — accepts the
 * same variety of shapes (scheme://?..., scheme:?..., https://.../?...,
 * bare `?...`, bare `key=value`).
 */
const extractSearchParams = (input: string): URLSearchParams => {
    const queryStart = input.indexOf('?');

    if (queryStart !== -1) {
        return new URLSearchParams(input.slice(queryStart + 1));
    }

    if (input.includes('://') || /^[a-z][a-z0-9+.-]*:/i.test(input)) {
        throw new VpError('invalid_uri', 'Authorization Request URI has no query string');
    }

    if (input.includes('=')) {
        return new URLSearchParams(input);
    }

    throw new VpError('invalid_uri', 'Authorization Request URI has no query string');
};

/**
 * Pull params out of the URL and validate the by-value shape. Throws
 * {@link VpError} on any required-field violation.
 */
const buildRequestFromParams = (params: URLSearchParams): AuthorizationRequest => {
    const clientId = params.get('client_id');
    if (!clientId) {
        throw new VpError('missing_client_id', 'Authorization Request is missing client_id');
    }

    const nonce = params.get('nonce');
    if (!nonce) {
        throw new VpError('missing_nonce', 'Authorization Request is missing nonce');
    }

    const responseType = params.get('response_type');
    if (!responseType) {
        throw new VpError(
            'missing_response_type',
            'Authorization Request is missing response_type'
        );
    }

    const responseTypes = responseType.split(/\s+/).filter(Boolean);
    // Slice 6 supports vp_token (optionally combined with id_token for
    // SIOPv2). Plain `code` is the OID4VCI auth flow — wrong surface.
    const knownResponseTypes = new Set(['vp_token', 'id_token']);
    if (!responseTypes.some(t => knownResponseTypes.has(t))) {
        throw new VpError(
            'unsupported_response_type',
            `Authorization Request response_type \"${responseType}\" is not supported (expected vp_token and/or id_token)`
        );
    }

    const responseUri = params.get('response_uri') ?? undefined;
    const redirectUri = params.get('redirect_uri') ?? undefined;
    const responseMode = params.get('response_mode') ?? undefined;

    // For direct_post modes, at least one response target is required.
    // Fragment/query modes reuse `redirect_uri`. When response_mode is
    // absent we still require a target — every real verifier ships one.
    if (!responseUri && !redirectUri) {
        throw new VpError(
            'missing_response_target',
            'Authorization Request is missing both response_uri and redirect_uri'
        );
    }

    const presentationDefinitionRaw = params.get('presentation_definition');
    const presentationDefinitionUri = params.get('presentation_definition_uri');
    const dcqlQueryRaw = params.get('dcql_query');

    if (presentationDefinitionRaw && presentationDefinitionUri) {
        throw new VpError(
            'both_definition_and_uri',
            'Authorization Request has both presentation_definition and presentation_definition_uri'
        );
    }

    // OID4VP 1.0 §5.3: PEX and DCQL are mutually exclusive. Catching this
    // here (rather than letting downstream selectors race) means we can
    // surface a precise error before either parser runs.
    if (dcqlQueryRaw && (presentationDefinitionRaw || presentationDefinitionUri)) {
        throw new VpError(
            'both_pex_and_dcql',
            'Authorization Request carries both PEX (presentation_definition[_uri]) and DCQL (dcql_query); OID4VP 1.0 §5.3 forbids this'
        );
    }

    let presentationDefinition: PresentationDefinition | undefined;
    if (presentationDefinitionRaw) {
        let parsed: unknown;
        try {
            parsed = JSON.parse(presentationDefinitionRaw);
        } catch (e) {
            throw new VpError(
                'invalid_json',
                'presentation_definition query parameter was not valid JSON',
                { cause: e }
            );
        }
        presentationDefinition = validatePresentationDefinition(parsed);
    }

    let dcqlQuery: DcqlQuery | undefined;
    if (dcqlQueryRaw) {
        let parsed: unknown;
        try {
            parsed = JSON.parse(dcqlQueryRaw);
        } catch (e) {
            throw new VpError(
                'invalid_json',
                'dcql_query query parameter was not valid JSON',
                { cause: e }
            );
        }
        dcqlQuery = parseDcqlQuery(parsed);
    }

    // `scope` (SIOPv2) lets verifiers reference pre-registered PDs by
    // name. We accept it without a PD present — the wallet UI / Slice 8
    // resolves scopes server-side. Outside of that escape hatch, a PD
    // (inline or by reference) OR a DCQL query is required for a
    // vp_token flow.
    const scope = params.get('scope') ?? undefined;
    const hasVpToken = responseTypes.includes('vp_token');

    if (
        hasVpToken &&
        !presentationDefinition &&
        !presentationDefinitionUri &&
        !dcqlQuery &&
        !scope
    ) {
        throw new VpError(
            'missing_presentation_definition',
            'Authorization Request has none of presentation_definition, presentation_definition_uri, dcql_query, or scope'
        );
    }

    const clientMetadataRaw = params.get('client_metadata');
    let clientMetadata: Record<string, unknown> | undefined;
    if (clientMetadataRaw) {
        try {
            const parsed = JSON.parse(clientMetadataRaw);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                clientMetadata = parsed as Record<string, unknown>;
            } else {
                throw new VpError(
                    'invalid_json',
                    'client_metadata query parameter must be a JSON object'
                );
            }
        } catch (e) {
            if (e instanceof VpError) throw e;
            throw new VpError(
                'invalid_json',
                'client_metadata query parameter was not valid JSON',
                { cause: e }
            );
        }
    }

    // Preserve unknown params so the caller can echo them into the
    // direct_post response (state-like extensions, custom claims, etc.).
    const known = new Set([
        'client_id',
        'client_id_scheme',
        'response_type',
        'response_mode',
        'response_uri',
        'redirect_uri',
        'nonce',
        'state',
        'presentation_definition',
        'presentation_definition_uri',
        'dcql_query',
        'client_metadata',
        'client_metadata_uri',
        'scope',
    ]);

    const extra: Record<string, string> = {};
    params.forEach((value, key) => {
        if (!known.has(key)) extra[key] = value;
    });

    // Derive the OID4VP 1.0 client-id prefix from the URL params.
    // The wire forms we accept are the same as the JAR verifier:
    //   - explicit `<prefix>:<value>` inline in `client_id`
    //   - implicit DID URI / https URL forms
    //   - draft-22 legacy `client_id_scheme` URL parameter
    //
    // Surfacing the derived prefix here (rather than echoing whatever
    // `client_id_scheme=` happens to be in the URL) keeps URI-mode
    // and Request-Object-mode aligned: plugin code downstream can
    // rely on `client_id_scheme` being a normalized prefix in both
    // paths, regardless of which encoding the verifier picked.
    const { prefix: derivedPrefix } = deriveClientIdPrefix(
        clientId,
        params.get('client_id_scheme') ?? undefined
    );

    return {
        client_id: clientId,
        client_id_scheme: derivedPrefix,
        response_type: responseType,
        response_mode: responseMode,
        response_uri: responseUri,
        redirect_uri: redirectUri,
        nonce,
        state: params.get('state') ?? undefined,
        presentation_definition: presentationDefinition,
        presentation_definition_uri: presentationDefinitionUri ?? undefined,
        dcql_query: dcqlQuery,
        client_metadata: clientMetadata,
        client_metadata_uri: params.get('client_metadata_uri') ?? undefined,
        scope,
        ...(Object.keys(extra).length > 0 ? { extra } : {}),
    };
};

/**
 * Minimal structural validation of a Presentation Definition — enough
 * to catch malformed payloads at the door, without rejecting valid
 * DIF PEX v2 documents we haven't explicitly modeled.
 */
const validatePresentationDefinition = (raw: unknown): PresentationDefinition => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new VpError(
            'invalid_presentation_definition',
            'presentation_definition must be a JSON object'
        );
    }

    const pd = raw as Record<string, unknown>;

    if (typeof pd.id !== 'string' || pd.id.length === 0) {
        throw new VpError(
            'invalid_presentation_definition',
            'presentation_definition is missing a string `id`'
        );
    }

    if (!Array.isArray(pd.input_descriptors) || pd.input_descriptors.length === 0) {
        throw new VpError(
            'invalid_presentation_definition',
            'presentation_definition must declare a non-empty input_descriptors array'
        );
    }

    for (const [i, descriptor] of pd.input_descriptors.entries()) {
        if (!descriptor || typeof descriptor !== 'object') {
            throw new VpError(
                'invalid_presentation_definition',
                `input_descriptors[${i}] must be an object`
            );
        }

        const d = descriptor as Record<string, unknown>;

        if (typeof d.id !== 'string' || d.id.length === 0) {
            throw new VpError(
                'invalid_presentation_definition',
                `input_descriptors[${i}].id must be a non-empty string`
            );
        }

        if (!d.constraints || typeof d.constraints !== 'object') {
            throw new VpError(
                'invalid_presentation_definition',
                `input_descriptors[${i}].constraints must be an object`
            );
        }
    }

    return pd as unknown as PresentationDefinition;
};

const isHttpsUrl = (value: string): boolean => {
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:';
    } catch {
        return false;
    }
};

const describe = (e: unknown): string => (e instanceof Error ? e.message : String(e));
