import React, { useRef, useState, useMemo } from 'react';
import type { AppStoreListing, InstalledApp } from '@learncard/types';

import { useModal, ModalTypes } from 'learn-card-base';
import AppStoreDetailModal from './AppStoreDetailModal';

// Vibrant color palette for carousel cards
const CAROUSEL_COLORS = [
    'bg-gradient-to-br from-indigo-500 to-purple-600',
    'bg-gradient-to-br from-emerald-500 to-teal-600',
    'bg-gradient-to-br from-rose-500 to-pink-600',
    'bg-gradient-to-br from-amber-500 to-orange-600',
    'bg-gradient-to-br from-cyan-500 to-blue-600',
    'bg-gradient-to-br from-fuchsia-500 to-purple-600',
    'bg-gradient-to-br from-lime-500 to-green-600',
    'bg-gradient-to-br from-sky-500 to-indigo-600',
];

interface FeaturedCarouselProps {
    apps: AppStoreListing[];
    installedAppIds: Set<string>;
    onInstallSuccess?: () => void;
    hideScrollDots: boolean;
}

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({
    apps,
    installedAppIds,
    onInstallSuccess,
    hideScrollDots = false
}) => {
    const { newModal } = useModal();
    const scrollRef = useRef<HTMLDivElement>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    // Filter out already-installed apps
    const visibleApps = useMemo(
        () => apps.filter(app => !installedAppIds.has(app.listing_id)),
        [apps, installedAppIds]
    );

    if (visibleApps.length === 0) {
        return null;
    }

    const handleOpenDetail = (listing: AppStoreListing) => {
        newModal(
            <AppStoreDetailModal
                listing={listing}
                isInstalled={false}
                onInstallSuccess={onInstallSuccess}
            />,
            {},
            { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
        );
    };

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const scrollLeft = scrollRef.current.scrollLeft;
        const cardWidth = 280 + 16; // card width + gap
        const newIndex = Math.round(scrollLeft / cardWidth);
        setActiveIndex(Math.min(newIndex, visibleApps.length - 1));
    };

    const scrollToIndex = (index: number) => {
        if (!scrollRef.current) return;
        const cardWidth = 280 + 16;
        scrollRef.current.scrollTo({
            left: cardWidth * index,
            behavior: 'smooth',
        });
    };

    return (
        <div className="w-full">
            {/* Carousel Container */}
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar px-4"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
            >
                {visibleApps.map((app, index) => {
                    const colorClass = CAROUSEL_COLORS[index % CAROUSEL_COLORS.length];
                    const isSingleApp = visibleApps.length === 1;

                    return (
                        <button
                            key={app.listing_id}
                            onClick={() => handleOpenDetail(app)}
                            className={`
                                flex-shrink-0 h-[120px] rounded-2xl p-5
                                ${isSingleApp ? 'w-full' : 'w-[280px]'}
                                ${colorClass}
                                snap-start cursor-pointer
                                transition-shadow duration-200 hover:shadow-xl
                                focus:outline-none focus:ring-2 focus:ring-white/50
                                transform-gpu
                            `}
                        >
                            <div className="flex items-center gap-4 h-full">
                                {/* App Icon */}
                                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white/20 flex-shrink-0 shadow-lg">
                                    <img
                                        src={app.icon_url}
                                        alt={app.display_name}
                                        className="w-full h-full object-cover"
                                        onError={e => {
                                            (e.target as HTMLImageElement).src =
                                                'https://cdn.filestackcontent.com/Ja9TRvGVRsuncjqpxedb';
                                        }}
                                    />
                                </div>

                                {/* App Info */}
                                <div className="flex-1 min-w-0 text-left">
                                    <h3 className="text-white font-bold text-lg leading-tight truncate">
                                        {app.display_name}
                                    </h3>

                                    <p className="text-white/80 text-sm mt-1 line-clamp-2 leading-snug">
                                        {app.tagline}
                                    </p>

                                    <div className="mt-2">
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white/25 rounded-full text-white text-xs font-medium">
                                            <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                                                />
                                            </svg>
                                            Get App
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Pagination Dots */}
            {visibleApps.length > 1 && !hideScrollDots && (
                <div className="flex justify-center gap-2 mt-3">
                    {visibleApps.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => scrollToIndex(index)}
                            className={`
                                w-2 h-2 rounded-full transition-all duration-200
                                ${index === activeIndex
                                    ? 'bg-indigo-600 w-6'
                                    : 'bg-grayscale-300 hover:bg-grayscale-400'
                                }
                            `}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default FeaturedCarousel;
