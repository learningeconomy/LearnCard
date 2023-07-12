import React from 'react';
import { LCCategoryEnum } from '../../types';

const getCategoryTextColor = (category = LCCategoryEnum.achievement): string => {
    if (category === LCCategoryEnum.socialBadge) return 'text-cyan-700';
    if (category === LCCategoryEnum.skill) return 'text-indigo-600';
    if (category === LCCategoryEnum.achievement) return 'text-spice-600';

    if (category === LCCategoryEnum.learningHistory) return 'text-emerald-700';
    if (category === LCCategoryEnum.id) return 'text-yellow-400';
    if (category === LCCategoryEnum.workHistory) return 'text-rose-600';

    if (category === LCCategoryEnum.course) return 'text-emerald-700';
    if (category === LCCategoryEnum.job) return 'text-rose-600';
    if (category === LCCategoryEnum.currency) return 'text-cyan-700';
    if (category === LCCategoryEnum.membership) return 'text-teal-500';

    return 'text-spice-600';
};

const VCDisplayCardCategoryType: React.FC<{ categoryType?: LCCategoryEnum }> = ({
    categoryType = LCCategoryEnum.achievement,
}) => {
    const categoryColor = getCategoryTextColor(categoryType);

    return (
        <span
            className={`uppercase font-poppins text-[12px] font-[600] leading-[12px] select-none ${categoryColor}`}
        >
            {categoryType}
        </span>
    );
};

export default VCDisplayCardCategoryType;
