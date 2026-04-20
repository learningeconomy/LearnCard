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

import type {
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
