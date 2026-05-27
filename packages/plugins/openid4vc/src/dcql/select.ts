/**
 * DCQL holder selector — wraps `DcqlQuery.query()` from the `dcql`
 * library in a plugin-friendly result shape that mirrors the PEX
 * selector's contract.
 *
 * # Why a wrapper instead of re-exporting `DcqlQuery.query` directly
 *
 * Three reasons:
 *
 *   1. **Adapter transparency.** Callers hand us their wire-shape
 *      credentials (JWT-VC strings, LD-VC objects); they shouldn't
 *      need to know what `DcqlW3cVcCredential` looks like. The
 *      wrapper runs the adapter (`./adapt.ts`) before calling
 *      `DcqlQuery.query`.
 *
 *   2. **Round-trip preservation.** The matcher returns winning
 *      credentials by index into the array we passed in. Submission
 *      code needs the *original* wire-shape candidate (to sign and
 *      package as a JWT-VP), not the normalized DCQL representation.
 *      We pair the result back to the original via the index.
 *
 *   3. **Ergonomic parity with PEX.** `vp/select.ts` returns
 *      `{ descriptors, canSatisfy, reason }`; this returns
 *      `{ matches, canSatisfy, reason }`. Different keying, same
 *      shape. Plugin-level routing (Slice 6) can branch on which
 *      one is set in the auth request and call the matching selector
 *      with no further translation.
 */
// Namespace import: `DcqlQuery` is a TS namespace compiled into a
// late-populated object in `dcql`. See `./parse.ts` for the full
// rationale; same pattern here keeps the matcher binding live.
import * as dcql from 'dcql';

import { adaptCredentialsForDcql, type AdaptableCredential } from './adapt';
import type { DcqlQuery, DcqlQueryResult } from './types';

/* -------------------------------------------------------------------------- */
/*                                public types                                */
/* -------------------------------------------------------------------------- */

/**
 * Per-credential-query result. Each `DcqlQuery.credentials[]` entry
 * gets exactly one of these in `DcqlSelectionResult.matches[]`,
 * keyed by its `id`.
 *
 * Mirrors `DescriptorSelection` from the PEX selector so UI code can
 * render PEX and DCQL flows identically (a list of "what was asked
 * for" + "which credentials satisfy it" panels).
 */
export interface DcqlCredentialMatch {
    /** Matches `DcqlQuery.credentials[N].id` from the verifier's query. */
    credentialQueryId: string;

    /**
     * Wire-shape credentials the matcher accepted for this query
     * entry. Empty when no held credential satisfies the query —
     * see `reason` for the failure summary.
     */
    candidates: AdaptableCredential[];

    /** Why no candidate matched. Set when `candidates.length === 0`. */
    reason?: string;
}

/**
 * Selector result. Mirrors `SelectionResult` (PEX) field-for-field,
 * with `descriptors` renamed to `matches` to reflect DCQL's keying
 * by `credential_query_id`.
 */
export interface DcqlSelectionResult {
    /**
     * `true` when the verifier's `credential_sets` (or the implicit
     * "all credentials match" rule when none are declared) can be
     * satisfied by the supplied candidate pool. Drives the "submit"
     * button enablement in UIs.
     */
    canSatisfy: boolean;

    /** Per-credential-query matches, keyed by `credential_query_id`. */
    matches: Record<string, DcqlCredentialMatch>;

    /** Overall failure reason when `canSatisfy === false`. */
    reason?: string;

    /**
     * Full `dcql` library result. Exposed so advanced callers can
     * drill into trusted-authority validation details, claim-set
     * results, and other DCQL features the simplified plugin shape
     * doesn't surface. Stable as long as `dcql` keeps it stable.
     */
    raw: DcqlQueryResult;
}

/* -------------------------------------------------------------------------- */
/*                              public surface                                */
/* -------------------------------------------------------------------------- */

/**
 * Run the holder's candidate pool against a parsed DCQL query.
 *
 * The supplied `query` MUST already be a `DcqlQuery` (i.e., have
 * passed `DcqlQuery.parse(...) + validate(...)`). The plugin's
 * resolver populates `AuthorizationRequest.dcql_query` exactly that
 * way; callers driving the selector directly should use
 * `parseDcqlQuery` from `./parse.ts` first.
 *
 * Drops candidates whose format the adapter doesn't support
 * (sd-jwt-vc, mso_mdoc — see `./adapt.ts`) without erroring; those
 * simply don't appear in `matches[*].candidates`.
 */
export const selectCredentialsForDcql = (
    candidates: readonly AdaptableCredential[],
    query: import('./types').DcqlQuery
): DcqlSelectionResult => {
    const adapted = adaptCredentialsForDcql(candidates);
    const dcqlCredentials = adapted.map(a => a.adapted);

    // The dcql library's matcher takes the validated query + the
    // adapted credentials and returns a per-id match record.
    const result = dcql.DcqlQuery.query(
        query as Parameters<typeof dcql.DcqlQuery.query>[0],
        dcqlCredentials
    );

    const matches: Record<string, DcqlCredentialMatch> = {};

    for (const [queryId, match] of Object.entries(result.credential_matches)) {
        if (match.success) {
            // Reconnect winning matches to their original wire-shape
            // candidates via the matcher's `input_credential_index`.
            // We `.filter` defensively for the unreachable "index
            // out of range" case so a future dcql update can't
            // silently drop entries with no warning.
            const winners = match.valid_credentials
                .map(vc => adapted[vc.input_credential_index]?.original)
                .filter((c): c is AdaptableCredential => c !== undefined);

            matches[queryId] = {
                credentialQueryId: queryId,
                candidates: winners,
            };
            continue;
        }

        // Failure case. The dcql library carries detailed valibot
        // issue trees for each failed-claim / failed-trusted-auth
        // dimension; we summarize as a single user-facing string and
        // expose the full detail via `result.raw` for callers that
        // want to render per-claim diagnostics.
        matches[queryId] = {
            credentialQueryId: queryId,
            candidates: [],
            reason: `No held credential satisfies query "${queryId}"`,
        };
    }

    return {
        canSatisfy: result.can_be_satisfied,
        matches,
        reason: result.can_be_satisfied
            ? undefined
            : 'No combination of held credentials satisfies the verifier\'s DCQL query',
        raw: result as DcqlQueryResult,
    };
};
