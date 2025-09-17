import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import X from '../svgs/X';

import { getVideoMetadata, VideoMetadata } from '../../helpers/video.helpers';

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
    showCloseButton?: boolean;
    enableImageClick?: boolean;
};

export const Lightbox: React.FC<LightboxProps> = ({
    items,
    currentUrl,
    setCurrentUrl,
    showCloseButton = true,
    enableImageClick = false,
}) => {
    const currentItem = items.find(item => item.url === currentUrl);
    const innerRef = useRef<HTMLImageElement>(null);
    const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);

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

    useEffect(() => {
        const fetchMetadata = async () => {
            if (currentItem?.type === 'video') {
                const metadata = await getVideoMetadata(currentItem.url);
                setVideoMetadata(metadata);
            } else {
                setVideoMetadata(null);
            }
        };

        fetchMetadata();
    }, []);

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
            {showCloseButton && (
                <X className="absolute w-[30px] h-[30px] top-[20px] right-[20px] cursor-pointer text-white z-[999999]" />
            )}
            {currentItem.type === 'photo' && (
                <img
                    className="cursor-pointer max-w-[90vw] max-h-[90vh]"
                    src={currentUrl}
                    onClick={() => enableImageClick && window.open(currentUrl, '_blank')}
                    ref={innerRef}
                    alt=""
                />
            )}

            {currentItem.type === 'video' && videoMetadata?.embedUrl && (
                <div className="relative w-[90vw] max-w-[800px] aspect-video">
                    <iframe
                        src={videoMetadata.embedUrl}
                        className="absolute top-0 left-0 w-full h-full rounded-md"
                        title="Video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            )}
        </div>,
        document.body
    );
};
