/**
 * Domain types for the OID4VCI pre-authorized_code flow.
 *
 * Kept intentionally narrow — we only type the fields the wallet actually
 * consumes. Issuer metadata carries many optional display/branding fields
 * that we pass through as `unknown` rather than over-specifying.
 */

/**
 * Which OID4VCI revision an issuer speaks, detected during metadata
 * discovery. `final` is the ratified 1.0 spec (the plugin's target);
 * `draft-13` is the earlier draft some issuers still serve. Used to pick
 * the Credential Request wire shape. [draft-13-compat]
 */
export type SpecVersion = 'final' | 'draft-13';

/**
 * Minimal Credential Issuer Metadata shape.
 *
 * Per OID4VCI 1.0 §12.2, issuers publish this at the well-known endpoint
 * derived from the Credential Issuer Identifier.
 */
export interface CredentialIssuerMetadata {
    /** MUST match the `credential_issuer` from the offer. */
    credential_issuer: string;
    /** Endpoint to POST credential requests to. Required. */
    credential_endpoint: string;
    /** Optional OID4VCI 1.0 Final endpoint for fetching a fresh c_nonce. */
    nonce_endpoint?: string;
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

/**
 * Key proof types the wallet can present in a Credential Request
 * (OID4VCI 1.0 §8.2.1). `jwt` is the historical default; `di_vp` is a
 * W3C Verifiable Presentation secured with a Data Integrity proof,
 * required by issuers implementing the VC Data Model profile
 * (e.g. the `data-integrity-cryptosuites` additive profile).
 */
export type KeyProofType = 'jwt' | 'di_vp';

/**
 * Result of matching a credential configuration's
 * `proof_types_supported` against the wallet's capabilities.
 */
export interface KeyProofSelection {
    proofType: KeyProofType;
    /**
     * For `di_vp`: cryptosuite to sign the VP with, chosen from the
     * issuer's `proof_signing_alg_values_supported`. Undefined means
     * "use the signer's default".
     */
    cryptosuite?: string;
}

/**
 * Signer capable of producing a `di_vp` key proof: a W3C Verifiable
 * Presentation carrying a Data Integrity proof with
 * `proofPurpose: authentication`, `domain` bound to the Credential
 * Issuer Identifier, and `challenge` bound to the issuer `c_nonce`.
 *
 * The plugin wires this to `learnCard.invoke.issuePresentation`; hosts
 * with external key backends can supply their own implementation.
 */
export interface DiVpProofSigner {
    /** Holder DID placed on the unsigned VP. */
    holder: string;
    /**
     * Sign the unsigned VP with a Data Integrity proof. Implementations
     * MUST set `proofPurpose: 'authentication'` and bind the supplied
     * `domain` / `challenge`.
     */
    signPresentation: (
        unsignedVp: Record<string, unknown>,
        options: { domain: string; challenge?: string; cryptosuite?: string }
    ) => Promise<Record<string, unknown>>;
}

/**
 * A single key proof ready to be embedded in a Credential Request's
 * `proofs` object — exactly one variant per request.
 */
export type CredentialRequestKeyProof =
    | { proofType: 'jwt'; jwt: string }
    | { proofType: 'di_vp'; diVp: Record<string, unknown> };

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
