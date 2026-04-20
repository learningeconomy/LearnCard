/**
 * GoalCapture — step 1 of onboarding.
 *
 * Free-text goal entry with a skip affordance. Docs § 6: "goal capture
 * is free text, optional, never a quiz." The learner can skip and the
 * suggestion step will still surface three starting templates.
 */

import React, { useState } from 'react';

interface GoalCaptureProps {
    initial?: string;
    onContinue: (goalText: string) => void;
    onSkip: () => void;
}

const GoalCapture: React.FC<GoalCaptureProps> = ({ initial = '', onContinue, onSkip }) => {
    const [goalText, setGoalText] = useState(initial);

    const trimmed = goalText.trim();

    return (
        <div className="max-w-md mx-auto px-4 py-10 font-poppins space-y-5">
            <div>
                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide mb-1">
                    Step 1 of 3
                </p>

                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    What are you working toward?
                </h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    One sentence is plenty. You can change it later.
                </p>
            </div>

            <div className="space-y-1.5">
                <label
                    htmlFor="pathways-goal"
                    className="text-xs font-medium text-grayscale-700"
                >
                    Your goal
                </label>

                <textarea
                    id="pathways-goal"
                    value={goalText}
                    onChange={e => setGoalText(e.target.value)}
                    placeholder="e.g. prepare for technical interviews, ship a portfolio piece, pivot into product"
                    rows={3}
                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900
                               placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
                               focus:border-transparent bg-white resize-none font-poppins"
                    maxLength={280}
                />

                <p className="text-xs text-grayscale-400 text-right">
                    {goalText.length} / 280
                </p>
            </div>

            <div className="space-y-3">
                <button
                    type="button"
                    onClick={() => onContinue(trimmed)}
                    disabled={trimmed.length === 0}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm
                               hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    Continue
                </button>

                <button
                    type="button"
                    onClick={onSkip}
                    className="w-full text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    Skip for now
                </button>
            </div>
        </div>
    );
};

export default GoalCapture;
