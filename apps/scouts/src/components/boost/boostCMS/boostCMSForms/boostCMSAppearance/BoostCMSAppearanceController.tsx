import React from 'react';

import { useIonModal } from '@ionic/react';
import {
    BoostUserTypeEnum,
    CATEGORY_TO_SUBCATEGORY_LIST,
    boostCategoryOptions,
} from '../../../boost-options/boostOptions';

import Ribbon from 'learn-card-base/svgs/Ribbon';
import Pencil from '../../../../svgs/Pencil';
import CircleWithText from 'learn-card-base/svgs/CircleWithText';
import MeritBadgeRibbon from 'learn-card-base/svgs/MeritBadgeRibbon';
import BoostCMSAppearanceFormModal from './BoostCMSAppearanceFormModal';

import { BoostCMSState } from '../../../boost';
import {
    getAchievementTypeFromCustomType,
    isCustomBoostType,
    replaceUnderscoresWithWhiteSpace,
    BoostCategoryOptionsEnum,
} from 'learn-card-base';

type BoostCMSActiveAppearanceControllerProps = {
    state: BoostCMSState;
    setState?: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    boostUserType?: BoostUserTypeEnum;
    customTypes?: any;
    setCustomTypes?: React.Dispatch<any>;
    disabled?: boolean;
    handleCategoryAndTypeChange?: (
        categoryType: BoostCategoryOptionsEnum,
        achievementType: string
    ) => void;
    showEditButton?: boolean;
    customHeaderClass?: string;
};

const BoostCMSAppearanceController: React.FC<BoostCMSActiveAppearanceControllerProps> = ({
    state,
    setState,
    boostUserType,
    customTypes,
    setCustomTypes,
    disabled = false,
    handleCategoryAndTypeChange,
    showEditButton = true,
    customHeaderClass = '',
}) => {
    const { color, subColor, IconComponent } =
        boostCategoryOptions[state?.basicInfo?.type as BoostCategoryOptionsEnum];
    let badgeCircleText = '';

    if (isCustomBoostType(state?.basicInfo?.achievementType)) {
        badgeCircleText = replaceUnderscoresWithWhiteSpace(
            getAchievementTypeFromCustomType(state?.basicInfo?.achievementType)
        );
    } else {
        badgeCircleText =
            CATEGORY_TO_SUBCATEGORY_LIST?.[state?.basicInfo?.type].find(
                options => options?.type === state?.basicInfo?.achievementType
            )?.title ?? '';
    }

    const isMeritBadge = state?.basicInfo?.type === BoostCategoryOptionsEnum.meritBadge;

    const [presentCenterModal, dismissCenterModal] = useIonModal(BoostCMSAppearanceFormModal, {
        state: state,
        setState: setState,
        handleCloseModal: () => dismissCenterModal(),
        boostUserType: boostUserType,
        customTypes: customTypes,
        setCustomTypes: setCustomTypes,
        showCloseButton: true,
        disabled: disabled,
        handleCategoryAndTypeChange: handleCategoryAndTypeChange,
    });

    const [presentSheetModal, dismissSheetModal] = useIonModal(BoostCMSAppearanceFormModal, {
        state: state,
        setState: setState,
        handleCloseModal: () => dismissSheetModal(),
        boostUserType: boostUserType,
        customTypes: customTypes,
        setCustomTypes: setCustomTypes,
        disabled: disabled,
        handleCategoryAndTypeChange: handleCategoryAndTypeChange,
    });

    return (
        <div className="flex items-center justify-center w-full mt-8 mb-8 relative">
            <div
                style={{
                    backgroundColor: state?.appearance?.backgroundColor
                        ? state?.appearance?.backgroundColor
                        : '#353E64',
                    backgroundImage: `url(${state?.appearance?.backgroundImage})`,
                    backgroundPosition: 'center',
                    backgroundSize: 'cover',
                }}
                className={`absolute top-[-25px] z-15 w-[220px] h-[170px] boost-cms-rounded-bg ${customHeaderClass}`}
            />
            <div className="relative flex items-center justify-center w-[170px] h-[170px] z-50">
                {showEditButton && (
                    <button
                        onClick={() =>
                            presentCenterModal({
                                cssClass: 'center-modal boost-cms-appearance-modal',
                                backdropDismiss: false,
                                showBackdrop: false,
                            })
                        }
                        className={`absolute bg-white h-12 w-12 z-10 ${
                            isMeritBadge ? 'right-[-32px]' : 'right-[-38px]'
                        } rounded-tr-full rounded-br-full flex items-center justify-center modal-btn-desktop`}
                    >
                        <Pencil className="text-grayscale-800 w-[30px]" />
                    </button>
                )}
                {showEditButton && (
                    <button
                        onClick={() => {
                            presentSheetModal();
                        }}
                        className={`absolute bg-white h-12 w-12 z-10 ${
                            isMeritBadge ? 'right-[-32px]' : 'right-[-38px]'
                        } rounded-tr-full rounded-br-full flex items-center justify-center modal-btn-mobile`}
                    >
                        <Pencil className="text-grayscale-800 w-[30px]" />
                    </button>
                )}

                {!isMeritBadge && (
                    <div
                        className={`relative flex items-center justify-center w-[170px] h-[170px] rounded-full border-white border-solid border-4 bg-${color} z-50`}
                    >
                        <CircleWithText
                            className="absolute text-white"
                            textClassName="text-white fill-white font-bold tracking-wider uppercase"
                            text={badgeCircleText}
                        />
                        <div
                            className={`relative flex items-center justify-center w-[60%] h-[60%] rounded-full border-white border-solid border-4 bg-${subColor} overflow-hidden object-contain bg-${subColor}`}
                        >
                            <img src={state?.appearance?.badgeThumbnail} alt="badge thumbnail" />
                        </div>
                        <div className="absolute flex items-center justify-center left-[37%] bottom-[-12%]">
                            <Ribbon />
                            <IconComponent className={`absolute text-${color} h-[30px] mb-3`} />
                        </div>
                    </div>
                )}

                {isMeritBadge && (
                    <MeritBadgeRibbon
                        image={state?.appearance.badgeThumbnail}
                        showIcon={false}
                        className="h-[202px] w-[202px] top-[-2px] absolute z-10 pointer-events-none text-sp-purple-base"
                    />
                )}
            </div>
        </div>
    );
};

export default BoostCMSAppearanceController;
