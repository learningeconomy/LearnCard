import React from 'react';

import { IonCol, IonRow } from '@ionic/react';
import Plus from 'learn-card-base/svgs/Plus';

import {
    BoostPageViewMode,
    BoostPageViewModeType,
} from '../earned-and-managed-tabs/EarnedAndManagedTabs';
import { CredentialCategory, CredentialCategoryEnum, categoryMetadata } from 'learn-card-base';
import { BrandingEnum } from '../headerBranding/headerBrandingHelpers';

type NewBoostButtonProps = {
    credentialType: CredentialCategory;
    onClick: () => void;
    viewMode?: BoostPageViewModeType;
    branding?: BrandingEnum;
};

const NewBoostButton: React.FC<NewBoostButtonProps> = ({
    credentialType,
    onClick,
    viewMode = BoostPageViewMode.Card,
    branding = BrandingEnum.learncard,
}) => {
    let { color } = categoryMetadata[credentialType];
    let typeName: string = credentialType;

    const isId = credentialType === CredentialCategoryEnum.id;

    if (branding === BrandingEnum.learncard) {
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
        //         <IonRow className="flex items-center justify-center cursor-pointer mx-4 h-[200px] w-[355px] overflow-hidden">
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
        //         </IonRow>
        //     );
        // }
        return (
            <IonCol
                size="6"
                size-sm={4}
                size-md={4}
                size-lg={4}
                className="flex justify-center items-center relative z-10 pt-[20px]"
            >
                <button
                    onClick={onClick}
                    className={`h-full pt-[15px] bg-opacity-30 rounded-[20px] flex flex-col items-center justify-center gap-[10px] w-[160px] min-h-[280px] bg-${color}`}
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
            </IonCol>
        );
    } else {
        // List View
        return (
            <IonRow
                className={`rounded-[15px] w-full flex gap-[10px] items-center w-full z-[2] bg-${color} bg-opacity-30 ${
                    isId ? 'px-[8px] py-[17px]' : 'p-[8px]'
                }`}
                onClick={onClick}
                role="button"
            >
                <div
                    className={`bg-white rounded-full p-[10px] text-${color} w-fit h-fit shadow-soft-bottom`}
                >
                    <Plus className="h-[20px] w-[20px]" />
                </div>
                <span className="text-[17px] text-white">New {typeName}</span>
            </IonRow>
        );
    }
};

export default NewBoostButton;
