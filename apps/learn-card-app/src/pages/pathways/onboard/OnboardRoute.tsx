/**
 * OnboardRoute — cold-start / first-mile flow (docs § 6).
 *
 * Phase 0 stub. Phase 1 lands GoalCapture + CredentialScan + SuggestionGrid,
 * driven by a vector-first / LLM-maybe PlannerAgent.seed() pipeline.
 */

import React from 'react';

const OnboardRoute: React.FC = () => (
    <div className="max-w-md mx-auto px-4 py-10 font-poppins space-y-5">
        <div>
            <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                Let's find what's next
            </h2>

            <p className="text-sm text-grayscale-600 leading-relaxed">
                Phase 1 will synthesize the credentials you already have and suggest 3–5
                pathways you could start today. Zero setup.
            </p>
        </div>

        <div className="p-4 rounded-[20px] bg-grayscale-100 border border-grayscale-200">
            <p className="text-sm text-grayscale-600 italic">
                Onboarding flow scaffolded but not yet wired — see{' '}
                <code className="px-1 py-0.5 rounded bg-white text-grayscale-800">
                    docs/pathways-architecture.md § 6
                </code>
                .
            </p>
        </div>
    </div>
);

export default OnboardRoute;
