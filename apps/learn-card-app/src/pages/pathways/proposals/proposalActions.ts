/**
 * Proposal actions — accept / reject / modify.
 *
 * The store-level verbs. Every UI affordance (ProposalCard buttons,
 * dev triggers, future deep-links) goes through these three so the
 * audit + telemetry story stays consistent.
 */

import { AnalyticsEvents, type EventPayload } from '../../../analytics';
import { pathwayStore, proposalStore } from '../../../stores/pathways';
import { reseedChosenRoute } from '../core/chosenRoute';
import type { Proposal } from '../types';

import {
    ProposalApplyError,
    applyProposal,
    materializeNewPathway,
} from './applyProposal';

type Track = (
    event: (typeof AnalyticsEvents)[keyof typeof AnalyticsEvents],
    payload: EventPayload<(typeof AnalyticsEvents)[keyof typeof AnalyticsEvents]>,
) => void;

export interface AcceptOptions {
    /** For cross-pathway materialization. Required when proposal.pathwayId === null. */
    ownerDid?: string;
    now?: string;
    track?: Track;
}

export class ProposalActionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ProposalActionError';
    }
}

// -----------------------------------------------------------------

const ageMs = (proposal: Proposal, now: string): number =>
    Math.max(0, new Date(now).getTime() - new Date(proposal.createdAt).getTime());

export const acceptProposal = (proposal: Proposal, opts: AcceptOptions = {}): void => {
    const now = opts.now ?? new Date().toISOString();

    if (proposal.status !== 'open') {
        throw new ProposalActionError(
            `Proposal ${proposal.id} is ${proposal.status}; only open proposals can be accepted.`,
        );
    }

    if (proposal.pathwayId === null) {
        // Cross-pathway: materialize a whole new pathway and set it active.
        if (!opts.ownerDid) {
            throw new ProposalActionError(
                'Cross-pathway proposals require an ownerDid on accept.',
            );
        }

        const pathway = materializeNewPathway(proposal, {
            ownerDid: opts.ownerDid,
            now,
        });

        pathwayStore.set.upsertPathway(pathway);
        pathwayStore.set.setActivePathway(pathway.id);
    } else {
        const existing = pathwayStore.get.pathways()[proposal.pathwayId];

        if (!existing) {
            throw new ProposalActionError(
                `Proposal ${proposal.id} targets pathway ${proposal.pathwayId}, which is not loaded.`,
            );
        }

        const applied = applyProposal(existing, proposal, now);

        // If the pre-diff pathway had a committed route but
        // applyProposal pruned it away (every route id was a casualty
        // of `removeNodeIds`), try to recover by seeding a fresh
        // route from the post-diff graph. This keeps Today's turn-
        // by-turn experience alive across structural proposals that
        // happen to wipe out the route — Planner adding a wholly new
        // chain, Router proposing a radical restructure, etc.
        //
        // Intentionally scoped: we never re-seed a pathway that
        // lacked a route to begin with (no-op on legacy pathways),
        // never re-seed when the proposal supplied its own
        // `setChosenRoute` (that's the learner's explicit choice —
        // honor it verbatim, even if it was empty), never override
        // a surviving route. The check is the cheapest way to
        // capture all three.
        const diffNamedRoute = proposal.diff.setChosenRoute !== undefined;
        const hadRouteBefore = (existing.chosenRoute?.length ?? 0) >= 2;
        const lostRouteAfter = (applied.chosenRoute?.length ?? 0) < 2;

        const next =
            !diffNamedRoute && hadRouteBefore && lostRouteAfter
                ? reseedChosenRoute(applied)
                : applied;

        pathwayStore.set.upsertPathway(next);
    }

    proposalStore.set.setStatus(proposal.id, 'accepted');

    opts.track?.(AnalyticsEvents.PATHWAYS_PROPOSAL_ACCEPTED, {
        proposalId: proposal.id,
        agent: proposal.agent,
        ageMs: ageMs(proposal, now),
    });
};

export const rejectProposal = (
    proposal: Proposal,
    opts: { now?: string; track?: Track } = {},
): void => {
    const now = opts.now ?? new Date().toISOString();

    if (proposal.status !== 'open') return;

    proposalStore.set.setStatus(proposal.id, 'rejected');

    opts.track?.(AnalyticsEvents.PATHWAYS_PROPOSAL_REJECTED, {
        proposalId: proposal.id,
        agent: proposal.agent,
        ageMs: ageMs(proposal, now),
    });
};

// Re-export so callers don't have to import from two files.
export { ProposalApplyError };
