import React, { useState } from 'react';
import { Star, TrendingUp, Minus, ArrowDown } from 'lucide-react';

import { PROMOTION_LEVEL_INFO, type PromotionLevel } from '../../appStoreDeveloper/types';
import * as m from '../../../paraglide/messages.js';

const PROMOTION_ICONS: Record<PromotionLevel, React.FC<{ className?: string }>> = {
    FEATURED_CAROUSEL: Star,
    CURATED_LIST: TrendingUp,
    STANDARD: Minus,
    DEMOTED: ArrowDown,
};

interface PromotionMenuProps {
    currentLevel: PromotionLevel | undefined;
    listingId: string;
    onPromotionChange: (listingId: string, level: PromotionLevel) => void;
}

const getPromotionLabel = (level: PromotionLevel): string => {
    const map: Record<PromotionLevel, () => string> = {
        FEATURED_CAROUSEL: () => m['appStoreAdmin.listing.promotion.featuredCarousel'](),
        CURATED_LIST: () => m['appStoreAdmin.listing.promotion.curatedList'](),
        STANDARD: () => m['appStoreAdmin.listing.promotion.standard'](),
        DEMOTED: () => m['appStoreAdmin.listing.promotion.demoted'](),
    };
    return map[level]();
};

const getPromotionDescription = (level: PromotionLevel): string => {
    const map: Record<PromotionLevel, () => string> = {
        FEATURED_CAROUSEL: () => m['appStoreAdmin.listing.promotion.featuredCarouselDesc'](),
        CURATED_LIST: () => m['appStoreAdmin.listing.promotion.curatedListDesc'](),
        STANDARD: () => m['appStoreAdmin.listing.promotion.standardDesc'](),
        DEMOTED: () => m['appStoreAdmin.listing.promotion.demotedDesc'](),
    };
    return map[level]();
};

export const PromotionMenu: React.FC<PromotionMenuProps> = ({
    currentLevel,
    listingId,
    onPromotionChange,
}) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
        <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">
                {m['appStoreAdmin.listing.promotionTitle']()}
            </h3>

            <div className="relative">
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="w-full p-3 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors"
                >
                    <span className="text-sm text-gray-600">
                        {currentLevel
                            ? getPromotionLabel(currentLevel)
                            : m['appStoreAdmin.listing.promotion.standard']()}
                    </span>
                    <ArrowDown className="w-4 h-4 text-gray-400" />
                </button>

                {showMenu && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                        {(
                            Object.entries(PROMOTION_LEVEL_INFO) as [
                                PromotionLevel,
                                (typeof PROMOTION_LEVEL_INFO)[PromotionLevel]
                            ][]
                        ).map(([level, info]) => {
                            const Icon = PROMOTION_ICONS[level];

                            return (
                                <button
                                    key={level}
                                    onClick={() => {
                                        onPromotionChange(listingId, level);
                                        setShowMenu(false);
                                    }}
                                    className={`w-full p-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                                        currentLevel === level ? 'bg-cyan-50' : ''
                                    }`}
                                >
                                    <Icon className="w-4 h-4 text-gray-400" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">
                                            {getPromotionLabel(level)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {getPromotionDescription(level)}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
