/**
 * useListingForNode — resolve a pathway node's linked AppStoreListing.
 *
 * Any node whose `action.kind === 'app-listing'` carries the listing
 * id in `action.listingId`. This hook centralises:
 *   - Gating the fetch on "is this actually an app-listing node?"
 *   - Cross-wiring the public-listing query with the install-state
 *     query so downstream UI has a single `{ listing, isInstalled }`
 *     shape to consume.
 *   - Graceful degradation: if the listing 404s (e.g. preset IDs the
 *     brain-service hasn't seeded yet), the hook returns
 *     `{ listing: null, error }` and lets the caller fall back to the
 *     legacy `LaunchRow` which at least routes the learner to a
 *     recoverable surface.
 *
 * React Query de-dupes per listingId, so mounting this hook on every
 * Map node + NodeDetail for the same listing issues at most one
 * network round-trip.
 */

import { useMemo } from 'react';
import type { AppStoreListing } from '@learncard/types';

import { resolveNodeAction } from '../core/action';
import type { PathwayNode } from '../types';
import useAppStore from '../../launchPad/useAppStore';

export interface ListingForNode {
    /** null if the node isn't an app-listing action. */
    listingId: string | null;
    /** Listing metadata once loaded. `null` while loading or on 404. */
    listing: AppStoreListing | null;
    isLoading: boolean;
    isInstalled: boolean;
    isInstalledLoading: boolean;
    /** Truthy if the fetch errored out — caller should fall back. */
    error: unknown;
}

export const useListingForNode = (node: PathwayNode): ListingForNode => {
    // Resolve once — the node may have explicit `action` or a legacy
    // fallback (earn-url, MCP). Only the `app-listing` case produces
    // a listingId; every other resolved kind leaves it null.
    const listingId = useMemo(() => {
        const resolved = resolveNodeAction(node);

        return resolved.kind === 'app-listing' ? resolved.listingId : null;
    }, [node]);

    // Pull the two queries from the shared LaunchPad hook. Both are
    // gated by `enabled: !!listingId` internally, so when the node
    // isn't an app-listing node these don't even issue requests.
    const { usePublicListing, useIsAppInstalled } = useAppStore();

    const listingQuery = usePublicListing(listingId ?? '');
    const installedQuery = useIsAppInstalled(listingId ?? '');

    return {
        listingId,
        listing: listingQuery.data ?? null,
        isLoading: listingQuery.isLoading,
        isInstalled: installedQuery.data ?? false,
        isInstalledLoading: installedQuery.isLoading,
        error: listingQuery.error,
    };
};
