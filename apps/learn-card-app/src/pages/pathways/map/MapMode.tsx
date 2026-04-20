/**
 * MapMode — zoomed-out graph viewport with depth-2 progressive disclosure
 * around a focus node (docs § 10).
 *
 * React Flow handles pan / zoom / fit-view; we own:
 *   - the layout (`layoutPathway`)
 *   - the focus-node state and depth filter (`neighborhood`)
 *   - the visual depth-2 emphasis (full vs dimmed cards, via `MapNode`)
 */

import React, { useMemo, useState } from 'react';

import {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    ReactFlow,
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

const MapMode: React.FC = () => {
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

    const rfEdges: RfEdge[] = useMemo(() => {
        if (!activePathway) return [];

        return activePathway.edges.map(e => {
            const inFocus = nb ? nb.edgeIds.has(e.id) : true;

            return {
                id: e.id,
                source: e.from,
                target: e.to,
                type: 'smoothstep',
                animated: false,
                style: {
                    stroke: inFocus ? '#6F7590' : '#E2E3E9',
                    strokeWidth: inFocus ? 1.5 : 1,
                },
            };
        });
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

    return (
        <div className="w-full h-[calc(100vh-220px)] min-h-[420px] bg-grayscale-10">
            <ReactFlow
                nodes={rfNodes}
                edges={rfEdges}
                nodeTypes={NODE_TYPES}
                fitView
                fitViewOptions={{ padding: 0.25 }}
                minZoom={0.3}
                maxZoom={1.5}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                panOnDrag
                proOptions={{ hideAttribution: true }}
                onNodeClick={(_event, node) => {
                    // Single-click re-focuses; double-click would open detail.
                    // Phase 2: click = focus, separate "open" button lives on the detail page.
                    setFocusId(node.id);
                }}
                onNodeDoubleClick={(_event, node) => {
                    history.push(`/pathways/node/${activePathway.id}/${node.id}`);
                }}
            >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E2E3E9" />

                <Controls showInteractive={false} className="!shadow-none !border !border-grayscale-200 !rounded-xl" />

                <MiniMap
                    pannable
                    zoomable
                    className="!border !border-grayscale-200 !rounded-xl"
                    maskColor="rgba(239, 240, 245, 0.8)"
                />
            </ReactFlow>
        </div>
    );
};

export default MapMode;
