import React, { useEffect } from 'react';

import { useIonModal } from '@ionic/react';
import {
    boostCategoryOptions,
    BoostCategoryOptionsEnum,
    BoostUserTypeEnum,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../../../boost-options/boostOptions';

import Ribbon from 'learn-card-base/svgs/Ribbon';
import Pencil from '../../../../svgs/Pencil';
import CircleWithText from 'learn-card-base/svgs/CircleWithText';
import MeritBadgeRibbon from 'learn-card-base/svgs/MeritBadgeRibbon';

import { BoostCMSAppearanceDisplayTypeEnum, BoostCMSState } from '../../../boost';
import BoostCMSAppearanceFormModal from './BoostCMSAppearanceFormModal';
import {
    getAchievementTypeFromCustomType,
    isCustomBoostType,
    replaceUnderscoresWithWhiteSpace,
    useModal,
} from 'learn-card-base';
import CertRibbon from 'apps/learn-card-app/src/components/svgs/CertRibbon';

import useTheme from '../../../../../theme/hooks/useTheme';

type BoostCMSAppearanceControllerProps = {
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

const BoostCMSAppearanceController: React.FC<BoostCMSAppearanceControllerProps> = ({
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
    const { newModal } = useModal();
    const { getThemedCategoryIcons } = useTheme();

    const { Icon } = getThemedCategoryIcons(state?.basicInfo?.type);
    const { color, subColor } = boostCategoryOptions[state?.basicInfo?.type];
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

    const isBadgeDisplayType =
        state?.appearance?.displayType === BoostCMSAppearanceDisplayTypeEnum.Badge;
    const isCertDisplayType =
        state?.appearance?.displayType === BoostCMSAppearanceDisplayTypeEnum.Certificate;
    const isAwardDisplayType =
        state?.appearance?.displayType === BoostCMSAppearanceDisplayTypeEnum.Award;
    const isMediaDisplayType =
        state?.appearance?.displayType === BoostCMSAppearanceDisplayTypeEnum.Media;

    let controllerContainerStyles = '';
    let imageStyles = '';
    if (isBadgeDisplayType) {
        controllerContainerStyles = `relative flex items-center justify-center w-[170px] h-[170px] rounded-full border-white border-solid border-4 bg-${color} z-50`;
        imageStyles = 'w-[60%] h-[60%]';
    } else if (isCertDisplayType) {
        controllerContainerStyles =
            'relative flex items-center justify-center w-[170px] h-[155px] rounded-[25px] border-white border-solid border-4 bg-white z-50';
        imageStyles = 'w-[60%] h-[65%]';
    } else if (isAwardDisplayType) {
        controllerContainerStyles =
            'relative flex items-center justify-center w-[202px] h-[202px] z-50';
    } else if (isMediaDisplayType) {
        controllerContainerStyles =
            'relative flex items-center justify-center w-[170px] h-[155px] rounded-[25px] border-white border-solid border-4 bg-white z-50 overflow-hidden';
        imageStyles = 'w-[100%] h-[100%] object-contain !rounded-[25px]';
    }
    return (
        <div className="flex items-center justify-center w-full relative">
            <div className={controllerContainerStyles}>
                {showEditButton && !isMediaDisplayType && (
                    <button
                        onClick={() => {
                            newModal(
                                <BoostCMSAppearanceFormModal
                                    state={state}
                                    setState={setState}
                                    boostUserType={boostUserType}
                                    customTypes={customTypes}
                                    setCustomTypes={setCustomTypes}
                                    showCloseButton={true} // todo
                                    disabled={disabled}
                                    handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                                />,
                                { sectionClassName: '!max-w-[500px]', hideButton: true }
                            );
                        }}
                        className={`absolute bg-white h-12 w-12 z-15 rounded-tr-full rounded-br-full flex items-center justify-center ${
                            isAwardDisplayType ? 'right-[-17px] top-[68px]' : 'right-[-48px]'
                        }`}
                    >
                        <Pencil className="text-grayscale-800 w-[30px]" />
                    </button>
                )}
                {!isAwardDisplayType && (
                    <div
                        className={`relative flex items-center justify-center rounded-full border-white border-solid border-4 bg-${subColor} overflow-hidden object-contain bg-${subColor} ${imageStyles}`}
                    >
                        <img src={state?.appearance?.badgeThumbnail} alt="badge thumbnail" />
                    </div>
                )}

                {isBadgeDisplayType && (
                    <CircleWithText
                        className="absolute text-white"
                        textClassName="text-white fill-white font-bold tracking-wider normal"
                        text={badgeCircleText}
                    />
                )}

                {isCertDisplayType && (
                    <CertRibbon className={`absolute z-[9999] w-[150px] h-[150px] text-${color}`} />
                )}

                {isBadgeDisplayType && (
                    <div className="absolute flex items-center justify-center left-[37%] bottom-[-12%]">
                        <Ribbon />
                        <Icon className={`absolute text-${color} h-[30px] mb-3`} />
                    </div>
                )}

                {isAwardDisplayType && (
                    <MeritBadgeRibbon
                        image={state?.appearance.badgeThumbnail}
                        showIcon={false}
                        className={`h-[202px] w-[202px] z-10 pointer-events-none text-${color}`}
                    />
                )}
            </div>
        </div>
    );
};

export default BoostCMSAppearanceController;
