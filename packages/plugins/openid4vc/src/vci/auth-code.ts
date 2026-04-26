/**
 * Slice 4 — **OID4VCI authorization_code flow**.
 *
 * The authorization code grant is the second issuance path in
 * OID4VCI Draft 13 (§5 / §6.1). Unlike `pre-authorized_code`, it
 * requires a user-agent redirect to the authorization server, where
 * the user consents, and then a callback back to the wallet with a
 * one-time `code`. PKCE (Slice 4's companion module
 * {@link ./pkce.ts}) protects the exchange.
 *
 * Because the plugin runs headless — it cannot itself launch a
 * browser — we split the flow into two halves:
 *
 *   1. **begin** — resolve issuer + AS metadata, generate PKCE, build
 *      the authorization URL, return it along with the opaque
 *      `flowHandle` the wallet persists until the redirect fires.
 *   2. **complete** — take the `code` that arrived on the redirect
 *      plus the stored `flowHandle`, exchange for an access token,
 *      then run the normal `/credential` request + proof-of-possession
 *      to get the actual VC.
 *
 * The plugin's public API (`beginCredentialOfferAuthCode` /
 * `completeCredentialOfferAuthCode`) wraps these with LearnCard
 * session plumbing.
 */
import { CredentialOffer } from '../offer/types';
import {
    fetchAuthorizationServerMetadata,
    fetchCredentialIssuerMetadata,
    resolveAuthorizationServer,
} from './metadata';
import {
    generatePkcePair,
    PkcePair,
} from './pkce';
import { buildProofJwt } from './proof';
import { requestCredential } from './request';
import {
    AcceptedCredentialResult,
    AuthorizationServerMetadata,
    CredentialIssuerMetadata,
    OAuthErrorBody,
    ProofJwtSigner,
    TokenResponse,
} from './types';
import { VciError } from './errors';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/** Grant-type URN used for the authorization_code flow on /token. */
export const AUTHORIZATION_CODE_GRANT = 'authorization_code';

export interface BeginAuthCodeFlowOptions {
    offer: CredentialOffer;

    /**
     * URL the wallet wants the AS to redirect back to after user
     * consent. Must match whatever the wallet registered with the
     * AS out-of-band (or, for clients using an ephemeral redirect
     * like `http://127.0.0.1:<random>/cb`, whatever the wallet spins
     * up at runtime).
     */
    redirectUri: string;

    /** OAuth 2.0 client identifier. Required for auth_code flows. */
    clientId: string;

    /**
     * Subset of `credential_configuration_ids` from the offer to
     * actually request. Defaults to all of them. Validated before
     * the network hits the AS so typos don't cost a real `code` round
     * trip.
     */
    configurationIds?: string[];

    /**
     * OAuth 2.0 `scope`. Optional — the plugin prefers
     * `authorization_details` (Draft 13 §5.1.1) when it can. Pass
     * `scope` if the AS mandates it.
     */
    scope?: string;

    /** Override fetch — defaults to `globalThis.fetch`. */
    fetchImpl?: typeof fetch;
}

/**
 * Result of `begin`. The wallet:
 *   - Opens `authorizationUrl` in a user-agent.
 *   - Persists `flowHandle` until the redirect delivers a `code`.
 *   - Calls `complete` with the received `code` + the stored handle.
 */
export interface BeginAuthCodeFlowResult {
    authorizationUrl: string;

    /**
     * Opaque handle — JSON-serializable so the wallet can round-trip
     * it through storage / postMessage / deep-link state. Carries
     * everything `complete` needs: PKCE verifier, AS token endpoint,
     * issuer metadata pointers, expected state.
     */
    flowHandle: AuthCodeFlowHandle;
}

export interface AuthCodeFlowHandle {
    version: 1;
    issuer: string;
    tokenEndpoint: string;
    credentialEndpoint: string;
    configurationIds: string[];
    redirectUri: string;
    clientId: string;
    state: string;
    pkceVerifier: string;
    pkceMethod: 'S256';
    // Minimal issuer-metadata echo so `complete` can pick the right
    // credential_definition without a second metadata fetch.
    credentialConfigurations: Record<string, unknown>;
}

export interface CompleteAuthCodeFlowOptions {
    flowHandle: AuthCodeFlowHandle;

    /** Code delivered on the redirect callback. */
    code: string;

    /** State delivered on the redirect callback — must match the handle. */
    state?: string;

    /**
     * Holder signer for the proof-of-possession JWT. Plugin wires
     * its Ed25519 default; HSM-backed hosts inject their own.
     */
    signer: ProofJwtSigner;

    fetchImpl?: typeof fetch;
}

/* -------------------------------------------------------------------------- */
/*                              begin the flow                                */
/* -------------------------------------------------------------------------- */

/**
 * Phase 1 of the auth_code flow. Pure preparation — the only network
 * hits are metadata lookups; no codes are exchanged yet.
 */
export const beginAuthCodeFlow = async (
    options: BeginAuthCodeFlowOptions
): Promise<BeginAuthCodeFlowResult> => {
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;

    if (!options.clientId || options.clientId.length === 0) {
        throw new VciError(
            'token_request_failed',
            'beginAuthCodeFlow requires a non-empty `clientId` — the AS cannot track the request otherwise'
        );
    }

    if (!options.redirectUri || options.redirectUri.length === 0) {
        throw new VciError(
            'token_request_failed',
            'beginAuthCodeFlow requires a non-empty `redirectUri`'
        );
    }

    const authCodeGrant = options.offer.grants?.[AUTHORIZATION_CODE_GRANT];
    if (!authCodeGrant) {
        throw new VciError(
            'unsupported_grant',
            'Offer does not advertise the authorization_code grant. Use acceptCredentialOffer for pre-auth offers.'
        );
    }

    const requestedIds = filterConfigurationIds(options.offer, options.configurationIds);

    const issuerMetadata = await fetchCredentialIssuerMetadata(
        options.offer.credential_issuer,
        fetchImpl
    );

    const authServer = resolveAuthorizationServer(
        issuerMetadata,
        (authCodeGrant as Record<string, unknown>).authorization_server as string | undefined
    );
    const asMetadata = await fetchAuthorizationServerMetadata(authServer, fetchImpl);

    if (typeof asMetadata.authorization_endpoint !== 'string') {
        throw new VciError(
            'metadata_invalid',
            'Authorization server metadata is missing `authorization_endpoint` — cannot run auth_code flow'
        );
    }

    const pkce = await generatePkcePair();
    const state = randomId();

    const authorizationUrl = buildAuthorizationUrl({
        authorizationEndpoint: asMetadata.authorization_endpoint,
        clientId: options.clientId,
        redirectUri: options.redirectUri,
        configurationIds: requestedIds,
        scope: options.scope,
        pkce,
        state,
        issuerState:
            typeof (authCodeGrant as Record<string, unknown>).issuer_state === 'string'
                ? ((authCodeGrant as Record<string, unknown>).issuer_state as string)
                : undefined,
    });

    const flowHandle: AuthCodeFlowHandle = {
        version: 1,
        issuer: options.offer.credential_issuer,
        tokenEndpoint: asMetadata.token_endpoint,
        credentialEndpoint: issuerMetadata.credential_endpoint,
        configurationIds: requestedIds,
        redirectUri: options.redirectUri,
        clientId: options.clientId,
        state,
        pkceVerifier: pkce.verifier,
        pkceMethod: pkce.method,
        credentialConfigurations:
            (issuerMetadata.credential_configurations_supported as Record<string, unknown>) ?? {},
    };

    return { authorizationUrl, flowHandle };
};

/* -------------------------------------------------------------------------- */
/*                              complete the flow                             */
/* -------------------------------------------------------------------------- */

/**
 * Phase 2 — wallet has the `code` back from the redirect. Exchange
 * for an access token, fetch the VC(s), return them.
 *
 * Reuses `requestCredential` and `buildProofJwt` from the pre-auth
 * pipeline — only the token exchange differs.
 */
export const completeAuthCodeFlow = async (
    options: CompleteAuthCodeFlowOptions
): Promise<AcceptedCredentialResult> => {
    const { flowHandle, code, signer } = options;
    const fetchImpl = options.fetchImpl ?? globalThis.fetch;

    if (options.state && options.state !== flowHandle.state) {
        throw new VciError(
            'token_request_failed',
            `State parameter mismatch (callback state=${options.state}, expected ${flowHandle.state})`
        );
    }

    const tokenResponse = await exchangeAuthorizationCode({
        tokenEndpoint: flowHandle.tokenEndpoint,
        code,
        codeVerifier: flowHandle.pkceVerifier,
        clientId: flowHandle.clientId,
        redirectUri: flowHandle.redirectUri,
        fetchImpl,
    });

    const proofJwt = await buildProofJwt({
        signer,
        audience: flowHandle.issuer,
        nonce: tokenResponse.c_nonce,
        clientId: flowHandle.clientId,
    });

    return fetchCredentialsForToken({
        flowHandle,
        tokenResponse,
        proofJwt,
        fetchImpl,
    });
};

/* -------------------------------------------------------------------------- */
/*                                internals                                   */
/* -------------------------------------------------------------------------- */

/**
 * Build the authorization-endpoint URL a wallet opens in a user-agent
 * to kick off the OAuth dance.
 *
 * Includes PKCE (S256), per-config `authorization_details` scoped to
 * `openid_credential` (Draft 13 §5.1.1), and optional issuer_state so
 * the AS can correlate the request with the original offer.
 */
export const buildAuthorizationUrl = (args: {
    authorizationEndpoint: string;
    clientId: string;
    redirectUri: string;
    configurationIds: string[];
    scope?: string;
    pkce: PkcePair;
    state: string;
    issuerState?: string;
}): string => {
    const url = new URL(args.authorizationEndpoint);

    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', args.clientId);
    url.searchParams.set('redirect_uri', args.redirectUri);
    url.searchParams.set('code_challenge', args.pkce.challenge);
    url.searchParams.set('code_challenge_method', args.pkce.method);
    url.searchParams.set('state', args.state);

    const authorizationDetails = args.configurationIds.map(id => ({
        type: 'openid_credential',
        credential_configuration_id: id,
    }));
    url.searchParams.set(
        'authorization_details',
        JSON.stringify(authorizationDetails)
    );

    if (args.scope) url.searchParams.set('scope', args.scope);
    if (args.issuerState) url.searchParams.set('issuer_state', args.issuerState);

    return url.toString();
};

/**
 * POST to the AS token endpoint with `grant_type=authorization_code`
 * + PKCE verifier. Returns the canonical {@link TokenResponse}.
 *
 * Error handling mirrors {@link ./token.ts:exchangePreAuthorizedCode}
 * so the plugin's error surface is consistent across grant types.
 */
export const exchangeAuthorizationCode = async (args: {
    tokenEndpoint: string;
    code: string;
    codeVerifier: string;
    clientId: string;
    redirectUri: string;
    fetchImpl?: typeof fetch;
}): Promise<TokenResponse> => {
    const { tokenEndpoint, code, codeVerifier, clientId, redirectUri } = args;
    const fetchImpl = args.fetchImpl ?? globalThis.fetch;

    if (typeof fetchImpl !== 'function') {
        throw new VciError(
            'token_request_failed',
            'No fetch implementation available for authorization_code token exchange'
        );
    }

    const body = new URLSearchParams();
    body.set('grant_type', AUTHORIZATION_CODE_GRANT);
    body.set('code', code);
    body.set('code_verifier', codeVerifier);
    body.set('client_id', clientId);
    body.set('redirect_uri', redirectUri);

    let response: Response;
    try {
        response = await fetchImpl(tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
            body: body.toString(),
        });
    } catch (e) {
        throw new VciError(
            'token_request_failed',
            `Token endpoint ${tokenEndpoint} unreachable: ${e instanceof Error ? e.message : String(e)}`,
            { cause: e }
        );
    }

    let payload: unknown;
    try {
        payload = await response.json();
    } catch (e) {
        throw new VciError(
            'token_response_invalid',
            `Token endpoint ${tokenEndpoint} returned non-JSON body`,
            { status: response.status, cause: e }
        );
    }

    if (!response.ok) {
        const err = payload as OAuthErrorBody;
        const errCode = typeof err?.error === 'string' ? err.error : 'unknown';
        const desc =
            typeof err?.error_description === 'string' ? `: ${err.error_description}` : '';
        throw new VciError(
            'token_request_failed',
            `Token endpoint returned ${response.status} (${errCode})${desc}`,
            { status: response.status, body: payload }
        );
    }

    if (!isTokenResponse(payload)) {
        throw new VciError(
            'token_response_invalid',
            'Token endpoint response is missing required `access_token` / `token_type`',
            { status: response.status, body: payload }
        );
    }

    return payload;
};

/**
 * Drive the post-token credential request loop. Identical in shape to
 * what {@link ./accept.ts:acceptCredentialOffer} does after its token
 * exchange; we keep a focused copy here to avoid tangling the two
 * entry points.
 */
const fetchCredentialsForToken = async (args: {
    flowHandle: AuthCodeFlowHandle;
    tokenResponse: TokenResponse;
    proofJwt: string;
    fetchImpl: typeof fetch | undefined;
}): Promise<AcceptedCredentialResult> => {
    const credentials: AcceptedCredentialResult['credentials'] = [];
    let aggregateNotificationId: string | undefined;
    let latestCNonce: string | undefined = args.tokenResponse.c_nonce;
    let latestCNonceExpiresIn: number | undefined = args.tokenResponse.c_nonce_expires_in;

    const identifiersByConfigId = indexAuthorizationDetails(
        args.tokenResponse.authorization_details
    );

    for (const configurationId of args.flowHandle.configurationIds) {
        const configDef = args.flowHandle.credentialConfigurations[configurationId];
        const format = inferFormat(configDef);
        const issuedIdentifiers = identifiersByConfigId.get(configurationId) ?? [];

        const descriptors =
            issuedIdentifiers.length > 0
                ? issuedIdentifiers.map(id => ({ credentialIdentifier: id }))
                : [{ credentialIdentifier: undefined }];

        for (const descriptor of descriptors) {
            const response = await requestCredential({
                credentialEndpoint: args.flowHandle.credentialEndpoint,
                accessToken: args.tokenResponse.access_token,
                tokenType: args.tokenResponse.token_type,
                credentialIdentifier: descriptor.credentialIdentifier,
                format: descriptor.credentialIdentifier ? undefined : format,
                extra: descriptor.credentialIdentifier
                    ? undefined
                    : formatSpecificBody(configDef, format),
                proofJwt: args.proofJwt,
                fetchImpl: args.fetchImpl,
            });

            if (!response.credential && !Array.isArray(response.credentials)) {
                throw new VciError(
                    'unsupported_format',
                    'Credential endpoint returned neither `credential` nor `credentials`; deferred issuance not supported yet',
                    { body: response }
                );
            }

            if (response.credential !== undefined) {
                credentials.push({
                    format,
                    credential: response.credential,
                    configuration_id: configurationId,
                });
            }

            if (Array.isArray(response.credentials)) {
                for (const entry of response.credentials) {
                    if (entry && typeof entry === 'object' && 'credential' in entry) {
                        credentials.push({
                            format,
                            credential: entry.credential,
                            configuration_id: configurationId,
                        });
                    }
                }
            }

            if (typeof response.notification_id === 'string') {
                aggregateNotificationId = response.notification_id;
            }

            if (typeof response.c_nonce === 'string') {
                latestCNonce = response.c_nonce;
                latestCNonceExpiresIn =
                    typeof response.c_nonce_expires_in === 'number'
                        ? response.c_nonce_expires_in
                        : undefined;
            }
        }
    }

    return {
        credentials,
        notification_id: aggregateNotificationId,
        c_nonce: latestCNonce,
        c_nonce_expires_in: latestCNonceExpiresIn,
    };
};

const filterConfigurationIds = (
    offer: CredentialOffer,
    requested: string[] | undefined
): string[] => {
    const filtered =
        requested && requested.length > 0
            ? requested.filter(id => offer.credential_configuration_ids.includes(id))
            : offer.credential_configuration_ids;

    if (filtered.length === 0) {
        throw new VciError(
            'unsupported_format',
            'No credential configuration ids matched the caller-supplied filter'
        );
    }

    return filtered;
};

const inferFormat = (configDef: unknown): string => {
    if (
        configDef &&
        typeof configDef === 'object' &&
        typeof (configDef as { format?: unknown }).format === 'string'
    ) {
        return (configDef as { format: string }).format;
    }
    return 'jwt_vc_json';
};

const formatSpecificBody = (
    configDef: unknown,
    format: string
): Record<string, unknown> | undefined => {
    if (!configDef || typeof configDef !== 'object') return undefined;
    if (
        format === 'jwt_vc_json' ||
        format === 'jwt_vc_json-ld' ||
        format === 'ldp_vc'
    ) {
        const def = (configDef as { credential_definition?: unknown }).credential_definition;
        if (def && typeof def === 'object') {
            return { credential_definition: def };
        }
    }
    return undefined;
};

const indexAuthorizationDetails = (raw: unknown): Map<string, string[]> => {
    const map = new Map<string, string[]>();
    if (!Array.isArray(raw)) return map;

    for (const entry of raw) {
        if (!entry || typeof entry !== 'object') continue;
        const record = entry as Record<string, unknown>;
        const configId = record.credential_configuration_id;
        const identifiers = record.credential_identifiers;
        if (typeof configId !== 'string' || !Array.isArray(identifiers)) continue;
        const strings = identifiers.filter((id): id is string => typeof id === 'string');
        if (strings.length > 0) map.set(configId, strings);
    }

    return map;
};

const isTokenResponse = (value: unknown): value is TokenResponse => {
    if (typeof value !== 'object' || value === null) return false;
    const obj = value as Record<string, unknown>;
    return (
        typeof obj.access_token === 'string' &&
        obj.access_token.length > 0 &&
        typeof obj.token_type === 'string' &&
        obj.token_type.length > 0
    );
};

const randomId = (): string => {
    // Web Crypto is available natively in browsers and Node \u2265 18.
    // We only need 16 bytes of unpredictable data for a non-secret
    // session correlation handle (state, nonce, etc.).
    const c = (globalThis as { crypto?: Crypto }).crypto;
    if (!c) throw new Error('Web Crypto API not available in this runtime');
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
        hex += bytes[i]!.toString(16).padStart(2, '0');
    }
    return hex;
};

/* Re-export metadata types so plugin consumers can import from a
 * single module without pulling them from ./types directly. */
export type { CredentialIssuerMetadata, AuthorizationServerMetadata };
