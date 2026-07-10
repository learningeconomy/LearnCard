import React from 'react';
import { InAppMessageMedia } from '@learncard/types';

export interface MessageMediaProps {
    media: InAppMessageMedia;
}

export const MessageMedia: React.FC<MessageMediaProps> = ({ media }) => {
    const getAspectRatio = (aspect: string) => {
        const [w, h] = aspect.split(':').map(Number);
        if (w && h) return `${w} / ${h}`;
        return '16 / 9';
    };

    if (media.type === 'youtube') {
        // Extract video ID from various YouTube URL formats
        const match = media.url.match(
            /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
        );
        const videoId = match ? match[1] : null;

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
