import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as Sentry from '@sentry/react';

import { useModal, useGetPreferencesForDid, getLogger } from 'learn-card-base';

import {
    useAnalytics,
    AnalyticsEvents,
    type FeedbackSentiment,
    type FeedbackSurface,
} from '@analytics';
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

    const bugReportsEnabled = preferences?.bugReportsEnabled ?? true;

    const [selected, setSelected] = useState<FeedbackReason[]>([]);
    const [note, setNote] = useState('');
    const resolvedRef = useRef(false);

    const toggleReason = (reason: FeedbackReason) => {
        setSelected(prev =>
            prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
        );
    };

    const handleSubmit = useCallback(() => {
        if (resolvedRef.current) return;
        resolvedRef.current = true;

        const trimmedNote = bugReportsEnabled ? note.trim() : '';

        void track(AnalyticsEvents.FEEDBACK_FOLLOWUP_SUBMITTED, {
            surface,
            sentiment,
            reasons: selected,
            hasFreeText: trimmedNote.length > 0,
            ...(trimmedNote ? { userNote: trimmedNote } : {}),
        });

        if (bugReportsEnabled && (selected.includes('broken') || trimmedNote)) {
            try {
                Sentry.withScope(scope => {
                    scope.setTag('feature', 'micro-feedback');
                    scope.setTag('surface', surface);
                    scope.setTag('sentiment', sentiment);

                    Sentry.captureFeedback({
                        message:
                            trimmedNote ||
                            `User reported a problem (${selected.join(', ') || 'unspecified'})`,
                    });
                });
            } catch (e) {
                log.error('feedback.sentry_capture_failed', e);
            }
        }

        closeModal();
    }, [bugReportsEnabled, note, selected, surface, sentiment, track, closeModal]);

    const handleSkip = useCallback(() => {
        if (resolvedRef.current) return;
        resolvedRef.current = true;

        void track(AnalyticsEvents.FEEDBACK_FOLLOWUP_DISMISSED, { surface, sentiment });
        closeModal();
    }, [surface, sentiment, track, closeModal]);

    useEffect(() => {
        return () => {
            if (!resolvedRef.current) {
                resolvedRef.current = true;
                void track(AnalyticsEvents.FEEDBACK_FOLLOWUP_DISMISSED, { surface, sentiment });
            }
        };
    }, [surface, sentiment, track]);

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
                    disabled={!canSubmit}
                    className="w-full py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    data-testid="feedback-followup-send"
                >
                    {m['feedback.followup.send']()}
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
