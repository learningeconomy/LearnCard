/**
 * catalog/types — the public types of the pathway-browse catalog.
 *
 * The catalog is the browsing surface a learner sees when they want to
 * "import a pathway from Credential Engine" but don't have a specific
 * CTID in mind. Each entry is a hand-curated summary of a real
 * registry pathway, rich enough to render in a card grid without
 * fetching the full CTDL document.
 *
 * Split from the data file so a future live-search adapter (backed by
 * a server-held Search API key) can share the same interface and drop
 * in behind the same UI without any component changes. See
 * `staticCatalogSource.ts` for the static-catalog implementation and
 * `PathwaySearchSource` for the contract.
 */

/**
 * A single browsable pathway. Everything a card needs to render *and*
 * the CTID we pass downstream into `fetchCtdlPathway` when the learner
 * decides to import it.
 *
 * Contract with authors:
 *
 *   - `ctid` must be the canonical `ce-<uuid>` form. The registry URL
 *     is derived at fetch time, not stored here — the registry base
 *     can change (sandbox vs prod) and catalog data shouldn't need to
 *     change with it.
 *   - `image` must be a raw `https:` URL; the UI doesn't proxy it.
 *   - `tags` are free-form category labels (e.g. "AI", "Finance",
 *     "Professional"). The browse UI derives its filter chips from
 *     whatever tags appear across the catalog, so there's no central
 *     controlled vocabulary — authors self-organize.
 *   - `credentialType` is what the learner *earns* at the destination
 *     (e.g. "Certificate", "Badge", "Micro-credential"). Drives the
 *     badge on the card and the copy we show in the preview.
 */
export interface CatalogEntry {
    /** Canonical CTID of the `ceterms:Pathway` resource. */
    ctid: string;

    /** Display name as it should appear on the card. */
    name: string;

    /** One-to-two sentence summary. Keep it short — card real estate
     *  is small, and we'd rather degrade to Learn-more than push the
     *  user to read a wall of text before they click. */
    description: string;

    /** Publishing organization name as shown on the card. */
    issuer: string;

    /**
     * Issuer's public website. Optional — surfaces as a subtle link
     * under the issuer name. If the browser later goes live, this also
     * lets us group entries by issuer without a second lookup.
     */
    issuerUrl?: string;

    /**
     * What the learner *earns* at the destination. Free-form so we can
     * accommodate publisher terminology ("Digital Badge" vs "Badge"
     * etc.), but the card styles a few common values specially — see
     * the UI for the list.
     */
    credentialType: string;

    /**
     * Category / topic labels. The browse UI auto-derives filter chips
     * from these; keep them human-readable, Title-Cased, and short
     * (one or two words).
     */
    tags: string[];

    /** Hero image shown on the card. Falls back to a neutral tile. */
    image?: string;

    /**
     * Optional heuristic: roughly how many steps / components this
     * pathway has. Used for a "~N steps" label on the card without
     * having to fetch the full graph first. Missing → we just omit
     * the label.
     */
    componentCount?: number;

    /**
     * If true, the entry surfaces in the "Featured" row at the top of
     * the browse view. Default: false. Featured entries still appear
     * in search results.
     */
    featured?: boolean;
}

/**
 * Filters applied on top of the free-text query. Everything is
 * optional; omitted filters are no-ops.
 *
 * Kept deliberately small — we can add `issuer` / `credentialType` /
 * `minComponentCount` later once we have enough entries to warrant
 * them. Over-designing filter UI before data exists is a waste.
 */
export interface CatalogSearchFilters {
    /** Restrict to entries whose `tags` include *any* of these
     *  (OR semantics — picking more chips broadens the result set,
     *  which is the intuitive behavior for topic browsing). */
    tags?: string[];

    /** If true, return only `featured: true` entries. */
    featuredOnly?: boolean;
}

/**
 * The contract behind the browse UI. A source returns a list of
 * catalog entries for the given query + filters, plus exposes a
 * `featured()` call for the landing grid.
 *
 * Why an interface rather than just calling the static catalog
 * directly: the eventual live-search adapter (once a backend proxy for
 * the CE Graph Search API lands) will slot in here without the modal
 * needing to know. Users of the modal see the same shape whether the
 * results came from a static file or a network request.
 *
 * Implementations should be *pure* with respect to their constructor
 * inputs (the static source is trivially so). Async to leave room for
 * the networked version.
 */
export interface PathwaySearchSource {
    /**
     * Free-text + filter search. Empty query + no filters → returns
     * every catalog entry (stable order: featured first, then
     * alphabetical by name).
     */
    search(
        query: string,
        filters?: CatalogSearchFilters,
    ): Promise<CatalogEntry[]>;

    /**
     * The curated "start here" list. Stable ordering — useful for the
     * initial browse view before the learner types anything.
     */
    featured(): Promise<CatalogEntry[]>;

    /**
     * Every distinct tag present in the source, alphabetical.
     * Drives the filter-chip row at the top of the browse view.
     */
    allTags(): Promise<string[]>;
}
