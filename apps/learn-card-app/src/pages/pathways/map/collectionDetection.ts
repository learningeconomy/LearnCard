/**
 * Collection detection — find fan-in sibling groups to collapse on the Map.
 *
 * ## The pattern
 *
 * Pathways frequently encode "earn N of these to unlock that":
 *
 *     Badge 1 ─┐
 *     Badge 2 ─┤
 *     Badge 3 ─┼─→  Certificate
 *     Badge 4 ─┤
 *      ...    ─┘
 *
 * Rendering 10 horizontal cards pointing at one card is visually chaotic
 * and scales poorly. Great-product UX instead collapses the feeder set
 * into a single "Earn 10 Badges (7/10 earned)" card with a stack of
 * representative images — an expandable aggregate, not a wall.
 *
 * ## Detection, precisely
 *
 * A group of nodes `G` is a `CollectionGroup` when ALL hold:
 *
 *   1. `|G| >= MIN_COLLECTION_SIZE` (default 4). Below that, showing the
 *      siblings individually is intentional, not chaotic.
 *   2. Every member has **exactly one** outgoing prerequisite edge, and
 *      they all point at the **same** target node `T`.
 *   3. No member has any incoming prerequisite edge — members are pure
 *      fan-in, not themselves gated by upstream nodes. This keeps the
 *      presentation-layer rewrite local: collapsing `G` can't strand
 *      an upstream edge that was feeding a member.
 *   4. No edges between members (implied by #3, asserted for safety).
 *   5. All members share the same `policy.kind` — a mixed group reads
 *      as "miscellaneous" and is better shown individually.
 *   6. Target `T` is not itself a member of `G` (would be a self-loop
 *      of sorts; also: if T is a node we want to keep it visible).
 *   7. None of the members is the pathway's `destinationNodeId` — the
 *      destination must always render as its own card so the learner
 *      sees the goal explicitly.
 *
 * ## What this module does NOT do
 *
 * - Rewrite the pathway data. Purely detects + describes.
 * - Modify layout. The caller (`MapMode`) decides how to render the
 *   group (collapsed or expanded) and how to position it.
 * - Care about progress. Progress rollup lives in presentation — the
 *   CollectionMapNode reads progress off its members directly.
 *
 * Separating detection from presentation keeps both trivially testable
 * and gives us a single seam to extend (e.g. richer heuristics, author
 * opt-out flags) without touching the Map.
 */

import type { Pathway, PathwayNode, Policy } from '../types';

import { buildAdjacency } from './../core/graphOps';

/** Threshold below which we render siblings individually. */
export const MIN_COLLECTION_SIZE = 4;

export interface CollectionGroup {
    /**
     * Synthetic id for this collection. Deterministic: derived from
     * the target node id, so renders are stable across re-detection
     * and React Flow doesn't churn the node identity.
     *
     * At most one collection can feed a given target (by #2 above),
     * so the target id is a sufficient key.
     */
    id: string;

    /**
     * Members in the order they appear in `pathway.nodes`. This is the
     * natural left-to-right ordering on the Map's layout, so the image
     * stack and expanded-list preserve author intent.
     */
    memberIds: string[];

    /** The shared downstream node every member edges to. */
    targetNodeId: string;

    /**
     * Edge ids that connect members to the target. The Map replaces
     * these N edges with a single `collection → target` edge. Listed
     * explicitly (not derived at render time) so the renderer doesn't
     * re-walk adjacency just to know what to drop.
     */
    edgeIds: string[];

    /**
     * Shared policy kind — used by the card to choose its avatar tone
     * and the progress framing ("earned" vs "completed" vs ...).
     */
    policyKind: Policy['kind'];
}

/**
 * Detect all collections in a pathway. Pure; O(V + E).
 *
 * Returns groups in target-node order for stability — two calls with
 * the same pathway return deep-equal output.
 */
export const detectCollections = (pathway: Pathway): CollectionGroup[] => {
    const { prereqs, dependents } = buildAdjacency(pathway);

    const nodeById = new Map(pathway.nodes.map(n => [n.id, n]));
    const destinationId = pathway.destinationNodeId ?? null;

    /**
     * Index members by "where they point": `target -> set of member
     * ids`. We only add a node to a bucket when it's shape-legal
     * (exactly one outgoing, no incoming, not the destination).
     */
    const candidatesByTarget = new Map<string, string[]>();

    for (const node of pathway.nodes) {
        if (node.id === destinationId) continue;

        const outgoing = dependents.get(node.id);
        if (!outgoing || outgoing.size !== 1) continue;

        const incoming = prereqs.get(node.id);
        if (incoming && incoming.size > 0) continue;

        // Single target — safe to read via iterator.
        const [targetId] = outgoing;

        // Target must exist in the pathway; guard against dangling
        // edges that slipped past validation.
        if (!nodeById.has(targetId)) continue;

        const bucket = candidatesByTarget.get(targetId) ?? [];
        bucket.push(node.id);
        candidatesByTarget.set(targetId, bucket);
    }

    // Stable member ordering: re-walk pathway.nodes to pick the
    // natural left-to-right order (Map layout honors it).
    const orderedIndex = new Map(pathway.nodes.map((n, i) => [n.id, i]));

    const groups: CollectionGroup[] = [];

    // Iterate targets in node-order too, so the resulting array is
    // stable across object-iteration changes.
    for (const target of pathway.nodes) {
        const memberIds = candidatesByTarget.get(target.id);
        if (!memberIds || memberIds.length < MIN_COLLECTION_SIZE) continue;

        // Shape parity — all members share the same policy kind. Mixed
        // groups get rendered individually.
        const kinds = new Set(
            memberIds.map(id => nodeById.get(id)!.stage.policy.kind),
        );
        if (kinds.size !== 1) continue;

        const sharedKind = [...kinds][0] as Policy['kind'];

        const sortedMembers = [...memberIds].sort(
            (a, b) => (orderedIndex.get(a) ?? 0) - (orderedIndex.get(b) ?? 0),
        );

        // Pick the specific edge ids so the Map can drop them without
        // re-walking the pathway.
        const memberSet = new Set(sortedMembers);
        const edgeIds = pathway.edges
            .filter(e => memberSet.has(e.from) && e.to === target.id)
            .map(e => e.id);

        groups.push({
            id: `collection-${target.id}`,
            memberIds: sortedMembers,
            targetNodeId: target.id,
            edgeIds,
            policyKind: sharedKind,
        });
    }

    return groups;
};

// ---------------------------------------------------------------------------
// Convenience indices
// ---------------------------------------------------------------------------

/**
 * Lightweight index structure the Map can precompute once and consult
 * during render. Not part of the detection API proper, but saves every
 * node renderer from doing a linear scan of `collections`.
 */
export interface CollectionIndex {
    /** `memberId -> group id` — tells the Map "skip this node, it's folded in". */
    memberToGroupId: Map<string, string>;

    /** `edgeId -> group id` — tells the edge renderer "drop this edge, it's collapsed". */
    edgeToGroupId: Map<string, string>;

    /** `group id -> group` — O(1) lookup from the synthetic node back to metadata. */
    byId: Map<string, CollectionGroup>;
}

export const buildCollectionIndex = (groups: CollectionGroup[]): CollectionIndex => {
    const memberToGroupId = new Map<string, string>();
    const edgeToGroupId = new Map<string, string>();
    const byId = new Map<string, CollectionGroup>();

    for (const g of groups) {
        byId.set(g.id, g);

        for (const memberId of g.memberIds) memberToGroupId.set(memberId, g.id);
        for (const edgeId of g.edgeIds) edgeToGroupId.set(edgeId, g.id);
    }

    return { memberToGroupId, edgeToGroupId, byId };
};

/**
 * Progress shape a renderer needs for one collection. Separated from
 * detection so the pure detector never has to touch node progress
 * (keeps detection inputs = pure topology).
 */
export interface CollectionProgress {
    completed: number;
    total: number;
    /** 0–1 fraction. `NaN`-safe; returns 0 when total is 0 (shouldn't happen). */
    fraction: number;
}

export const computeCollectionProgress = (
    group: CollectionGroup,
    pathway: Pathway,
): CollectionProgress => {
    const memberSet = new Set(group.memberIds);

    let completed = 0;
    let total = 0;

    for (const node of pathway.nodes) {
        if (!memberSet.has(node.id)) continue;

        total += 1;
        if (node.progress.status === 'completed') completed += 1;
    }

    return {
        completed,
        total,
        fraction: total === 0 ? 0 : completed / total,
    };
};
