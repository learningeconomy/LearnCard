import React from 'react';

import { useLocation, useHistory } from 'react-router-dom';

import { BrandingEnum, getHeaderBrandingColor } from './headerBrandingHelpers';

import ScoutPassLogoAndText from 'learn-card-base/svgs/ScoutLogoAndText';

type HeaderBrandingProps = {
    branding: BrandingEnum;
    className?: string;
    textColor?: string;
    spanColor?: string;
    disableClick?: boolean;
};

const HeaderBranding: React.FC<HeaderBrandingProps> = ({
    branding = BrandingEnum.learncard,
    className,
    textColor,
    spanColor,
    disableClick,
}) => {
    const location = useLocation();
    const history = useHistory();

    if (branding === BrandingEnum.metaversity) {
        return (
            <h6
                className={`text-sm tracking-[6px] font-bold text-mv_red-700 select-none ${getHeaderBrandingColor(
                    BrandingEnum.metaversity,
                    location.pathname
                )} ${textColor} ${className}`}
            >
                META
                <span
                    className={`text-mv_blue-700 ${getHeaderBrandingColor(
                        BrandingEnum.metaversity,
                        location.pathname
                    )} ${spanColor}`}
                >
                    VERSITY
                </span>
            </h6>
        );
    }

    if (branding === BrandingEnum.scoutPass) {
        return (
            <button
                onClick={() => history.push('/campfire')}
                className={`flex items-center justify-start ion-padding ${className}`}
                disabled={disableClick}
            >
                <ScoutPassLogoAndText
                    className={`min-w-[235px] main-header-sp-logo ${getHeaderBrandingColor(
                        branding,
                        location.pathname
                    )} ${textColor} ${className} !ml-[-10px]`}
                />
            </button>
        );
    }

    return (
        <button
            onClick={() => history.push('/wallet')}
            className={`text-sm z-10 tracking-[6px] font-bold select-none ${getHeaderBrandingColor(
                branding,
                location.pathname
            )} ${textColor} ${className}`}
            disabled={disableClick}
        >
            LEARNCARD
        </button>
    );
};

export default HeaderBranding;
