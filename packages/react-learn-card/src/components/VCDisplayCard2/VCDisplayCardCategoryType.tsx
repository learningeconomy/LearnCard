import React from 'react';
import { getCategoryColor } from '../../helpers/credential.helpers';
import { LCCategoryEnum } from '../../types';

const VCDisplayCardCategoryType: React.FC<{ categoryType?: LCCategoryEnum }> = ({
    categoryType = LCCategoryEnum.achievement,
}) => {
    const categoryColor = getCategoryColor(categoryType);

    return (
        <span
            className={`uppercase font-poppins text-[12px] font-[600] leading-[12px] select-none text-${categoryColor}`}
        >
            {categoryType}
        </span>
    );
};

export default VCDisplayCardCategoryType;
