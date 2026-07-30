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
import { Reorder } from 'framer-motion';
import {
    addOutline,
    alertCircleOutline,
    arrowBackOutline,
    cloudDownloadOutline,
    gitBranchOutline,
    warningOutline,
} from 'ionicons/icons';

import type { PathwayMap } from '../../core/composition';
import { detectCollections } from '../../map/collectionDetection';
import type { Pathway, PathwayNode } from '../../types';
import type { SummarizeContext } from '../summarize/summarizePolicy';
import type { Issue } from '../validate/validatePathway';
import NodeRow from './NodeRow';

/**
 * Per-node lookup: "is this node part of a detected collection, and
 * what position does it occupy?" Used by NodeRow to render the small
 * `1/5` chip next to the row title. Mirrors `collectionDetection`'s
 * outputs without the renderer having to re-run detection itself.
 */
interface CollectionLookup {
    [nodeId: string]: { index: number; size: number } | undefined;
}

const buildCollectionLookup = (pathway: Pathway): CollectionLookup => {
    const lookup: CollectionLookup = {};
    const groups = detectCollections(pathway);

    for (const g of groups) {
        g.memberIds.forEach((mid, i) => {
            lookup[mid] = { index: i + 1, size: g.memberIds.length };
        });
    }

    return lookup;
};

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

    /**
     * All issues for this pathway — used to render a count pill in
     * the header so authors know at a glance whether the pathway
     * needs attention.
     *
     * `ValidationBanner` (in the inspector) shows the detail. The
     * outline's job is just to surface "there's something to fix"
     * from 30,000 feet — error-first, then warning count.
     */
    issues?: Issue[];

    /**
     * "Reorder the steps" — commits a new ordering of the
     * top-level nodes array. Omit to disable drag-to-reorder (e.g.
     * in read-only review surfaces).
     */
    onReorder?: (orderedIds: string[]) => void;
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
    issues = [],
    onReorder,
}) => {
    const destinationId = pathway.destinationNodeId ?? null;
    const parent = findParentOf(pathway.id, allPathways);
    const nestedChildren = buildNestedChildMap(pathway, allPathways);

    // Collection-aware chip data. Re-runs on every edit; cheap
    // (O(V+E)) and keeps the chips in sync when the author adds or
    // removes a shared prereq from a collection member.
    const collectionLookup = buildCollectionLookup(pathway);

    // Count issues for the outline pill. We don't include other-node
    // issues (same filter the ValidationBanner uses) because those
    // don't belong to this pathway's surface — they belong to the
    // nested pathways the author drills into.
    const errorCount = issues.filter(i => i.level === 'error').length;
    const warningCount = issues.filter(i => i.level === 'warning').length;

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

            <header className="flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-2 min-w-0">
                    <h2 className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide">
                        Steps
                    </h2>

                    <span className="text-xs text-grayscale-500 tabular-nums">
                        {pathway.nodes.length}
                    </span>
                </div>

                {/* Validation pill — errors win over warnings when both
                    exist; no pill when the pathway is clean. */}
                {errorCount > 0 ? (
                    <IssuePill
                        level="error"
                        count={errorCount}
                        extraWarnings={warningCount}
                    />
                ) : warningCount > 0 ? (
                    <IssuePill level="warning" count={warningCount} />
                ) : null}
            </header>

            {pathway.nodes.length === 0 ? (
                <div className="p-4 rounded-[20px] border border-dashed border-grayscale-300 bg-grayscale-10 text-center">
                    <p className="text-xs text-grayscale-600 leading-relaxed">
                        No steps yet. Add one below or import a pathway.
                    </p>
                </div>
            ) : (
                <NodesList
                    pathway={pathway}
                    nestedChildren={nestedChildren}
                    allPathways={allPathways}
                    destinationId={destinationId}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onDrillIn={onDrillIn}
                    onReorder={onReorder}
                    summarizeContext={summarizeContext}
                    collectionLookup={collectionLookup}
                />
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
// IssuePill — small coloured count next to the "Steps" header.
// ---------------------------------------------------------------------------

const IssuePill: React.FC<{
    level: 'error' | 'warning';
    count: number;
    /** Extra warnings when the pill is already showing errors. */
    extraWarnings?: number;
}> = ({ level, count, extraWarnings = 0 }) => {
    const isError = level === 'error';

    // When errors exist alongside warnings, fold the total into a
    // single pill — two pills would be noisy at this zoom level.
    // ValidationBanner in the inspector still breaks them out per
    // issue, which is where the detail belongs.
    const labelN = count + extraWarnings;
    const labelSuffix = labelN === 1 ? '' : 's';

    return (
        <span
            className={`
                shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full
                text-[10px] font-semibold uppercase tracking-wide
                ${
                    isError
                        ? 'bg-red-50 text-red-700'
                        : 'bg-amber-50 text-amber-800'
                }
            `}
            aria-label={`${labelN} ${isError ? 'error' : 'warning'}${labelSuffix}`}
        >
            <IonIcon
                icon={isError ? alertCircleOutline : warningOutline}
                aria-hidden
                className="text-[11px]"
            />
            {labelN}
        </span>
    );
};

// ---------------------------------------------------------------------------
// NodesList — drag-to-reorder list, or static list when `onReorder`
// is omitted.
//
// We use framer-motion's `Reorder.Group` + `Reorder.Item` rather than
// adding `@dnd-kit/*`: it ships with the app already, handles touch /
// mouse / keyboard (hold space → arrow keys), and integrates with our
// layout animations.
//
// The group hands us the reordered values on drop; we map them back
// to ids and delegate to the caller's `onReorder(ids)` which typically
// threads into `buildOps.setNodeOrder`.
//
// NodeRow inside a Reorder.Item is a whole-row drag affordance —
// there's no dedicated "handle" because the outline rows are short
// enough that the handle would eat more space than it's worth. Tap
// still selects (Reorder only starts drag on pointer-move).
// ---------------------------------------------------------------------------

const NodesList: React.FC<{
    pathway: Pathway;
    nestedChildren: Map<string, Pathway>;
    allPathways: PathwayMap;
    destinationId: string | null;
    selectedId: string | null;
    onSelect: (nodeId: string) => void;
    onDrillIn: (pathwayId: string, nodeId?: string) => void;
    onReorder?: (orderedIds: string[]) => void;
    summarizeContext?: SummarizeContext;
    collectionLookup: CollectionLookup;
}> = ({
    pathway,
    nestedChildren,
    allPathways,
    destinationId,
    selectedId,
    onSelect,
    onDrillIn,
    onReorder,
    summarizeContext,
    collectionLookup,
}) => {
    // Static render when reordering is disabled — keeps the DOM
    // identical to pre-M5 in surfaces that opt out (e.g. tests,
    // read-only review).
    if (!onReorder) {
        return (
            <ul className="space-y-1.5">
                {pathway.nodes.map(n => (
                    <NodeListItem
                        key={n.id}
                        node={n}
                        nestedChildren={nestedChildren}
                        allPathways={allPathways}
                        destinationId={destinationId}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onDrillIn={onDrillIn}
                        summarizeContext={summarizeContext}
                        collectionLookup={collectionLookup}
                    />
                ))}
            </ul>
        );
    }

    return (
        <Reorder.Group
            axis="y"
            values={pathway.nodes}
            onReorder={nodes => onReorder(nodes.map(n => n.id))}
            className="space-y-1.5 list-none"
            /* framer-motion stamps an inline style; ensure the UL
               has no default padding/margin so the visual layout
               matches the static branch. */
            style={{ paddingInlineStart: 0, margin: 0 }}
        >
            {pathway.nodes.map(n => (
                <Reorder.Item
                    key={n.id}
                    value={n}
                    className="list-none"
                    /* whileDrag styling is additive — a subtle shadow
                       while the row is being moved gives the author
                       the "picking up" affordance without a full
                       skeuomorphic hand-off. */
                    whileDrag={{
                        scale: 1.01,
                        boxShadow: '0 6px 20px rgba(0,0,0,0.08)',
                        zIndex: 1,
                    }}
                >
                    <NodeListItemBody
                        node={n}
                        nestedChildren={nestedChildren}
                        allPathways={allPathways}
                        destinationId={destinationId}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        onDrillIn={onDrillIn}
                        summarizeContext={summarizeContext}
                        collectionLookup={collectionLookup}
                    />
                </Reorder.Item>
            ))}
        </Reorder.Group>
    );
};

const NodeListItem: React.FC<{
    node: PathwayNode;
    nestedChildren: Map<string, Pathway>;
    allPathways: PathwayMap;
    destinationId: string | null;
    selectedId: string | null;
    onSelect: (nodeId: string) => void;
    onDrillIn: (pathwayId: string, nodeId?: string) => void;
    summarizeContext?: SummarizeContext;
    collectionLookup: CollectionLookup;
}> = props => (
    <li>
        <NodeListItemBody {...props} />
    </li>
);

const NodeListItemBody: React.FC<{
    node: PathwayNode;
    nestedChildren: Map<string, Pathway>;
    allPathways: PathwayMap;
    destinationId: string | null;
    selectedId: string | null;
    onSelect: (nodeId: string) => void;
    onDrillIn: (pathwayId: string, nodeId?: string) => void;
    summarizeContext?: SummarizeContext;
    collectionLookup: CollectionLookup;
}> = ({
    node,
    nestedChildren,
    allPathways,
    destinationId,
    selectedId,
    onSelect,
    onDrillIn,
    summarizeContext,
    collectionLookup,
}) => {
    const nested = nestedChildren.get(node.id);

    return (
        <>
            <NodeRow
                node={node}
                isSelected={node.id === selectedId}
                isDestination={node.id === destinationId}
                onSelect={() => onSelect(node.id)}
                summarizeContext={summarizeContext}
                collectionInfo={collectionLookup[node.id]}
            />

            {nested && (
                <NestedSubtree
                    childPathway={nested}
                    allPathways={allPathways}
                    onDrillIn={onDrillIn}
                    summarizeContext={summarizeContext}
                    depth={1}
                />
            )}
        </>
    );
};

// ---------------------------------------------------------------------------
// NestedSubtree — indented child rows for inline-expandable composites.
//
// Recursive with a depth cap so deeply-nested graphs don't render an
// infinite tree. Past the cap we collapse to a "drill in" hint — the
// author can still navigate into deeper levels; we just don't try to
// render them all inline. Keeps the outline scannable.
// ---------------------------------------------------------------------------

const MAX_NESTED_DEPTH = 2;

const NestedSubtree: React.FC<{
    childPathway: Pathway;
    allPathways: PathwayMap;
    onDrillIn: (pathwayId: string, nodeId?: string) => void;
    summarizeContext?: SummarizeContext;
    depth: number;
}> = ({ childPathway, allPathways, onDrillIn, summarizeContext, depth }) => {
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

    const grandchildren = buildNestedChildMap(childPathway, allPathways);

    return (
        <ul className="ml-4 pl-3 mt-1 space-y-0.5 border-l-2 border-grayscale-200">
            {childPathway.nodes.map((n: PathwayNode) => {
                const grandchild = grandchildren.get(n.id);
                const canRecurse = !!grandchild && depth < MAX_NESTED_DEPTH;

                return (
                    <li key={n.id}>
                        <NodeRow
                            node={n}
                            isSelected={false}
                            isDestination={n.id === destId}
                            onSelect={() => onDrillIn(childPathway.id, n.id)}
                            nested
                            summarizeContext={summarizeContext}
                        />

                        {canRecurse && grandchild && (
                            <NestedSubtree
                                childPathway={grandchild}
                                allPathways={allPathways}
                                onDrillIn={onDrillIn}
                                summarizeContext={summarizeContext}
                                depth={depth + 1}
                            />
                        )}

                        {grandchild && !canRecurse && (
                            <div className="ml-4 pl-3 mt-0.5 text-[11px] text-grayscale-400 leading-snug">
                                Has {grandchild.nodes.length}{' '}
                                {grandchild.nodes.length === 1 ? 'more step' : 'more steps'} —
                                drill in to see them.
                            </div>
                        )}
                    </li>
                );
            })}
        </ul>
    );
};

export default OutlinePane;
