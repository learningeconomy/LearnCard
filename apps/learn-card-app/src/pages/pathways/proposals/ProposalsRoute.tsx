/**
 * ProposalsRoute — the agent-origin change queue.
 *
 * Lists every open proposal with full diff + accept / reject / modify
 * controls (docs § 7).
 *
 * Phase 3a ships a **Simulate agent** dev affordance at the bottom:
 * each capability button invokes `invokeAgent` with the scripted mock
 * provider, exercising the full pipeline (budget → dispatch → record →
 * propose → render). When the brain-service proxy lands in Phase 3b,
 * this affordance stays useful for offline / budget-exceeded testing.
 */

import React, { useState } from 'react';

import { AnalyticsEvents, useAnalytics } from '../../../analytics';
import { pathwayStore, proposalStore } from '../../../stores/pathways';
import { useLearnerDid } from '../hooks/useLearnerDid';
import { invokeAgent } from '../agents/proxy';
import type { Capability } from '../types';

import ProposalCard from './ProposalCard';

const DEV_CAPABILITIES: readonly Capability[] = [
    'planning',
    'interpretation',
    'nudging',
    'routing',
    'matching',
];

const ProposalsRoute: React.FC = () => {
    const open = proposalStore.use.openProposals();
    const activePathway = pathwayStore.use.activePathway();
    const analytics = useAnalytics();
    const learnerDid = useLearnerDid();

    const [simulating, setSimulating] = useState<Capability | null>(null);
    const [simError, setSimError] = useState<string | null>(null);

    const simulate = async (capability: Capability) => {
        setSimulating(capability);
        setSimError(null);

        try {
            const result = await invokeAgent(
                {
                    capability,
                    pathway: activePathway,
                    ownerDid: learnerDid,
                },
                (event, payload) => analytics.track(event, payload),
            );

            if (!result.ok) {
                setSimError(result.reason);

                analytics.track(AnalyticsEvents.PATHWAYS_AGENT_BUDGET_EXCEEDED, {
                    agent: capability,
                    tier: 'low',
                    cappedAt: result.cappedAt,
                });
            }
        } catch (err) {
            setSimError(err instanceof Error ? err.message : 'Simulation failed');
        } finally {
            setSimulating(null);
        }
    };

    return (
        <div className="max-w-xl mx-auto px-4 py-8 font-poppins space-y-5">
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
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        Nothing waiting. When an agent has a suggestion, it shows up here.
                    </p>
                </div>
            ) : (
                <ul className="space-y-4">
                    {open.map(proposal => (
                        <li key={proposal.id}>
                            <ProposalCard proposal={proposal} />
                        </li>
                    ))}
                </ul>
            )}

            <section className="mt-10 p-4 rounded-[20px] border border-dashed border-grayscale-300 bg-grayscale-10 space-y-3">
                <div>
                    <p className="text-xs font-semibold text-grayscale-500 uppercase tracking-wide">
                        Simulate agent
                    </p>

                    <p className="text-xs text-grayscale-500 leading-relaxed mt-0.5">
                        Phase 3a scripted proposals — no LLM. Use these to exercise the
                        accept / reject / modify pipeline end-to-end.
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    {DEV_CAPABILITIES.map(capability => {
                        const disabled =
                            simulating !== null ||
                            (capability !== 'matching' && !activePathway);

                        return (
                            <button
                                key={capability}
                                type="button"
                                disabled={disabled}
                                onClick={() => simulate(capability)}
                                className="py-2 px-3 rounded-full border border-grayscale-300 bg-white text-xs font-medium text-grayscale-700 hover:bg-grayscale-10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                {simulating === capability ? 'Working…' : capability}
                            </button>
                        );
                    })}
                </div>

                {simError && (
                    <p className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-xs text-amber-800 leading-relaxed">
                        {simError}
                    </p>
                )}
            </section>
        </div>
    );
};

export default ProposalsRoute;
