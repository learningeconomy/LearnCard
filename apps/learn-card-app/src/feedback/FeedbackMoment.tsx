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
 * Single entry point for the feedback/advocacy ask on a success screen.
 *
 * The two asks are mutually exclusive by design: when a user has earned an
 * advocacy ask we never also show the sentiment strip, because on native the
 * advocacy ask is an OS dialog and stacking an inline question underneath it
 * is both noisy and reads as a pre-prompt.
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
