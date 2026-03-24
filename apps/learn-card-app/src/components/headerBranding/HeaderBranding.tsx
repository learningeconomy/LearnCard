import React from 'react';

import { useLocation, useHistory } from 'react-router-dom';

import {
    BrandingEnum,
    getHeaderBrandingColor,
} from 'learn-card-base/components/headerBranding/headerBrandingHelpers';
import { getHeaderText } from 'learn-card-base/config/brandingHelpers';

import useTheme from '../../theme/hooks/useTheme';
import { CredentialCategoryEnum } from 'learn-card-base';
import { useTenantBrandingAssets } from '../../config/brandingAssets';
import { useTenantConfig } from 'learn-card-base/config/TenantConfigProvider';

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
    const { textLogoDark } = useTenantBrandingAssets();
    const tenantConfig = useTenantConfig();

    const { getThemedCategoryColors } = useTheme();
    const colors = getThemedCategoryColors(category as CredentialCategoryEnum);

    const headerColors =
        colors?.headerBrandingTextColor || getHeaderBrandingColor(branding, location.pathname);

    const headerText = getHeaderText(tenantConfig.branding);

    return (
        <button
            onClick={() => history.push(tenantConfig.branding.homeRoute ?? '/wallet')}
            className={`text-sm z-10 tracking-[6px] font-bold select-none ${headerColors} ${textColor} ${className}`}
            disabled={disableClick}
        >
            {textLogoDark ? (
                <img
                    src={textLogoDark}
                    alt={headerText}
                    className="max-w-[150px] max-h-[20px] object-contain"
                />
            ) : (
                headerText
            )}
        </button>
    );
};

export default HeaderBranding;
