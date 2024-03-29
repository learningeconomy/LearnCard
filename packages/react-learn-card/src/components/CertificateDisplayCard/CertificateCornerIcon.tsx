import React from 'react';
import RoundedCorner from '../svgs/RoundedCorner';
import { getCategoryColor, getCategoryIcon } from '../../helpers/credential.helpers';
import { LCCategoryEnum } from '../../types';

type CertificateCornerIconProps = {
    categoryType: LCCategoryEnum;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
};

const CertificateCornerIcon: React.FC<CertificateCornerIconProps> = ({
    categoryType,
    position,
}) => {
    const credentialPrimaryColor = getCategoryColor(categoryType) ?? 'emerald-500';
    const credentialIcon = getCategoryIcon(categoryType);

    let iconPositionClassName, cornerPositionClassName;
    switch (position) {
        case 'top-left':
            iconPositionClassName = 'top-0 left-0';
            cornerPositionClassName = 'bottom-0 right-0';
            break;
        case 'top-right':
            iconPositionClassName = 'top-0 right-0';
            cornerPositionClassName = 'bottom-0 left-0 rotate-90';
            break;
        case 'bottom-left':
            iconPositionClassName = 'bottom-0 left-0';
            cornerPositionClassName = 'top-0 right-0 rotate-[270deg]';
            break;
        case 'bottom-right':
            iconPositionClassName = 'bottom-0 right-0';
            cornerPositionClassName = 'top-0 left-0 rotate-180';
            break;
    }

    return (
        <div
            className={`text-${credentialPrimaryColor} p-[11px] rounded-full bg-white absolute ${iconPositionClassName}`}
        >
            {credentialIcon}
            <RoundedCorner className={`absolute ${cornerPositionClassName}`} />
        </div>
    );
};

export default CertificateCornerIcon;
