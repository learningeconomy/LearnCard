import React from 'react';
import RoundedCorner from '../svgs/RoundedCorner';
import { getCategoryIcon, getCategoryLightColor } from '../../helpers/credential.helpers';
import { LCCategoryEnum } from '../../types';

type MeritBadgeCornerIconProps = {
    categoryType: LCCategoryEnum;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};

const MeritBadgeCornerIcon: React.FC<MeritBadgeCornerIconProps> = ({ categoryType, position }) => {
    const credentialPrimaryColor = getCategoryLightColor(categoryType);
    const credentialIcon = getCategoryIcon(categoryType);

    let iconPositionClassName, cornerPositionClassName;
    switch (position) {
        case 'top-left':
            iconPositionClassName = 'top-[3px] left-[3px] pb-[10px] pr-[10px] pl-[4px] pt-[4px]';
            cornerPositionClassName = 'bottom-[-1px] right-0';
            break;
        case 'top-right':
            iconPositionClassName = 'top-[3px] right-[3px] pl-[10px] pb-[10px] pr-[4px] pt-[4px]';
            cornerPositionClassName = 'bottom-[-1px] left-0 rotate-90';
            break;
        case 'bottom-left':
            iconPositionClassName = 'bottom-[3px] left-[3px] pr-[10px] pt-[10px] pl-[4px] pb-[4px]';
            cornerPositionClassName = 'top-0 right-0 rotate-[270deg]';
            break;
        case 'bottom-right':
            iconPositionClassName =
                'bottom-[3px] right-[3px] pl-[10px] pt-[10px] pr-[4px] pb-[4px]';
            cornerPositionClassName = 'top-[-1px] left-0 rotate-180';
            break;
    }

    return (
        <div
            className={`text-${credentialPrimaryColor} rounded-full bg-white absolute ${iconPositionClassName}`}
        >
            {credentialIcon}
            <RoundedCorner className={`absolute ${cornerPositionClassName}`} />
        </div>
    );
};

export default MeritBadgeCornerIcon;
