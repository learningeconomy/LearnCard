/**
 * SuggestionGrid — step 3 of onboarding.
 *
 * Renders the ranked suggestions from `suggestPathways`. The learner
 * taps a card; the caller instantiates the template and redirects to
 * Today. See docs § 6.
 */

import React from 'react';

import type { PathwaySuggestion } from './suggestPathways';

interface SuggestionGridProps {
    suggestions: readonly PathwaySuggestion[];
    onPick: (suggestion: PathwaySuggestion) => void;
    onBack: () => void;
    /** Rendered as a subdued summary above the grid. */
    goalText?: string;
}

const SuggestionGrid: React.FC<SuggestionGridProps> = ({
    suggestions,
    onPick,
    onBack,
    goalText,
}) => (
    <div className="max-w-md mx-auto px-4 py-10 font-poppins space-y-5">
        <div>
            <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide mb-1">
                Step 3 of 3
            </p>

            <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                Pick a starting pathway
            </h2>

            <p className="text-sm text-grayscale-600 leading-relaxed">
                {goalText
                    ? 'Ranked against what you told us and what we saw in your wallet.'
                    : 'Three good first pathways for people in transition.'}
            </p>
        </div>

        <ul className="space-y-3">
            {suggestions.map((suggestion, i) => (
                <li key={suggestion.template.id}>
                    <button
                        type="button"
                        onClick={() => onPick(suggestion)}
                        className="w-full text-left p-4 rounded-2xl border border-grayscale-300 bg-white
                                   hover:border-grayscale-900 hover:bg-grayscale-10 transition-colors
                                   focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                            <h3 className="text-base font-semibold text-grayscale-900">
                                {suggestion.template.title}
                            </h3>

                            {i === 0 && (
                                <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
                                    Top match
                                </span>
                            )}
                        </div>

                        <p className="text-sm text-grayscale-600 leading-relaxed mb-3">
                            {suggestion.template.summary}
                        </p>

                        <ul className="space-y-1">
                            {suggestion.reasons.slice(0, 2).map(reason => (
                                <li
                                    key={reason}
                                    className="text-xs text-grayscale-500 flex items-start gap-1.5"
                                >
                                    <span className="text-emerald-600 mt-[1px]">•</span>
                                    <span>{reason}</span>
                                </li>
                            ))}
                        </ul>
                    </button>
                </li>
            ))}
        </ul>

        <button
            type="button"
            onClick={onBack}
            className="w-full text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
        >
            Back
        </button>
    </div>
);

export default SuggestionGrid;
