/**
 * Pure helpers for Build mode.
 *
 * All operations return a new `Pathway` (or new `PathwayNode`) — never
 * mutate. Callers thread the result through `pathwayStore.upsertPathway`.
 *
 * Keeping Build's mutations pure means they're trivially testable and
 * reversible (the store's history layer can diff them cleanly).
 */

import { v4 as uuid } from 'uuid';

import {
    wouldCreateCycle,
    type PathwayMap,
} from '../core/composition';
import type {
    CompositeRenderStyle,
    Edge,
    EdgeType,
    Pathway,
    PathwayNode,
    Policy,
    Termination,
} from '../types';

// -----------------------------------------------------------------
// Timestamps — injectable for deterministic tests
// -----------------------------------------------------------------

export interface BuildOpOptions {
    now?: string;
    makeId?: () => string;
}

const resolve = (opts?: BuildOpOptions) => ({
    now: opts?.now ?? new Date().toISOString(),
    makeId: opts?.makeId ?? uuid,
});

// -----------------------------------------------------------------
// Default stages — the blank form for a fresh node
// -----------------------------------------------------------------

export const DEFAULT_POLICY: Policy = {
    kind: 'artifact',
    prompt: '',
    expectedArtifact: 'text',
};

export const DEFAULT_TERMINATION: Termination = {
    kind: 'self-attest',
    prompt: 'I did the work.',
};

// -----------------------------------------------------------------
// Node ops
// -----------------------------------------------------------------

export const addNode = (
    pathway: Pathway,
    draft: { title: string; description?: string },
    opts?: BuildOpOptions,
): Pathway => {
    const { now, makeId } = resolve(opts);

    const newNode: PathwayNode = {
        id: makeId(),
        pathwayId: pathway.id,
        title: draft.title,
        description: draft.description,
        stage: {
            initiation: [],
            policy: DEFAULT_POLICY,
            termination: DEFAULT_TERMINATION,
        },
        endorsements: [],
        progress: {
            status: 'not-started',
            artifacts: [],
            reviewsDue: 0,
            streak: { current: 0, longest: 0 },
        },
        createdBy: 'learner',
        createdAt: now,
        updatedAt: now,
    };

    return {
        ...pathway,
        nodes: [...pathway.nodes, newNode],
        updatedAt: now,
    };
};

/**
 * Remove a node. Also drops any edges that reference it — orphan edges
 * are never a valid state.
 */
export const removeNode = (
    pathway: Pathway,
    nodeId: string,
    opts?: BuildOpOptions,
): Pathway => {
    const { now } = resolve(opts);

    return {
        ...pathway,
        nodes: pathway.nodes.filter(n => n.id !== nodeId),
        edges: pathway.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
        updatedAt: now,
    };
};

export const updateNode = (
    pathway: Pathway,
    nodeId: string,
    patch: Partial<Pick<PathwayNode, 'title' | 'description'>>,
    opts?: BuildOpOptions,
): Pathway => {
    const { now } = resolve(opts);

    return {
        ...pathway,
        nodes: pathway.nodes.map(n =>
            n.id === nodeId ? { ...n, ...patch, updatedAt: now } : n,
        ),
        updatedAt: now,
    };
};

// -----------------------------------------------------------------
// Stage ops — per-node policy/termination replacement
// -----------------------------------------------------------------

export const setPolicy = (
    pathway: Pathway,
    nodeId: string,
    policy: Policy,
    opts?: BuildOpOptions,
): Pathway => {
    const { now } = resolve(opts);

    return {
        ...pathway,
        nodes: pathway.nodes.map(n =>
            n.id === nodeId
                ? {
                      ...n,
                      stage: { ...n.stage, policy },
                      updatedAt: now,
                  }
                : n,
        ),
        updatedAt: now,
    };
};

export const setTermination = (
    pathway: Pathway,
    nodeId: string,
    termination: Termination,
    opts?: BuildOpOptions,
): Pathway => {
    const { now } = resolve(opts);

    return {
        ...pathway,
        nodes: pathway.nodes.map(n =>
            n.id === nodeId
                ? {
                      ...n,
                      stage: { ...n.stage, termination },
                      updatedAt: now,
                  }
                : n,
        ),
        updatedAt: now,
    };
};

// -----------------------------------------------------------------
// Destination
// -----------------------------------------------------------------

/**
 * Set (or clear) the pathway's destination node — the terminal the
 * learner is ultimately earning.
 *
 * Passing `null` clears `destinationNodeId`; passing a node id that
 * doesn't belong to this pathway is a no-op (returns the input
 * unchanged). The uniqueness constraint lives in the schema
 * (`destinationNodeId` is a single optional field, not a boolean on
 * each node), so we don't need to "unset" anyone else here — writing
 * to this one field is the atomic flip.
 */
export const setDestinationNode = (
    pathway: Pathway,
    nodeId: string | null,
    opts?: BuildOpOptions,
): Pathway => {
    const { now } = resolve(opts);

    // Defensive: ignore node ids that don't exist in this pathway.
    // A stale id here would silently persist an unreachable
    // destination; returning unchanged makes the bug louder.
    if (nodeId !== null && !pathway.nodes.some(n => n.id === nodeId)) {
        return pathway;
    }

    // No-op if the destination is already what we were asked for.
    // Preserves object identity so callers that use `===` to detect
    // changes don't trigger spurious re-renders.
    if ((pathway.destinationNodeId ?? null) === nodeId) return pathway;

    return {
        ...pathway,
        destinationNodeId: nodeId ?? undefined,
        updatedAt: now,
    };
};

// -----------------------------------------------------------------
// Composite (nesting + composition) ops
//
// A "composite" node represents completion of another pathway. We
// model it with *paired* policy + termination — authoring flips both
// atomically so we can never store a composite policy alongside an
// unrelated termination.
// -----------------------------------------------------------------

export const DEFAULT_COMPOSITE_RENDER_STYLE: CompositeRenderStyle =
    'inline-expandable';

/**
 * Build the `(policy, termination)` pair for a composite node that
 * references `pathwayRef`. Co-located so authoring tools don't need
 * to know the invariant "composite policy ⇔ pathway-completed
 * termination" — they just call this helper.
 */
export const makeCompositeStage = (
    pathwayRef: string,
    renderStyle: CompositeRenderStyle = DEFAULT_COMPOSITE_RENDER_STYLE,
): { policy: Policy; termination: Termination } => ({
    policy: { kind: 'composite', pathwayRef, renderStyle },
    termination: { kind: 'pathway-completed', pathwayRef },
});

/**
 * Structured result from attempting to turn a node into a composite
 * reference. Callers render the refusal reason rather than silently
 * no-op'ing.
 */
export type SetCompositeResult =
    | { ok: true; pathway: Pathway }
    | { ok: false; reason: 'cycle' | 'self' | 'missing-target' };

/**
 * Convert a node into a composite reference pointing at `pathwayRef`.
 * Enforces that embedding doesn't create a cycle across the pathway
 * reference graph (see `core/composition#wouldCreateCycle`).
 *
 * Returns a tagged result so UI can render the rejection reason —
 * "would create a cycle" is a legitimate author-facing message, not an
 * assertion failure.
 */
export const setCompositePolicy = (
    pathway: Pathway,
    nodeId: string,
    pathwayRef: string,
    pathways: PathwayMap,
    renderStyle: CompositeRenderStyle = DEFAULT_COMPOSITE_RENDER_STYLE,
    opts?: BuildOpOptions,
): SetCompositeResult => {
    if (pathway.id === pathwayRef) return { ok: false, reason: 'self' };

    if (!pathways[pathwayRef]) return { ok: false, reason: 'missing-target' };

    if (wouldCreateCycle(pathways, pathway.id, pathwayRef)) {
        return { ok: false, reason: 'cycle' };
    }

    const { policy, termination } = makeCompositeStage(pathwayRef, renderStyle);

    const withPolicy = setPolicy(pathway, nodeId, policy, opts);
    const withTermination = setTermination(withPolicy, nodeId, termination, opts);

    return { ok: true, pathway: withTermination };
};

/**
 * Add a new node pre-wired as a composite reference. Convenience so
 * "Import from Credential Engine as a sub-step" and "Insert nested
 * pathway" flows don't have to call `addNode` + `setCompositePolicy`
 * back-to-back.
 */
export const addPathwayRefNode = (
    pathway: Pathway,
    draft: {
        title: string;
        description?: string;
        pathwayRef: string;
        renderStyle?: CompositeRenderStyle;
    },
    pathways: PathwayMap,
    opts?: BuildOpOptions,
): SetCompositeResult => {
    const withNode = addNode(
        pathway,
        { title: draft.title, description: draft.description },
        opts,
    );

    const newNode = withNode.nodes[withNode.nodes.length - 1];

    return setCompositePolicy(
        withNode,
        newNode.id,
        draft.pathwayRef,
        pathways,
        draft.renderStyle,
        opts,
    );
};

// -----------------------------------------------------------------
// Edge ops
// -----------------------------------------------------------------

export const addEdge = (
    pathway: Pathway,
    from: string,
    to: string,
    type: EdgeType = 'prerequisite',
    opts?: BuildOpOptions,
): Pathway => {
    const { now, makeId } = resolve(opts);

    if (from === to) return pathway;

    // Don't duplicate an identical edge.
    const exists = pathway.edges.some(
        e => e.from === from && e.to === to && e.type === type,
    );

    if (exists) return pathway;

    const edge: Edge = { id: makeId(), from, to, type };

    return {
        ...pathway,
        edges: [...pathway.edges, edge],
        updatedAt: now,
    };
};

export const removeEdge = (
    pathway: Pathway,
    edgeId: string,
    opts?: BuildOpOptions,
): Pathway => {
    const { now } = resolve(opts);

    return {
        ...pathway,
        edges: pathway.edges.filter(e => e.id !== edgeId),
        updatedAt: now,
    };
};
