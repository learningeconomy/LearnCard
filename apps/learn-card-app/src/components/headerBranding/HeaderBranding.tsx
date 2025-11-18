import React from 'react';

import { useLocation, useHistory } from 'react-router-dom';

import {
    BrandingEnum,
    getHeaderBrandingColor,
} from 'learn-card-base/components/headerBranding/headerBrandingHelpers';

import useTheme from '../../theme/hooks/useTheme';
import { CredentialCategoryEnum } from 'learn-card-base';

type HeaderBrandingProps = {
    category?: CredentialCategoryEnum;
    branding: BrandingEnum;
    className?: string;
    textColor?: string;
    disableClick?: boolean;
};

const HeaderBranding: React.FC<HeaderBrandingProps> = ({
    category,
    branding = BrandingEnum.learncard,
    className,
    textColor,
    disableClick,
}) => {
    const location = useLocation();
    const history = useHistory();

    const { getThemedCategoryColors } = useTheme();
    const colors = getThemedCategoryColors(category as CredentialCategoryEnum);

    const headerColors =
        colors?.headerBrandingTextColor || getHeaderBrandingColor(branding, location.pathname);

    return (
        <button
            onClick={() => history.push('/wallet')}
            className={`text-sm z-10 tracking-[6px] font-bold select-none ${headerColors} ${textColor} ${className}`}
            disabled={disableClick}
        >
            LEARNCARD
        </button>
    );
};

export default HeaderBranding;
