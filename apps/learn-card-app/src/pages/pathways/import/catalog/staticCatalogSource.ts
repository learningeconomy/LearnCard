/**
 * catalog/staticCatalogSource — a `PathwaySearchSource` backed by a
 * hand-curated in-memory catalog.
 *
 * This is the implementation the browse UI ships with today. A future
 * `ctdlCatalogSource` (backed by the Credential Engine Graph Search
 * API through a server-side proxy) will implement the same interface,
 * at which point the modal can swap between them — or layer them: a
 * featured row from the static catalog on top of a live-search feed.
 *
 * The async signatures are preserved from `PathwaySearchSource` for
 * that swap to be trivial; callers should await as if talking to a
 * network.
 */

import { collectTags, searchCatalog } from './searchCatalog';
import type {
    CatalogEntry,
    CatalogSearchFilters,
    PathwaySearchSource,
} from './types';

/**
 * Build a `PathwaySearchSource` over a fixed catalog.
 *
 * Pure-ish: the closure captures `catalog` by reference. Tests should
 * pass in their own fixture rather than relying on the shipped
 * `CATALOG` so they stay insulated from editorial changes.
 */
export const createStaticCatalogSource = (
    catalog: ReadonlyArray<CatalogEntry>,
): PathwaySearchSource => {
    return {
        async search(
            query: string,
            filters?: CatalogSearchFilters,
        ): Promise<CatalogEntry[]> {
            return searchCatalog(catalog, { query, filters });
        },

        async featured(): Promise<CatalogEntry[]> {
            return searchCatalog(catalog, {
                filters: { featuredOnly: true },
            });
        },

        async allTags(): Promise<string[]> {
            return collectTags(catalog);
        },
    };
};
