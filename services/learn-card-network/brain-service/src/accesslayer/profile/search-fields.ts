/**
 * Profile search runs `CONTAINS` against TEXT indexes, and TEXT index `CONTAINS` is case-sensitive.
 * `profileId` is already stored lowercased (`transformProfileId`), so it can be searched as-is.
 * `displayName` keeps the casing people typed, so we keep a normalized copy of it in
 * `displayNameLower` (TEXT-indexed by `profile_displayname_lower_text_idx`) and search that.
 *
 * Every write that sets `displayName` must also set `displayNameLower`, and writes, the backfill
 * and the search input all go through the same Cypher expression, `normalizeProfileSearchText`.
 */
export const PROFILE_DISPLAY_NAME_LOWER_FIELD = 'displayNameLower';

/**
 * The one search normalization for display names: Cypher `toLower`, then final sigma (ς, U+03C2)
 * folded to σ (U+03C3).
 *
 * `toLower` alone isn't safe for substring matching because it's context-sensitive for Greek:
 * a capital Σ becomes ς at the end of a word and σ everywhere else. So `ΑΝΑΣΤΑΣΙΑ` is stored as
 * `αναστασια`, but the search input `ΑΝΑΣ` lowercases to `ανας` and no longer matches. Folding ς to
 * σ afterwards makes the result the same for a letter wherever it sits in the string, so a
 * substring of a name always normalizes to a substring of the normalized name.
 *
 * Use this for writes, the backfill and queries alike. Changing it means re-running the backfill.
 */
export const normalizeProfileSearchText = (expression: string): string =>
    `replace(toLower(${expression}), '\u03C2', '\u03C3')`;

/** Cypher fragment that keeps `displayNameLower` in sync with `displayName` for `identifier`. */
export const syncProfileDisplayNameLower = (identifier: string): string =>
    `${identifier}.${PROFILE_DISPLAY_NAME_LOWER_FIELD} = ${normalizeProfileSearchText(
        `${identifier}.displayName`
    )}`;

/** Cypher predicate: true for a profile whose `displayNameLower` is missing or stale. */
export const profileDisplayNameLowerIsStale = (identifier: string): string =>
    `${identifier}.displayName IS NOT NULL
  AND (${identifier}.${PROFILE_DISPLAY_NAME_LOWER_FIELD} IS NULL
       OR ${identifier}.${PROFILE_DISPLAY_NAME_LOWER_FIELD} <> ${normalizeProfileSearchText(
           `${identifier}.displayName`
       )})`;

/**
 * One-pass, idempotent backfill for profiles written before `displayNameLower` existed (or whose
 * copy has drifted). Uses `CALL { ... } IN TRANSACTIONS`, so it has to run in an auto-commit
 * transaction (e.g. `session.run`), not inside an explicit transaction.
 */
export const buildBackfillProfileDisplayNameLowerQuery = (batchSize = 1000): string => `
MATCH (profile:Profile)
WHERE ${profileDisplayNameLowerIsStale('profile')}
CALL {
    WITH profile
    SET ${syncProfileDisplayNameLower('profile')}
} IN TRANSACTIONS OF ${Number.isFinite(batchSize) ? Math.max(1, Math.floor(batchSize)) : 1000} ROWS
`;

/** Anything that runs a query in an auto-commit transaction, e.g. `query => session.run(query)`. */
export type AutoCommitRunner = (
    query: string
) => PromiseLike<{ summary: { counters: { updates: () => Record<string, number> } } }>;

/** Runs the backfill and returns how many profiles were updated. */
export const backfillProfileDisplayNameLower = async (
    run: AutoCommitRunner,
    { batchSize = 1000 }: { batchSize?: number } = {}
): Promise<number> => {
    // The batch size is inlined: OF ... ROWS needs an integer and JS numbers bind as floats.
    const result = await run(buildBackfillProfileDisplayNameLowerQuery(batchSize));

    return result.summary.counters.updates().propertiesSet ?? 0;
};
