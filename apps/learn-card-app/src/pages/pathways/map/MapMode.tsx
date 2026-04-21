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
import { useHistory } from 'react-router-dom';

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
import { NODE_HEIGHT, NODE_WIDTH, layoutPathway } from './layout';

const NODE_TYPES = {
    pathwayNode: MapNode,
    collectionNode: CollectionMapNode,
} as const;

/**
 * FocusPanner — nested inside ReactFlow so it can grab `useReactFlow()`.
 * Every time the focus node shifts, smoothly pans + zooms the viewport
 * to center the node. 500 ms feels physical; much longer reads as lag.
 */
const FocusPanner: React.FC<{
    focusId: string | null;
    positions: ReturnType<typeof layoutPathway>;
}> = ({ focusId, positions }) => {
    const rf = useReactFlow();

    useEffect(() => {
        if (!focusId) return;

        const pos = positions.find(p => p.id === focusId);

        if (!pos) return;

        rf.setCenter(pos.x + NODE_WIDTH / 2, pos.y + NODE_HEIGHT / 2, {
            zoom: 1,
            duration: 500,
        });
    }, [focusId, positions, rf]);

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

const MapModeInner: React.FC = () => {
    const activePathway = pathwayStore.use.activePathway();
    const allPathways = pathwayStore.use.pathways();
    const history = useHistory();

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

    const [focusId, setFocusId] = useState<string | null>(defaultFocusId);

    // Keep the focus in sync when the pathway changes.
    React.useEffect(() => {
        setFocusId(defaultFocusId);
    }, [defaultFocusId]);

    const positions = useMemo(
        () => (activePathway ? layoutPathway(activePathway) : []),
        [activePathway],
    );

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
    // 3. Downstream consumers (rfNodes, rfEdges) use this state to
    //    decide whether to render individual member cards + member
    //    edges OR a single synthetic collection card + one rolled-up
    //    edge.
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
    const openNode = React.useCallback(
        (nodeId: string) => {
            if (!activePathway) return;

            history.push(`/pathways/node/${activePathway.id}/${nodeId}`);
        },
        [activePathway, history],
    );

    const rfNodes: Array<RfNode<MapNodeData> | RfNode<CollectionMapNodeData>> = useMemo(() => {
        if (!activePathway) return [];

        const positionById = new Map(positions.map(p => [p.id, p]));

        // Member ids whose group is currently collapsed — we skip
        // rendering these as individual cards and render a single
        // collection card in their place.
        const collapsedMemberIds = new Set<string>();

        for (const group of collections) {
            if (!expandedGroupIds.has(group.id)) {
                for (const mid of group.memberIds) collapsedMemberIds.add(mid);
            }
        }

        const nodes: Array<RfNode<MapNodeData> | RfNode<CollectionMapNodeData>> = [];

        // 1. Regular pathway nodes (skipping collapsed members).
        for (const pos of positions) {
            if (collapsedMemberIds.has(pos.id)) continue;

            const node = activePathway.nodes.find(n => n.id === pos.id)!;
            const inFocus = nb ? nb.nodeIds.has(pos.id) : true;
            const isFocusNode = pos.id === focusId;
            const prereq = prereqByNode.get(pos.id) ?? {
                met: 0,
                total: 0,
                gated: false,
            };

            nodes.push({
                id: pos.id,
                type: 'pathwayNode',
                position: { x: pos.x, y: pos.y },
                data: { node, inFocus, isFocusNode, prereq },
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
            if (expandedGroupIds.has(group.id)) continue;

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
            const inFocus = nb
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
        expandedGroupIds,
        toggleGroupExpansion,
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
        // collection? Those get dropped; a single synthetic
        // collection→target edge stands in for the whole bundle.
        const collapsedEdgeIds = new Set<string>();
        const collapsedGroupIds = new Set<string>();

        for (const group of collections) {
            if (expandedGroupIds.has(group.id)) continue;

            collapsedGroupIds.add(group.id);
            for (const eid of group.edgeIds) collapsedEdgeIds.add(eid);
        }

        const edges: RfEdge[] = [];

        for (const e of activePathway.edges) {
            if (collapsedEdgeIds.has(e.id)) continue;

            const inFocus = nb ? nb.edgeIds.has(e.id) : true;

            const sourceNode = activePathway.nodes.find(n => n.id === e.from);
            const fromCompleted = sourceNode?.progress.status === 'completed';

            if (fromCompleted) currentlyCompleted.add(e.id);

            // The trail draw-in plays for edges that *just* flipped to
            // completed this render. First-paint of an already-complete
            // pathway skips the animation so returning users don't see
            // every old edge redraw every time they open the map.
            const isFreshlyCompleted = fromCompleted && !seen.has(e.id);

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
                    stroke: fromCompleted
                        ? inFocus
                            ? '#10B981' // emerald-500
                            : '#A7F3D0' // emerald-200
                        : inFocus
                            ? '#9CA3AF' // neutral gray
                            : '#E5E7EB',
                    strokeWidth: inFocus ? 1.5 : 1,
                    opacity: inFocus ? 1 : 0.7,
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

            edges.push({
                id: `${group.id}-edge`,
                source: group.id,
                target: group.targetNodeId,
                type: 'default',
                animated: false,
                style: {
                    stroke: allDone
                        ? inFocus
                            ? '#10B981'
                            : '#A7F3D0'
                        : inFocus
                            ? '#9CA3AF'
                            : '#E5E7EB',
                    strokeWidth: inFocus ? 1.5 : 1,
                    opacity: inFocus ? 1 : 0.7,
                },
            } satisfies RfEdge);
        }

        // Mark this render's set as "seen" for the next render so the
        // same edge doesn't animate twice.
        seenCompletedEdgesRef.current = currentlyCompleted;

        return edges;
    }, [activePathway, nb, collections, collectionIndex, expandedGroupIds]);

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
                Goal anchor — a floating frosted pill centered above the
                canvas. Reads like Apple's Dynamic Island: calm, obvious
                destination, doesn't steal a full row of vertical space.
            */}
            <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-10 font-poppins animate-fade-in-up">
                <div className="pointer-events-auto flex items-center gap-2 py-2 px-4 rounded-full bg-white/70 backdrop-blur-md border border-white shadow-lg shadow-grayscale-900/5">
                    <span
                        aria-hidden
                        className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"
                    />

                    <span className="text-[10px] font-semibold text-grayscale-500 uppercase tracking-wide">
                        On your way to
                    </span>

                    <span className="text-sm font-semibold text-grayscale-900 max-w-[260px] truncate">
                        {activePathway.goal}
                    </span>
                </div>
            </div>

            <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                nodeTypes={NODE_TYPES}
                fitView
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
                <FocusPanner focusId={focusId} positions={positions} />

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

                <MiniMap
                    pannable
                    zoomable
                    className="!border !border-white/50 !rounded-xl !bg-white/60 !backdrop-blur-md"
                    maskColor="rgba(236, 253, 245, 0.4)"
                    nodeColor={minimapNodeColor}
                />
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
            {expandedGroupIds.size > 0 && (
                <button
                    type="button"
                    onClick={() => setExpandedGroupIds(new Set())}
                    className="absolute bottom-24 right-4 z-10 font-poppins
                               py-2 px-3 rounded-full
                               bg-white/80 backdrop-blur-md border border-white/60
                               shadow-lg shadow-grayscale-900/10
                               text-xs font-medium text-grayscale-700
                               hover:bg-white transition-colors
                               animate-fade-in-up"
                >
                    Regroup {expandedGroupIds.size === 1 ? 'collection' : 'collections'}
                </button>
            )}

            {/*
                Bottom action sheet — persistent, docked affordance for
                opening the focused node. Bookends the top "On your way to"
                pill: destination above, current action below. Lives in
                the viewport chrome so it never overlaps the graph's
                edges (the mistake the previous attached CTA made).
            */}
            <FocusActionBar
                node={
                    focusId
                        ? activePathway.nodes.find(n => n.id === focusId) ?? null
                        : null
                }
                onOpen={openNode}
            />
        </div>
    );
};

export default MapMode;
