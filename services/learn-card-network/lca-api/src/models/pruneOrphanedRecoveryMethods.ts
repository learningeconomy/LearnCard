/**
 * Minimal shape needed for pruning — avoids circular import with UserKey.ts.
 */
interface RecoveryMethodLike {
    shareVersion?: number;
    [key: string]: unknown;
}

/**
 * Remove recovery methods whose shareVersion no longer has a corresponding
 * auth share in either the current version or previousAuthShares.
 *
 * Rules:
 * - Methods with no shareVersion (legacy / unversioned) are always kept.
 * - Methods whose shareVersion matches `currentShareVersion` are kept.
 * - Methods whose shareVersion matches any entry in `previousVersions` are kept.
 * - Everything else is pruned — the auth share it depends on has been evicted.
 */
export const pruneOrphanedRecoveryMethods = <T extends RecoveryMethodLike>(
    recoveryMethods: T[],
    currentShareVersion: number,
    previousVersions: number[],
): T[] => {
    const validVersions = new Set([currentShareVersion, ...previousVersions]);

    return recoveryMethods.filter(method => {
        // Legacy methods with no shareVersion are always kept
        if (method.shareVersion == null) return true;

        return validVersions.has(method.shareVersion);
    });
};
