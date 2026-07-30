/**
 * Plugin-side type bridge to the [`dcql`](https://github.com/openwallet-foundation-labs/dcql-ts)
 * library — Open Wallet Foundation's reference TypeScript implementation
 * of the **Digital Credentials Query Language** (DCQL, OID4VP 1.0 §6).
 *
 * # Why a separate types module
 *
 * `dcql` is the canonical spec-compliant query parser/matcher (authored
 * by Martin Auer, the spec's editor). Re-implementing it would buy us
 * spec drift and nothing else, so the plugin uses it directly. This
 * module exists for two reasons:
 *
 *   1. **Surface curation.** `dcql` exports ~25 type symbols. The
 *      plugin only consumes a handful. Re-exporting just those keeps
 *      our public API tractable and prevents "leaky transitive types"
 *      from creeping into LearnCard's downstream surface.
 *
 *   2. **Plugin-specific ergonomic aliases.** A few `dcql` types want
 *      shorter or more domain-specific names when used in the plugin's
 *      AuthorizationRequest, selector, and presentation layers.
 *
 * # Coexistence with PEX
 *
 * DCQL is the query language introduced in OID4VP draft 23+ and
 * mandated in OID4VP 1.0. PEX (DIF Presentation Exchange v2, here as
 * `presentation_definition`) is the legacy mechanism used by every
 * pre-1.0 verifier in the wild. The plugin supports BOTH: an incoming
 * AuthorizationRequest may carry either `presentation_definition` or
 * `dcql_query`, and the plugin auto-routes through the corresponding
 * select/build/submit pipeline. See `AuthorizationRequest.dcql_query`
 * (in `../vp/types.ts`) for the discriminator field.
 *
 * # What's in scope
 *
 * The plugin is a **wallet/holder**. Most DCQL surface area is
 * holder-side (parse the verifier's query, match held credentials,
 * emit a DCQL-shaped wallet response). Verifier-side helpers
 * (`buildDcqlQuery`, `validateDcqlPresentation`) are exposed too so
 * LearnCard apps that play the verifier role have ergonomic builders,
 * but the heavy lifting lives in `dcql` itself.
 */
import type {
    DcqlCredential,
    DcqlMdocCredential,
    DcqlPresentation,
    DcqlPresentationResult,
    DcqlQuery,
    DcqlQueryResult,
    DcqlSdJwtVcCredential,
    DcqlW3cVcCredential,
} from 'dcql';

/* -------------------------------------------------------------------------- */
/*                               re-exports                                   */
/* -------------------------------------------------------------------------- */

/**
 * The verifier's DCQL query, post-validation. Matches OID4VP 1.0 §6.1.
 *
 * Use `dcql`'s `DcqlQuery.parse(input)` to obtain a value of this type
 * from raw JSON; the plugin's auth-request resolver does that
 * automatically when it sees a `dcql_query` field on an incoming
 * Authorization Request.
 */
export type { DcqlQuery, DcqlQueryResult };

/**
 * Normalized credential shape consumed by `DcqlQuery.query()` (the
 * holder-side matcher). Discriminated by `credential_format`. The
 * adapter at `./adapt.ts` (Slice 2) converts the plugin's wire-format
 * credentials (JWT-VC strings, LD-VC objects, etc.) into this shape.
 */
export type {
    DcqlCredential,
    DcqlW3cVcCredential,
    DcqlSdJwtVcCredential,
    DcqlMdocCredential,
};

/**
 * Wallet's response to a DCQL query — an object keyed by the verifier's
 * `credential_query_id`s, each value being a serialized presentation
 * (JWT-VP for `jwt_vc_json`, compact SD-JWT for `vc+sd-jwt`, etc.).
 *
 * Distinct from PEX's response shape: there's no companion
 * `presentation_submission` because DCQL embeds the routing implicitly
 * in the keying.
 */
export type { DcqlPresentation, DcqlPresentationResult };

/* -------------------------------------------------------------------------- */
/*                            plugin-specific aliases                         */
/* -------------------------------------------------------------------------- */

/**
 * Single entry in the wallet's DCQL response: a credential-query ID
 * paired with its serialized presentation.
 *
 * Convenience type used by the build/submit layers to keep the per-id
 * loop body legible. The on-the-wire shape is a plain object whose
 * keys are these ids; this type just gives the loop iterator a name.
 */
export interface DcqlPresentationEntry {
    /** Matches `credentials[].id` from the verifier's DCQL query. */
    credentialQueryId: string;
    /**
     * Serialized presentation in the format the corresponding query
     * entry asked for:
     *   - `jwt_vc_json` → compact JWT-VP string
     *   - `ldp_vc`      → JSON object (an unsigned VP wrapped with an LD proof)
     *   - `vc+sd-jwt`   → compact SD-JWT(+KB-JWT) string
     *
     * The plugin currently only emits jwt_vc_json + ldp_vc; sd-jwt-vc
     * presentation is tracked separately (sd-jwt KB-JWT is a different
     * signing path).
     */
    presentation: string | Record<string, unknown>;
}
