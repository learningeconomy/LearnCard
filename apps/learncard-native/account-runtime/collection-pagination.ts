/** Refuse missing/repeated cursors before automatic paging can loop or appear complete. */
export const validateCollectionCursor = (
    hasMore: boolean,
    next: string | undefined,
    visited: ReadonlySet<string>
): void => {
    if (hasMore && (!next || visited.has(next))) throw new Error('Collection page unavailable');
};
