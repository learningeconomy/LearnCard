/**
 * OutlinePane — left side of the Builder.
 *
 * M3: each node row may render its nested-pathway children inline
 * when the node's policy is `composite` with
 * `renderStyle: 'inline-expandable'` and a resolvable `pathwayRef`.
 * Children are visual scaffolding — clicking one drills into that
 * pathway rather than selecting it in the parent's inspector (the
 * inspector only edits nodes of the active pathway).
 *
 * Also renders a breadcrumb at the top when the currently-active
 * pathway is itself embedded as a nested child of another pathway.
 * Tapping the breadcrumb navigates back to the parent. We show just
 * the first parent we find — in practice a nested pathway is
 * usually referenced from one place, and "all referencers" would
 * need a disambiguation UI that's overkill for M3.
 *
 * The three action buttons (Add step / Nest a pathway / Import)
 * keep their visual hierarchy — filled → outlined → text — encoding
 * frequency of use.
 */

import React from 'react';

import { IonIcon } from '@ionic/react';
import {
    addOutline,
    arrowBackOutline,
    cloudDownloadOutline,
    gitBranchOutline,
} from 'ionicons/icons';

import type { PathwayMap } from '../../core/composition';
import type { Pathway, PathwayNode } from '../../types';
import type { SummarizeContext } from '../summarize/summarizePolicy';
import NodeRow from './NodeRow';

interface OutlinePaneProps {
    pathway: Pathway;
    allPathways: PathwayMap;
    selectedId: string | null;
    onSelect: (nodeId: string) => void;
    onAddNode: () => void;
    onAddNestedPathway: () => void;
    onOpenImport: () => void;
    /**
     * Navigate into a different pathway — triggered by clicking a
     * nested child row, or by tapping the parent breadcrumb.
     */
    onDrillIn: (pathwayId: string, nodeId?: string) => void;
    summarizeContext?: SummarizeContext;
}

// Find the first pathway that embeds `childId` as a composite child.
// O(pathways × nodes), but the counts are small and this runs once
// per render of the outline — no need to memoise.
const findParentOf = (
    childId: string,
    allPathways: PathwayMap,
): Pathway | null => {
    for (const p of Object.values(allPathways)) {
        if (p.id === childId) continue;

        for (const n of p.nodes) {
            if (n.stage.policy.kind !== 'composite') continue;
            if (n.stage.policy.pathwayRef === childId) return p;
        }
    }

    return null;
};

/**
 * Which composite-node-id → nested pathway map applies to this
 * outline? Built once per render so `NestedRows` can bail out early
 * without re-walking the policy for each node.
 */
const buildNestedChildMap = (
    pathway: Pathway,
    allPathways: PathwayMap,
): Map<string, Pathway> => {
    const map = new Map<string, Pathway>();

    for (const node of pathway.nodes) {
        const policy = node.stage.policy;

        if (policy.kind !== 'composite') continue;
        if (policy.renderStyle !== 'inline-expandable') continue;
        if (!policy.pathwayRef) continue;

        const child = allPathways[policy.pathwayRef];

        if (child) map.set(node.id, child);
    }

    return map;
};

const OutlinePane: React.FC<OutlinePaneProps> = ({
    pathway,
    allPathways,
    selectedId,
    onSelect,
    onAddNode,
    onAddNestedPathway,
    onOpenImport,
    onDrillIn,
    summarizeContext,
}) => {
    const destinationId = pathway.destinationNodeId ?? null;
    const parent = findParentOf(pathway.id, allPathways);
    const nestedChildren = buildNestedChildMap(pathway, allPathways);

    return (
        <aside className="space-y-3 font-poppins" aria-label="Pathway outline">
            {/*
                Breadcrumb: only shown when this pathway is embedded
                somewhere else. Clicking navigates back to the parent.
                Rendered above the section header so it reads as
                navigation chrome, not content.
            */}
            {parent && (
                <button
                    type="button"
                    onClick={() => onDrillIn(parent.id)}
                    className="w-full inline-flex items-center gap-1.5 px-1 py-1 text-xs text-grayscale-500 hover:text-grayscale-900 transition-colors"
                >
                    <IonIcon icon={arrowBackOutline} aria-hidden className="text-sm" />

                    <span className="truncate">
                        Back to{' '}
                        <span className="font-medium text-grayscale-700">
                            {parent.title}
                        </span>
                    </span>
                </button>
            )}

            <header className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide">
                    Steps
                </h2>

                <span className="text-xs text-grayscale-500 tabular-nums">
                    {pathway.nodes.length}
                </span>
            </header>

            {pathway.nodes.length === 0 ? (
                <div className="p-4 rounded-[20px] border border-dashed border-grayscale-300 bg-grayscale-10 text-center">
                    <p className="text-xs text-grayscale-600 leading-relaxed">
                        No steps yet. Add one below or import a pathway.
                    </p>
                </div>
            ) : (
                <ul className="space-y-1.5">
                    {pathway.nodes.map(n => {
                        const nested = nestedChildren.get(n.id);

                        return (
                            <li key={n.id}>
                                <NodeRow
                                    node={n}
                                    isSelected={n.id === selectedId}
                                    isDestination={n.id === destinationId}
                                    onSelect={() => onSelect(n.id)}
                                    summarizeContext={summarizeContext}
                                />

                                {nested && (
                                    <NestedSubtree
                                        childPathway={nested}
                                        onDrillIn={onDrillIn}
                                        summarizeContext={summarizeContext}
                                    />
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="space-y-1.5 pt-1">
                <button
                    type="button"
                    onClick={onAddNode}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[20px] bg-grayscale-900 text-white text-sm font-medium hover:opacity-90 transition-opacity"
                >
                    <IonIcon icon={addOutline} aria-hidden className="text-base" />
                    Add step
                </button>

                <button
                    type="button"
                    onClick={onAddNestedPathway}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[20px] border border-grayscale-300 text-sm font-medium text-grayscale-700 hover:bg-grayscale-10 transition-colors"
                >
                    <IonIcon icon={gitBranchOutline} aria-hidden className="text-base" />
                    Nest a pathway
                </button>

                <button
                    type="button"
                    onClick={onOpenImport}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-[20px] text-sm font-medium text-grayscale-600 hover:text-grayscale-900 hover:bg-grayscale-10 transition-colors"
                >
                    <IonIcon
                        icon={cloudDownloadOutline}
                        aria-hidden
                        className="text-base"
                    />
                    Import from Credential Engine
                </button>
            </div>
        </aside>
    );
};

// ---------------------------------------------------------------------------
// NestedSubtree — indented child rows for inline-expandable composites.
// ---------------------------------------------------------------------------

const NestedSubtree: React.FC<{
    childPathway: Pathway;
    onDrillIn: (pathwayId: string, nodeId?: string) => void;
    summarizeContext?: SummarizeContext;
}> = ({ childPathway, onDrillIn, summarizeContext }) => {
    // Destination of the nested pathway — we surface its flag on
    // the child rows just like the top-level outline does. This
    // keeps visual semantics consistent across nesting depth.
    const destId = childPathway.destinationNodeId ?? null;

    // Empty nested pathway shouldn't render as silent whitespace.
    // A tiny hint nudges the author to fill it in.
    if (childPathway.nodes.length === 0) {
        return (
            <div className="ml-4 pl-3 mt-1 border-l-2 border-grayscale-200 py-1.5">
                <p className="text-[11px] text-grayscale-400 italic">
                    {childPathway.title} has no steps yet.
                </p>
            </div>
        );
    }

    return (
        <ul className="ml-4 pl-3 mt-1 space-y-0.5 border-l-2 border-grayscale-200">
            {childPathway.nodes.map((n: PathwayNode) => (
                <li key={n.id}>
                    <NodeRow
                        node={n}
                        isSelected={false}
                        isDestination={n.id === destId}
                        onSelect={() => onDrillIn(childPathway.id, n.id)}
                        nested
                        summarizeContext={summarizeContext}
                    />
                </li>
            ))}
        </ul>
    );
};

export default OutlinePane;
