/**
 * Verifier-side DCQL query composition helpers.
 *
 * # Why this exists
 *
 * The `dcql` library's `DcqlQuery.Input` is fully spec-typed and you
 * can hand-write objects that conform to it. That's enough for sophisticated
 * verifiers but a lot of boilerplate for the common cases LearnCard apps
 * actually hit ("I want a `UniversityDegree`", "I want either an
 * `OpenBadgeCredential` or a `JobCertificate`").
 *
 * This module provides two layers:
 *
 *   1. **`buildDcqlQuery(input)`** — pass-through over `parseDcqlQuery`
 *      that returns a fully-validated `DcqlQuery` from a hand-rolled
 *      `DcqlQuery.Input`. Lets verifier code keep one symbol on the
 *      import line ("compose a DCQL query") rather than reaching for
 *      `parseDcqlQuery` (which is named for the holder-side concern).
 *
 *   2. **`requestW3cVc(spec)`** — single-credential ergonomic builder
 *      for the W3C VC case (jwt_vc_json / ldp_vc). Takes domain-shaped
 *      input ("I want a `UniversityDegree` JWT-VC with these claim
 *      paths") and emits a parsed `DcqlQuery` ready to attach to an
 *      Authorization Request.
 *
 * Anything more elaborate (mso_mdoc, vc+sd-jwt, credential_sets,
 * trusted_authorities) — write the literal `DcqlQuery.Input` and pass
 * it to `buildDcqlQuery`. Adding a domain DSL for every spec corner
 * would balloon this module without adding spec coverage; the dcql
 * library types are already the source of truth.
 */
import { parseDcqlQuery } from './parse';
import type { DcqlQuery } from './types';

/* -------------------------------------------------------------------------- */
/*                              public surface                                */
/* -------------------------------------------------------------------------- */

/**
 * Validate + parse a hand-rolled DCQL query input. Lightweight wrapper
 * over {@link parseDcqlQuery} — same throw semantics
 * (`VpError('invalid_dcql_query', ...)` on any structural / content
 * issue), different name to read naturally on the verifier side.
 */
export const buildDcqlQuery = (input: unknown): DcqlQuery => parseDcqlQuery(input);

/**
 * Domain-shaped input for {@link requestW3cVc}. Keeps the common case
 * legible without reaching into the spec-typed schema.
 */
export interface RequestW3cVcSpec {
    /**
     * Stable identifier the wallet echoes back as the
     * `credential_query_id` in the response's `vp_token` object.
     * Required and must be unique within a query.
     */
    id: string;

    /**
     * VC types the credential must declare (in addition to
     * `VerifiableCredential`). Becomes a single AND-clause inside
     * `meta.type_values`. Pass an array of arrays via
     * {@link buildDcqlQuery} directly if you need OR semantics.
     */
    types: readonly string[];

    /**
     * Wire format. Defaults to `jwt_vc_json` — what walt.id, EUDI, and
     * every learn-card ecosystem issuer emits today.
     */
    format?: 'jwt_vc_json' | 'ldp_vc';

    /**
     * Optional claim filters. Each entry is a JSON-path-array
     * (`['credentialSubject', 'degreeName']`) and an optional list of
     * acceptable values. The wallet only returns credentials whose
     * actual claim value matches at least one of the listed values
     * (or any value when omitted).
     */
    claims?: readonly RequestW3cVcClaim[];

    /**
     * Whether the wallet's response MUST carry cryptographic holder
     * binding (i.e. the VP was signed by a key the holder controls).
     * Defaults to `true` — the conservative choice for any flow
     * sensitive to credential theft.
     */
    requireHolderBinding?: boolean;
}

export interface RequestW3cVcClaim {
    /** JSON path through the credential body, e.g. `['credentialSubject', 'name']`. */
    path: readonly (string | number)[];

    /**
     * Optional list of acceptable values. The wallet may only return
     * credentials whose claim matches at least one entry. Omit for a
     * "must-be-present" filter.
     */
    values?: readonly (string | number | boolean)[];

    /** Optional id for the claim, used when expressing claim_sets. */
    id?: string;
}

/**
 * Build a single-credential DCQL query for a W3C VC. The most common
 * verifier intent collapses to:
 *
 * ```ts
 * const query = requestW3cVc({
 *   id: 'degree',
 *   types: ['VerifiableCredential', 'UniversityDegree'],
 *   claims: [{ path: ['credentialSubject', 'degreeName'] }],
 * });
 * // attach `query` to an Authorization Request as `dcql_query`
 * ```
 *
 * Output is a parsed + validated {@link DcqlQuery} — embed it directly
 * in the Authorization Request URI's `dcql_query` parameter (after
 * `JSON.stringify`+`encodeURIComponent`).
 */
export const requestW3cVc = (spec: RequestW3cVcSpec): DcqlQuery => {
    const format = spec.format ?? 'jwt_vc_json';

    if (spec.types.length === 0) {
        // The dcql library would catch this, but a precise plugin-level
        // error is better signal than a valibot stack trace.
        throw new Error('requestW3cVc: `types` must contain at least one type string');
    }

    const credential: Record<string, unknown> = {
        id: spec.id,
        format,
        meta: {
            type_values: [Array.from(spec.types)],
        },
    };

    if (spec.claims && spec.claims.length > 0) {
        credential.claims = spec.claims.map(c => {
            const claimEntry: Record<string, unknown> = {
                path: Array.from(c.path),
            };
            if (c.values && c.values.length > 0) {
                claimEntry.values = Array.from(c.values);
            }
            if (c.id) claimEntry.id = c.id;
            return claimEntry;
        });
    }

    // `require_cryptographic_holder_binding` defaults to true in the
    // spec; we set it explicitly only when the caller asks to opt OUT
    // so the emitted query is minimally noisy.
    if (spec.requireHolderBinding === false) {
        credential.require_cryptographic_holder_binding = false;
    }

    return buildDcqlQuery({ credentials: [credential] });
};
