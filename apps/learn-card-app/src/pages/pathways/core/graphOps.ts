/**
 * Graph operations over a Pathway — pure, testable, no I/O.
 *
 * Phase 1: lives in-app. Promoted to `@learncard/pathways-core` at end of
 * Phase 1 once the surface is stable (docs § 15).
 *
 * All ops are O(V + E) with a single adjacency-list build. Callers that
 * need multiple queries should call `buildAdjacency` once and reuse the
 * result via the `*With` variants.
 */

import type { Edge, Pathway, PathwayNode } from '../types';

// -----------------------------------------------------------------
// Adjacency
// -----------------------------------------------------------------

export interface Adjacency {
    /** nodeId -> ids of its direct prerequisites (incoming prerequisite edges). */
    prereqs: Map<string, Set<string>>;
    /** nodeId -> ids of its direct dependents (outgoing prerequisite edges). */
    dependents: Map<string, Set<string>>;
    /** nodeId -> ids linked by non-prerequisite edges (siblings, alternatives, etc.). */
    related: Map<string, Set<string>>;
}

export const buildAdjacency = (pathway: Pathway): Adjacency => {
    const prereqs = new Map<string, Set<string>>();
    const dependents = new Map<string, Set<string>>();
    const related = new Map<string, Set<string>>();

    for (const node of pathway.nodes) {
        prereqs.set(node.id, new Set());
        dependents.set(node.id, new Set());
        related.set(node.id, new Set());
    }

    for (const edge of pathway.edges) {
        if (edge.type === 'prerequisite') {
            prereqs.get(edge.to)?.add(edge.from);
            dependents.get(edge.from)?.add(edge.to);
        } else {
            related.get(edge.from)?.add(edge.to);
            related.get(edge.to)?.add(edge.from);
        }
    }

    return { prereqs, dependents, related };
};

// -----------------------------------------------------------------
// Traversals
// -----------------------------------------------------------------

const traverse = (
    start: string,
    adjacency: Map<string, Set<string>>,
): Set<string> => {
    const visited = new Set<string>();
    const stack: string[] = [start];

    while (stack.length > 0) {
        const id = stack.pop()!;
        const neighbors = adjacency.get(id);

        if (!neighbors) continue;

        for (const next of neighbors) {
            if (!visited.has(next)) {
                visited.add(next);
                stack.push(next);
            }
        }
    }

    return visited;
};

/** All transitive prerequisites of `nodeId`. Does not include the node itself. */
export const ancestors = (pathway: Pathway, nodeId: string): Set<string> =>
    traverse(nodeId, buildAdjacency(pathway).prereqs);

/** All transitive dependents of `nodeId`. Does not include the node itself. */
export const descendants = (pathway: Pathway, nodeId: string): Set<string> =>
    traverse(nodeId, buildAdjacency(pathway).dependents);

/** True iff `to` is reachable from `from` following prerequisite edges. */
export const canReach = (pathway: Pathway, from: string, to: string): boolean =>
    descendants(pathway, from).has(to);

// -----------------------------------------------------------------
// Validation
// -----------------------------------------------------------------

export interface ValidationIssue {
    kind:
        | 'unknown-node-reference'
        | 'cycle'
        | 'duplicate-node-id'
        | 'duplicate-edge-id'
        | 'self-loop';
    message: string;
    nodeId?: string;
    edgeId?: string;
}

/**
 * Validate structural invariants:
 *   - No duplicate node IDs or edge IDs
 *   - Every edge endpoint references an existing node
 *   - No self-loops
 *   - No cycles in the prerequisite DAG
 *
 * Returns empty array iff the pathway is structurally sound.
 */
export const validatePathway = (pathway: Pathway): ValidationIssue[] => {
    const issues: ValidationIssue[] = [];

    const seenNodeIds = new Set<string>();

    for (const node of pathway.nodes) {
        if (seenNodeIds.has(node.id)) {
            issues.push({
                kind: 'duplicate-node-id',
                message: `Duplicate node id: ${node.id}`,
                nodeId: node.id,
            });
        }

        seenNodeIds.add(node.id);
    }

    const seenEdgeIds = new Set<string>();

    for (const edge of pathway.edges) {
        if (seenEdgeIds.has(edge.id)) {
            issues.push({
                kind: 'duplicate-edge-id',
                message: `Duplicate edge id: ${edge.id}`,
                edgeId: edge.id,
            });
        }

        seenEdgeIds.add(edge.id);

        if (edge.from === edge.to) {
            issues.push({
                kind: 'self-loop',
                message: `Edge ${edge.id} loops from ${edge.from} back to itself`,
                edgeId: edge.id,
            });
        }

        if (!seenNodeIds.has(edge.from)) {
            issues.push({
                kind: 'unknown-node-reference',
                message: `Edge ${edge.id} references unknown node ${edge.from}`,
                edgeId: edge.id,
            });
        }

        if (!seenNodeIds.has(edge.to)) {
            issues.push({
                kind: 'unknown-node-reference',
                message: `Edge ${edge.id} references unknown node ${edge.to}`,
                edgeId: edge.id,
            });
        }
    }

    // Cycle detection via DFS coloring on the prerequisite subgraph.
    const { dependents } = buildAdjacency(pathway);

    const WHITE = 0;
    const GRAY = 1;
    const BLACK = 2;
    const color = new Map<string, number>();

    for (const node of pathway.nodes) color.set(node.id, WHITE);

    const hasCycleFrom = (start: string): boolean => {
        const stack: Array<{ id: string; iter: Iterator<string> }> = [
            { id: start, iter: (dependents.get(start) ?? new Set()).values() },
        ];

        color.set(start, GRAY);

        while (stack.length > 0) {
            const top = stack[stack.length - 1];
            const next = top.iter.next();

            if (next.done) {
                color.set(top.id, BLACK);
                stack.pop();
                continue;
            }

            const nextColor = color.get(next.value);

            if (nextColor === GRAY) return true;

            if (nextColor === WHITE) {
                color.set(next.value, GRAY);
                stack.push({
                    id: next.value,
                    iter: (dependents.get(next.value) ?? new Set()).values(),
                });
            }
        }

        return false;
    };

    for (const node of pathway.nodes) {
        if (color.get(node.id) === WHITE && hasCycleFrom(node.id)) {
            issues.push({
                kind: 'cycle',
                message: `Cycle detected starting at node ${node.id}`,
                nodeId: node.id,
            });

            break;
        }
    }

    return issues;
};

// -----------------------------------------------------------------
// Node selection helpers
// -----------------------------------------------------------------

/**
 * Nodes available to work on right now: not completed, and all their
 * prerequisites are completed. This is the candidate set `scoreCandidate`
 * operates over.
 */
export const availableNodes = (pathway: Pathway): PathwayNode[] => {
    const { prereqs } = buildAdjacency(pathway);
    const completed = new Set(
        pathway.nodes.filter(n => n.progress.status === 'completed').map(n => n.id),
    );

    return pathway.nodes.filter(node => {
        if (node.progress.status === 'completed') return false;
        if (node.progress.status === 'skipped') return false;

        const requiredPrereqs = prereqs.get(node.id) ?? new Set();

        for (const prereqId of requiredPrereqs) {
            if (!completed.has(prereqId)) return false;
        }

        return true;
    });
};

/**
 * Root nodes — those with no prerequisites. Useful for onboarding and for
 * "where did this pathway start?" surfaces.
 */
export const rootNodes = (pathway: Pathway): PathwayNode[] => {
    const { prereqs } = buildAdjacency(pathway);

    return pathway.nodes.filter(n => (prereqs.get(n.id)?.size ?? 0) === 0);
};

// -----------------------------------------------------------------
// Prerequisite progress (Map gating)
// -----------------------------------------------------------------

export interface PrereqProgress {
    /** How many direct prerequisite nodes exist for this node. */
    total: number;
    /** How many of those prerequisites are in status `completed`. */
    met: number;
    /**
     * True iff there's at least one unmet prerequisite — i.e. the node
     * cannot be started yet. A root node (`total === 0`) is never
     * gated; a fully-satisfied node (`met === total`) is never gated.
     */
    gated: boolean;
}

/**
 * Direct prerequisite count + how many of them are completed, for a
 * single node. Pure, O(edges + prereqs). Separate from `availableNodes`
 * so the Map can render per-node gating state (e.g. "2 of 6 earned ·
 * Locked" on the destination) without recomputing adjacency per card.
 *
 * The Map calls this once per node render; for a 10k-node pathway the
 * caller should memoize `buildAdjacency` and fold in the completion
 * set themselves. For the sizes we actually see (O(10–100) nodes), the
 * straightforward call is fine.
 */
export const prereqProgress = (
    pathway: Pathway,
    nodeId: string,
): PrereqProgress => {
    const { prereqs } = buildAdjacency(pathway);
    const directPrereqs = prereqs.get(nodeId) ?? new Set<string>();
    const total = directPrereqs.size;

    if (total === 0) {
        return { total: 0, met: 0, gated: false };
    }

    let met = 0;

    for (const prereqId of directPrereqs) {
        const prereqNode = pathway.nodes.find(n => n.id === prereqId);
        if (prereqNode?.progress.status === 'completed') met += 1;
    }

    return { total, met, gated: met < total };
};

/** Edges of a given type. Keeps call sites declarative. */
export const edgesOfType = (pathway: Pathway, type: Edge['type']): Edge[] =>
    pathway.edges.filter(e => e.type === type);

// -----------------------------------------------------------------
// Neighborhoods (Map mode / progressive disclosure)
// -----------------------------------------------------------------

export interface Neighborhood {
    /** Node ids within `radius` hops of `focusId` on the undirected graph. */
    nodeIds: Set<string>;
    /** Edges with both endpoints inside `nodeIds`. */
    edgeIds: Set<string>;
    /** Depth from focus, keyed by node id. Focus node itself is depth 0. */
    depthByNode: Map<string, number>;
}

/**
 * Depth-N neighborhood around a focus node, treating the graph as
 * undirected (prerequisites AND related edges both expand). Used by
 * Map mode for the "depth-2 progressive disclosure" pattern in
 * docs § 10.
 */
export const neighborhood = (
    pathway: Pathway,
    focusId: string,
    radius: number,
): Neighborhood => {
    const { prereqs, dependents, related } = buildAdjacency(pathway);

    const combinedNeighbors = (id: string): Set<string> => {
        const out = new Set<string>();

        prereqs.get(id)?.forEach(n => out.add(n));
        dependents.get(id)?.forEach(n => out.add(n));
        related.get(id)?.forEach(n => out.add(n));

        return out;
    };

    const depthByNode = new Map<string, number>();

    if (!pathway.nodes.some(n => n.id === focusId)) {
        return { nodeIds: new Set(), edgeIds: new Set(), depthByNode };
    }

    depthByNode.set(focusId, 0);

    let frontier: string[] = [focusId];

    for (let depth = 1; depth <= radius; depth++) {
        const next: string[] = [];

        for (const id of frontier) {
            for (const neighbor of combinedNeighbors(id)) {
                if (!depthByNode.has(neighbor)) {
                    depthByNode.set(neighbor, depth);
                    next.push(neighbor);
                }
            }
        }

        frontier = next;
        if (frontier.length === 0) break;
    }

    const nodeIds = new Set(depthByNode.keys());

    const edgeIds = new Set(
        pathway.edges
            .filter(e => nodeIds.has(e.from) && nodeIds.has(e.to))
            .map(e => e.id),
    );

    return { nodeIds, edgeIds, depthByNode };
};
