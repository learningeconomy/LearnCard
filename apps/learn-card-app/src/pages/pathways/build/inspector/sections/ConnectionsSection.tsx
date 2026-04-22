/**
 * ConnectionsSection — prerequisite edges for this node.
 *
 * ## Collection-aware bulk authoring
 *
 * When the current step is part of a detected collection (see
 * `map/collectionDetection.ts`), the section adopts a second mode:
 * prereqs added here can be written to **every member** of the group
 * in one action. This is the authoring surface for the "Option 2"
 * shape we now support structurally — "Software Development is a
 * prerequisite of these 5 badges collectively" expressed as one
 * gesture instead of five identical edits.
 *
 * ## Design contract
 *
 *   - **Detect membership** — we re-run `detectCollections` on the
 *     live pathway each render. Cheap (O(V+E)) for realistic
 *     pathways; no memo dance needed, and it keeps the banner in
 *     sync with pathway edits the author has made.
 *   - **Default to bulk** — when a node is in a collection, the
 *     "Apply to all N" toggle starts enabled. The most common
 *     authoring intent on a collection member is "this prereq
 *     applies to the whole badge set." Authors who want
 *     per-member prereqs can flip it off, accepting that doing so
 *     may fragment the collection at re-detection time.
 *   - **Shared chip** — prereqs that are part of the group's
 *     `sharedPrereqIds` get a small "Shared" chip, telling the
 *     author "this one is applied to every member." Mirrors the
 *     Map's collapsed funnel so Build and Map read as the same
 *     mental model.
 *
 * ## What this section does NOT own
 *
 * - Downstream dependents (what *this* node unlocks). Future work.
 * - Stage-level `initiation` refs. Also future.
 * - Bulk-apply across non-detected sibling groups (e.g., 3 siblings
 *   sharing a target but below `MIN_COLLECTION_SIZE`). The detection
 *   module is the single source of truth for "is this a group,"
 *   and sub-threshold clumps stay opt-in via one-at-a-time editing.
 */

import React, { useMemo, useState } from 'react';

import { IonIcon } from '@ionic/react';
import { informationCircleOutline, linkOutline, peopleOutline } from 'ionicons/icons';

import { detectCollections } from '../../../map/collectionDetection';
import type { Pathway, PathwayNode } from '../../../types';
import { addEdge as addEdgeOp, removeEdge as removeEdgeOp } from '../../buildOps';
import Section from '../Section';

interface ConnectionsSectionProps {
    pathway: Pathway;
    node: PathwayNode;
    onChangePathway: (next: Pathway) => void;
}

const LABEL = 'text-xs font-medium text-grayscale-700';
const INPUT =
    'w-full py-2.5 px-3 border border-grayscale-300 rounded-xl text-sm text-grayscale-900 placeholder:text-grayscale-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-poppins';

/**
 * Add the same prereq to every member of a collection in one pass.
 * Threads the pathway through `addEdge` so the history stack sees a
 * single logical edit rather than N separate ones.
 */
const addEdgeToAll = (
    pathway: Pathway,
    fromId: string,
    memberIds: string[],
): Pathway =>
    memberIds.reduce(
        (p, memberId) => addEdgeOp(p, fromId, memberId, 'prerequisite'),
        pathway,
    );

/**
 * Remove the `fromId → memberId` prereq edge for every member in the
 * collection. Idempotent — missing edges are simply skipped by the
 * filter in `removeEdge`.
 */
const removeEdgeFromAll = (
    pathway: Pathway,
    fromId: string,
    memberIds: string[],
): Pathway => {
    const memberSet = new Set(memberIds);

    // Collect matching edge ids first so we don't walk the edge
    // array N times.
    const toRemove = pathway.edges.filter(
        e =>
            e.type === 'prerequisite' &&
            e.from === fromId &&
            memberSet.has(e.to),
    );

    return toRemove.reduce((p, edge) => removeEdgeOp(p, edge.id), pathway);
};

const ConnectionsSection: React.FC<ConnectionsSectionProps> = ({
    pathway,
    node,
    onChangePathway,
}) => {
    const prereqEdges = pathway.edges.filter(
        e => e.to === node.id && e.type === 'prerequisite',
    );

    // ----- Collection awareness ------------------------------------
    // Detect once per render. Cheap relative to the number of edits
    // the author is making and keeps the banner in sync with every
    // edge change. We only need the group this node happens to
    // belong to, so the lookup is a linear find.
    const collection = useMemo(() => {
        const groups = detectCollections(pathway);
        return groups.find(g => g.memberIds.includes(node.id)) ?? null;
    }, [pathway, node.id]);

    // Default bulk mode ON for collection members — the most common
    // authoring intent. Flipped state survives re-renders (React
    // default) but resets on node switch because `InspectorPane`
    // remounts via `key={node.id}`.
    const [applyToAll, setApplyToAll] = useState<boolean>(true);

    const bulkActive = !!collection && applyToAll;

    const candidatePrereqs = pathway.nodes.filter(
        n => n.id !== node.id && !prereqEdges.some(e => e.from === n.id),
    );

    const sharedPrereqSet = useMemo(
        () => new Set(collection?.sharedPrereqIds ?? []),
        [collection],
    );

    const handleAddPrereq = (fromId: string) => {
        if (!fromId) return;

        if (bulkActive && collection) {
            onChangePathway(addEdgeToAll(pathway, fromId, collection.memberIds));
            return;
        }

        onChangePathway(addEdgeOp(pathway, fromId, node.id, 'prerequisite'));
    };

    const handleRemovePrereq = (edgeId: string, fromId: string) => {
        if (bulkActive && collection) {
            onChangePathway(removeEdgeFromAll(pathway, fromId, collection.memberIds));
            return;
        }

        onChangePathway(removeEdgeOp(pathway, edgeId));
    };

    const summary =
        prereqEdges.length === 0
            ? 'No prerequisites'
            : prereqEdges.length === 1
              ? '1 prerequisite'
              : `${prereqEdges.length} prerequisites`;

    const memberIndex = collection
        ? collection.memberIds.indexOf(node.id) + 1
        : 0;

    return (
        <Section icon={linkOutline} title="Connections" summary={summary} defaultOpen={false}>
            <div className="space-y-3">
                {/*
                    Collection membership banner. Only shows when the
                    detector has folded this node into a group. Reads
                    like a wayfinding chip ("1 of 5 in a shared group")
                    rather than an editorial nag — the toggle below is
                    the actionable surface.
                */}
                {collection && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                        <IonIcon
                            icon={peopleOutline}
                            className="shrink-0 text-emerald-600 text-base mt-0.5"
                            aria-hidden
                        />

                        <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-xs font-medium text-emerald-900">
                                Step {memberIndex} of {collection.memberIds.length} in a shared group
                            </p>

                            <p className="text-[11px] text-emerald-800 leading-relaxed">
                                Changes you make here can apply to the whole group at once.
                            </p>
                        </div>
                    </div>
                )}

                {prereqEdges.length === 0 ? (
                    <p className="text-xs text-grayscale-500 leading-relaxed">
                        This step can be started anytime. Add a prerequisite to
                        gate it behind another step.
                    </p>
                ) : (
                    <ul className="space-y-1.5">
                        {prereqEdges.map(edge => {
                            const from = pathway.nodes.find(n => n.id === edge.from);
                            const isShared =
                                !!collection && sharedPrereqSet.has(edge.from);

                            return (
                                <li
                                    key={edge.id}
                                    className="flex items-center justify-between gap-2 py-2 px-3 rounded-xl border border-grayscale-200 bg-white"
                                >
                                    <div className="min-w-0 flex-1 flex items-center gap-2">
                                        <span className="text-sm text-grayscale-800 truncate">
                                            {from?.title ?? edge.from}
                                        </span>

                                        {isShared && (
                                            <span
                                                title="This prerequisite applies to every member of the group"
                                                className="shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-100 text-[10px] font-semibold uppercase tracking-wide text-emerald-700"
                                            >
                                                Shared
                                            </span>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleRemovePrereq(edge.id, edge.from)
                                        }
                                        className="shrink-0 text-xs text-grayscale-500 hover:text-red-700 transition-colors"
                                    >
                                        {bulkActive ? 'Remove from all' : 'Remove'}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                )}

                {/*
                    Bulk-apply toggle — shown only for collection
                    members. Flipping it changes the semantic of the
                    Add/Remove buttons below: "apply to this step" vs
                    "apply to all N." The toggle copy explicitly says
                    the count so the author never has to guess how
                    many edges a single click will write.
                */}
                {collection && (
                    <label className="flex items-start gap-2 p-2 rounded-xl bg-grayscale-10 border border-grayscale-200 cursor-pointer hover:bg-grayscale-50 transition-colors">
                        <input
                            type="checkbox"
                            checked={applyToAll}
                            onChange={e => setApplyToAll(e.target.checked)}
                            className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer"
                        />

                        <span className="text-xs text-grayscale-800 leading-relaxed">
                            Apply prerequisite changes to all{' '}
                            <span className="font-semibold">
                                {collection.memberIds.length} steps
                            </span>{' '}
                            in this group
                        </span>
                    </label>
                )}

                {candidatePrereqs.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                        <label className={LABEL} htmlFor="node-add-prereq">
                            {bulkActive
                                ? `Add a prerequisite to all ${collection!.memberIds.length} steps`
                                : 'Add a prerequisite step'}
                        </label>

                        <select
                            id="node-add-prereq"
                            className={INPUT}
                            value=""
                            onChange={e => {
                                handleAddPrereq(e.target.value);
                                e.target.value = '';
                            }}
                        >
                            <option value="">Pick a step…</option>

                            {candidatePrereqs.map(n => (
                                <option key={n.id} value={n.id}>
                                    {n.title || 'Untitled'}
                                </option>
                            ))}
                        </select>

                        {/*
                            Helpful hint shown ONLY when the author is
                            working outside bulk mode on a collection
                            member — flags the consequence before they
                            click. "Partial prereqs break the group"
                            is the kind of surprise we want to prevent
                            (it re-renders the 5 badges as 5 individual
                            cards on the Map the next time they switch
                            to that view).
                        */}
                        {collection && !applyToAll && (
                            <p className="flex items-start gap-1.5 pt-1 text-[11px] text-amber-800 leading-relaxed">
                                <IonIcon
                                    icon={informationCircleOutline}
                                    className="shrink-0 text-sm mt-0.5"
                                    aria-hidden
                                />

                                <span>
                                    Adding a prereq to just this step will split the group on the Map.
                                </span>
                            </p>
                        )}
                    </div>
                )}
            </div>
        </Section>
    );
};

export default ConnectionsSection;
