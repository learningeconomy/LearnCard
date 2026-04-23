/**
 * buildAppListingSnapshot — derive an `AppListingSnapshot` from a
 * live `AppStoreListing` at bind time.
 *
 * Called at exactly two points:
 *
 *   1. **Author flow.** When a node picker lets an author attach a
 *      listing to a node, the setter wraps the `AppListingAction` in
 *      a snapshot so the persisted pathway carries enough context
 *      for agents to reason about — without a per-read listing fetch.
 *
 *   2. **Dev / seed flow.** `devSeed` and CTDL import paths that
 *      know the target listing up-front populate the snapshot inline
 *      so the Map/NodeDetail UI doesn't flash "Loading…" on first
 *      render of a freshly-seeded pathway.
 *
 * Keep this module thin. The snapshot shape lives in
 * `types/action.ts:AppListingSnapshotSchema`; this helper is just
 * the one function that projects a listing into it. The UI-driven
 * refresh path (listing drift detection → refresh-proposal) will
 * live in a separate module alongside the agents.
 *
 * See `docs/pathways-storage-and-sync.md` § 4.1 for why snapshots
 * exist and how they support agent reasoning.
 */

import type { AppListingSnapshot } from '../types';

/**
 * Minimal shape we need from a listing to build a snapshot. Declared
 * structurally (not as `AppStoreListing`) so this module stays free
 * of `@learncard/types`. When the types promote to a shared package
 * we can swap this for the real interface without a visible change
 * to callers.
 *
 * Every field except `name` is optional — listings in the registry
 * are allowed to omit category / tagline / icon / semantic tags, and
 * the snapshot gracefully degrades when they're absent. `name` is
 * load-bearing: it's the one field UI always renders, so refusing to
 * snapshot without it is honest.
 */
export interface ListingSnapshotInput {
    /** Display name — required. */
    name: string;
    category?: string;
    type?: string;
    /** `launch_type` on the registry side, e.g. "DIRECT_LINK". */
    launch_type?: string;
    tagline?: string;
    icon_url?: string;
    /** Author-provided or LLM-filled tags, when available. */
    semanticTags?: readonly string[];
}

export interface BuildAppListingSnapshotOptions {
    /**
     * ISO timestamp to stamp on `snapshottedAt`. Injectable for
     * deterministic tests and for seed scripts that author pathways
     * at a known "now".
     */
    now?: string;
}

/**
 * Project a listing into an `AppListingSnapshot`.
 *
 * Returns `null` if the listing lacks a display name — we refuse to
 * produce a half-built snapshot (one without the field the UI always
 * renders). Callers upstream treat `null` as "skip the snapshot; let
 * the UI fall back to a live fetch".
 *
 * Normalization rules:
 *   - Empty strings are treated as absent; they never make it into
 *     the snapshot.
 *   - `category` falls back to `type` when the listing registry uses
 *     the older field name.
 *   - `semanticTags` is copied into a fresh array so the returned
 *     object is not aliased to the caller's listing.
 */
export const buildAppListingSnapshot = (
    listing: ListingSnapshotInput,
    opts: BuildAppListingSnapshotOptions = {},
): AppListingSnapshot | null => {
    const displayName = listing.name?.trim();

    if (!displayName) return null;

    const category = listing.category?.trim() || listing.type?.trim() || undefined;
    const launchType = listing.launch_type?.trim() || undefined;
    const tagline = listing.tagline?.trim() || undefined;
    const iconUrl = listing.icon_url?.trim() || undefined;

    const semanticTags =
        listing.semanticTags && listing.semanticTags.length > 0
            ? [...listing.semanticTags]
            : undefined;

    const snapshottedAt = opts.now ?? new Date().toISOString();

    return {
        displayName,
        ...(category ? { category } : {}),
        ...(launchType ? { launchType } : {}),
        ...(tagline ? { tagline } : {}),
        ...(iconUrl ? { iconUrl } : {}),
        ...(semanticTags ? { semanticTags } : {}),
        snapshottedAt,
    };
};
