/**
 * applyProposal — pure function that folds a `Proposal` into a `Pathway`.
 *
 * This is the commit seam. Every path from "learner accepted a
 * proposal" to "pathway changed" goes through here, which is exactly
 * what we want: one place to audit, test, and (later) intercept for
 * history / offline queueing / replay.
 *
 * Pure: no store access, no I/O. Callers turn the result into a store
 * mutation.
 *
 * Cross-pathway proposals (pathwayId === null, with a `newPathway` hint)
 * are handled by `materializeNewPathway`, which produces a fresh
 * `Pathway` instead of patching an existing one.
 */

import type {
    Edge,
    NodePatch,
    Pathway,
    PathwayNode,
    Proposal,
} from '../types';

// -----------------------------------------------------------------
// Errors
// -----------------------------------------------------------------

export class ProposalApplyError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ProposalApplyError';
    }
}

// -----------------------------------------------------------------
// In-pathway diff application
// -----------------------------------------------------------------

const mergeNodePatch = (node: PathwayNode, patch: NodePatch, now: string): PathwayNode => ({
    ...node,
    ...patch,
    // Preserve identity + provenance; proposals can't rewrite these.
    id: node.id,
    pathwayId: node.pathwayId,
    createdBy: node.createdBy,
    createdAt: node.createdAt,
    // Deep-merge the stage so partial policy/termination patches compose.
    stage: patch.stage
        ? {
              ...node.stage,
              ...patch.stage,
          }
        : node.stage,
    // Never let a patch silently blow away progress or endorsements;
    // those are learner-owned state, not authoring state.
    progress: node.progress,
    endorsements: node.endorsements,
    updatedAt: now,
});

/**
 * Apply an agent-origin diff to an existing pathway.
 *
 * Throws `ProposalApplyError` if:
 *   - the proposal targets a different pathway
 *   - updateNodes references a node id that doesn't exist
 *   - a node add would collide with an existing node id
 */
export const applyProposal = (
    pathway: Pathway,
    proposal: Proposal,
    now: string = new Date().toISOString(),
): Pathway => {
    if (proposal.pathwayId !== null && proposal.pathwayId !== pathway.id) {
        throw new ProposalApplyError(
            `Proposal ${proposal.id} targets pathway ${proposal.pathwayId}, not ${pathway.id}`,
        );
    }

    const { diff } = proposal;

    // -- Validation --------------------------------------------------------

    const nodeIdSet = new Set(pathway.nodes.map(n => n.id));

    for (const addition of diff.addNodes) {
        if (nodeIdSet.has(addition.id)) {
            throw new ProposalApplyError(
                `Proposal adds node ${addition.id}, but that id already exists`,
            );
        }
    }

    for (const patch of diff.updateNodes) {
        if (!nodeIdSet.has(patch.id)) {
            throw new ProposalApplyError(
                `Proposal patches unknown node ${patch.id}`,
            );
        }
    }

    // -- Build next node set ----------------------------------------------

    const patchById = new Map<string, NodePatch>();
    for (const patch of diff.updateNodes) patchById.set(patch.id, patch);

    const removeSet = new Set(diff.removeNodeIds);

    const patchedNodes: PathwayNode[] = pathway.nodes
        .filter(n => !removeSet.has(n.id))
        .map(n => {
            const patch = patchById.get(n.id);

            return patch ? mergeNodePatch(n, patch, now) : n;
        });

    // Stamp pathwayId onto inbound additions so callers can't mis-wire them.
    const additions = diff.addNodes.map(n => ({ ...n, pathwayId: pathway.id }));

    const nextNodes = [...patchedNodes, ...additions];

    // -- Build next edge set ----------------------------------------------

    const removedEdgeIds = new Set(diff.removeEdgeIds);
    const survivingEdges = pathway.edges.filter(e => !removedEdgeIds.has(e.id));

    // Any edge whose endpoint was removed is also gone (no ghost edges).
    const nextNodeIdSet = new Set(nextNodes.map(n => n.id));

    const cleanSurviving = survivingEdges.filter(
        e => nextNodeIdSet.has(e.from) && nextNodeIdSet.has(e.to),
    );

    // Validate incoming edges point at nodes that actually exist in the result.
    for (const edge of diff.addEdges) {
        if (!nextNodeIdSet.has(edge.from) || !nextNodeIdSet.has(edge.to)) {
            throw new ProposalApplyError(
                `Proposal adds edge ${edge.id} with unknown endpoint`,
            );
        }
    }

    // Dedupe by id (a re-applied proposal shouldn't double up).
    const edgeIdSet = new Set(cleanSurviving.map(e => e.id));
    const newEdges: Edge[] = [];

    for (const edge of diff.addEdges) {
        if (edgeIdSet.has(edge.id)) continue;
        edgeIdSet.add(edge.id);
        newEdges.push(edge);
    }

    const nextEdges = [...cleanSurviving, ...newEdges];

    return {
        ...pathway,
        nodes: nextNodes,
        edges: nextEdges,
        updatedAt: now,
    };
};

// -----------------------------------------------------------------
// Cross-pathway materialization
// -----------------------------------------------------------------

export interface MaterializeOptions {
    ownerDid: string;
    now?: string;
    makeId?: () => string;
}

/**
 * Produce a brand-new `Pathway` from a cross-pathway proposal
 * (`pathwayId === null`, with a `newPathway` hint). The proposal's
 * `diff.addNodes` / `diff.addEdges` describe the initial contents.
 *
 * This is the Matcher-capability path: "you should start a new pathway
 * about X". We keep it distinct from `applyProposal` so the type system
 * nudges callers toward the right one.
 */
export const materializeNewPathway = (
    proposal: Proposal,
    { ownerDid, now = new Date().toISOString(), makeId }: MaterializeOptions,
): Pathway => {
    if (proposal.pathwayId !== null) {
        throw new ProposalApplyError(
            `Proposal ${proposal.id} targets an existing pathway — use applyProposal`,
        );
    }

    const hint = proposal.diff.newPathway;

    if (!hint) {
        throw new ProposalApplyError(
            `Proposal ${proposal.id} is cross-pathway but has no newPathway hint`,
        );
    }

    const pathwayId = makeId ? makeId() : crypto.randomUUID();

    const nodes = proposal.diff.addNodes.map(n => ({ ...n, pathwayId }));
    const edges = proposal.diff.addEdges;

    return {
        id: pathwayId,
        ownerDid,
        title: hint.title,
        goal: hint.goal,
        nodes,
        edges,
        status: 'active',
        visibility: { self: true, mentors: false, guardians: false, publicProfile: false },
        source: 'generated',
        templateRef: hint.templateRef,
        createdAt: now,
        updatedAt: now,
    };
};
