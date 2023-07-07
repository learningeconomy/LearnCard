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

export const Lightbox: React.FC<LightboxProps> = ({ items, currentUrl, setCurrentUrl }) => {
    const currentItem = items.find(item => item.url === currentUrl);
    const goToNextItem = useCallback(() => {
        const currentIndex = items.findIndex(item => item.url === currentUrl);
        const nextItem = items.at((currentIndex + 1) % items.length);

        if (nextItem) {
            setCurrentUrl(nextItem.url);
        }
    }, [currentUrl]);
    const goToPreviousItem = useCallback(() => {
        const currentIndex = items.findIndex(item => item.url === currentUrl);
        const previousItem = items.at((currentIndex - 1) % items.length);

        if (previousItem) {
            setCurrentUrl(previousItem.url);
        }
    }, [currentUrl]);

    const innerRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const keydownListener: (this: Window, e: KeyboardEvent) => any = e => {
            if (!currentUrl || !currentItem) {
                return;
            }

            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();

                setCurrentUrl(undefined);
            }

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();

                goToNextItem();
            }

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopPropagation();

                goToPreviousItem();
            }
        };

        window.addEventListener('keydown', keydownListener);

        return () => {
            window.removeEventListener('keydown', keydownListener);
        };
    }, [currentUrl, currentItem]);

    if (!currentUrl || !currentItem) {
        return null;
    }

    return (
        <>
            {createPortal(
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
                            onClick={() => {
                                window.open(currentUrl, '_blank');
                            }}
                            ref={innerRef}
                        />
                    )}
                    {currentItem.type === 'video' &&
                        new URL(currentUrl).hostname
                            .replace('www.', '')
                            .startsWith('youtube.com') && (
                            <iframe
                                width="560"
                                height="315"
                                src={currentUrl.replace('watch?v=', 'embed/')}
                            />
                        )}
                </div>,
                document.body
            )}
        </>
    );
};
