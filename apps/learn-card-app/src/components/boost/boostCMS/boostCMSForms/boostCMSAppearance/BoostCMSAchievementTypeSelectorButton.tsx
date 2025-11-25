import React from 'react';

import { IonRow } from '@ionic/react';
import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import {
    BoostCategoryOptionsEnum,
    isCustomBoostType,
    replaceUnderscoresWithWhiteSpace,
    getAchievementTypeFromCustomType,
    BoostUserTypeEnum,
    useModal,
    useDeviceTypeByWidth,
    ModalTypes,
} from 'learn-card-base';

import {
    boostCategoryOptions,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../../../boost-options/boostOptions';

import { BoostCMSState } from '../../../boost';
import BoostCMSAchievementTypeSelectorModal from './BoostCMSAchievementTypeSelectorModal';

import useTheme from '../../../../../theme/hooks/useTheme';

type AchievementTypeSelectorButtonProps = {
    state: BoostCMSState;
    setState?: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    boostUserType?: BoostUserTypeEnum;
    customTypes: any;
    setCustomTypes: React.Dispatch<any>;
    disabled?: boolean;
    handleCategoryAndTypeChange?: (
        categoryType: BoostCategoryOptionsEnum,
        achievementType: string
    ) => void;
};

const BoostCMSAchievementTypeSelectorButton: React.FC<AchievementTypeSelectorButtonProps> = ({
    state,
    setState,
    boostUserType,
    customTypes,
    setCustomTypes,
    disabled = false,
    handleCategoryAndTypeChange,
}) => {
    const { newModal } = useModal({ desktop: ModalTypes.Center, mobile: ModalTypes.FullScreen });
    const { isDesktop } = useDeviceTypeByWidth();
    const { getThemedCategoryIcons } = useTheme();

    let achievementTypeSelected;

    if (isCustomBoostType(state?.basicInfo?.achievementType)) {
        achievementTypeSelected = replaceUnderscoresWithWhiteSpace(
            getAchievementTypeFromCustomType(state?.basicInfo?.achievementType)
        );
    } else {
        const subcategories = CATEGORY_TO_SUBCATEGORY_LIST?.[state?.basicInfo?.type] || [];
        achievementTypeSelected =
            subcategories.find(options => options?.type === state?.basicInfo?.achievementType)
                ?.title ?? 'Select Type';
    }

    const { color: _color } = boostCategoryOptions[state?.basicInfo?.type];
    const { Icon } = getThemedCategoryIcons(state?.basicInfo?.type);

    return (
        <IonRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-4">
            <button
                className="w-full bg-white ion-padding rounded-[20px] flex items-center justify-between"
                onClick={() =>
                    newModal(
                        <BoostCMSAchievementTypeSelectorModal
                            state={state}
                            setState={setState}
                            showCloseButton={isDesktop}
                            boostUserType={boostUserType}
                            handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                            customTypes={customTypes}
                            setCustomTypes={setCustomTypes}
                        />,
                        { sectionClassName: '!max-w-[500px]', hideButton: true }
                    )
                }
                disabled={disabled}
            >
                <div className="flex items-center justify-start font-poppins text-xl text-grayscale-900">
                    <Icon className={`h-[30px] w-auto text-${_color} mr-2`} />{' '}
                    {achievementTypeSelected}
                </div>
                <CaretLeft className="rotate-180 text-grayscale-900" />
            </button>
        </IonRow>
    );
};

export default BoostCMSAchievementTypeSelectorButton;
