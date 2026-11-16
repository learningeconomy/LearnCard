/** Max amount that can be stored in Custom Storage (in bytes) */
export const MAX_CUSTOM_STORAGE_SIZE = 10_485_760;

/**
 * Most records one index.get page returns. Larger requested limits are clamped, not rejected,
 * so older clients keep paging with hasMore/cursor. A whole page is encrypted into one
 * response, and a 1000-record page can pass the 6 MB Lambda response limit.
 */
export const MAX_INDEX_PAGE_LIMIT = 100;
