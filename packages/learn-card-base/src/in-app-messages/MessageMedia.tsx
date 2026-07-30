import React from 'react';
import { InAppMessageMedia } from '@learncard/types';

export interface MessageMediaProps {
    media: InAppMessageMedia;
}

// Parsed with URL/URLSearchParams instead of a regex: the previous
// `watch\?.+&v=` pattern backtracked polynomially on adversarial input
// (CodeQL js/polynomial-redos). Linear by construction.
export const getYouTubeVideoId = (raw: string): string | null => {
    try {
        const url = new URL(raw);
        const host = url.hostname.toLowerCase();
        const segments = url.pathname.split('/').filter(Boolean);

        if (host === 'youtu.be' || host === 'www.youtu.be') return segments[0] ?? null;

        if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
            const v = url.searchParams.get('v');

            if (v) return v;

            if (segments[0] === 'embed' || segments[0] === 'v' || segments[0] === 'shorts') {
                return segments[1] ?? null;
            }
        }

        return null;
    } catch {
        return null;
    }
};

export const MessageMedia: React.FC<MessageMediaProps> = ({ media }) => {
    const getAspectRatio = (aspect: string) => {
        const [w, h] = aspect.split(':').map(Number);
        if (w && h) return `${w} / ${h}`;
        return '16 / 9';
    };

    if (media.type === 'youtube') {
        const videoId = getYouTubeVideoId(media.url);

        if (!videoId) return null;

        return (
            <div
                className="w-full overflow-hidden rounded-[20px] border border-white/60 shadow-sm"
                style={{ aspectRatio: getAspectRatio(media.aspect) }}
            >
                <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    // Defense-in-depth: keeps the embed from navigating the top
                    // frame even though the URL host is already validated above.
                    sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <div
            className="w-full overflow-hidden rounded-[20px] border border-white/60 shadow-sm"
            style={{ aspectRatio: getAspectRatio(media.aspect) }}
        >
            <img src={media.url} alt={media.alt ?? ''} className="w-full h-full object-cover" />
        </div>
    );
};

export default MessageMedia;
