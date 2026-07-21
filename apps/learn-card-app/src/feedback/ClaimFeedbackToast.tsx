import React from 'react';

import { useToast } from 'learn-card-base';

import type { FeedbackSentiment, FeedbackSurface } from '@analytics';
import SentimentStrip from './SentimentStrip';
import * as m from '../paraglide/messages.js';

export const CLAIM_FEEDBACK_TOAST_DURATION_MS = 8000;

/**
 * Toast body for claim flows that navigate away on success and therefore
 * have no success screen to host an inline strip. Rendered as the toast's
 * custom `message` node (the `Toast` component mounts inside the analytics
 * and modals providers, so hooks inside the strip resolve normally).
 */
export const ClaimFeedbackToast: React.FC<{ surface: FeedbackSurface }> = ({ surface }) => {
    const { dismissToast } = useToast();

    const handleAnswered = (sentiment: FeedbackSentiment) => {
        setTimeout(() => dismissToast(), sentiment === 'positive' ? 1200 : 300);
    };

    return (
        <div className="flex flex-col gap-0.5 py-1">
            <p className="text-sm text-left text-grayscale-900 font-medium">
                {m['toasts.credentialClaimed']()}
            </p>

            <SentimentStrip
                surface={surface}
                onAnswered={handleAnswered}
                className="!justify-start"
            />
        </div>
    );
};

export default ClaimFeedbackToast;
