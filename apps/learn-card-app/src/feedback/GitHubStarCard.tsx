import React from 'react';
import { Star, X } from 'lucide-react';

import * as m from '../paraglide/messages.js';

export interface GitHubStarCardProps {
    onStarClick: () => void;
    onDismiss: () => void;
    className?: string;
}

export const GitHubStarCard: React.FC<GitHubStarCardProps> = ({
    onStarClick,
    onDismiss,
    className = '',
}) => (
    <div
        className={`font-poppins relative flex items-center gap-3 p-3 pe-9 rounded-2xl border border-grayscale-200 bg-grayscale-10 animate-fade-in-up ${className}`}
        data-testid="github-star-card"
    >
        <div className="shrink-0 w-9 h-9 rounded-lg bg-white border border-grayscale-200 flex items-center justify-center">
            <Star className="w-[18px] h-[18px] text-amber-500" />
        </div>

        <p className="flex-1 text-xs text-grayscale-600 leading-relaxed text-start">
            {m['feedback.github.body']()}{' '}
            <button
                type="button"
                onClick={onStarClick}
                className="font-medium text-grayscale-900 underline hover:no-underline transition-all"
                data-testid="github-star-cta"
            >
                {m['feedback.github.cta']()}
            </button>
        </p>

        <button
            type="button"
            onClick={onDismiss}
            aria-label={m['feedback.github.dismiss']()}
            className="absolute top-2 end-2 p-1.5 rounded-full text-grayscale-400 hover:text-grayscale-700 hover:bg-grayscale-100 transition-colors"
            data-testid="github-star-dismiss"
        >
            <X className="w-3.5 h-3.5" />
        </button>
    </div>
);

export default GitHubStarCard;
