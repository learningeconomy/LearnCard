/**
 * TodayMode — one node, one action, zero distraction.
 *
 * Phase 0 stub. Phase 1 wires `getNextAction` from `today/ranking.ts`, the
 * StreakRibbon, IdentityBanner, and NextActionCard (docs § 5).
 */

import React from 'react';

import { pathwayStore } from '../../../stores/pathways';

const TodayMode: React.FC = () => {
    const activePathway = pathwayStore.use.activePathway();

    if (!activePathway) {
        return (
            <div className="max-w-md mx-auto px-4 py-12 font-poppins text-center">
                <h2 className="text-xl font-semibold text-grayscale-900 mb-2">
                    Nothing to do just yet
                </h2>

                <p className="text-sm text-grayscale-600 leading-relaxed mb-6">
                    Choose a pathway and Today will light up with your next step.
                </p>

                <a
                    href="/pathways/onboard"
                    className="inline-block py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity"
                >
                    Start a pathway
                </a>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto px-4 py-8 font-poppins space-y-5">
            <div>
                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide mb-1">
                    You are becoming
                </p>

                <p className="text-base text-grayscale-800 leading-relaxed">
                    {activePathway.goal}
                </p>
            </div>

            <div className="p-4 rounded-[20px] bg-grayscale-100 border border-grayscale-200">
                <p className="text-sm text-grayscale-600 italic">
                    Phase 0: NextActionCard lands in Phase 1, ranked by
                    <code className="mx-1 px-1 py-0.5 rounded bg-white text-grayscale-800">
                        scoreCandidate
                    </code>
                    with explicit reasons.
                </p>
            </div>
        </div>
    );
};

export default TodayMode;
