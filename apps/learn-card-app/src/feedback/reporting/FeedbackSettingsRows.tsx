import React, { useCallback, useState } from 'react';

import CaretListItem from '../../components/learncard/CaretListItem';
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
        className="h-[30px] w-[30px] shrink-0 text-grayscale-700"
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
        className="h-[30px] w-[30px] shrink-0 text-grayscale-700"
        aria-hidden="true"
    >
        <path
            d="M12 3a6 6 0 0 0-3.5 10.9c.7.5 1 1.3 1 2.1h5c0-.8.3-1.6 1-2.1A6 6 0 0 0 12 3Z"
            strokeLinejoin="round"
        />
        <path d="M9.5 18.5h5M10.5 21h3" strokeLinecap="round" />
    </svg>
);

const PreparingSpinner: React.FC = () => (
    <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-grayscale-200 border-t-grayscale-700"
        aria-hidden="true"
    />
);

type PendingAction = 'bug' | 'idea';

export const FeedbackSettingsRows: React.FC = () => {
    const { reportProblem, shareIdea } = useFeedback();
    const { bug, idea } = useFeedbackReportingEligibility();
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

    const prepare = useCallback(
        async (action: PendingAction, run: () => Promise<void>): Promise<void> => {
            if (pendingAction !== null) return;

            setPendingAction(action);
            try {
                await run();
            } finally {
                setPendingAction(null);
            }
        },
        [pendingAction]
    );

    if (!bug && !idea) return null;

    const isPreparing = pendingAction !== null;

    return (
        <div>
            {bug && (
                <CaretListItem
                    icon={<AlertIcon />}
                    mainText={m['feedback.reporting.reportProblem']()}
                    onClick={() => {
                        void prepare('bug', () => reportProblem({ source: 'settings' })).catch(
                            () => undefined
                        );
                    }}
                    disabled={isPreparing}
                    ariaBusy={pendingAction === 'bug'}
                    caretOverride={pendingAction === 'bug' ? <PreparingSpinner /> : undefined}
                />
            )}

            {idea && (
                <CaretListItem
                    icon={<BulbIcon />}
                    mainText={m['feedback.reporting.shareIdea']()}
                    onClick={() => {
                        void prepare('idea', () => shareIdea({ source: 'settings' })).catch(
                            () => undefined
                        );
                    }}
                    disabled={isPreparing}
                    ariaBusy={pendingAction === 'idea'}
                    caretOverride={pendingAction === 'idea' ? <PreparingSpinner /> : undefined}
                />
            )}
        </div>
    );
};

export default FeedbackSettingsRows;
