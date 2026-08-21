import React from 'react';

import { useFeedback } from './FeedbackContext';
import { useFeedbackReportingEligibility } from './eligibility';
import * as m from '../../paraglide/messages.js';

/**
 * Explicit feedback entry points for the guardian Settings list
 * (LC-2086 Task 9).
 *
 * Each action is gated on its own destination eligibility — bug reports and
 * ideas are independent — and both delegate to the shared controller with the
 * `settings` source, so the composer opens above whatever is on screen. When
 * neither destination is eligible nothing renders at all.
 */

const AlertIcon: React.FC = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="w-5 h-5 shrink-0"
        aria-hidden="true"
    >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v6" strokeLinecap="round" />
        <circle cx="12" cy="16.4" r="0.9" fill="currentColor" stroke="none" />
    </svg>
);

const BulbIcon: React.FC = () => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        className="w-5 h-5 shrink-0"
        aria-hidden="true"
    >
        <path
            d="M12 3a6 6 0 0 0-3.5 10.9c.7.5 1 1.3 1 2.1h5c0-.8.3-1.6 1-2.1A6 6 0 0 0 12 3Z"
            strokeLinejoin="round"
        />
        <path d="M9.5 18.5h5M10.5 21h3" strokeLinecap="round" />
    </svg>
);

const rowClasses =
    'w-full flex items-center gap-3 py-3 px-4 rounded-[20px] border border-grayscale-300 ' +
    'bg-white text-grayscale-700 font-medium text-sm hover:bg-grayscale-10 ' +
    'transition-colors text-left';

export const FeedbackSettingsRows: React.FC = () => {
    const { reportProblem, shareIdea } = useFeedback();
    const { bug, idea } = useFeedbackReportingEligibility();

    if (!bug && !idea) return null;

    return (
        <div className="flex flex-col gap-[10px] pt-[10px] pb-[10px] font-poppins">
            {bug && (
                <button
                    type="button"
                    className={rowClasses}
                    onClick={() => {
                        void reportProblem({ source: 'settings' });
                    }}
                >
                    <AlertIcon />
                    {m['feedback.reporting.reportProblem']()}
                </button>
            )}

            {idea && (
                <button
                    type="button"
                    className={rowClasses}
                    onClick={() => {
                        void shareIdea({ source: 'settings' });
                    }}
                >
                    <BulbIcon />
                    {m['feedback.reporting.shareIdea']()}
                </button>
            )}
        </div>
    );
};

export default FeedbackSettingsRows;
