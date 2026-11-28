import { tailwindColorWithOpacity } from 'learn-card-base/helpers/colorHelpers';
import React from 'react';

import Plus from 'learn-card-base/svgs/Plus';

import {
    BoostPageViewMode,
    BoostPageViewModeType,
} from '../earned-and-managed-tabs/EarnedAndManagedTabs';
import { CredentialCategory, CredentialCategoryEnum, categoryMetadata } from 'learn-card-base';
import { BrandingEnum } from '../headerBranding/headerBrandingHelpers';
import type { TenantBrandingConfig } from '../../config/tenantConfig';
import { getCategoryLabel, getCategoryColor } from '../../config/brandingHelpers';
import { AppCol, AppRow } from 'learn-card-base/ui/layout';

type NewBoostButtonProps = {
    credentialType: CredentialCategory;
    onClick: () => void;
    viewMode?: BoostPageViewModeType;
    branding?: BrandingEnum;
    tenantBranding?: TenantBrandingConfig;
};

const NewBoostButton: React.FC<NewBoostButtonProps> = ({
    credentialType,
    onClick,
    viewMode = BoostPageViewMode.Card,
    branding = BrandingEnum.learncard,
    tenantBranding,
}) => {
    let { color } = categoryMetadata[credentialType];
    let typeName: string = credentialType;

    const isId = credentialType === CredentialCategoryEnum.id;

    // Data-driven path: use tenant config for labels and colors
    if (tenantBranding) {
        typeName = getCategoryLabel(tenantBranding, credentialType);

        const colorOverride = getCategoryColor(tenantBranding, credentialType);

        if (colorOverride) color = colorOverride;
    } else if (branding === BrandingEnum.learncard) {
        switch (credentialType) {
            case CredentialCategoryEnum.learningHistory:
                typeName = 'Study';
                break;
            case CredentialCategoryEnum.workHistory:
                typeName = 'Experience';
                break;
            case CredentialCategoryEnum.accommodation:
                typeName = 'Assistance';
                break;
            case CredentialCategoryEnum.accomplishment:
                typeName = 'Portfolio';
                break;
            case CredentialCategoryEnum.socialBadge:
                typeName = 'Boost';
                break;
        }
    } else if (branding === BrandingEnum.scoutPass) {
        const isMeritBadge = credentialType === CredentialCategoryEnum.meritBadge;
        color = isMeritBadge ? 'sp-purple-base' : 'sp-blue-dark-ocean';

        if (credentialType === CredentialCategoryEnum.socialBadge) {
            typeName = 'Boost';
        }
    }

    if (viewMode === BoostPageViewMode.Card) {
        // if (isId) {
        //     return (
        //         <AppRow className="flex items-center justify-center cursor-pointer mx-4 h-[200px] w-[355px] overflow-hidden">
        //             <button
        //                 onClick={onClick}
        //                 className="bg-blue-400 rounded-[15px] px-[6px] h-full w-full flex flex-col gap-[10px] items-center justify-center"
        //             >
        //                 <div
        //                     className={`bg-white rounded-full p-[8px] text-${color} w-fit h-fit shadow-soft-bottom`}
        //                 >
        //                     <Plus className="h-[20px] w-[20px]" />
        //                 </div>
        //                 <div className="flex flex-col text-[17px] text-white font-notoSans font-[700] leading-[normal]">
        //                     {/* <span>New {credentialTypeOverride || credentialType}</span> */}
        //                     <span>New</span>
        //                     <span>{typeName}</span>
        //                 </div>
        //             </button>
        //         </AppRow>
        //     );
        // }
        return (
            <AppCol
                size="6"
                size-sm={4}
                size-md={4}
                size-lg={4}
                className="flex justify-center items-center relative z-10 pt-[20px]"
            >
                <button
                    onClick={onClick}
                    style={{ backgroundColor: tailwindColorWithOpacity(color, 30) }}
                    className="h-full pt-[15px] rounded-[20px] flex flex-col items-center justify-center gap-[10px] w-[160px] min-h-[280px]"
                >
                    <div
                        className={`bg-white rounded-full p-[8px] text-${color} w-fit h-fit shadow-soft-bottom`}
                    >
                        <Plus className="h-[20px] w-[20px]" />
                    </div>
                    <div className="flex flex-col text-[17px] text-white font-notoSans font-[700] leading-[normal]">
                        {/* <span>New {credentialTypeOverride || credentialType}</span> */}
                        <span>New</span>
                        <span>{typeName}</span>
                    </div>
                </button>
            </AppCol>
        );
    } else {
        // List View
        return (
            <AppRow
                className={`rounded-[15px] w-full flex gap-[10px] items-center w-full z-[2] ${
                    isId ? 'px-[8px] py-[17px]' : 'p-[8px]'
                }`}
                onClick={onClick}
                style={{ backgroundColor: tailwindColorWithOpacity(color, 30) }}
                role="button"
            >
                <div
                    className={`bg-white rounded-full p-[10px] text-${color} w-fit h-fit shadow-soft-bottom`}
                >
                    <Plus className="h-[20px] w-[20px]" />
                </div>
                <span className="text-[17px] text-white">New {typeName}</span>
            </AppRow>
        );
    }
};

export default NewBoostButton;
