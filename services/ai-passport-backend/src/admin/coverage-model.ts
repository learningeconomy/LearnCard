export type CoverageSource = {
    _id: unknown;
    did?: string;
    uri?: string;
    embeddingEpoch?: string;
    verification?: { contentHash?: string; consent?: { revision?: string } };
};
export const sourceFingerprint = (source: CoverageSource) =>
    JSON.stringify([
        String(source._id),
        source.did,
        source.uri,
        source.embeddingEpoch,
        source.verification?.contentHash,
        source.verification?.consent?.revision,
    ]);
export function classifyCoverage(
    rows: { stable: boolean; novaViews: number; openaiViews: number }[],
    complete: boolean,
    limit: number
) {
    let novaReady = 0,
        openaiOnly = 0,
        unresolved = 0,
        rollbackCopies = 0;
    for (const row of rows) {
        if (!row.stable) {
            unresolved += 1;
            continue;
        }
        if (row.novaViews === 5) {
            novaReady += 1;
            if (row.openaiViews === 5) rollbackCopies += 1;
        } else if (row.novaViews === 0 && row.openaiViews === 5) openaiOnly += 1;
        else unresolved += 1;
    }
    return {
        scope: 'persisted-credentials' as const,
        observedAt: new Date().toISOString(),
        complete: complete && rows.every(row => row.stable),
        inventoryLimit: limit,
        observedRecords: rows.length,
        totalRecords: complete && rows.every(row => row.stable) ? rows.length : null,
        novaReady,
        openaiOnly,
        unresolved,
        rollbackCopies,
    };
}
