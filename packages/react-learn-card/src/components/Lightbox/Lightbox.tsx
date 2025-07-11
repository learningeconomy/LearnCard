import React, { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export type LightboxItemType = 'photo' | 'video';

export type LightboxItem = {
    url: string;
    type: LightboxItemType;
};

export type LightboxImage = LightboxItem & {
    type: 'photo';
    alt?: string;
};

export type LightboxVideo = LightboxItem & {
    type: 'video';
};

export type LightboxProps = {
    items: LightboxItem[];
    currentUrl: string | undefined;
    setCurrentUrl: (url: string | undefined) => void;
};

const getYoutubeVideoId = (url: string): string | null => {
    const match = url.match(
        /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/
    );
    return match ? match[1] : null;
};

const isYoutubeUrl = (url: string): boolean => {
    try {
        const { hostname } = new URL(url);
        return hostname.includes('youtube.com') || hostname === 'youtu.be';
    } catch {
        return false;
    }
};

export const Lightbox: React.FC<LightboxProps> = ({ items, currentUrl, setCurrentUrl }) => {
    const currentItem = items.find(item => item.url === currentUrl);
    const innerRef = useRef<HTMLImageElement>(null);

    const goToNextItem = useCallback(() => {
        const currentIndex = items.findIndex(item => item.url === currentUrl);
        const nextItem = items.at((currentIndex + 1) % items.length);
        if (nextItem) setCurrentUrl(nextItem.url);
    }, [currentUrl, items, setCurrentUrl]);

    const goToPreviousItem = useCallback(() => {
        const currentIndex = items.findIndex(item => item.url === currentUrl);
        const previousItem = items.at((currentIndex - 1 + items.length) % items.length);
        if (previousItem) setCurrentUrl(previousItem.url);
    }, [currentUrl, items, setCurrentUrl]);

    useEffect(() => {
        const keydownListener = (e: KeyboardEvent) => {
            if (!currentUrl || !currentItem) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                setCurrentUrl(undefined);
            }

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                goToNextItem();
            }

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goToPreviousItem();
            }
        };

        window.addEventListener('keydown', keydownListener);
        return () => window.removeEventListener('keydown', keydownListener);
    }, [currentUrl, currentItem, goToNextItem, goToPreviousItem, setCurrentUrl]);

    if (!currentUrl || !currentItem) return null;

    return createPortal(
        <div
            className="absolute top-0 left-0 w-screen h-screen bg-[rgba(0,0,0,0.9)] text-white flex justify-center items-center z-[999999]"
            onClick={e => {
                if (e.target !== innerRef.current) {
                    setCurrentUrl(undefined);
                }
            }}
        >
            {currentItem.type === 'photo' && (
                <img
                    className="cursor-pointer max-w-[90vw] max-h-[90vh]"
                    src={currentUrl}
                    onClick={() => window.open(currentUrl, '_blank')}
                    ref={innerRef}
                    alt=""
                />
            )}

            {currentItem.type === 'video' && isYoutubeUrl(currentUrl) && (
                <iframe
                    width="800"
                    height="450"
                    src={`https://www.youtube.com/embed/${getYoutubeVideoId(currentUrl)}`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="max-w-[90vw] max-h-[90vh]"
                />
            )}
        </div>,
        document.body
    );
};
