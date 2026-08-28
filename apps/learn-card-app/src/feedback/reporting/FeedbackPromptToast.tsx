import React from 'react';

import * as m from '../../paraglide/messages.js';

export interface FeedbackPromptToastProps {
    /** Open the feedback composer with the preserved pending draft. */
    onReport(): void;
    /** Discard the pending draft without opening the composer. */
    onDismiss(): void;
}

/**
 * Actionable deferred-report toast (LC-2086 Task 8).
 *
 * Rendered as a custom React element inside the shared toast store while the
 * user was busy during an automatic trigger (shake / iOS screenshot). Tapping
 * "Report" opens the composer with the preserved screenshot and context;
 * "Dismiss" drops the pending draft. The toast never auto-dismisses — the
 * user must choose.
 *
 * Carries `data-feedback-exclude` so a later screenshot capture can never
 * include the prompt in its own attachment.
 */
export const FeedbackPromptToast: React.FC<FeedbackPromptToastProps> = ({
    onReport,
    onDismiss,
}) => (
    <div
        data-feedback-exclude
        className="flex w-full min-w-0 flex-col items-stretch gap-4 font-poppins"
    >
        <div className="flex w-full min-w-0 flex-col text-left">
            <h4 className="text-sm font-semibold text-grayscale-900">
                {m['feedback.reporting.promptTitle']()}
            </h4>
            <p className="text-sm leading-relaxed text-grayscale-600">
                {m['feedback.reporting.promptBody']()}
            </p>
        </div>
        <div className="flex w-full items-center gap-2">
            <button
                type="button"
                onClick={onDismiss}
                className="flex-1 rounded-[20px] border border-grayscale-300 px-3 py-2 text-sm font-medium text-grayscale-700 transition-colors hover:bg-grayscale-10"
            >
                {m['feedback.reporting.dismiss']()}
            </button>
            <button
                type="button"
                onClick={onReport}
                className="flex-1 rounded-[20px] bg-grayscale-900 px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
                {m['feedback.reporting.promptAction']()}
            </button>
        </div>
    </div>
);

export default FeedbackPromptToast;
