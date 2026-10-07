import React, { useCallback, useEffect, useRef, useState } from 'react';

import { useModal, useGetPreferencesForDid, getLogger } from 'learn-card-base';

import {
    useAnalytics,
    AnalyticsEvents,
    type FeedbackSentiment,
    type FeedbackSurface,
} from '@analytics';
import { useFeedback } from './reporting/FeedbackContext';
import * as m from '../paraglide/messages.js';

const log = getLogger('feedback-followup');

const REASONS = ['confusing', 'slow', 'broken', 'other'] as const;
type FeedbackReason = (typeof REASONS)[number];

const REASON_LABEL_KEYS: Record<
    FeedbackReason,
    | 'feedback.followup.reason.confusing'
    | 'feedback.followup.reason.slow'
    | 'feedback.followup.reason.broken'
    | 'feedback.followup.reason.other'
> = {
    confusing: 'feedback.followup.reason.confusing',
    slow: 'feedback.followup.reason.slow',
    broken: 'feedback.followup.reason.broken',
    other: 'feedback.followup.reason.other',
};

export interface FeedbackFollowUpSheetProps {
    surface: FeedbackSurface;
    sentiment: FeedbackSentiment;
}

export const FeedbackFollowUpSheet: React.FC<FeedbackFollowUpSheetProps> = ({
    surface,
    sentiment,
}) => {
    const { closeModal } = useModal();
    const { track } = useAnalytics();
    const { data: preferences } = useGetPreferencesForDid();
    const { reportProblem } = useFeedback();

    const bugReportsEnabled = preferences?.bugReportsEnabled ?? true;

    const [selected, setSelected] = useState<FeedbackReason[]>([]);
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const resolvedRef = useRef(false);

    const toggleReason = (reason: FeedbackReason) => {
        setSelected(prev =>
            prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
        );
    };

    const handleSubmit = useCallback(async () => {
        if (resolvedRef.current) return;
        resolvedRef.current = true;
        setIsSubmitting(true);

        const trimmedNote = bugReportsEnabled ? note.trim() : '';

        void track(AnalyticsEvents.FEEDBACK_FOLLOWUP_SUBMITTED, {
            surface,
            sentiment,
            reasons: selected,
            hasFreeText: trimmedNote.length > 0,
        });

        if (bugReportsEnabled && (selected.includes('broken') || trimmedNote)) {
            try {
                // The prefilled report goes through the shared controller so
                // eligibility, privacy-safe context, and the transport are all
                // consistent with every other feedback entry point.
                await reportProblem({
                    source: 'micro-feedback',
                    initialMessage:
                        trimmedNote ||
                        `User reported a problem (${selected.join(', ') || 'unspecified'})`,
                    submitImmediately: true,
                });
            } catch (e) {
                // Sanitized warning only — a provider failure never surfaces
                // a raw error here; the sheet closes like it always did.
                log.warn('feedback.followup.report_failed', e);
            }
        }

        setIsSubmitting(false);
        closeModal();
    }, [bugReportsEnabled, note, selected, surface, sentiment, track, reportProblem, closeModal]);

    const handleSkip = useCallback(() => {
        if (resolvedRef.current) return;
        resolvedRef.current = true;

        void track(AnalyticsEvents.FEEDBACK_FOLLOWUP_DISMISSED, { surface, sentiment });
        closeModal();
    }, [surface, sentiment, track, closeModal]);

    const trackRef = useRef(track);
    trackRef.current = track;
    const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        // Mount-only effect (via refs) so re-renders and StrictMode's
        // simulated unmount can't fire a spurious "dismissed" event; the
        // real dismissal is deferred a tick and cancelled on remount.
        if (dismissTimeoutRef.current) {
            clearTimeout(dismissTimeoutRef.current);
            dismissTimeoutRef.current = undefined;
        }

        return () => {
            if (resolvedRef.current) return;

            dismissTimeoutRef.current = setTimeout(() => {
                if (resolvedRef.current) return;

                resolvedRef.current = true;
                void trackRef.current(AnalyticsEvents.FEEDBACK_FOLLOWUP_DISMISSED, {
                    surface,
                    sentiment,
                });
            }, 0);
        };
    }, [surface, sentiment]);

    const canSubmit = selected.length > 0 || note.trim().length > 0;

    return (
        <div className="font-poppins p-6 space-y-5 bg-white rounded-[20px]">
            <div>
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    {m['feedback.followup.title']()}
                </h2>

                <p className="text-sm text-grayscale-600 leading-relaxed">
                    {m['feedback.followup.desc']()}
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                {REASONS.map(reason => {
                    const isSelected = selected.includes(reason);

                    return (
                        <button
                            key={reason}
                            type="button"
                            onClick={() => toggleReason(reason)}
                            className={
                                isSelected
                                    ? 'py-2.5 px-3 rounded-full bg-grayscale-900 text-white font-medium text-sm'
                                    : 'py-2.5 px-3 rounded-full bg-grayscale-100 text-grayscale-700 hover:bg-grayscale-200 font-medium text-sm transition-colors'
                            }
                            data-testid={`feedback-reason-${reason}`}
                        >
                            {m[REASON_LABEL_KEYS[reason]]()}
                        </button>
                    );
                })}
            </div>

            {bugReportsEnabled && (
                <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={m['feedback.followup.placeholder']()}
                    rows={3}
                    className="w-full py-3 px-4 border border-grayscale-300 rounded-xl text-sm text-grayscale-900
                               placeholder:text-grayscale-400 focus:outline-none focus:ring-2 focus:ring-emerald-500
                               focus:border-transparent bg-white resize-none"
                />
            )}

            <div className="space-y-3">
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit || isSubmitting}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="feedback-followup-send"
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {m['feedback.reporting.sendingReport']()}
                        </span>
                    ) : (
                        m['feedback.followup.send']()
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleSkip}
                    className="w-full text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                >
                    {m['feedback.followup.skip']()}
                </button>
            </div>
        </div>
    );
};

export default FeedbackFollowUpSheet;
