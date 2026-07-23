import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Frown, Meh, Smile } from 'lucide-react';

import { useModal, ModalTypes } from 'learn-card-base';

import {
    useAnalytics,
    AnalyticsEvents,
    type FeedbackSentiment,
    type FeedbackSurface,
} from '@analytics';
import { feedbackGovernorStore } from './feedbackGovernor';
import { useFeedbackEligibility } from './useFeedbackEligibility';
import FeedbackFollowUpSheet from './FeedbackFollowUpSheet';
import * as m from '../paraglide/messages.js';

export interface SentimentStripProps {
    surface: FeedbackSurface;
    onAnswered?: (sentiment: FeedbackSentiment) => void;
    className?: string;
    /**
     * When false, unmounting without an answer does NOT count toward the
     * ignore-mute backoff. Set for hosts that disappear on their own (e.g.
     * auto-dismissing toasts) where unmount ≠ "user saw it and ignored it".
     */
    countUnmountAsIgnore?: boolean;
}

const SENTIMENT_OPTIONS: {
    sentiment: FeedbackSentiment;
    Icon: typeof Frown;
    labelKey: 'feedback.bad' | 'feedback.okay' | 'feedback.great';
    hoverClass: string;
}[] = [
    {
        sentiment: 'negative',
        Icon: Frown,
        labelKey: 'feedback.bad',
        hoverClass: 'hover:text-red-500 hover:bg-red-50 active:text-red-500',
    },
    {
        sentiment: 'neutral',
        Icon: Meh,
        labelKey: 'feedback.okay',
        hoverClass: 'hover:text-amber-500 hover:bg-amber-50 active:text-amber-500',
    },
    {
        sentiment: 'positive',
        Icon: Smile,
        labelKey: 'feedback.great',
        hoverClass: 'hover:text-emerald-600 hover:bg-emerald-50 active:text-emerald-600',
    },
];

/**
 * Inline 3-point sentiment prompt rendered inside success moments.
 * Renders nothing unless the privacy gate + frequency governor allow it.
 * Eligibility is latched on first render so recording the "shown" event
 * (which consumes governor budget) doesn't immediately hide the strip.
 * Unmounting without an answer counts as an ignore (dismissal backoff).
 */
export const SentimentStrip: React.FC<SentimentStripProps> = ({
    surface,
    onAnswered,
    className = '',
    countUnmountAsIgnore = true,
}) => {
    const eligible = useFeedbackEligibility(surface);
    const { track } = useAnalytics();
    const { newModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.BottomSheet,
    });

    const [latched, setLatched] = useState(false);
    const [answered, setAnswered] = useState<FeedbackSentiment | null>(null);
    const shownAtRef = useRef<number | null>(null);
    const shownRecordedRef = useRef(false);
    const answeredRef = useRef(false);
    const ignoreTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => {
        // Ref (not state) guards the side effects so StrictMode's double
        // effect invocation can't consume governor budget twice.
        if (!eligible || shownRecordedRef.current) return;

        shownRecordedRef.current = true;
        setLatched(true);
        shownAtRef.current = Date.now();
        feedbackGovernorStore.set.recordShown(surface);
        void track(AnalyticsEvents.FEEDBACK_PROMPT_SHOWN, { surface });
    }, [eligible, surface, track]);

    useEffect(() => {
        // Ignore recording is deferred a tick and cancelled on remount so
        // StrictMode's simulated unmount doesn't log a spurious ignore.
        if (ignoreTimeoutRef.current) {
            clearTimeout(ignoreTimeoutRef.current);
            ignoreTimeoutRef.current = undefined;
        }

        return () => {
            if (!countUnmountAsIgnore) return;
            if (shownAtRef.current === null || answeredRef.current) return;

            ignoreTimeoutRef.current = setTimeout(() => {
                feedbackGovernorStore.set.recordIgnored(surface);
            }, 0);
        };
    }, [surface, countUnmountAsIgnore]);

    const handleSelect = useCallback(
        (sentiment: FeedbackSentiment) => {
            if (answeredRef.current) return;

            answeredRef.current = true;
            setAnswered(sentiment);
            feedbackGovernorStore.set.recordAnswered(surface);

            void track(AnalyticsEvents.FEEDBACK_SENTIMENT_GIVEN, {
                surface,
                sentiment,
                msSinceShown: shownAtRef.current ? Date.now() - shownAtRef.current : 0,
            });

            if (sentiment !== 'positive') {
                newModal(<FeedbackFollowUpSheet surface={surface} sentiment={sentiment} />, {
                    sectionClassName: '!max-w-[440px]',
                });
            }

            onAnswered?.(sentiment);
        },
        [surface, track, newModal, onAnswered]
    );

    if (!latched) return null;

    return (
        <div
            className={`font-poppins flex items-center justify-center gap-3 min-h-[36px] ${className}`}
            data-testid="sentiment-strip"
        >
            {answered ? (
                <p className="text-sm text-grayscale-600 animate-fade-in-up">
                    {m['feedback.thanks']()}
                </p>
            ) : (
                <>
                    <span className="text-sm text-grayscale-500">{m['feedback.howWasThat']()}</span>

                    <div className="flex items-center gap-1">
                        {SENTIMENT_OPTIONS.map(({ sentiment, Icon, labelKey, hoverClass }) => (
                            <button
                                key={sentiment}
                                type="button"
                                aria-label={m[labelKey]()}
                                title={m[labelKey]()}
                                onClick={() => handleSelect(sentiment)}
                                className={`p-2.5 rounded-full text-grayscale-400 transition-all active:scale-90 ${hoverClass}`}
                                data-testid={`sentiment-${sentiment}`}
                            >
                                <Icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default SentimentStrip;
