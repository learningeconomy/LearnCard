/**
 * DCQL parsing helpers for the plugin's auth-request resolver.
 *
 * Wraps the `dcql` library's `DcqlQuery.parse` + `validate` pair into a
 * single call that throws the plugin's `VpError` taxonomy on failure
 * (so UI code can branch on `code` instead of string-matching the
 * underlying library's messages). All structural + content validation
 * still comes from `dcql` itself — we just adapt the error surface.
 *
 * # Why parse + validate (and not just parse)
 *
 * `DcqlQuery.parse(raw)` enforces *structure* (every field is the
 * right JSON shape, required fields present). `DcqlQuery.validate(parsed)`
 * enforces *content* (e.g. `credential_sets[].options[]` references
 * are valid, no duplicate IDs). Both must succeed before downstream
 * matcher code can safely call `DcqlQuery.query(parsed, candidates)`.
 *
 * A future slice may expose the lower-level `DcqlQuery.parse` separately
 * for callers that want to surface parse-vs-validate errors with
 * different copy. For now the plugin treats "didn't pass either check"
 * as the same failure mode.
 */
import { DcqlQuery } from 'dcql';

import { VpError } from '../vp/types';

/**
 * Parse + validate an arbitrary value as a DCQL query. Returns the
 * fully-typed `DcqlQuery` (a.k.a. `DcqlQuery.Output`) ready for
 * `DcqlQuery.query(...)` to consume.
 *
 * Throws `VpError('invalid_dcql_query', ...)` on:
 *  - non-object inputs
 *  - structural parse errors from `DcqlQuery.parse`
 *  - content validation errors from `DcqlQuery.validate`
 *
 * The original `dcql` error is attached as `cause` so debug code can
 * still inspect the precise `valibot` issue tree if needed.
 */
export const parseDcqlQuery = (raw: unknown): DcqlQuery => {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        throw new VpError(
            'invalid_dcql_query',
            'dcql_query must be a JSON object',
        );
    }

    let parsed: DcqlQuery;
    try {
        // `parse` already throws on a malformed structure, so `as DcqlQuery.Input`
        // here is a typed-input convenience — runtime validation is what we lean on.
        parsed = DcqlQuery.parse(raw as DcqlQuery.Input);
    } catch (e) {
        throw new VpError(
            'invalid_dcql_query',
            `dcql_query failed structural validation: ${describe(e)}`,
            { cause: e },
        );
    }

    try {
        DcqlQuery.validate(parsed);
    } catch (e) {
        throw new VpError(
            'invalid_dcql_query',
            `dcql_query failed content validation: ${describe(e)}`,
            { cause: e },
        );
    }

    return parsed;
};

const describe = (e: unknown): string =>
    e instanceof Error ? e.message : String(e);
