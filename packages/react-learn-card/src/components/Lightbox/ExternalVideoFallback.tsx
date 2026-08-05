import React from 'react';

import { openExternalUrl } from '../../helpers/externalUrl.helpers';

export type ExternalVideoFallbackProps = {
    /** Public `watch` URL opened when the user taps play. */
    url: string;
    /** Poster frame, when we managed to resolve one. */
    thumbnailUrl?: string | null;
    label?: string;
    className?: string;
};

/**
 * Stand-in for a video `<iframe>` in documents where third-party embeds cannot
 * play — see `canEmbedVideoIframe`. Renders the poster frame with a play button
 * that hands playback off to an external browser.
 */
export const ExternalVideoFallback: React.FC<ExternalVideoFallbackProps> = ({
    url,
    thumbnailUrl,
    label = 'Watch on YouTube',
    className = '',
}) => (
    <button
        type="button"
        onClick={e => {
            e.stopPropagation();
            openExternalUrl(url);
        }}
        aria-label={label}
        className={`relative w-full h-full flex flex-col items-center justify-center gap-[16px] overflow-hidden rounded-md bg-black ${className}`}
    >
        {thumbnailUrl && (
            <img
                src={thumbnailUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
        )}

        <div className="relative w-[64px] h-[64px] rounded-full bg-white/95 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-[28px] h-[28px] ml-[4px]" aria-hidden="true">
                <path d="M8 5v14l11-7z" fill="#000" />
            </svg>
        </div>

        <span className="relative text-white text-base font-semibold">{label}</span>
    </button>
);

export default ExternalVideoFallback;
