type FreshReadOptions = { cache: 'skip-cache' };
type IndexRecord = { uri: string };

export interface NativeAccountIndex {
    get: (query?: undefined, options?: FreshReadOptions) => Promise<IndexRecord[]>;
    getPage?: (
        query?: undefined,
        pagination?: { cursor?: string; limit?: number },
        options?: FreshReadOptions
    ) => Promise<{ records: IndexRecord[]; hasMore: boolean; cursor?: string }>;
}

/**
 * Bypass both SDK index caches. LearnCloud.get aggregates getPage calls without
 * forwarding cache options, so skipping only the full-index cache is insufficient.
 * A failed/incomplete scan must never be mistaken for authoritative removal.
 */
export const readCurrentAccountIndex = async (
    index: NativeAccountIndex
): Promise<IndexRecord[]> => {
    if (!index.getPage) return index.get(undefined, { cache: 'skip-cache' });
    const records: IndexRecord[] = [];
    const cursors = new Set<string>();
    let cursor: string | undefined;
    while (true) {
        const page = await index.getPage(
            undefined,
            { cursor, limit: 100 },
            { cache: 'skip-cache' }
        );
        records.push(...page.records);
        if (!page.hasMore) return records;
        if (!page.cursor || cursors.has(page.cursor)) throw new Error('Account index incomplete');
        cursors.add(page.cursor);
        cursor = page.cursor;
    }
};
