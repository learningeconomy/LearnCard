/**
 * CompletionMoment — transient banner shown on Today right after a
 * node flips to `completed` (docs § 5: proof-of-effort feeling).
 *
 * The banner is cosmetic only. The actual state change happens
 * elsewhere (NodeDetail → pathwayStore); this component just reads the
 * "something just finished" signal and renders for a few seconds.
 */

import React from 'react';

interface CompletionMomentProps {
    title: string;
    /** User tapped the dismiss affordance early. */
    onDismiss?: () => void;
}

const CompletionMoment: React.FC<CompletionMomentProps> = ({ title, onDismiss }) => (
    <section
        className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100 animate-fade-in-up"
        role="status"
        aria-live="polite"
    >
        <span className="shrink-0 mt-0.5 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
            ✓
        </span>

        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-800 leading-snug">
                {title}
            </p>

            <p className="text-xs text-emerald-700 mt-0.5">
                Done. Next up below.
            </p>
        </div>

        {onDismiss && (
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss"
                className="shrink-0 text-emerald-700 hover:text-emerald-900 transition-colors text-sm leading-none px-1"
            >
                ×
            </button>
        )}
    </section>
);

export default CompletionMoment;
