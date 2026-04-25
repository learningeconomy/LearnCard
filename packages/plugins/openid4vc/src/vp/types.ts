/**
 * OpenID for Verifiable Presentations (OID4VP) Authorization Request types
 * plus the DIF Presentation Exchange v2.0 subset the plugin consumes.
 *
 * Spec references:
 * - OpenID4VP Draft 22: https://openid.net/specs/openid-4-verifiable-presentations-1_0.html
 * - DIF PEX v2.0:       https://identity.foundation/presentation-exchange/spec/v2.0.0/
 *
 * We target Draft 22 (`response_uri`) but tolerate legacy `redirect_uri`
 * when the caller used an older verifier implementation.
 */

/**
 * Stable error codes surfaced to UI layers. Every parse failure maps to
 * exactly one of these so UI can localize copy without string-matching
 * `Error.message`.
 */
export type VpErrorCode =
    | 'invalid_uri'
    | 'invalid_json'
    | 'missing_client_id'
    | 'missing_nonce'
    | 'missing_response_type'
    | 'unsupported_response_type'
    | 'missing_response_target'
    | 'missing_presentation_definition'
    | 'invalid_presentation_definition'
    | 'both_definition_and_uri'
    | 'request_object_not_supported'
    | 'presentation_definition_fetch_failed'
    /**
     * The Authorization Request carried a `dcql_query` that wasn't a
     * JSON object, failed `DcqlQuery.parse` (structure), or failed
     * `DcqlQuery.validate` (content). Distinct from
     * `invalid_presentation_definition` so UI can localize the two
     * separately; the underlying `dcql` library error rides along on
     * `Error.cause` for debug.
     */
    | 'invalid_dcql_query'
    /**
     * The Authorization Request carried BOTH `presentation_definition`
     * (or `..._uri`) AND `dcql_query`. OID4VP 1.0 §5.3 forbids this:
     * the verifier picks ONE query language per request. Without this
     * guard we'd silently route on whichever one we happened to read
     * first, which would mask verifier-side bugs.
     */
    | 'both_pex_and_dcql';

/**
 * Thrown by the parser/resolver and by PEX selection helpers. The `code`
 * field is the stable contract; `message` and `cause` are diagnostic.
 */
export class VpError extends Error {
    public readonly code: VpErrorCode;

    constructor(code: VpErrorCode, message: string, options?: { cause?: unknown }) {
        super(message);
        this.name = 'VpError';
        this.code = code;
        if (options?.cause !== undefined) (this as { cause?: unknown }).cause = options.cause;
    }
}

/**
 * Result of parsing an OID4VP Authorization Request URI.
 *
 * - `by_value` — every parameter was inline in the URI; the request is
 *   fully resolved and ready for PEX matching (Slice 6c+).
 * - `by_reference_request_uri` — the verifier delegated the full request
 *   to a signed JWT fetched from `request_uri`; deferred to Slice 7.
 * - `by_reference_request_jwt` — the request was embedded inline as a
 *   signed JWS via the `request` parameter; deferred to Slice 7.
 *
 * The `by_reference_*` variants intentionally don't attempt to decode
 * the JWS — signature verification requires trust anchors (x5c chain,
 * registered client metadata, did:web resolution) that belong in Slice 7.
 */
export type ParsedAuthorizationRequest =
    | { kind: 'by_value'; request: AuthorizationRequest }
    | { kind: 'by_reference_request_uri'; requestUri: string; rawParams: URLSearchParams }
    | { kind: 'by_reference_request_jwt'; jwt: string; rawParams: URLSearchParams };

/**
 * Canonical Authorization Request shape the plugin operates on. Values
 * come from either the inline URI params or the decoded signed Request
 * Object (Slice 7). Field names match the OID4VP spec so they round-trip
 * cleanly back into the `direct_post` response.
 */
export interface AuthorizationRequest {
    /**
     * Verifier identifier. Shape depends on `client_id_scheme`:
     * - `did`        → a DID URL
     * - `x509_san_dns` / `x509_san_uri` → a hostname/URL backed by the
     *                  signing cert's SAN
     * - `redirect_uri` → the verifier's response_uri host
     * - `pre-registered` → an opaque string registered out-of-band
     */
    client_id: string;
    client_id_scheme?: string;

    /**
     * Space-separated list — typically `vp_token` alone, or
     * `vp_token id_token` for SIOPv2 + VP combined.
     */
    response_type: string;

    /**
     * `direct_post` — POST the VP token to `response_uri` as a form body.
     * `direct_post.jwt` — same, but the body is a JWE.
     * `fragment` / `query` — legacy browser-redirect modes.
     *
     * When omitted for a `vp_token` response_type, the spec's default is
     * `fragment`, but every real-world wallet assumes `direct_post`.
     */
    response_mode?: string;

    /**
     * Draft 22+: destination for the VP token when `response_mode` is
     * `direct_post*`. Mutually exclusive with legacy `redirect_uri` for
     * direct-post flows, though older verifiers may still send
     * `redirect_uri` here.
     */
    response_uri?: string;

    /**
     * Legacy (Draft ≤ 17): combined redirect + response destination.
     * Still used by some verifiers in the wild. The resolver surfaces
     * whichever one arrived under `response_uri` for consistency.
     */
    redirect_uri?: string;

    nonce: string;

    state?: string;

    /**
     * Inline DIF PEX v2 Presentation Definition. Mutually exclusive
     * with `dcql_query` per OID4VP 1.0 §5.3 — a verifier expresses
     * its credential ask in EITHER PEX OR DCQL, never both.
     *
     * Exactly one of `presentation_definition` /
     * `presentation_definition_uri` / `dcql_query` /
     * `scope` (with a well-known scope→PD mapping) is expected.
     *
     * The plugin auto-routes on whichever is present; PEX is the legacy
     * path (every pre-1.0 verifier), DCQL is the OID4VP 1.0+ path.
     */
    presentation_definition?: PresentationDefinition;

    /**
     * URL returning the inline `presentation_definition` JSON. Resolved
     * by {@link resolvePresentationDefinitionByReference}.
     */
    presentation_definition_uri?: string;

    /**
     * **OID4VP 1.0 §6** Digital Credentials Query Language query.
     *
     * Mutually exclusive with `presentation_definition` —
     * verifiers using DCQL set this and omit PEX, and vice versa.
     * Coexistence is at the plugin level (we accept either),
     * NOT at the wire level (a single auth request never carries both).
     *
     * Stored as a parsed-and-validated value of the `dcql` library's
     * `DcqlQuery` type so downstream selector code can run
     * `DcqlQuery.query(...)` without re-parsing. The plugin's
     * resolver (in `./parse.ts`) calls `DcqlQuery.parse(rawJson)`
     * before populating this field — by the time it lands here, it's
     * already been structurally + semantically validated.
     *
     * Unlike `presentation_definition_uri`, DCQL is **always inline**;
     * the spec doesn't define a `dcql_query_uri` mechanism.
     */
    dcql_query?: import('../dcql/types').DcqlQuery;

    /**
     * Verifier metadata (supported formats, response-encryption JWKS,
     * etc.). Consumed by Slice 7 when building the direct_post.jwt
     * response.
     */
    client_metadata?: Record<string, unknown>;

    /** URL variant of {@link client_metadata}. */
    client_metadata_uri?: string;

    /**
     * Space-separated OAuth scopes. Mainly used by SIOPv2 (`openid`) and
     * by verifiers that pre-register scope→presentation_definition
     * mappings. Passed through verbatim for Slice 8.
     */
    scope?: string;

    /**
     * Any additional parameters the verifier included. Kept so callers
     * writing to the direct_post response can echo `state`, custom
     * extensions, etc. without losing fidelity.
     */
    extra?: Record<string, string>;
}

/* -------------------------------------------------------------------------- */
/*                        DIF Presentation Exchange v2                        */
/* -------------------------------------------------------------------------- */

/**
 * DIF PEX v2 Presentation Definition. The minimum fields the plugin
 * inspects for matching; forward-compatible extensions are preserved in
 * `extra` so they can round-trip into the Presentation Submission.
 */
export interface PresentationDefinition {
    id: string;
    name?: string;
    purpose?: string;
    format?: Record<string, ClaimFormatDesignation>;
    submission_requirements?: SubmissionRequirement[];
    input_descriptors: InputDescriptor[];
}

export interface InputDescriptor {
    id: string;
    name?: string;
    purpose?: string;
    group?: string[];
    format?: Record<string, ClaimFormatDesignation>;
    constraints: Constraints;
}

export interface Constraints {
    /**
     * `required` — wallet MUST strip every field not listed in `fields[]`
     *              before presenting (selective disclosure).
     * `preferred` — wallet SHOULD, but isn't required to.
     *
     * Slice 6 ignores limit_disclosure for VC 1.1 JSON-LD / JWT-VC since
     * neither format supports field-level redaction cleanly. SD-JWT-VC
     * support lives in a separate plugin.
     */
    limit_disclosure?: 'required' | 'preferred';

    fields?: Field[];
}

export interface Field {
    /**
     * JSONPath expressions evaluated (in order) against each candidate VC.
     * The first path that yields a non-empty match wins; that match is
     * then tested against `filter` (when present).
     */
    path: string[];
    id?: string;
    name?: string;
    purpose?: string;

    /**
     * JSON Schema (Draft 7 subset) applied to the resolved value. Slice 6
     * supports `type`, `const`, `enum`, `pattern`, `contains`, plus the
     * numeric/string bound keywords — which covers every filter seen in
     * the PEX test vectors and real verifier payloads we've inspected.
     */
    filter?: Record<string, unknown>;

    /**
     * When `true`, the field doesn't need to match for the input
     * descriptor to be satisfied. Useful for "nice-to-have" claims.
     */
    optional?: boolean;

    /**
     * `required` — the VC must literally contain the claim (default).
     * `preferred` — the wallet should supply the claim if available, but
     *               may substitute a predicate proof (ZKP). We treat
     *               both as `required` until a ZKP-capable backend lands.
     */
    predicate?: 'required' | 'preferred';
}

export interface SubmissionRequirement {
    name?: string;
    purpose?: string;
    rule: 'all' | 'pick';
    count?: number;
    min?: number;
    max?: number;
    /** Reference to an `input_descriptor.group` value. */
    from?: string;
    /** Nested submission requirements for composite rules. */
    from_nested?: SubmissionRequirement[];
}

export interface ClaimFormatDesignation {
    alg?: string[];
    proof_type?: string[];
}
