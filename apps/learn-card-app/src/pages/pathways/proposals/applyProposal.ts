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

import { pruneChosenRoute } from '../core/chosenRoute';
import { wouldCreateCycle, type PathwayMap } from '../core/composition';
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
// Composite invariant guard
// -----------------------------------------------------------------

/**
 * Enforce the composite policy ⇔ pathway-completed termination pairing
 * on a single node. The invariant is:
 *
 *   - if `policy.kind === 'composite'` then `termination.kind` must be
 *     `'pathway-completed'` AND both `pathwayRef`s must match.
 *   - if `termination.kind === 'pathway-completed'` then
 *     `policy.kind` must be `'composite'` (and refs must match).
 *
 * This is the one place in the system that validates the invariant
 * after a proposal-origin mutation. NodeEditor already enforces it for
 * learner-origin edits via `handlePolicyChange`. Proposals (which
 * bypass the editor) would otherwise be free to produce orphan
 * compositions, so we reject them here.
 */
const enforceCompositeInvariant = (node: PathwayNode): void => {
    const { policy, termination } = node.stage;

    const policyIsComposite = policy.kind === 'composite';
    const terminationIsPathwayCompleted = termination.kind === 'pathway-completed';

    if (policyIsComposite !== terminationIsPathwayCompleted) {
        throw new ProposalApplyError(
            `Node ${node.id}: composite policy must be paired with pathway-completed ` +
                `termination (got policy=${policy.kind}, termination=${termination.kind})`,
        );
    }

    if (policyIsComposite && terminationIsPathwayCompleted) {
        if (policy.pathwayRef !== termination.pathwayRef) {
            throw new ProposalApplyError(
                `Node ${node.id}: composite policy and pathway-completed termination ` +
                    `reference different pathways (${policy.pathwayRef} vs ${termination.pathwayRef})`,
            );
        }
    }
};

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

export interface ApplyProposalOptions {
    /**
     * Full pathway map for cross-pathway cycle detection. When a
     * proposal introduces or edits a composite node, we verify the
     * target pathway reference would not close a cycle against the
     * rest of the learner's graph. Omitting this falls back to a
     * same-pathway identity check — still correct for self-ref, but
     * can't catch A→B→A cycles.
     */
    allPathways?: PathwayMap;
}

/**
 * Apply an agent-origin diff to an existing pathway.
 *
 * Throws `ProposalApplyError` if:
 *   - the proposal targets a different pathway
 *   - updateNodes references a node id that doesn't exist
 *   - a node add would collide with an existing node id
 *   - any resulting node violates the composite ⇔ pathway-completed
 *     invariant, or a composite reference would create a cycle
 */
export const applyProposal = (
    pathway: Pathway,
    proposal: Proposal,
    now: string = new Date().toISOString(),
    options: ApplyProposalOptions = {},
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

    // Resolve the next chosenRoute. Priority order:
    //
    //   1. `diff.setChosenRoute` — an explicit route swap from the
    //      proposal itself. This is what What-If emits when the
    //      learner picks an alternative walk ("fast track", "skip
    //      externals", etc.) — non-destructive route editing in its
    //      purest form.
    //   2. Prune `pathway.chosenRoute` — a structural diff (add/remove
    //      nodes) that didn't name a new route: preserve what's still
    //      walkable, drop the rest.
    //
    // Either path runs through the same filter-by-surviving-ids
    // pipeline so the route can't reference a vanished node, and
    // either falls back to `undefined` when the result can't form a
    // walk. Re-seeding is intentionally *not* done here; the
    // `proposalActions` layer owns that decision (it knows the user's
    // intent — a Planner removing a node is different from a Router
    // swapping routes).
    const sourceRoute =
        diff.setChosenRoute !== undefined
            ? diff.setChosenRoute
            : pathway.chosenRoute;

    const nextChosenRoute = pruneChosenRoute(sourceRoute, nextNodeIdSet);

    const nextPathway: Pathway = {
        ...pathway,
        nodes: nextNodes,
        edges: nextEdges,
        updatedAt: now,
        // Only write the field when we have a usable route; otherwise
        // `...pathway` already carried the original, and we need to
        // actively strip it.
        ...(nextChosenRoute
            ? { chosenRoute: nextChosenRoute }
            : { chosenRoute: undefined }),
    };

    // -- Composite invariants (post-merge) --------------------------------
    //
    // Run after the final pathway shape is known so we validate the
    // effective state, not intermediate values. Violations here
    // indicate a broken agent proposal (or a corrupt replay) — reject
    // rather than silently committing an orphan composite.

    for (const node of nextPathway.nodes) {
        enforceCompositeInvariant(node);
    }

    // Composite cycle check — each composite node's `pathwayRef` must
    // not be reachable back to the parent pathway via other composite
    // edges. We fold the post-merge pathway into the caller's map so
    // the DFS sees the would-be state. Self-reference (ref === parent)
    // is always rejected, even without the broader map.
    const postMergeMap: PathwayMap = {
        ...(options.allPathways ?? {}),
        [nextPathway.id]: nextPathway,
    };

    for (const node of nextPathway.nodes) {
        if (node.stage.policy.kind !== 'composite') continue;

        const ref = node.stage.policy.pathwayRef;

        if (ref === nextPathway.id) {
            throw new ProposalApplyError(
                `Node ${node.id} composites the same pathway it lives in — self-reference not allowed`,
            );
        }

        if (wouldCreateCycle(postMergeMap, nextPathway.id, ref)) {
            throw new ProposalApplyError(
                `Node ${node.id} composites pathway ${ref}, which would create a composition cycle`,
            );
        }
    }

    return nextPathway;
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
