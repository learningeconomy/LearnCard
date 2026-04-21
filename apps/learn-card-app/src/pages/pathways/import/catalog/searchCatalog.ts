/**
 * catalog/searchCatalog — pure search over a `CatalogEntry[]`.
 *
 * Responsibilities kept narrow:
 *
 *   - Case-insensitive substring match against name, description,
 *     issuer, credentialType, and tags. (Fuzzy approaches like
 *     Levenshtein were considered and rejected; our catalog is too
 *     small to justify the complexity, and exact substrings feel more
 *     predictable when the corpus is ~20 entries.)
 *
 *   - OR semantics for multiple tag filters — picking two chips
 *     should *broaden* the result set the way it does in every store
 *     / category UI the user has touched. This matches `allTags()`'s
 *     role as a browsing aid rather than a drill-down.
 *
 *   - Stable, deterministic ordering: featured entries first, then
 *     alphabetical by name. Query-time ranking (closest match first)
 *     is explicitly out of scope — with a small, hand-curated catalog,
 *     authorial ordering + alphabetical is more useful than inferred
 *     relevance scores.
 *
 * Pure function: given the same inputs, always produces the same
 * output. Trivially testable.
 */

import type { CatalogEntry, CatalogSearchFilters } from './types';

export interface SearchCatalogOptions {
    query?: string;
    filters?: CatalogSearchFilters;
}

/**
 * Filter + sort a catalog. Returns a new array; the input is never
 * mutated. Pass an empty query + no filters to get the full catalog
 * in default display order.
 */
export const searchCatalog = (
    catalog: ReadonlyArray<CatalogEntry>,
    { query = '', filters = {} }: SearchCatalogOptions = {},
): CatalogEntry[] => {
    const normalizedQuery = query.trim().toLowerCase();

    const tagFilter = (filters.tags ?? []).map(t => t.toLowerCase());

    const filtered = catalog.filter(entry => {
        if (filters.featuredOnly && !entry.featured) return false;

        if (tagFilter.length > 0) {
            const entryTagsLower = entry.tags.map(t => t.toLowerCase());
            const anyMatch = tagFilter.some(t => entryTagsLower.includes(t));

            if (!anyMatch) return false;
        }

        if (normalizedQuery.length > 0) {
            if (!matchesQuery(entry, normalizedQuery)) return false;
        }

        return true;
    });

    return sortForDisplay(filtered);
};

/**
 * Union of every distinct tag across the catalog, alphabetical. The
 * browse UI renders a chip per tag — keep them Title-Cased in the
 * source data so the chips read well without extra processing.
 */
export const collectTags = (
    catalog: ReadonlyArray<CatalogEntry>,
): string[] => {
    const seen = new Map<string, string>();

    for (const entry of catalog) {
        for (const tag of entry.tags) {
            const key = tag.toLowerCase();

            // Preserve the first-seen casing — the catalog author
            // already chose their preferred presentation.
            if (!seen.has(key)) seen.set(key, tag);
        }
    }

    return [...seen.values()].sort((a, b) => a.localeCompare(b));
};

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

/**
 * Single-field substring check. Fields are concatenated with newlines
 * so a query like "ima finance" (two words in any order) can still
 * match — but only if both words appear *somewhere* across the entry's
 * searchable text. Terms are AND-joined because that matches every
 * store search the user has used (type more → narrow more).
 */
const matchesQuery = (entry: CatalogEntry, normalizedQuery: string): boolean => {
    const haystack = [
        entry.name,
        entry.description,
        entry.issuer,
        entry.credentialType,
        ...entry.tags,
    ]
        .join('\n')
        .toLowerCase();

    // Split on whitespace so "ai finance" matches "AI in Finance"
    // even though the entry never uses those two words adjacently.
    const terms = normalizedQuery.split(/\s+/).filter(Boolean);

    return terms.every(term => haystack.includes(term));
};

/**
 * Featured first, then alphabetical by name. Stable (doesn't rely on
 * JS engine sort stability because we break ties on name explicitly).
 */
const sortForDisplay = (entries: CatalogEntry[]): CatalogEntry[] => {
    return [...entries].sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;

        return a.name.localeCompare(b.name);
    });
};
