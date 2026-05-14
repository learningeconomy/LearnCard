/**
 * Domain types for the OID4VCI pre-authorized_code flow.
 *
 * Kept intentionally narrow — we only type the fields the wallet actually
 * consumes. Issuer metadata carries many optional display/branding fields
 * that we pass through as `unknown` rather than over-specifying.
 */

/**
 * Minimal Credential Issuer Metadata shape.
 *
 * Per Draft 13 §11.2, issuers publish this at
 * `${credential_issuer}/.well-known/openid-credential-issuer`.
 */
export interface CredentialIssuerMetadata {
    /** MUST match the `credential_issuer` from the offer. */
    credential_issuer: string;
    /** Endpoint to POST credential requests to. Required. */
    credential_endpoint: string;
    /** Optional endpoint for notification of credential acceptance. */
    notification_endpoint?: string;
    /**
     * Authorization servers delegated for token issuance. If omitted, the
     * issuer itself is the AS and exposes token/auth endpoints directly.
     */
    authorization_servers?: string[];
    /**
     * Deferred endpoint — not used in Slice 2; credentials returned
     * synchronously from the credential endpoint.
     */
    deferred_credential_endpoint?: string;
    /**
     * Credential configurations keyed by configuration id. Values are left
     * as `unknown` for now; Slice 5 will narrow the `ldp_vc` + `jwt_vc_json`
     * shapes when we start honoring `types` and `credential_definition`.
     */
    credential_configurations_supported?: Record<string, unknown>;
    /** Pass-through catch-all for fields we don't consume. */
    [k: string]: unknown;
}

/**
 * Minimal Authorization Server Metadata (RFC 8414 + OID4VCI extensions).
 *
 * Fetched from `${auth_server}/.well-known/oauth-authorization-server`
 * (preferred) or `/.well-known/openid-configuration` (fallback).
 */
export interface AuthorizationServerMetadata {
    issuer: string;
    /** Required for pre-authorized_code flow. */
    token_endpoint: string;
    authorization_endpoint?: string;
    /**
     * OID4VCI extension — if present and `true`, the AS supports
     * `pre-authorized_code` as a grant type.
     */
    'pre-authorized_grant_anonymous_access_supported'?: boolean;
    grant_types_supported?: string[];
    [k: string]: unknown;
}

/** Successful response from the token endpoint. */
export interface TokenResponse {
    access_token: string;
    token_type: 'Bearer' | 'DPoP' | string;
    expires_in?: number;
    /** Nonce the wallet must echo in its proof-of-possession JWT. */
    c_nonce?: string;
    c_nonce_expires_in?: number;
    /**
     * If the token endpoint returned authorization details, the wallet
     * should use them to shape the credential request. We pass them
     * through but do not enforce them in Slice 2.
     */
    authorization_details?: unknown;
    [k: string]: unknown;
}

/** RFC 6749 §5.2 error body. */
export interface OAuthErrorBody {
    error: string;
    error_description?: string;
    error_uri?: string;
}

/**
 * Body of a successful credential request response. Either
 * - `credential` present (synchronous issuance), or
 * - `transaction_id` present (deferred issuance — not yet supported).
 *
 * Slice 2 only handles synchronous jwt_vc_json; other branches surface
 * `unsupported_format` for the caller to handle.
 */
export interface CredentialResponseBody {
    credential?: unknown;
    credentials?: Array<{ credential: unknown; [k: string]: unknown }>;
    transaction_id?: string;
    c_nonce?: string;
    c_nonce_expires_in?: number;
    notification_id?: string;
    [k: string]: unknown;
}

/** Result of {@link acceptCredentialOffer} — what the caller actually cares about. */
export interface AcceptedCredentialResult {
    /** One entry per credential returned by the issuer. */
    credentials: Array<{
        /** `jwt_vc_json`, `ldp_vc`, etc. */
        format: string;
        /** The raw credential payload — a JWT string for jwt_vc_json, a JSON object for ldp_vc. */
        credential: unknown;
        /** The configuration id from the offer that produced this credential. */
        configuration_id: string;
    }>;
    /** Issuer-supplied id the wallet should echo in a notification POST. */
    notification_id?: string;
    /** Fresh nonce from the credential response, if rotated. */
    c_nonce?: string;
    c_nonce_expires_in?: number;
}

/** A signer capable of producing JWS detached / compact signatures. */
export interface ProofJwtSigner {
    /** JWS `alg` — e.g. `EdDSA`, `ES256`. */
    alg: string;
    /** Verification-method URL for the `kid` header (e.g. `did:key:z6M...#z6M...`). */
    kid: string;
    /**
     * Produce a compact JWS over the given header + payload.
     *
     * Implementations MUST merge `alg` and `kid` / other header members
     * the caller supplies (e.g. `typ: openid4vci-proof+jwt`).
     */
    sign: (header: Record<string, unknown>, payload: Record<string, unknown>) => Promise<string>;
}

/** Options for accepting a credential offer via the pre-authorized code grant. */
export interface AcceptCredentialOfferOptions {
    /**
     * Transaction code the user entered, if the offer required one
     * (offer's `tx_code` field is present).
     */
    txCode?: string;
    /**
     * Optional override of the signer. Defaults to a signer backed by the
     * LearnCard's Ed25519 keypair.
     */
    signer?: ProofJwtSigner;
    /**
     * Client identifier presented to the authorization server. Most
     * pre-authorized flows accept anonymous clients, but some AS's
     * require one.
     */
    clientId?: string;
    /**
     * Subset of `credential_configuration_ids` from the offer to actually
     * request. Defaults to all of them.
     */
    configurationIds?: string[];
}
