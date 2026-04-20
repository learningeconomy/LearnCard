/**
 * NextActionCard — the hero of Today mode.
 *
 * One node. One primary action. The reasons array from the scorer
 * shows up as hint lines so the learner understands *why* this is
 * what we're asking them to pick up (docs § 5, § 8.1).
 */

import React from 'react';

import type { PathwayNode, ScoredCandidate } from '../types';

interface NextActionCardProps {
    node: PathwayNode;
    scored: ScoredCandidate;
    onOpen: () => void;
}

const policyCallToAction = (node: PathwayNode): string => {
    switch (node.stage.policy.kind) {
        case 'practice':
            return 'Log a practice session';
        case 'review':
            return 'Start the review';
        case 'assessment':
            return 'Start the assessment';
        case 'artifact':
            return 'Work on the artifact';
        case 'external':
            return 'Open the external tool';
    }
};

const NextActionCard: React.FC<NextActionCardProps> = ({
    node,
    scored,
    onOpen,
}) => (
    <article className="p-5 rounded-[24px] border border-grayscale-200 bg-white shadow-sm">
        <div className="space-y-4">
            <header className="space-y-1.5">
                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide">
                    Next step
                </p>

                <h2 className="text-lg font-semibold text-grayscale-900 leading-snug">
                    {node.title}
                </h2>

                {node.description && (
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {node.description}
                    </p>
                )}
            </header>

            {scored.reasons.length > 0 && (
                <ul className="space-y-1">
                    {scored.reasons.slice(0, 3).map(reason => (
                        <li
                            key={reason}
                            className="text-xs text-grayscale-500 flex items-start gap-1.5"
                        >
                            <span className="text-emerald-600 mt-[1px]">•</span>
                            <span>{reason}</span>
                        </li>
                    ))}
                </ul>
            )}

            <button
                type="button"
                onClick={onOpen}
                className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm
                           hover:opacity-90 transition-opacity mt-1"
            >
                {policyCallToAction(node)}
            </button>
        </div>
    </article>
);

export default NextActionCard;
