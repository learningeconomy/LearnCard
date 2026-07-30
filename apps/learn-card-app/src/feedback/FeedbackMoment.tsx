import React from 'react';

import type { FeedbackSurface } from '@analytics';
import SentimentStrip from './SentimentStrip';
import GitHubStarCard from './GitHubStarCard';
import { useAdvocacyPrompt } from './useAdvocacyPrompt';

export interface FeedbackMomentProps {
    surface: FeedbackSurface;
    className?: string;
}

/**
 * The feedback/advocacy ask for success *screens*. Claim flows that only toast
 * before navigating away still render `SentimentStrip` directly via
 * `ClaimFeedbackToast`, since a delayed native prompt can't survive that
 * unmount.
 *
 * The two asks are mutually exclusive: when a user has earned an advocacy ask
 * we never also show the sentiment strip, because on native the advocacy ask is
 * an OS dialog and stacking an inline question underneath it is both noisy and
 * reads as a pre-prompt.
 */
export const FeedbackMoment: React.FC<FeedbackMomentProps> = ({ surface, className }) => {
    const { showGitHubCard, advocacyActive, handleGitHubClick, handleGitHubDismiss } =
        useAdvocacyPrompt(surface);

    if (showGitHubCard) {
        return (
            <GitHubStarCard
                onStarClick={handleGitHubClick}
                onDismiss={handleGitHubDismiss}
                className={className}
            />
        );
    }

    if (advocacyActive) return null;

    return <SentimentStrip surface={surface} className={className} />;
};

export default FeedbackMoment;
