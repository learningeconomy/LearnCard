import React from 'react';

import { BoostCategoryOptionsEnum } from 'learn-card-base';

import * as m from '../../paraglide/messages.js';
import { CATEGORY_DESCRIPTIONS } from './category-descriptions';

// Maps the descriptor category (string enum value) to the i18n key segment under
// wallet.categoryDescriptor.descriptions.*. Falls back to the hardcoded English
// text in CATEGORY_DESCRIPTIONS when there's no translation.
const DESCRIPTION_KEYS: Record<string, string> = {
    'Learning History': 'studies',
    'Social Badge': 'socialBadges',
    Achievement: 'achievements',
    Accomplishment: 'portfolio',
    Skill: 'skills',
    'Work History': 'experiences',
    Accommodation: 'assistance',
    ID: 'ids',
    Family: 'families',
    'AI Insight': 'aiInsights',
    aiPathway: 'aiPathways',
};

export const CategoryDescriptor: React.FC<{
    category: BoostCategoryOptionsEnum | string;
    className: string;
}> = ({ category, className }) => {
    const categoryDescriptor = CATEGORY_DESCRIPTIONS?.[category];

    const descKey = DESCRIPTION_KEYS[category];
    const messageFn = descKey
        ? (m as Record<string, unknown>)[`wallet.categoryDescriptor.descriptions.${descKey}`]
        : undefined;
    const text =
        typeof messageFn === 'function' ? (messageFn as () => string)() : categoryDescriptor?.text;

    return (
        <div className="relative text-grayscale-900 z-9999">
            <p className={className || 'text-black max-w-[400px] text-center mx-auto mt-10 pb-5'}>
                {text}
            </p>
        </div>
    );
};

export default CategoryDescriptor;
