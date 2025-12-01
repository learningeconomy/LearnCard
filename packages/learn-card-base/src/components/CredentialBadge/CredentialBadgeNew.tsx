import React from 'react';

import Ribbon from 'learn-card-base/svgs/Ribbon';
import CertRibbon from 'learn-card-base/svgs/CertRibbon';
import MeritBadgeRibbon from 'learn-card-base/svgs/MeritBadgeRibbon';
import CredentialIDBadge from './CredentialIDBadge';
import CredentialMediaBadge from './CredentialMediaBadge';

import { insertParamsToFilestackUrl } from 'learn-card-base/filestack/images/filestack.helpers';
import { VC } from '@learncard/types';
import { BrandingEnum } from '../headerBranding/headerBrandingHelpers';
import { getAchievementTypeDisplayText } from 'learn-card-base/helpers/credentialHelpers';

import { BoostCategoryOptionsEnum, boostCategoryMetadata } from 'learn-card-base';

type CredentialBadgeProps = {
    boostType?: BoostCategoryOptionsEnum;
    achievementType: string;
    fallbackCircleText?: string;
    badgeThumbnail: string;
    showBackgroundImage: boolean;
    backgroundImage: string;
    backgroundColor: string;
    badgeContainerCustomClass?: string;
    badgeCircleCustomClass?: string;
    badgeThumbnailContainerClass?: string;
    badgeThumbnailCustomClass?: string;
    badgeRibbonContainerCustomClass?: string;
    badgeRibbonCustomClass?: string;
    badgeRibbonIconCustomClass?: string;
    certRibbonCustomClass?: string;
    displayType?: string;
    branding?: BrandingEnum;
    credential: VC;
    borderStyle?: string;
};

export const CredentialBadgeNew: React.FC<CredentialBadgeProps> = ({
    boostType,
    achievementType,
    fallbackCircleText,
    badgeThumbnail,
    showBackgroundImage = false,
    backgroundImage,
    backgroundColor,
    badgeContainerCustomClass = '',
    badgeCircleCustomClass = '',
    badgeThumbnailContainerClass = '',
    badgeThumbnailCustomClass = '',
    badgeRibbonContainerCustomClass = '',
    badgeRibbonCustomClass = '',
    badgeRibbonIconCustomClass = '',
    certRibbonCustomClass = '',
    displayType = 'badge',
    branding,
    credential,
    borderStyle,
}) => {
    const defaultBoostType = BoostCategoryOptionsEnum.socialBadge;
    const { subColor, IconComponent, SolidIconComponent, badgeBackgroundColor } =
        boostCategoryMetadata[boostType ?? defaultBoostType];

    let _colorOverride = badgeBackgroundColor ?? 'gray-500';
    let _subColorOverride = subColor ?? 'gray-300';
    let IconComponentOverride = SolidIconComponent ?? IconComponent ?? (() => null);

    let badgeCircleText = getAchievementTypeDisplayText(
        achievementType,
        boostType ?? defaultBoostType,
        fallbackCircleText
    );

    // check what display type to render
    const isBadgeDisplayType = displayType === 'badge';
    const isCertDisplayType = displayType === 'certificate';
    const isAwardDisplay = displayType === 'award';
    const isMediaDisplayType = displayType === 'media';
    const isIDDisplayType = displayType === 'id';

    const isMeritBadge = boostType === BoostCategoryOptionsEnum.meritBadge;
    const isID = boostType === BoostCategoryOptionsEnum.id || isIDDisplayType;

    const displayTypeStyles = isCertDisplayType
        ? `bg-white shadow-none w-[115px] h-[115px]`
        : `bg-${_colorOverride} ${badgeCircleCustomClass}`;

    let displayTypeBackgroundStyles = 'min-h-[120px] max-h-[120px] top-[-10px]';
    if (isCertDisplayType) displayTypeBackgroundStyles = 'min-h-[120px] max-h-[120px] top-[-20px]';
    if (isMediaDisplayType)
        displayTypeBackgroundStyles = 'min-h-[120px] max-h-[120px] !rounded-none';

    let badgeBackground = null;

    if (showBackgroundImage) {
        badgeBackground = backgroundImage ? (
            <div
                className={`absolute z-10 w-full h-full ${displayTypeBackgroundStyles} bg-${_colorOverride} rounded-br-[100%] rounded-bl-[100%]`}
                style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.75)), url(${insertParamsToFilestackUrl(
                        backgroundImage,
                        'resize=width:300/quality=value:75/'
                    )})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                }}
            />
        ) : (
            <div
                className={`absolute z-10 w-full h-full ${displayTypeBackgroundStyles} rounded-br-[100%] rounded-bl-[100%] bg-${_colorOverride}`}
                style={{
                    backgroundColor: backgroundColor,
                }}
            />
        );
    }

    if (isMeritBadge || isAwardDisplay) {
        return (
            <>
                <div
                    className={`relative flex items-center justify-center w-full mt-8 mb-8 select-none ${badgeContainerCustomClass}`}
                >
                    {badgeBackground}
                </div>
                <div
                    className={`w-full mx-auto flex items-center justify-center relative shadow-none relative`}
                >
                    <MeritBadgeRibbon
                        className={`z-10 h-full w-fit text-${badgeBackgroundColor}`}
                        image={badgeThumbnail}
                    />
                    <div className="absolute bottom-[-8%] right-[50%] translate-x-1/2 bg-white rounded-full p-1 h-[28px] w-[28px] flex items-center justify-center z-[9999]">
                        <IconComponentOverride className={`text-${_colorOverride} h-[18px]`} />
                    </div>
                </div>
            </>
        );
    }

    if (isCertDisplayType) {
        return (
            <>
                <div
                    className={`relative flex items-center justify-center w-full mt-8 mb-8 select-none ${badgeContainerCustomClass}`}
                >
                    {badgeBackground}
                </div>
                <div className="w-full flex items-center justify-center">
                    <div
                        className={`relative z-50 flex items-center justify-center rounded-full border-white border-solid border-4 ${borderStyle} ${displayTypeStyles}`}
                    >
                        <div
                            className={`relative flex items-center justify-center w-[70%] h-[70%] rounded-full border-white border-solid border-4 ${borderStyle} ${_subColorOverride} overflow-hidden object-contain bg-${subColor} ${badgeThumbnailContainerClass}`}
                        >
                            <img
                                src={insertParamsToFilestackUrl(
                                    badgeThumbnail,
                                    'resize=width:200/quality=value:75/'
                                )}
                                alt="badge thumbnail"
                                className={`${badgeThumbnailCustomClass}`}
                            />
                        </div>
                        {isCertDisplayType && (
                            <CertRibbon
                                className={`absolute top-[-6%] z-[9999] w-[120px] h-[120px] text-${_colorOverride} ${certRibbonCustomClass}`}
                            />
                        )}
                        <div className="absolute bottom-[1%] right-[50%] translate-x-1/2 bg-white rounded-full p-1 h-[28px] w-[28px] flex items-center justify-center z-[9999]">
                            <IconComponentOverride className={`text-${_colorOverride} h-[18px]`} />
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (isMediaDisplayType) {
        return (
            <CredentialMediaBadge
                credential={credential}
                backgroundColor={backgroundColor}
                badgeContainerCustomClass={badgeContainerCustomClass}
            />
        );
    }

    if (isID) {
        return (
            <CredentialIDBadge
                credential={credential}
                backgroundColor={backgroundColor}
                badgeContainerCustomClass={badgeContainerCustomClass}
            />
        );
    }

    return (
        <div
            className={`relative flex items-center justify-center w-full mt-8 mb-8 select-none ${badgeContainerCustomClass}`}
        >
            {badgeBackground}
            <div
                className={`relative z-50 flex items-center justify-center rounded-full border-white border-solid border-4 ${borderStyle} ${displayTypeStyles}`}
            >
                <div
                    className={`relative flex items-center justify-center w-[60%] h-[60%] rounded-full border-white border-solid border-4 ${borderStyle} ${_subColorOverride} overflow-hidden object-contain bg-${subColor} ${badgeThumbnailContainerClass}`}
                >
                    <img
                        src={insertParamsToFilestackUrl(
                            badgeThumbnail,
                            'resize=width:200/quality=value:75/'
                        )}
                        alt="badge thumbnail"
                        className={`h-full w-full object-cover ${badgeThumbnailCustomClass}`}
                    />
                </div>

                {/* <CircleWithText
                    className="absolute text-white"
                    textClassName="text-white fill-white font-bold tracking-wider uppercase"
                    text={badgeCircleText ?? 'Achievement'}
                /> */}

                <div
                    className={`absolute flex items-center justify-center left-[37%] bottom-[-12%] ${badgeRibbonContainerCustomClass}`}
                >
                    <Ribbon className={badgeRibbonCustomClass} />
                    <IconComponentOverride
                        className={`absolute text-${_colorOverride} h-[18px] mb-3 ${badgeRibbonIconCustomClass}`}
                    />
                </div>
            </div>
        </div>
    );
};

export default CredentialBadgeNew;
