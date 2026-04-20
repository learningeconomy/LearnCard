/**
 * ProposalsRoute — the agent-origin change queue.
 *
 * Phase 0 stub. Phase 3a lands the ProposalCard + ProposalDiff renderer
 * and the accept / reject / modify flow (docs § 7, § 17).
 */

import React from 'react';

import { proposalStore } from '../../../stores/pathways';

const ProposalsRoute: React.FC = () => {
    const open = proposalStore.use.openProposals();

    return (
        <div className="max-w-md mx-auto px-4 py-8 font-poppins space-y-4">
            <div>
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    Proposals
                </h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    Changes suggested by agents. You decide what lands.
                </p>
            </div>

            {open.length === 0 ? (
                <div className="p-6 rounded-[20px] bg-grayscale-100 border border-grayscale-200 text-center">
                    <p className="text-sm text-grayscale-600">
                        No proposals yet. Agents ship in Phase 3.
                    </p>
                </div>
            ) : (
                <ul className="space-y-3">
                    {open.map(proposal => (
                        <li
                            key={proposal.id}
                            className="p-4 rounded-2xl border border-grayscale-200 bg-white"
                        >
                            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide mb-1">
                                {proposal.capability}
                            </p>

                            <p className="text-sm text-grayscale-800 leading-relaxed">
                                {proposal.reason}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ProposalsRoute;
