import React from 'react';

import { BoostCategoryOptionsEnum } from 'learn-card-base';

import { CATEGORY_DESCRIPTIONS } from './category-descriptions';

type CategoryDescriptorProps = {
    category: BoostCategoryOptionsEnum | string;
    className: string;
};

export const CategoryDescriptor: React.FC<CategoryDescriptorProps> = ({ category, className }) => {
    const categoryDescriptor = CATEGORY_DESCRIPTIONS?.[category];

    return (
        <div className="relative text-grayscale-900 z-9999">
            <p className={className || 'text-black max-w-[400px] text-center mx-auto mt-10 pb-5'}>
                {categoryDescriptor?.text}
            </p>
        </div>
    );
};

export default CategoryDescriptor;
