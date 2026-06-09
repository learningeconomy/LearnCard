/**
 * GoalCapture — step 1 of onboarding.
 *
 * Free-text input with a skip affordance. Docs § 6: "goal capture is
 * free text, optional, never a quiz." The prompt is deliberately
 * altitude-neutral — aspirations, questions, actions, and exploratory
 * curiosity are all first-class. The classifier (see
 * `./classifyAltitude.ts`) infers altitude from whatever the learner
 * writes and the suggestion grid ranks accordingly. The word "goal"
 * is kept out of the copy so learners who don't have one yet don't
 * feel filtered out at the door.
 */

import React, { useState } from 'react';

interface GoalCaptureProps {
    initial?: string;
    onContinue: (text: string) => void;
    onSkip: () => void;
}

/**
 * Placeholder text spans all four altitudes (aspiration, question,
 * action, exploration) so every kind of learner sees themselves in
 * at least one example. Kept to short fragments so the textarea
 * doesn't look like a form field with a correct answer.
 */
const PLACEHOLDER =
    'e.g. become a product manager \u00B7 why do interest rates matter? \u00B7 draft my essay today \u00B7 look around climate tech';

const GoalCapture: React.FC<GoalCaptureProps> = ({ initial = '', onContinue, onSkip }) => {
    const [text, setText] = useState(initial);

    const trimmed = text.trim();

    return (
        <div className="max-w-md mx-auto px-4 py-10 font-poppins space-y-5">
            <div>
                <p className="text-xs font-medium text-grayscale-500 uppercase tracking-wide mb-1">
                    Step 1 of 3
                </p>

                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    What's on your mind?
                </h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    A goal you're chasing, a question you're sitting with, something you want to
                    do today, or a field you're curious about — any of it works. One sentence is
                    plenty.
                </p>
            </div>

            <div className="space-y-1.5">
                <label
                    htmlFor="pathways-goal"
                    className="text-xs font-medium text-grayscale-700"
                >
                    In your own words
                </label>

                <textarea
                    id="pathways-goal"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={PLACEHOLDER}
                    rows={3}
                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900
                               placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
                               focus:border-transparent bg-white resize-none font-poppins"
                    maxLength={280}
                />

                <p className="text-xs text-grayscale-400 text-right">
                    {text.length} / 280
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
