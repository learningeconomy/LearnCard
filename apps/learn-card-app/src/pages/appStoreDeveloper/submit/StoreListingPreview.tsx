import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { star } from 'ionicons/icons';
import { DEFAULT_APP_ICON_URL } from './constants';
import { DEFAULT_HERO_COLOR } from './listingForm';
import { CATEGORY_OPTIONS, AGE_RATING_OPTIONS } from '../types';

interface StoreListingPreviewProps {
    name: string;
    tagline: string;
    description: string;
    iconUrl: string;
    category: string;
    ageRating: string;
    screenshots: string[];
    highlights: string[];
    heroColor?: string;
}

export const StoreListingPreview: React.FC<StoreListingPreviewProps> = ({
    name,
    tagline,
    description,
    iconUrl,
    category,
    ageRating,
    screenshots,
    highlights,
    heroColor,
}) => {
    const categoryLabel = CATEGORY_OPTIONS.find(c => c.value === category)?.label || category;
    const ageLabel = AGE_RATING_OPTIONS.find(a => a.value === ageRating)?.label || ageRating;
    const visibleScreenshots = screenshots.filter(Boolean);
    const visibleHighlights = highlights.map(h => h.trim()).filter(Boolean);
    const [showFullDescription, setShowFullDescription] = useState(false);

    return (
        <div className="w-full max-w-md mx-auto bg-white rounded-[20px] shadow-lg overflow-hidden font-poppins border border-grayscale-200">
            <div
                className="h-32 w-full relative"
                style={{ backgroundColor: heroColor || DEFAULT_HERO_COLOR }}
            >
                <div className="absolute -bottom-10 left-6">
                    <img
                        src={iconUrl || DEFAULT_APP_ICON_URL}
                        alt=""
                        className="w-20 h-20 rounded-2xl border-4 border-white object-cover bg-white shadow-sm"
                    />
                </div>
            </div>

            <div className="pt-12 px-6 pb-6">
                <h2 className="text-xl font-semibold text-grayscale-900 mb-1">
                    {name || 'App Name'}
                </h2>
                <p className="text-sm text-grayscale-600 mb-4">
                    {tagline || 'A short description of what your app does.'}
                </p>

                <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 ">
                    {category && (
                        <div className="flex flex-col items-center min-w-[70px]">
                            <span className="text-xs font-medium text-grayscale-500 uppercase tracking-wider mb-1">
                                Category
                            </span>
                            <span className="text-sm font-semibold text-grayscale-900">
                                {categoryLabel}
                            </span>
                        </div>
                    )}
                    {ageRating && (
                        <div className="flex flex-col items-center min-w-[70px] border-l border-grayscale-200 pl-3">
                            <span className="text-xs font-medium text-grayscale-500 uppercase tracking-wider mb-1">
                                Age
                            </span>
                            <span className="text-sm font-semibold text-grayscale-900">
                                {ageLabel}
                            </span>
                        </div>
                    )}
                </div>

                {visibleScreenshots.length > 0 && (
                    <div className="mb-6">
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                            {visibleScreenshots.map((url, i) => (
                                <img
                                    key={i}
                                    src={url}
                                    alt={`Screenshot ${i + 1}`}
                                    className="h-48 w-auto rounded-xl object-cover snap-center border border-grayscale-200"
                                />
                            ))}
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-grayscale-900 mb-2">
                        About this app
                    </h3>
                    <p
                        className={`text-sm text-grayscale-600 leading-relaxed whitespace-pre-wrap ${
                            showFullDescription ? '' : 'line-clamp-4'
                        }`}
                    >
                        {description || 'Your description will appear here.'}
                    </p>
                    {description.length > 240 && (
                        <button
                            type="button"
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="mt-1 text-sm font-medium text-grayscale-900 hover:underline"
                        >
                            {showFullDescription ? 'Less' : 'More'}
                        </button>
                    )}
                </div>

                {visibleHighlights.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-grayscale-900 mb-2">
                            Highlights
                        </h3>
                        <ul className="space-y-2">
                            {visibleHighlights.map((highlight, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-2 text-sm text-grayscale-600"
                                >
                                    <IonIcon
                                        icon={star}
                                        className="text-emerald-500 mt-0.5 shrink-0"
                                    />
                                    <span>{highlight}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
