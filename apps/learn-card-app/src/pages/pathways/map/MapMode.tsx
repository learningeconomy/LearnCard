/**
 * MapMode — zoomed-out graph viewport with depth-2 progressive disclosure
 * around a focus node (docs § 10).
 *
 * React Flow handles pan / zoom / fit-view; we own:
 *   - the layout (`layoutPathway`)
 *   - the focus-node state and depth filter (`neighborhood`)
 *   - the visual depth-2 emphasis (full vs dimmed cards, via `MapNode`)
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    useReactFlow,
    type Edge as RfEdge,
    type Node as RfNode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useHistory, useLocation } from 'react-router-dom';

import { pathwayStore } from '../../../stores/pathways';
import {
    findParentCompositeNode,
    findParentPathway,
} from '../core/composition';
import {
    availableNodes,
    buildAdjacency,
    neighborhood,
} from '../core/graphOps';

import type { NodeDetailLocationState } from '../node/NodeDetail';

import CollectionMapNode, {
    type CollectionMapNodeData,
} from './CollectionMapNode';
import FocusActionBar from './FocusActionBar';
import MapNode, { type MapNodeData } from './MapNode';
import NestedPathwayContext from './NestedPathwayContext';
import {
    buildCollectionIndex,
    computeCollectionProgress,
    detectCollections,
} from './collectionDetection';
import {
    NODE_HEIGHT,
    NODE_WIDTH,
    layoutPathway,
    layoutPathwayNavigate,
} from './layout';
import { buildRouteIndex, getPathwayRoute } from './route';

const NODE_TYPES = {
    pathwayNode: MapNode,
    collectionNode: CollectionMapNode,
} as const;

/**
 * useIsDesktop — reactive `>= sm` (640 px) media-query hook.
 *
 * Mobile / desktop split matters on the Map because several pieces of
 * chrome that read as useful affordances on a laptop become noise on
 * a 375-wide phone:
 *
 *   - The MiniMap is a "bird's-eye view" meant for orienting inside a
 *     large pannable graph. On mobile its 200-ish-px footprint
 *     occupies ~half the horizontal edge of the viewport, occludes
 *     the canvas, and its details are too small to tap precisely.
 *   - The FocusActionBar (bottom docked CTA) duplicates the
 *     corner-chevron already on the focused node card; on a phone
 *     the chevron tap is a single gesture that's both more compact
 *     and better-aligned with mobile-map conventions (tap pin again
 *     to dive in, à la Google Maps).
 *
 * Rendering them conditionally (rather than CSS-hiding) keeps them
 * out of the DOM entirely on mobile so React Flow doesn't waste
 * cycles mounting MiniMap's SVG scene graph on every focus change.
 *
 * SSR-safe via the `typeof window` guard on the initial state.
 */
const useIsDesktop = (): boolean => {
    const [isDesktop, setIsDesktop] = React.useState<boolean>(() =>
        typeof window !== 'undefined'
            ? window.matchMedia('(min-width: 640px)').matches
            : true,
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const mq = window.matchMedia('(min-width: 640px)');
        const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    return isDesktop;
};

/**
 * FocusPanner — nested inside ReactFlow so it can grab `useReactFlow()`.
 * Every time the focus node shifts, smoothly pans + zooms the viewport
 * to center the node. 500 ms feels physical; much longer reads as lag.
 *
 * The first pan of a mount uses `duration: 0` so the learner doesn't
 * see the "fit everything" intermediate state before settling on the
 * focus node — important for Navigate mode, where we want the step
 * you're on to be the first thing you see, not the whole route
 * zoomed out.
 */
const FocusPanner: React.FC<{
    focusId: string | null;
    positions: ReturnType<typeof layoutPathway>;
    /**
     * Zoom level to center at. Navigate mode uses a tighter zoom
     * (~1.1) so the current step feels "here, now"; Explore uses
     * a looser zoom (~1) so neighbor cards remain legible around
     * the focus.
     */
    zoom: number;
}> = ({ focusId, positions, zoom }) => {
    const rf = useReactFlow();
    const hasPannedRef = useRef(false);

    useEffect(() => {
        if (!focusId) return;

        const pos = positions.find(p => p.id === focusId);

        if (!pos) return;

        // ReactFlow stores node positions as the *top-left corner* of
        // the node's bounding box; `rf.setCenter(x, y)` centers the
        // viewport on the coordinate (x, y). Calling it with raw
        // (pos.x, pos.y) therefore anchors the viewport on the node's
        // top-left corner — on a wide desktop the node is still
        // mostly visible because of ambient padding, but on a
        // 375-wide iPhone SE the node's left edge lands on the
        // screen's horizontal center and the card appears shifted
        // to the right. Offset by half the node's dimensions so we
        // actually center on the node's visual center, independent
        // of viewport width.
        rf.setCenter(pos.x + NODE_WIDTH / 2, pos.y + NODE_HEIGHT / 2, {
            zoom,
            // First pan per mount is instant (duration 0) to suppress
            // the `fitView`-then-recenter flicker. Subsequent focus
            // changes animate so the learner sees the pan as motion.
            duration: hasPannedRef.current ? 500 : 0,
        });

        hasPannedRef.current = true;
    }, [focusId, positions, rf, zoom]);

    return null;
};

// CSS injected once at mount. The draw-in animation is a classic
// dash-offset trick: start with a long dasharray fully offset (invisible),
// animate the offset to 0 so the line paints itself forward. We scope the
// selector to paths *inside* our tagged edge class so React Flow's other
// path elements (handles, minimap) stay untouched.
const MAP_EDGE_STYLE = `
@keyframes pathway-edge-draw {
    from { stroke-dashoffset: 600; }
    to { stroke-dashoffset: 0; }
}
.react-flow__edge.pathway-edge-drawing .react-flow__edge-path {
    stroke-dasharray: 600;
    stroke-dashoffset: 0;
    animation: pathway-edge-draw 850ms cubic-bezier(0.22, 1, 0.36, 1);
}
`;

const MapMode: React.FC = () => (
    <ReactFlowProvider>
        <MapModeInner />
    </ReactFlowProvider>
);

/**
 * Router state understood by MapMode when the user returns from
 * another route (currently only NodeDetail). NodeDetail dismissal
 * passes `initialFocusId` back here so the canvas re-opens with the
 * same pin focused / panned — matching "exactly where I was" UX.
 * Completion navigations deliberately *omit* `initialFocusId` so the
 * natural `defaultFocusId` recomputation advances focus to the next
 * uncompleted step.
 */
interface MapModeLocationState {
    initialFocusId?: string;
}

const MapModeInner: React.FC = () => {
    const activePathway = pathwayStore.use.activePathway();
    const allPathways = pathwayStore.use.pathways();
    const history = useHistory();
    const location = useLocation<MapModeLocationState | undefined>();
    const isDesktop = useIsDesktop();

    // Sub-pathway context — if the active pathway is embedded inside
    // another pathway as a composite reference, render the breadcrumb
    // + "unlocks X" chips. Pure lookup, O(pathways × nodes); tiny in
    // practice since learners rarely have more than a handful of
    // pathways loaded at once.
    const parentContext = useMemo(() => {
        if (!activePathway) return null;

        const parent = findParentPathway(allPathways, activePathway.id);
        if (!parent) return null;

        const parentNode = findParentCompositeNode(parent, activePathway.id);
        if (!parentNode) return null;

        return { parent, parentNode };
    }, [activePathway, allPathways]);

    const handleBackToParent = React.useCallback(() => {
        if (!parentContext) return;
        pathwayStore.set.setActivePathway(parentContext.parent.id);
    }, [parentContext]);

    // Focus node: first available node (the same one Today would pick by
    // default), or the pathway's first node if everything is completed.
    const defaultFocusId = useMemo(() => {
        if (!activePathway) return null;

        const avail = availableNodes(activePathway);

        return avail[0]?.id ?? activePathway.nodes[0]?.id ?? null;
    }, [activePathway]);

    // Router-provided initial focus — takes precedence over
    // `defaultFocusId` on mount so NodeDetail dismissal can restore
    // the pin the learner was looking at. Read once via `useState`
    // initializer so later `history.replace` calls from other code
    // paths don't fight this.
    const [focusId, setFocusId] = useState<string | null>(
        () => location.state?.initialFocusId ?? defaultFocusId,
    );

    // Re-sync focus to the new `defaultFocusId` only when it *actually
    // changes* (e.g. the active pathway flipped to a different
    // pathway, or the current step was completed so the first
    // uncompleted node shifted forward). On plain re-renders where
    // the memo returns the same id, we skip — otherwise a router-
    // state initial focus or a manual pan/click would be overwritten
    // every render.
    const prevDefaultFocusIdRef = useRef<string | null>(defaultFocusId);

    React.useEffect(() => {
        if (prevDefaultFocusIdRef.current === defaultFocusId) return;

        prevDefaultFocusIdRef.current = defaultFocusId;
        setFocusId(defaultFocusId);
    }, [defaultFocusId]);

    // ------------------------------------------------------------------
    // Map layout mode — Navigate vs Explore.
    //
    // The Map has two layouts and one source of truth for each:
    //
    //   - **Effective layout** — what the canvas actually renders as.
    //     Derived from (`layoutOverride`, `pathway.chosenRoute`) via:
    //       - `layoutOverride !== null` → honor the override.
    //       - otherwise → navigate when chosenRoute exists, else
    //         explore. This gives committed pathways a Navigate-first
    //         default (the mental model is "I've chosen my walk, show
    //         me the walk") while keeping legacy pathways in Explore.
    //
    //   - **Override** — an explicit user gesture to see the other
    //     layout without clearing the route. "View full map" from
    //     Navigate sets override to 'explore'; "Resume navigation"
    //     clears it. Clearing `chosenRoute` outright (via the
    //     "Exit navigation" affordance) also resets the override —
    //     the pathway is now in Explore for real, there's nothing to
    //     override back to.
    //
    // The override is intentionally per-session, not persisted. It's
    // a "peek" gesture, not a preference — switching pathways or
    // reloading the Map resets to the Navigate-first default.
    // ------------------------------------------------------------------
    const [layoutOverride, setLayoutOverride] = useState<
        'navigate' | 'explore' | null
    >(null);

    // Reset override when the pathway changes — each pathway deserves
    // a fresh peek-at-nothing start.
    useEffect(() => {
        setLayoutOverride(null);
    }, [activePathway?.id]);

    const hasChosenRoute =
        (activePathway?.chosenRoute?.length ?? 0) >= 2;

    const effectiveLayout: 'navigate' | 'explore' =
        layoutOverride ?? (hasChosenRoute ? 'navigate' : 'explore');

    /**
     * Clear the committed route entirely. This is the "End navigation"
     * gesture in Google Maps — the learner is abandoning this walk,
     * not peeking at the graph. Side effects:
     *
     *   - `pathway.chosenRoute` → `undefined` (via store upsert).
     *   - `layoutOverride` → `null` so the derivation swings us to
     *     Explore automatically (no chosenRoute + null override =
     *     explore).
     *
     * The route can be restored later via any route-seeding surface
     * (What-If's "Return to original walk" card, a Router proposal,
     * or `reseedChosenRoute` on a template reinstantiation). The
     * learner isn't stranded — they've simply chosen to browse.
     */
    const clearRoute = React.useCallback(() => {
        if (!activePathway) return;

        pathwayStore.set.upsertPathway({
            ...activePathway,
            chosenRoute: undefined,
            updatedAt: new Date().toISOString(),
        });

        setLayoutOverride(null);
    }, [activePathway]);

    // ------------------------------------------------------------------
    // M6.c.3 — Collection collapsing.
    //
    // 1. `detectCollections` finds fan-in sibling groups (≥4 nodes, all
    //    pointing at the same target). Purely topological, runs every
    //    time the pathway changes.
    // 2. `expandedGroupIds` tracks which groups the user has
    //    manually expanded on the canvas. Default: all collapsed.
    //    Clicking a collection card toggles the group into/out of the
    //    set; clicking a member's "Collapse" chip removes its group.
    // 3. Downstream consumers (rfNodes, rfEdges, positions) use this
    //    state to decide whether to render individual member cards +
    //    member edges OR a single synthetic collection card + one
    //    rolled-up edge. `positions` reads it to compress consecutive
    //    collapsed route members into a single spine slot so the
    //    Navigate spine doesn't reserve empty rows for hidden members.
    // ------------------------------------------------------------------
    const collections = useMemo(
        () => (activePathway ? detectCollections(activePathway) : []),
        [activePathway],
    );

    const collectionIndex = useMemo(
        () => buildCollectionIndex(collections),
        [collections],
    );

    const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(
        () => new Set(),
    );

    // Reset expansion when the active pathway changes — expansion is a
    // per-pathway affordance, not a global preference.
    useEffect(() => {
        setExpandedGroupIds(new Set());
    }, [activePathway?.id]);

    const toggleGroupExpansion = React.useCallback((groupId: string) => {
        setExpandedGroupIds(prev => {
            const next = new Set(prev);

            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);

            return next;
        });
    }, []);

    // Effective expansion = manual `expandedGroupIds` UNION the
    // group that currently contains `focusId`, if any. The auto-
    // expand is what keeps navigation through a collection coherent
    // across completions: when the learner completes a badge inside
    // "Earn 4 Badges", focus advances to the next uncompleted badge
    // on remount, which is still a member of the same group — so
    // the group stays visually expanded without any state being
    // persisted across the NodeDetail round-trip. Once focus moves
    // to a node *outside* any group (e.g. every badge completed, focus
    // advances to the capstone), the group naturally collapses back.
    //
    // We keep `expandedGroupIds` itself as the manual-toggle record
    // so the "Regroup" button has something concrete to clear, and
    // so CollectionMapNode's toggle still round-trips cleanly when
    // focus isn't inside the group. Derivation is cheap: O(groups).
    const effectivelyExpandedGroupIds = useMemo(() => {
        if (!focusId) return expandedGroupIds;

        const containingGroupId = collectionIndex.memberToGroupId.get(focusId);
        if (!containingGroupId) return expandedGroupIds;

        if (expandedGroupIds.has(containingGroupId)) return expandedGroupIds;

        const next = new Set(expandedGroupIds);
        next.add(containingGroupId);
        return next;
    }, [expandedGroupIds, focusId, collectionIndex]);

    // Member-id → collapsed-group-id lookup. Drives:
    //   - `layoutPathwayNavigate` spine compression (consecutive
    //     route members of the same collection share one slot).
    //   - `rfEdges` Navigate-mode route-spine edge remapping (so
    //     edges land on the rendered collection node instead of
    //     hidden individual members).
    // Only collapsed (non-expanded) groups contribute. Expanded
    // groups behave exactly like plain nodes in both layout and
    // edge passes. Uses the *effective* expansion set so a group
    // containing the focused node is treated as expanded (members
    // rendered individually, no spine compression).
    const collapsedMemberToGroup = useMemo(() => {
        const map = new Map<string, string>();
        for (const group of collections) {
            if (effectivelyExpandedGroupIds.has(group.id)) continue;
            for (const mid of group.memberIds) map.set(mid, group.id);
        }
        return map;
    }, [collections, effectivelyExpandedGroupIds]);

    const positions = useMemo(() => {
        if (!activePathway) return [];

        if (
            effectiveLayout === 'navigate' &&
            activePathway.chosenRoute &&
            activePathway.chosenRoute.length >= 2
        ) {
            return layoutPathwayNavigate(
                activePathway,
                activePathway.chosenRoute,
                collapsedMemberToGroup,
            );
        }

        return layoutPathway(activePathway);
    }, [activePathway, effectiveLayout, collapsedMemberToGroup]);

    // ------------------------------------------------------------------
    // Waze-style suggested route.
    //
    // The pathway is a dependency DAG; a learner's *journey through it*
    // is a single linear chain from where they are to where they're
    // going. We compute that chain once per (pathway, focus) pair and
    // use it to drive three pieces of chrome:
    //
    //   - **Route ribbon** — edges on the route render as a thicker
    //     emerald line, edges ahead-of-you dashed, edges behind-you
    //     solid. Off-route edges fade to a subtle gray.
    //   - **"You are here" pin** — rendered on the focus MapNode when
    //     a route exists (see `isYourPosition` in MapNodeData).
    //   - **ETA** — the goal pill shows "~4 weeks · 6 steps" so the
    //     learner has a felt sense of distance-to-destination.
    //
    // If the pathway has no destinationNodeId or the focus is off the
    // subtree that leads to the destination, `route` is null and the
    // Map renders in its pre-M7 state (no ribbon / no ETA).
    // ------------------------------------------------------------------
    const route = useMemo(() => {
        if (!activePathway || !focusId) return null;
        // Prefer the learner's committed `chosenRoute` over
        // focus-derived topology. `getPathwayRoute` falls back to
        // `computeSuggestedRoute(focus)` when no chosenRoute exists.
        return getPathwayRoute(activePathway, focusId);
    }, [activePathway, focusId]);

    const routeIndex = useMemo(() => {
        if (!route || !activePathway) return null;
        return buildRouteIndex(route, activePathway);
    }, [route, activePathway]);

    /** The node the learner is "at" right now on the route. */
    const yourNodeId = useMemo(() => {
        if (!route || routeIndex?.yourIndex == null) return null;
        return route.nodeIds[routeIndex.yourIndex] ?? null;
    }, [route, routeIndex]);

    /** The node immediately after you on the route — used for "Next up" peek. */
    const nextNodeOnRoute = useMemo(() => {
        if (!route || routeIndex?.yourIndex == null) return null;
        const nextIdx = routeIndex.yourIndex + 1;
        const nid = route.nodeIds[nextIdx];
        if (!nid || !activePathway) return null;
        return activePathway.nodes.find(n => n.id === nid) ?? null;
    }, [route, routeIndex, activePathway]);

    const nb = useMemo(
        () => (activePathway && focusId ? neighborhood(activePathway, focusId, 2) : null),
        [activePathway, focusId],
    );

    // Precompute prerequisite progress for every node in one adjacency
    // build. `prereqProgress` on `graphOps` exposes a per-node helper,
    // but calling it N times walks adjacency N times — wasteful for
    // fan-in graphs like the IMA pathway. Folding it here gives us
    // O(nodes + edges) instead of O(nodes · (nodes + edges)).
    const prereqByNode = useMemo(() => {
        const acc = new Map<string, { met: number; total: number; gated: boolean }>();

        if (!activePathway) return acc;

        const { prereqs } = buildAdjacency(activePathway);
        const completed = new Set(
            activePathway.nodes
                .filter(n => n.progress.status === 'completed')
                .map(n => n.id),
        );

        for (const node of activePathway.nodes) {
            const set = prereqs.get(node.id) ?? new Set<string>();
            const total = set.size;

            if (total === 0) {
                acc.set(node.id, { met: 0, total: 0, gated: false });
                continue;
            }

            let met = 0;
            for (const id of set) if (completed.has(id)) met += 1;

            acc.set(node.id, { met, total, gated: met < total });
        }

        return acc;
    }, [activePathway]);

    // Memoized navigation handler so the MapNode data object identity is
    // stable across re-renders (React Flow treats a changed `data` as a
    // node update — not a correctness bug, but cheap to avoid).
    //
    // We stamp `returnTo: '/pathways/map'` into the router state so
    // NodeDetail dismissal/completion returns the learner to the Map
    // instead of Today. `restoreFocusId` carries the pin we were
    // looking at so dismissal re-opens the canvas on the same node
    // (completion deliberately omits it on the return leg so focus
    // auto-advances to the next uncompleted step).
    const openNode = React.useCallback(
        (nodeId: string) => {
            if (!activePathway) return;

            history.push(
                `/pathways/node/${activePathway.id}/${nodeId}`,
                {
                    returnTo: '/pathways/map',
                    restoreFocusId: nodeId,
                } satisfies NodeDetailLocationState,
            );
        },
        [activePathway, history],
    );

    // ------------------------------------------------------------------
    // Detour counts per spine node (Navigate mode).
    //
    // For each node on the committed route, count how many of its
    // graph neighbors (prereqs + dependents, deduplicated) are **not**
    // on the route. That number becomes the "N detours" chip on the
    // node in Navigate mode — a Google-Maps-style signal that there's
    // more here without rendering the off-route cards on the spine
    // canvas (which was the whole distraction problem with the
    // previous side-branch layout).
    //
    // Computed only when the pathway has a committed route AND the
    // effective layout is `navigate` — in Explore the full graph is
    // already visible, so the chip would be redundant / noisy.
    // Explore mode gets an empty map.
    // ------------------------------------------------------------------
    const detourCountByNodeId = useMemo(() => {
        const acc = new Map<string, number>();

        if (!activePathway) return acc;
        if (effectiveLayout !== 'navigate') return acc;

        const chosen = activePathway.chosenRoute ?? [];
        if (chosen.length < 2) return acc;

        const routeSet = new Set(chosen);
        const { prereqs, dependents } = buildAdjacency(activePathway);

        for (const routeId of chosen) {
            const neighbors = new Set<string>();
            for (const id of prereqs.get(routeId) ?? []) neighbors.add(id);
            for (const id of dependents.get(routeId) ?? []) neighbors.add(id);

            let count = 0;
            for (const id of neighbors) {
                if (!routeSet.has(id)) count += 1;
            }

            acc.set(routeId, count);
        }

        return acc;
    }, [activePathway, effectiveLayout]);

    // Detour chip tap handler — flip into Explore without clearing the
    // route. "Resume navigation" in the top-right chrome swings back.
    // Stable identity via useCallback so MapNodeData doesn't churn.
    const peekDetours = React.useCallback(() => {
        setLayoutOverride('explore');
    }, []);

    const rfNodes: Array<RfNode<MapNodeData> | RfNode<CollectionMapNodeData>> = useMemo(() => {
        if (!activePathway) return [];

        const positionById = new Map(positions.map(p => [p.id, p]));

        // Member ids whose group is currently collapsed — we skip
        // rendering these as individual cards and render a single
        // collection card in their place.
        const collapsedMemberIds = new Set<string>();

        for (const group of collections) {
            if (!effectivelyExpandedGroupIds.has(group.id)) {
                for (const mid of group.memberIds) collapsedMemberIds.add(mid);
            }
        }

        const nodes: Array<RfNode<MapNodeData> | RfNode<CollectionMapNodeData>> = [];

        // 1. Regular pathway nodes (skipping collapsed members).
        for (const pos of positions) {
            if (collapsedMemberIds.has(pos.id)) continue;

            const node = activePathway.nodes.find(n => n.id === pos.id)!;

            // In Navigate mode, the **entire committed walk** reads at
            // equal prominence — the depth-2 neighborhood fade is an
            // Explore affordance ("what's near what I'm looking at"),
            // but when you're navigating, every step of your walk is
            // equally relevant no matter how far ahead. Using the
            // layout's `pos.onRoute` flag (set only by
            // `layoutPathwayNavigate`, and only for on-route ids)
            // keeps this switch scoped: Explore still fades, and
            // any non-route node in Navigate mode (none today, but a
            // future extension might add detour nodes) would still
            // obey the neighborhood fade.
            const baseInFocus = nb ? nb.nodeIds.has(pos.id) : true;
            const inFocus =
                effectiveLayout === 'navigate' && pos.onRoute === true
                    ? true
                    : baseInFocus;

            const isFocusNode = pos.id === focusId;
            const prereq = prereqByNode.get(pos.id) ?? {
                met: 0,
                total: 0,
                gated: false,
            };

            // Route membership is a lookup, not a scan: `routeIndex`
            // maps node id → position on the route. The "you are here"
            // flag is only true for the single `yourNodeId`, so across
            // the entire canvas exactly one pin pulses.
            const isOnRoute = routeIndex?.nodeIndex.has(pos.id) ?? false;
            const isYourPosition = yourNodeId === pos.id;

            // In Navigate layout, `pos.onRoute === false` means this
            // node is a side-branch off the spine — tell MapNode so it
            // can dim aggressively. We trust the position's own flag
            // rather than `!isOnRoute` because the route-index view of
            // membership (focus-derived) can disagree with the
            // layout's view (chosenRoute-derived) during transitions.
            // Explore layout doesn't set `pos.onRoute` at all, so this
            // defaults to undefined/false and the existing depth fade
            // stays the governing emphasis.
            const isSideBranch =
                effectiveLayout === 'navigate' && pos.onRoute === false;

            // Detour count — non-zero only in Navigate mode (the memo
            // is empty in Explore). Undefined in Explore so the chip
            // stays hidden; the graph itself is already the answer.
            const detourCount = detourCountByNodeId.get(pos.id);

            nodes.push({
                id: pos.id,
                type: 'pathwayNode',
                position: { x: pos.x, y: pos.y },
                data: {
                    node,
                    inFocus,
                    isFocusNode,
                    prereq,
                    isOnRoute,
                    isYourPosition,
                    isSideBranch,
                    detourCount,
                    onDetourTap:
                        detourCount && detourCount > 0 ? peekDetours : undefined,
                },
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                draggable: false,
            });
        }

        // 2. Collapsed-collection synthetic nodes.
        //    Position: same row as the original members (they all
        //    share a level by detection rules), horizontally aligned
        //    with the target above so the funnel reads cleanly.
        for (const group of collections) {
            if (effectivelyExpandedGroupIds.has(group.id)) continue;

            // Reference member to inherit y (they all share a level).
            const anchorMember = group.memberIds
                .map(id => positionById.get(id))
                .find(Boolean);
            const targetPos = positionById.get(group.targetNodeId);

            if (!anchorMember || !targetPos) continue;

            // Members' y is the shared row; target's x aligns the
            // funnel. Fall back to the anchor's x if the target isn't
            // laid out (shouldn't happen, but cheap defensive).
            const x = targetPos.x ?? anchorMember.x;
            const y = anchorMember.y;

            const members = group.memberIds
                .map(id => activePathway.nodes.find(n => n.id === id))
                .filter((n): n is NonNullable<typeof n> => Boolean(n));

            const progress = computeCollectionProgress(group, activePathway);

            // A collection is "in focus" if any of its members would
            // have been in focus — otherwise we'd artificially dim the
            // collection just because none of its members is the
            // current focus node. `inFocus` governs the depth fade,
            // so inheriting it from members keeps the neighborhood
            // read consistent.
            //
            // Navigate-mode override: if any member is on the
            // committed route, the collection is part of the walk and
            // reads at equal prominence (matching the per-node
            // override above). In Explore, the neighborhood-derived
            // answer still governs so distant collections fade.
            const anyMemberOnRoute = group.memberIds.some(
                mid => routeIndex?.nodeIndex.has(mid) ?? false,
            );
            const inFocus =
                effectiveLayout === 'navigate' && anyMemberOnRoute
                    ? true
                    : nb
                        ? group.memberIds.some(mid => nb.nodeIds.has(mid))
                        : true;

            nodes.push({
                id: group.id,
                type: 'collectionNode',
                position: { x, y },
                data: {
                    group,
                    members,
                    progress,
                    inFocus,
                    onExpand: toggleGroupExpansion,
                },
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                draggable: false,
                selectable: false,
            });
        }

        return nodes;
    }, [
        activePathway,
        positions,
        nb,
        focusId,
        prereqByNode,
        collections,
        effectivelyExpandedGroupIds,
        toggleGroupExpansion,
        routeIndex,
        yourNodeId,
        effectiveLayout,
        detourCountByNodeId,
        peekDetours,
    ]);

    // Track which edges have already been seen as "completed" so we can
    // flag *newly* completed ones for the draw-in animation exactly
    // once. Using a ref instead of state because the change doesn't
    // need to trigger a re-render — the className is baked into the
    // edge object we return this render and React Flow picks it up.
    const seenCompletedEdgesRef = useRef<Set<string>>(new Set());

    const rfEdges: RfEdge[] = useMemo(() => {
        if (!activePathway) return [];

        const seen = seenCompletedEdgesRef.current;
        const currentlyCompleted = new Set<string>();

        // Which edges are folded into a (currently collapsed)
        // collection? Those get dropped; synthetic edges stand in
        // for the whole bundle:
        //   - one `collection → target` edge (always)
        //   - K `prereq → collection` edges (one per shared prereq,
        //     when the collection has shared incoming prereqs)
        const collapsedEdgeIds = new Set<string>();
        const collapsedGroupIds = new Set<string>();

        for (const group of collections) {
            if (effectivelyExpandedGroupIds.has(group.id)) continue;

            collapsedGroupIds.add(group.id);
            for (const eid of group.edgeIds) collapsedEdgeIds.add(eid);
            // NEW: drop the N × K real member-incoming edges too.
            // They're replaced by K synthetic `prereq → collection`
            // edges emitted below.
            for (const eid of group.incomingEdgeIds) collapsedEdgeIds.add(eid);
        }

        // Set of ids that are actually *rendered* on the canvas.
        //
        // In Explore this is every node in `positions` — the full
        // pathway — so the filter becomes a no-op.
        //
        // In Navigate, `positions` contains only route nodes, **and**
        // collapsed-collection members don't produce individual
        // render nodes: rfNodes skips them and renders one synthetic
        // collection card in their place. So `renderedNodeIds` needs
        // to reflect that substitution — swap collapsed member ids
        // for their collection id — or every edge pointing at a
        // hidden member would silently disappear.
        const renderedNodeIds = new Set<string>();
        for (const pos of positions) {
            const groupId = collapsedMemberToGroup.get(pos.id);
            renderedNodeIds.add(groupId ?? pos.id);
        }

        const edges: RfEdge[] = [];

        const navigatingMode = effectiveLayout === 'navigate';
        const chosenRoute = activePathway.chosenRoute ?? [];

        // -------------------------------------------------------------
        // Navigate-mode spine edges — the continuous ribbon.
        //
        // The learner's committed walk is a sequence of node ids.
        // Adjacent ids on that sequence may not have a direct graph
        // edge, and individual ids may be hidden behind a collapsed
        // collection card. Using only real graph edges — or emitting
        // spine edges between raw route ids — both produce visual
        // holes wherever the rendered canvas diverges from the
        // literal route sequence.
        //
        // The fix: walk the route and emit one edge per *rendered*
        // transition. That means:
        //
        //   1. Remap each route id to its **render id** — the
        //      collapsed collection id if the id is a hidden member,
        //      otherwise the id itself.
        //   2. Walk consecutive route ids. Skip pairs that map to the
        //      same render id (both members of the same collection —
        //      an intra-collection traversal is an internal fan-in,
        //      not a spine step).
        //   3. Emit one edge per distinct render-id transition, from
        //      the previous distinct render id to the current one.
        //
        // This produces a continuous polyline top-to-bottom with
        // exactly one edge per visible-node transition, regardless of
        // collapsing or missing direct graph edges.
        //
        // Styling rules:
        //   - Source "completed enough to show trail" → emerald.
        //     For a plain node, that's `progress.status === 'completed'`.
        //     For a collection, it's **all members completed** — the
        //     AND-gate semantics of a fan-in collection mean
        //     completing just one member doesn't unlock the target,
        //     so emerald would misrepresent progress.
        //   - Otherwise → indigo dashed (projected ahead).
        //
        // Edge id is deterministic (`route-spine-from→to` using
        // render ids) so the trail draw-in animation bookkeeping
        // via `seenCompletedEdgesRef` fires exactly once per
        // visible-transition completion.
        // -------------------------------------------------------------
        if (navigatingMode && chosenRoute.length >= 2) {
            // Tiny helper: is this render id "completed enough" for
            // the emerald trail color? Plain node checks progress;
            // collection checks all-members-done.
            const isRenderSourceCompleted = (renderId: string): boolean => {
                if (collapsedGroupIds.has(renderId)) {
                    const group = collections.find(g => g.id === renderId);
                    if (!group) return false;
                    return group.memberIds.every(mid => {
                        const m = activePathway.nodes.find(n => n.id === mid);
                        return m?.progress.status === 'completed';
                    });
                }
                const src = activePathway.nodes.find(n => n.id === renderId);
                return src?.progress.status === 'completed';
            };

            // Walk the route and emit one edge per distinct
            // render-id transition.
            let prevRenderId: string | null = null;

            for (const routeId of chosenRoute) {
                const renderId =
                    collapsedMemberToGroup.get(routeId) ?? routeId;

                // Skip when this id isn't actually rendered (the
                // defensive branch — shouldn't trigger for a valid
                // route, but swallows stale ids gracefully).
                if (!renderedNodeIds.has(renderId)) continue;

                if (prevRenderId === null) {
                    prevRenderId = renderId;
                    continue;
                }

                // Still inside the same collection run — no visible
                // transition, so no edge.
                if (prevRenderId === renderId) continue;

                const fromCompleted = isRenderSourceCompleted(prevRenderId);
                const spineEdgeId = `route-spine-${prevRenderId}-${renderId}`;

                if (fromCompleted) currentlyCompleted.add(spineEdgeId);

                const isFreshlyCompleted =
                    fromCompleted && !seen.has(spineEdgeId);

                let stroke: string;
                let strokeWidth: number;
                let strokeDasharray: string | undefined;

                if (fromCompleted) {
                    stroke = '#10B981';
                    strokeWidth = 2.5;
                    strokeDasharray = undefined;
                } else {
                    stroke = '#6366F1';
                    strokeWidth = 2.25;
                    strokeDasharray = '6 5';
                }

                edges.push({
                    id: spineEdgeId,
                    source: prevRenderId,
                    target: renderId,
                    type: 'default',
                    animated: false,
                    className: isFreshlyCompleted
                        ? 'pathway-edge-drawing'
                        : undefined,
                    style: {
                        stroke,
                        strokeWidth,
                        strokeDasharray,
                        opacity: 1,
                    },
                } satisfies RfEdge);

                prevRenderId = renderId;
            }

            // In Navigate mode we've replaced the graph-edge pass
            // entirely. Skip the remaining loops — no real graph
            // edges, no separate collection-in/out synthetic edges
            // (the route-spine edges we just emitted already funnel
            // through the collection card correctly).
            seenCompletedEdgesRef.current = currentlyCompleted;
            return edges;
        }

        for (const e of activePathway.edges) {
            if (collapsedEdgeIds.has(e.id)) continue;

            // Skip edges whose endpoints aren't in the rendered node
            // set (Navigate mode only drops these in practice). The
            // committed route is still visible — we don't filter
            // *route* edges here — because both of its endpoints are
            // on-route and therefore rendered.
            if (
                !renderedNodeIds.has(e.from) ||
                !renderedNodeIds.has(e.to)
            ) {
                continue;
            }

            const inFocus = nb ? nb.edgeIds.has(e.id) : true;

            const sourceNode = activePathway.nodes.find(n => n.id === e.from);
            const fromCompleted = sourceNode?.progress.status === 'completed';

            if (fromCompleted) currentlyCompleted.add(e.id);

            // The trail draw-in plays for edges that *just* flipped to
            // completed this render. First-paint of an already-complete
            // pathway skips the animation so returning users don't see
            // every old edge redraw every time they open the map.
            const isFreshlyCompleted = fromCompleted && !seen.has(e.id);

            // ----------------------------------------------------------
            // Route ribbon styling.
            //
            // Navigate and Explore modes share the same four buckets
            // below — trail / projected / off-route-completed /
            // off-route-pending — but differ on the **projected**
            // color:
            //
            //   - **Explore** uses emerald for the whole ribbon. The
            //     route is one visual idea ("your suggested path")
            //     layered over the DAG you're browsing.
            //   - **Navigate** splits the ribbon: emerald for the
            //     **trail behind you**, **indigo** for the
            //     **projected ahead**. This mirrors Google / Apple
            //     Maps' "driven = gray, ahead = blue" convention and
            //     makes the committed walk's direction legible at a
            //     glance. Side-branches simultaneously fade (see
            //     `MapNode.isSideBranch`) so the indigo spine carries
            //     the eye end-to-end.
            //
            // `inFocus` still dims everything outside the depth-2
            // neighborhood so the route ribbon peaks in the area the
            // learner is actually looking at.
            // ----------------------------------------------------------
            const onRoute = routeIndex?.edgeOnRoute.has(e.id) ?? false;
            const navigating = effectiveLayout === 'navigate';

            let stroke: string;
            let strokeWidth: number;
            let strokeDasharray: string | undefined;

            if (onRoute && fromCompleted) {
                // Trail behind — always emerald, in both modes. In
                // Navigate mode this is the "you've driven this"
                // portion of the polyline.
                stroke = inFocus ? '#10B981' : '#6EE7B7';
                strokeWidth = inFocus ? 2.5 : 2;
                strokeDasharray = undefined;
            } else if (onRoute) {
                // Projected ahead — indigo in Navigate (wayfinding
                // palette), emerald in Explore (matches the rest of
                // the ribbon). Dashed in both to read as motion.
                if (navigating) {
                    stroke = inFocus ? '#6366F1' : '#A5B4FC';
                } else {
                    stroke = inFocus ? '#10B981' : '#A7F3D0';
                }
                strokeWidth = inFocus ? 2.25 : 1.75;
                // 6/5 dash reads as motion without being busy — slightly
                // longer dash than gap so the line still feels directional.
                strokeDasharray = '6 5';
            } else if (fromCompleted) {
                stroke = inFocus ? '#A7F3D0' : '#D1FAE5';
                strokeWidth = 1;
                strokeDasharray = undefined;
            } else {
                stroke = inFocus ? '#CBD5E1' : '#E5E7EB';
                strokeWidth = 1;
                strokeDasharray = undefined;
            }

            edges.push({
                id: e.id,
                source: e.from,
                target: e.to,
                // Bezier is softer than smoothstep — reads as a "path"
                // rather than a wiring diagram.
                type: 'default',
                animated: false,
                className: isFreshlyCompleted ? 'pathway-edge-drawing' : undefined,
                style: {
                    stroke,
                    strokeWidth,
                    strokeDasharray,
                    // Route edges stay crisp regardless of focus so the
                    // ribbon reads end-to-end; off-route fade via inFocus.
                    opacity: onRoute ? 1 : inFocus ? 0.8 : 0.55,
                },
            } satisfies RfEdge);
        }

        // Synthetic rolled-up edges: one per collapsed collection.
        // Source = synthetic collection node id; target = the shared
        // downstream target. Styled like a completed edge when every
        // member is completed (the collection itself acts "done"),
        // otherwise a neutral gray so it reads as a pending funnel.
        for (const groupId of collapsedGroupIds) {
            const group = collectionIndex.byId.get(groupId);
            if (!group) continue;

            const progress = computeCollectionProgress(group, activePathway);
            const allDone = progress.total > 0 && progress.completed === progress.total;

            // In-focus if the target is in focus — the funnel lines
            // up with the target visually, so depth-fade should agree.
            const inFocus = nb ? nb.nodeIds.has(group.targetNodeId) : true;

            // Outgoing funnel: collection → target. Picks up route
            // styling when any underlying member → target edge is
            // on-route (the whole group shares the target, so if one
            // edge is on-route they all are).
            const anyOutgoingOnRoute = group.edgeIds.some(
                eid => routeIndex?.edgeOnRoute.has(eid) ?? false,
            );

            edges.push({
                id: `${group.id}-edge`,
                source: group.id,
                target: group.targetNodeId,
                type: 'default',
                animated: false,
                style: {
                    stroke: anyOutgoingOnRoute
                        ? allDone
                            ? inFocus ? '#10B981' : '#6EE7B7'
                            : inFocus ? '#10B981' : '#A7F3D0'
                        : allDone
                            ? inFocus ? '#10B981' : '#A7F3D0'
                            : inFocus ? '#9CA3AF' : '#E5E7EB',
                    strokeWidth: anyOutgoingOnRoute ? (inFocus ? 2.25 : 1.75) : (inFocus ? 1.5 : 1),
                    strokeDasharray: anyOutgoingOnRoute && !allDone ? '6 5' : undefined,
                    opacity: inFocus ? 1 : 0.7,
                },
            } satisfies RfEdge);

            // Incoming funnel: one synthetic `prereq → collection`
            // edge per shared prereq. This is the Option 2 payoff —
            // N × K real edges collapse into K tidy funnels, matching
            // how the outgoing side already collapses N real edges
            // into 1.
            //
            // Styling mirrors the member→target ribbon: completed
            // prereq renders as trail-emerald; uncompleted renders
            // as dashed projected-emerald when on route.
            for (const prereqId of group.sharedPrereqIds) {
                const prereqNode = activePathway.nodes.find(n => n.id === prereqId);
                if (!prereqNode) continue;

                const prereqCompleted = prereqNode.progress.status === 'completed';

                // An incoming edge is "on route" when the prereq is
                // on the route zone — every member of the group is
                // an ancestor of the destination (by construction,
                // since they all feed `targetNodeId` which feeds the
                // destination), so it's enough to check the prereq
                // via any of its real member edges.
                const incomingOnRoute = group.incomingEdgeIds.some(
                    eid => routeIndex?.edgeOnRoute.has(eid) ?? false,
                );

                const prereqInFocus = nb ? nb.nodeIds.has(prereqId) || nb.nodeIds.has(group.targetNodeId) : true;

                let stroke: string;
                let strokeWidth: number;
                let strokeDasharray: string | undefined;

                if (incomingOnRoute && prereqCompleted) {
                    stroke = prereqInFocus ? '#10B981' : '#6EE7B7';
                    strokeWidth = prereqInFocus ? 2.5 : 2;
                    strokeDasharray = undefined;
                } else if (incomingOnRoute) {
                    stroke = prereqInFocus ? '#10B981' : '#A7F3D0';
                    strokeWidth = prereqInFocus ? 2.25 : 1.75;
                    strokeDasharray = '6 5';
                } else if (prereqCompleted) {
                    stroke = prereqInFocus ? '#A7F3D0' : '#D1FAE5';
                    strokeWidth = 1;
                    strokeDasharray = undefined;
                } else {
                    stroke = prereqInFocus ? '#CBD5E1' : '#E5E7EB';
                    strokeWidth = 1;
                    strokeDasharray = undefined;
                }

                edges.push({
                    id: `${group.id}-incoming-${prereqId}`,
                    source: prereqId,
                    target: group.id,
                    type: 'default',
                    animated: false,
                    style: {
                        stroke,
                        strokeWidth,
                        strokeDasharray,
                        opacity: incomingOnRoute ? 1 : prereqInFocus ? 0.8 : 0.55,
                    },
                } satisfies RfEdge);
            }
        }

        // Mark this render's set as "seen" for the next render so the
        // same edge doesn't animate twice.
        seenCompletedEdgesRef.current = currentlyCompleted;

        return edges;
    }, [
        activePathway,
        nb,
        collections,
        collectionIndex,
        effectivelyExpandedGroupIds,
        routeIndex,
        effectiveLayout,
        positions,
        collapsedMemberToGroup,
    ]);

    if (!activePathway) {
        return (
            <div className="max-w-md mx-auto px-4 py-12 font-poppins text-center">
                <h2 className="text-xl font-semibold text-grayscale-900 mb-2">
                    No pathway to map yet
                </h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    Start one from Today and the Map view will show you the terrain.
                </p>
            </div>
        );
    }

    // Minimap color — mirrors the main viewport's focus + status story so
    // glancing at the minimap reads the same pattern as the main canvas.
    const minimapNodeColor = (n: { id: string }): string => {
        const pathwayNode = activePathway.nodes.find(x => x.id === n.id);

        if (!pathwayNode) return '#E5E7EB';

        // Status wins over depth — a completed node stays emerald in the
        // minimap regardless of focus, so the learner's trail remains
        // visible even when they re-focus far away.
        if (pathwayNode.progress.status === 'completed') return '#10B981';
        if (pathwayNode.progress.status === 'in-progress') return '#F59E0B';
        if (pathwayNode.progress.status === 'stalled') return '#EF4444';

        const depth = nb?.depthByNode.get(n.id);

        if (depth === undefined) return '#D1D5DB'; // outside neighborhood
        if (depth === 0) return '#111827'; // focus itself
        if (depth === 1) return '#4B5563';
        if (depth === 2) return '#9CA3AF';

        return '#D1D5DB';
    };

    return (
        <div
            className="relative w-full h-[calc(100vh-220px)] min-h-[420px] overflow-hidden"
            style={{
                // Subtle top-to-bottom wash: pale emerald at the top
                // (where the goal lives) fading into neutral at the
                // bottom (where level 0 starts). Reinforces "climbing
                // toward something" without shouting about it.
                background:
                    'linear-gradient(180deg, rgba(236, 253, 245, 0.55) 0%, rgba(251, 251, 252, 1) 55%, rgba(251, 251, 252, 1) 100%)',
            }}
        >
            <style>{MAP_EDGE_STYLE}</style>

            {/*
                Sub-pathway wayfinding — only rendered when the current
                pathway is embedded inside another. Top-left placement
                keeps the back affordance out of the centered goal
                pill's visual lane. Motion and frosted-glass treatment
                match the goal pill so the chrome reads as a family.
            */}
            {parentContext && (
                <NestedPathwayContext
                    parent={parentContext.parent}
                    parentNode={parentContext.parentNode}
                    onBack={handleBackToParent}
                />
            )}

            {/*
                Top-right mode chrome.
                ──────────────────────────────────────────────────────
                Google-Maps-style controls for the committed route.
                Only rendered when the pathway has a chosenRoute —
                on a destination-less or explore-only pathway there's
                nothing to navigate and these buttons would be a lie.

                Stacked vertically so each affordance gets its own
                row with a clear label:

                  1. **Mode indicator** — compact pill. Indigo dot +
                     "Navigating" in navigate layout, grayscale dot +
                     "Exploring" when peeking at the full graph.
                  2. **Toggle** — "View full map" switches the canvas
                     to Explore layout temporarily (keeps the route
                     committed); "Resume navigation" swings back.
                     The two labels live on the same button, swapped
                     by mode, so there's never both visible at once.
                  3. **Exit navigation** — clears the chosen route
                     outright. Equivalent to Google Maps'
                     "End navigation" — the route is gone, the Map
                     drops to Explore for real, the learner can
                     restart via What-If or a Router proposal.

                A prior "Guide me" CTA lived here too, launching a
                full-screen Waze-style single-card drill-in. It was
                removed because it duplicated the Today tab (no-graph
                step feed) *and* the FocusActionBar at the bottom of
                this very canvas (the primary "Open" CTA plus a Then
                peek at the next step). Three affordances pointing at
                the same act is noise, not choice.

                When there's no chosenRoute we skip the whole stack —
                the pathway is in Explore by default and there's no
                route to manage.
            */}
            {hasChosenRoute && (
                <div
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 font-poppins
                               flex flex-col items-end gap-1.5 sm:gap-2
                               max-w-[50vw]
                               animate-fade-in-up"
                >
                    <span
                        className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full
                                    bg-white/70 backdrop-blur-md border border-white
                                    shadow-sm text-[10px] font-semibold uppercase tracking-wide ${
                                        effectiveLayout === 'navigate'
                                            ? 'text-indigo-700'
                                            : 'text-grayscale-600'
                                    }`}
                    >
                        <span
                            aria-hidden
                            className={`w-1.5 h-1.5 rounded-full ${
                                effectiveLayout === 'navigate'
                                    ? 'bg-indigo-500 animate-pulse'
                                    : 'bg-grayscale-400'
                            }`}
                        />
                        <span>
                            {effectiveLayout === 'navigate'
                                ? 'Navigating'
                                : 'Exploring'}
                        </span>
                    </span>

                    <button
                        type="button"
                        onClick={() =>
                            setLayoutOverride(
                                effectiveLayout === 'navigate'
                                    ? 'explore'
                                    : null,
                            )
                        }
                        className="py-1.5 px-3 rounded-full
                                   bg-white/80 backdrop-blur-md border border-white/60
                                   shadow-sm hover:bg-white transition-colors
                                   text-[11px] sm:text-xs font-medium text-grayscale-700
                                   whitespace-nowrap"
                        aria-label={
                            effectiveLayout === 'navigate'
                                ? 'View the full map'
                                : 'Resume navigation'
                        }
                    >
                        {effectiveLayout === 'navigate'
                            ? 'View full map'
                            : 'Resume navigation'}
                    </button>

                    <button
                        type="button"
                        onClick={clearRoute}
                        className="py-1.5 px-3 rounded-full
                                   bg-white/80 backdrop-blur-md border border-white/60
                                   shadow-sm hover:bg-white transition-colors
                                   text-[11px] sm:text-xs font-medium text-grayscale-500
                                   hover:text-grayscale-900
                                   whitespace-nowrap"
                        aria-label="Exit navigation and clear the committed route"
                    >
                        Exit navigation
                    </button>

                </div>
            )}

            <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                nodeTypes={NODE_TYPES}
                // Navigate mode centers on the current step via
                // FocusPanner (see below) rather than fitting the
                // whole route — the learner is *walking*, they want
                // to see where they are, not where they'll end up.
                // Explore keeps fitView so the full graph lands on
                // screen when you swing out to browse.
                fitView={effectiveLayout !== 'navigate'}
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.3}
                maxZoom={1.5}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                panOnDrag
                proOptions={{ hideAttribution: true }}
                onNodeClick={(_event, node) => {
                    // Collection nodes handle their own click (the
                    // inner <button> stops propagation and calls
                    // `toggleGroupExpansion`). If React Flow still
                    // fires onNodeClick for them (e.g. keyboard
                    // activation), we bail out so we don't try to
                    // re-focus a synthetic id that isn't a pathway
                    // node.
                    if (node.type === 'collectionNode') return;

                    // Click on a non-focus node → re-focus (pan/center
                    // on it). Click on the already-focused node → open
                    // NodeDetail. This mirrors Google Maps' pin behavior:
                    // first tap selects, second tap dives in. The
                    // `FocusActionBar` at the bottom of the viewport is
                    // the primary, most-discoverable way to open; this
                    // click gesture is the secondary shortcut.
                    if (node.id === focusId) {
                        openNode(node.id);
                    } else {
                        setFocusId(node.id);
                    }
                }}
                onNodeDoubleClick={(_event, node) => {
                    openNode(node.id);
                }}
            >
                <FocusPanner
                    focusId={focusId}
                    positions={positions}
                    zoom={effectiveLayout === 'navigate' ? 1.1 : 1}
                />

                <Background
                    variant={BackgroundVariant.Dots}
                    gap={18}
                    size={1}
                    color="#D7DAE5"
                />

                <Controls
                    showInteractive={false}
                    className="!shadow-sm !bg-white/80 !backdrop-blur-md !border !border-white/50 !rounded-xl"
                />

                {/*
                    MiniMap — bird's-eye orient for the graph. Rendered
                    only on tablet+ (`sm:` and above). On phones the
                    ~180 px footprint fights the main canvas for
                    every pixel and its targets are too small to
                    tap precisely; learners orient via pan/pinch
                    directly on the canvas instead, which is the
                    standard mobile-map convention.
                */}
                {isDesktop && (
                    <MiniMap
                        pannable
                        zoomable
                        className="!border !border-white/50 !rounded-xl !bg-white/60 !backdrop-blur-md"
                        maskColor="rgba(236, 253, 245, 0.4)"
                        nodeColor={minimapNodeColor}
                    />
                )}
            </ReactFlow>

            {/*
                "Collapse all" affordance — only rendered when the
                learner has manually expanded one or more collections.
                Sits above the FocusActionBar on the right edge of the
                viewport so it never competes with the primary Open
                action. One click regroups every expanded collection
                at once — simpler than tracking per-group collapse
                targets on the canvas and matches the "undo a zoom"
                mental model.
            */}
            {effectivelyExpandedGroupIds.size > 0 && (
                <button
                    type="button"
                    onClick={() => {
                        // If focus sits inside a (possibly auto-)expanded
                        // group, move it to the group's card id first so
                        // the auto-expand derivation doesn't immediately
                        // re-expand the group the learner just asked to
                        // regroup. Also fixes a latent bug where the
                        // FocusPanner would pan to a now-hidden member.
                        if (focusId) {
                            const containingGroupId =
                                collectionIndex.memberToGroupId.get(focusId);

                            if (containingGroupId) setFocusId(containingGroupId);
                        }

                        setExpandedGroupIds(new Set());
                    }}
                    className="absolute bottom-24 right-4 z-10 font-poppins
                               py-2 px-3 rounded-full
                               bg-white/80 backdrop-blur-md border border-white/60
                               shadow-lg shadow-grayscale-900/10
                               text-xs font-medium text-grayscale-700
                               hover:bg-white transition-colors
                               animate-fade-in-up"
                >
                    Regroup {effectivelyExpandedGroupIds.size === 1 ? 'collection' : 'collections'}
                </button>
            )}

            {/*
                Bottom action sheet — docked primary CTA for the
                focused node. Lives in the viewport chrome so it
                never overlaps the graph's edges (the mistake the
                previous attached CTA made).

                Rendered only on tablet+ (`sm:` and above). On phones
                the sheet duplicates the chevron on the focused node
                card (tap pin → focus, tap again → open, the Google
                Maps pattern) *and* eats ~120 px of vertical
                real-estate above the iOS tab bar that the learner
                needs to actually see the graph. Mobile flow: first
                tap centers + zooms via `FocusPanner`; second tap on
                the same node calls `openNode` directly (handled in
                `onNodeClick` below).
            */}
            {isDesktop && (
                <FocusActionBar
                    node={
                        focusId
                            ? activePathway.nodes.find(n => n.id === focusId) ?? null
                            : null
                    }
                    nextOnRoute={nextNodeOnRoute}
                    onOpen={openNode}
                />
            )}

        </div>
    );
};

export default MapMode;
