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
    NodeProgress,
    OutcomeSignal,
    Pathway,
    PathwayDiff,
    PathwayNode,
    Proposal,
} from '../types';
import { CURRENT_PATHWAY_SCHEMA_VERSION } from '../types';

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

// -----------------------------------------------------------------
// Outcome binding application
// -----------------------------------------------------------------

type OutcomeBindingPatch = NonNullable<Proposal['diff']['setOutcomeBindings']>[number];
type NodeCompletionPatch = NonNullable<PathwayDiff['completeNodes']>[number];

/**
 * Apply a set of outcome binding patches to the pathway's outcomes.
 *
 * Returns the *same* reference when nothing changes, so
 * `applyProposal` can preserve reference equality (and not emit a
 * phantom `outcomes` key) on proposals that don't touch outcomes.
 *
 * Unknown outcome ids are silently dropped — a stale proposal
 * referring to a deleted signal shouldn't wedge the pathway. The UI
 * that lists outcomes can separately surface "this proposal is
 * stale" based on the proposal's own lifecycle.
 */
const applyOutcomeBindings = (
    outcomes: readonly OutcomeSignal[] | undefined,
    patches: readonly OutcomeBindingPatch[] | undefined,
): OutcomeSignal[] | undefined => {
    if (!patches || patches.length === 0) return outcomes as OutcomeSignal[] | undefined;
    if (!outcomes || outcomes.length === 0) return outcomes as OutcomeSignal[] | undefined;

    const byId = new Map<string, OutcomeBindingPatch>();
    for (const patch of patches) byId.set(patch.outcomeId, patch);

    let changed = false;

    const next = outcomes.map(outcome => {
        const patch = byId.get(outcome.id);

        if (!patch) return outcome;

        // `binding: null` clears; anything else replaces. Always
        // produces a new reference so downstream equality checks
        // detect the change even when the value is structurally the
        // same as what was there.
        changed = true;

        if (patch.binding === null) {
            const { binding: _discard, ...rest } = outcome;

            return rest as OutcomeSignal;
        }

        return { ...outcome, binding: patch.binding } as OutcomeSignal;
    });

    return changed ? next : (outcomes as OutcomeSignal[]);
};

// -----------------------------------------------------------------
// Node completion application
// -----------------------------------------------------------------

/**
 * Fold a list of `completeNodes` patches into the pathway's node set,
 * returning the new node list (and whether anything changed so
 * callers can preserve reference equality when the diff is a no-op).
 *
 * Idempotency: nodes already in status `completed` are silently
 * skipped. This keeps replay, cross-device sync, and re-applying a
 * stale proposal from bumping progress or overwriting the original
 * `completedAt`.
 *
 * Unknown node ids are dropped. Same policy as outcome bindings —
 * a stale proposal shouldn't wedge the pathway.
 *
 * Evidence is recorded on `node.progress.terminationEvidence` when
 * supplied. The field is typed as `unknown` on `NodeProgress` today
 * (no Zod schema update needed yet — we store evidence on the
 * progress record as an auxiliary field that progress consumers
 * ignore; the Record builder / audit UI can read it directly when
 * it lands).
 */
const applyNodeCompletions = (
    nodes: readonly PathwayNode[],
    patches: readonly NodeCompletionPatch[] | undefined,
    now: string,
): { nodes: PathwayNode[]; changed: boolean } => {
    if (!patches || patches.length === 0) {
        return { nodes: nodes as PathwayNode[], changed: false };
    }

    const byId = new Map<string, NodeCompletionPatch>();
    for (const patch of patches) byId.set(patch.nodeId, patch);

    let changed = false;

    const next = nodes.map(node => {
        const patch = byId.get(node.id);

        if (!patch) return node;

        // Idempotent: once a node is completed, later patches are
        // silently dropped. Two replay events on the same credential
        // must not bump `completedAt` or double-record evidence.
        if (node.progress.status === 'completed') return node;

        changed = true;

        // Evidence is recorded as an auxiliary field on progress.
        // We avoid widening `NodeProgress` itself here — progress is
        // learner-owned state, and adding a first-class `evidence`
        // slot is a conversation the schema should have separately.
        // Stashing it as a companion property keeps the shape
        // compatible today; the Record builder and Audit UI can
        // read it by key without a migration.
        const progress: NodeProgress & { terminationEvidence?: unknown } = {
            ...node.progress,
            status: 'completed',
            completedAt: patch.completedAt,
        };

        if (patch.evidence) {
            progress.terminationEvidence = patch.evidence;
        }

        return {
            ...node,
            progress,
            updatedAt: now,
        };
    });

    return { nodes: next, changed };
};

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

    // Ownership invariant: a proposal's declared owner must match the
    // pathway it's being applied to. This is the client-side check
    // that becomes the server-side authorization check at wire-up.
    // Catches two classes of bug:
    //   - A mentor's propose-scoped edit routed into the wrong
    //     learner's store.
    //   - A replay / offline-queue bug that re-targets a proposal at
    //     someone else's pathway.
    // Exact string compare — no case folding, no anonymous bypass.
    if (proposal.ownerDid !== pathway.ownerDid) {
        throw new ProposalApplyError(
            `Proposal ${proposal.id} owner (${proposal.ownerDid}) does not match ` +
                `pathway ${pathway.id} owner (${pathway.ownerDid})`,
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

    const nodesAfterStructural = [...patchedNodes, ...additions];

    // Apply progress-driven completions. Runs over the post-structural
    // node set so a single proposal can legitimately add a node *and*
    // complete it in one shot (unusual but legal — e.g. a planner
    // proposal that adds a node already known to be satisfied by an
    // existing credential).
    const { nodes: nextNodes } = applyNodeCompletions(
        nodesAfterStructural,
        diff.completeNodes,
        now,
    );

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

    // Resolve the next outcome list. Outcome bindings are applied by id —
    // entries for unknown ids are silently dropped (stale proposal, deleted
    // outcome) so a cross-device replay can't wedge the pathway. `binding:
    // null` clears a prior binding; any other value replaces it. Bindings
    // are the only field `applyProposal` writes on an outcome — authoring
    // of signals themselves happens through other paths (Build mode,
    // import) because it's learner-owned, not agent-proposed state.
    const nextOutcomes = applyOutcomeBindings(pathway.outcomes, diff.setOutcomeBindings);

    const nextPathway: Pathway = {
        ...pathway,
        // Bump the revision counter for every proposal acceptance.
        // Proposals are structural edits — they must participate in
        // the same CAS hinge as learner-origin mutations so the
        // future server-side optimistic-concurrency write sees a
        // monotonic sequence regardless of who authored the change.
        // `?? 0` tolerates legacy pathways that pre-date the field.
        revision: (pathway.revision ?? 0) + 1,
        nodes: nextNodes,
        edges: nextEdges,
        updatedAt: now,
        // Only write the field when we have a usable route; otherwise
        // `...pathway` already carried the original, and we need to
        // actively strip it.
        ...(nextChosenRoute
            ? { chosenRoute: nextChosenRoute }
            : { chosenRoute: undefined }),
        ...(nextOutcomes !== pathway.outcomes ? { outcomes: nextOutcomes } : {}),
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
        revision: 0,
        schemaVersion: CURRENT_PATHWAY_SCHEMA_VERSION,
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
