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
import { availableNodes, neighborhood } from '../core/graphOps';

import MapNode, { type MapNodeData } from './MapNode';
import { NODE_HEIGHT, NODE_WIDTH, layoutPathway } from './layout';

const NODE_TYPES = { pathwayNode: MapNode } as const;

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
    const history = useHistory();

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

    const nb = useMemo(
        () => (activePathway && focusId ? neighborhood(activePathway, focusId, 2) : null),
        [activePathway, focusId],
    );

    const rfNodes: RfNode<MapNodeData>[] = useMemo(() => {
        if (!activePathway) return [];

        return positions.map(pos => {
            const node = activePathway.nodes.find(n => n.id === pos.id)!;
            const inFocus = nb ? nb.nodeIds.has(pos.id) : true;
            const isFocusNode = pos.id === focusId;

            return {
                id: pos.id,
                type: 'pathwayNode',
                position: { x: pos.x, y: pos.y },
                data: { node, inFocus, isFocusNode },
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                draggable: false,
            };
        });
    }, [activePathway, positions, nb, focusId]);

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

        const edges = activePathway.edges.map(e => {
            const inFocus = nb ? nb.edgeIds.has(e.id) : true;

            const sourceNode = activePathway.nodes.find(n => n.id === e.from);
            const fromCompleted = sourceNode?.progress.status === 'completed';

            if (fromCompleted) currentlyCompleted.add(e.id);

            // The trail draw-in plays for edges that *just* flipped to
            // completed this render. First-paint of an already-complete
            // pathway skips the animation so returning users don't see
            // every old edge redraw every time they open the map.
            const isFreshlyCompleted = fromCompleted && !seen.has(e.id);

            return {
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
            } satisfies RfEdge;
        });

        // Mark this render's set as "seen" for the next render so the
        // same edge doesn't animate twice.
        seenCompletedEdgesRef.current = currentlyCompleted;

        return edges;
    }, [activePathway, nb]);

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
                    // Single-click re-focuses; double-click opens detail.
                    setFocusId(node.id);
                }}
                onNodeDoubleClick={(_event, node) => {
                    history.push(`/pathways/node/${activePathway.id}/${node.id}`);
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
        </div>
    );
};

export default MapMode;
