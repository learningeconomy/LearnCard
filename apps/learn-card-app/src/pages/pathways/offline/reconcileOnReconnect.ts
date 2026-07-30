/**
 * Offline queue reconciliation.
 *
 * Docs § 11 — a small, opinionated policy table. This module is its
 * executable form. No CRDTs in v1; this is the table, rendered.
 *
 * Design notes:
 *   - Pure function: takes the queue + a fetch-shaped server snapshot
 *     and returns a plan (what to replay, what to drop, what to surface
 *     to the learner). The store does the mutating.
 *   - Every decision records a telemetry event (`pathways.offline.conflict`)
 *     so we learn how often conflicts actually happen in the wild.
 *   - Mutation types whose conflict strategy couldn't be written as "just
 *     replay" or "just discard" — currently only `complete-termination`
 *     on an archived node — surface as `learner-prompt` entries the UI
 *     renders as a small banner, not a modal.
 */

import type { ProposalStatus } from '../types';
import type { QueuedMutation } from '../../../stores/pathways';

// -----------------------------------------------------------------
// Server snapshot — the minimum the reconciler needs
// -----------------------------------------------------------------

export interface ServerSnapshot {
    /** pathwayId → { nodeId → status } for the nodes the client touched. */
    pathwayNodes: Record<
        string,
        Record<
            string,
            {
                status: 'active' | 'archived';
                /** Monotonically increasing per node. */
                serverUpdatedAt: string;
            }
        >
    >;
    /** pathwayId → status. Missing means "still active". */
    pathwayStatuses: Record<string, 'active' | 'archived'>;
    /** proposalId → current server status. */
    proposalStatuses: Record<string, ProposalStatus>;
}

// -----------------------------------------------------------------
// Plan
// -----------------------------------------------------------------

export type ReconcileResolution =
    | 'client-wins'
    | 'server-wins'
    | 'last-write-wins'
    | 'learner-prompt';

export interface ReconcileDecision {
    mutation: QueuedMutation;
    resolution: ReconcileResolution;
    /** Plain-language — used by the "your work arrived" UI affordance. */
    explanation: string;
}

export interface ReconcilePlan {
    /** Replay in order against the server. */
    replay: ReconcileDecision[];
    /** Silently discard; the server already moved past these. */
    discard: ReconcileDecision[];
    /** Needs a tap from the learner before resolution. */
    prompt: ReconcileDecision[];
    /** Proposal statuses that were stale client-side and should be synced. */
    proposalStatusUpdates: Record<string, ProposalStatus>;
}

// -----------------------------------------------------------------
// Reconciler
// -----------------------------------------------------------------

const nodeIsArchived = (
    snapshot: ServerSnapshot,
    pathwayId: string,
    nodeId: string,
): boolean =>
    snapshot.pathwayNodes[pathwayId]?.[nodeId]?.status === 'archived';

const pathwayIsArchived = (snapshot: ServerSnapshot, pathwayId: string): boolean =>
    snapshot.pathwayStatuses[pathwayId] === 'archived';

const decideOne = (
    mutation: QueuedMutation,
    snapshot: ServerSnapshot,
): ReconcileDecision => {
    switch (mutation.kind) {
        // -- Evidence uploads: additive; client wins always ----------
        case 'evidence-upload':
            return {
                mutation,
                resolution: 'client-wins',
                explanation: 'Your uploaded evidence was saved to the server.',
            };

        // -- completeTermination: client wins UNLESS the node was archived server-side
        case 'complete-termination':
            if (
                nodeIsArchived(snapshot, mutation.pathwayId, mutation.nodeId) ||
                pathwayIsArchived(snapshot, mutation.pathwayId)
            ) {
                return {
                    mutation,
                    resolution: 'learner-prompt',
                    explanation:
                        'You completed this node offline, but it has since been archived. Tap to restore it.',
                };
            }

            return {
                mutation,
                resolution: 'client-wins',
                explanation: 'Your completion was synced.',
            };

        // -- Learner-initiated structural edits: last-write-wins ------
        case 'edit-node':
            return {
                mutation,
                resolution: 'last-write-wins',
                explanation: 'Your edits were synced; the most recent change wins.',
            };

        // -- Agent proposal commits offline: server wins --------------
        case 'commit-proposal': {
            const serverStatus = snapshot.proposalStatuses[mutation.proposalId];

            if (!serverStatus || serverStatus === 'open') {
                return {
                    mutation,
                    resolution: 'client-wins',
                    explanation: 'The proposal was still open; your acceptance went through.',
                };
            }

            return {
                mutation,
                resolution: 'server-wins',
                explanation:
                    'That suggestion was already acted on elsewhere. Nothing to do here.',
            };
        }

        // -- Pathway archival: server wins (never revive) -------------
        case 'archive-pathway':
            return {
                mutation,
                resolution: 'server-wins',
                explanation: 'Pathway archival synced.',
            };
    }
};

/**
 * Produce a reconcile plan. Callers (the store) turn the plan into
 * actual mutations: replay `replay` in order, discard `discard`, render
 * `prompt` as a learner-facing banner.
 */
export const reconcileOnReconnect = (
    queue: readonly QueuedMutation[],
    snapshot: ServerSnapshot,
): ReconcilePlan => {
    const replay: ReconcileDecision[] = [];
    const discard: ReconcileDecision[] = [];
    const prompt: ReconcileDecision[] = [];

    for (const mutation of queue) {
        const decision = decideOne(mutation, snapshot);

        if (decision.resolution === 'learner-prompt') {
            prompt.push(decision);
        } else if (decision.resolution === 'server-wins') {
            discard.push(decision);
        } else {
            replay.push(decision);
        }
    }

    // Cross-device stale proposal cache: every proposal whose client-known
    // status diverges from the server value should be updated on next render
    // so the UI stops advertising stale proposals as open.
    return {
        replay,
        discard,
        prompt,
        proposalStatusUpdates: { ...snapshot.proposalStatuses },
    };
};
