/**
 * proposalStore — agent-origin changes awaiting learner commit.
 *
 * Proposals live in their own collection keyed by pathwayId (docs § 3.5).
 * Agents never write to pathwayStore directly; they write here via the
 * `proposalBus` and the learner accepts/rejects.
 */

import { createStore } from '@udecode/zustood';

import type { Proposal, ProposalStatus } from '../../pages/pathways/types';

interface ProposalStoreState {
    proposals: Record<string, Proposal>;
}

const initialState: ProposalStoreState = {
    proposals: {},
};

export const proposalStore = createStore('proposalStore')<ProposalStoreState>(
    initialState,
    // Persistence enabled alongside `pathwayStore` so agent-origin
    // proposals outlive navigation. Without this, a learner who
    // bounces off the app to an external issuer (claim link, OAuth)
    // returns to an empty Proposals tab — any pending auto-binds
    // from before the round-trip disappear. `invalidateStale` on
    // reconnect reconciles anything that changed server-side while
    // the client was away.
    { persist: { name: 'proposalStore', enabled: true } },
).extendActions(set => ({
    addProposal: (proposal: Proposal) => {
        set.state(draft => {
            draft.proposals[proposal.id] = proposal;
        });
    },

    setStatus: (proposalId: string, status: ProposalStatus) => {
        set.state(draft => {
            const proposal = draft.proposals[proposalId];

            if (proposal) proposal.status = status;
        });
    },

    removeProposal: (proposalId: string) => {
        set.state(draft => {
            delete draft.proposals[proposalId];
        });
    },

    /**
     * Invalidate stale cache entries on reconnect — covers the cross-device
     * case where Device A already accepted a proposal Device B still sees
     * as open (docs § 11).
     */
    invalidateStale: (latestById: Record<string, ProposalStatus>) => {
        set.state(draft => {
            for (const [id, status] of Object.entries(latestById)) {
                const existing = draft.proposals[id];

                if (existing && existing.status !== status) {
                    existing.status = status;
                }
            }
        });
    },
})).extendSelectors((state, get) => ({
    openProposals: (): Proposal[] =>
        Object.values(get.proposals()).filter(p => p.status === 'open'),

    openProposalsForPathway: (pathwayId: string): Proposal[] =>
        Object.values(get.proposals()).filter(
            p => p.status === 'open' && p.pathwayId === pathwayId,
        ),

    openProposalCount: (): number =>
        Object.values(get.proposals()).filter(p => p.status === 'open').length,
}));

export default proposalStore;
