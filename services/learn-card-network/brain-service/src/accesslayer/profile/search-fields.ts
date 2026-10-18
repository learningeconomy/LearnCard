/**
 * Profile search runs `CONTAINS` against TEXT indexes, and TEXT index `CONTAINS` is case-sensitive.
 * `profileId` is already stored lowercased (`transformProfileId`), so it can be searched as-is.
 * `displayName` keeps the casing people typed, so we keep a lowercased copy of it in
 * `displayNameLower` (TEXT-indexed by `profile_displayname_lower_text_idx`) and search that.
 *
 * Every write that sets `displayName` must also set `displayNameLower`. Doing the lowercasing in
 * Cypher (`toLower`) on writes, on the backfill, and on the search input keeps all three on the
 * same lowercasing rules.
 */
export const PROFILE_DISPLAY_NAME_LOWER_FIELD = 'displayNameLower';

/** Cypher fragment that keeps `displayNameLower` in sync with `displayName` for `identifier`. */
export const syncProfileDisplayNameLower = (identifier: string): string =>
    `${identifier}.${PROFILE_DISPLAY_NAME_LOWER_FIELD} = toLower(${identifier}.displayName)`;

/**
 * One-pass, idempotent backfill for profiles written before `displayNameLower` existed (or whose
 * copy has drifted). Uses `CALL { ... } IN TRANSACTIONS`, so it has to run in an auto-commit
 * transaction (e.g. `session.run`), not inside an explicit transaction.
 */
export const buildBackfillProfileDisplayNameLowerQuery = (batchSize = 1000): string => `
MATCH (profile:Profile)
WHERE profile.displayName IS NOT NULL
  AND (profile.${PROFILE_DISPLAY_NAME_LOWER_FIELD} IS NULL
       OR profile.${PROFILE_DISPLAY_NAME_LOWER_FIELD} <> toLower(profile.displayName))
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
