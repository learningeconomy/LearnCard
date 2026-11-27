import React from 'react';

import CaretLeft from 'learn-card-base/svgs/CaretLeft';

import {
    BoostCategoryOptionsEnum,
    isCustomBoostType,
    replaceUnderscoresWithWhiteSpace,
    getAchievementTypeFromCustomType,
    BoostUserTypeEnum,
    useModal,
    ModalTypes,
} from 'learn-card-base';

import {
    boostCategoryOptions,
    CATEGORY_TO_SUBCATEGORY_LIST,
} from '../../../boost-options/boostOptions';

import { BoostCMSState } from '../../../boost';
import BoostCMSAchievementTypeSelectorModal from './BoostCMSAchievementTypeSelectorModal';
import { AppRow } from 'learn-card-base/ui/layout';

type BoostCMSTypeSelectorButtonProps = {
    state: BoostCMSState;
    setState?: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    boostUserType?: BoostUserTypeEnum;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
    customTypes: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
    setCustomTypes: React.Dispatch<any>;
    disabled?: boolean;
    handleCategoryAndTypeChange?: (
        categoryType: BoostCategoryOptionsEnum,
        achievementType: string
    ) => void;
};

const BoostCMSAchievementTypeSelectorButton: React.FC<BoostCMSTypeSelectorButtonProps> = ({
    state,
    setState,
    boostUserType,
    customTypes,
    setCustomTypes,
    disabled = false,
    handleCategoryAndTypeChange,
}) => {
    let achievementTypeSelected;

    if (isCustomBoostType(state?.basicInfo?.achievementType)) {
        achievementTypeSelected = replaceUnderscoresWithWhiteSpace(
            getAchievementTypeFromCustomType(state?.basicInfo?.achievementType)
        );
    } else {
        achievementTypeSelected =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
            CATEGORY_TO_SUBCATEGORY_LIST?.[state?.basicInfo?.type as any]?.find(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for the Ionic removal
                (options: any) => options?.type === state?.basicInfo?.achievementType
            )?.title ?? '';
    }

    const { color: _color, IconComponent: Icon } =
        boostCategoryOptions[state?.basicInfo?.type as BoostCategoryOptionsEnum];

    const { newModal: newCenterModal, closeModal: closeCenterModal } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const { newModal: newSheetModal, closeModal: closeSheetModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    const presentCenterModal = () => {
        newCenterModal(
            <BoostCMSAchievementTypeSelectorModal
                state={state}
                setState={setState}
                showCloseButton={true}
                handleCloseModal={() => closeCenterModal()}
                boostUserType={boostUserType}
                handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                customTypes={customTypes}
                setCustomTypes={setCustomTypes}
            />
        );
    };

    const presentSheetModal = () => {
        newSheetModal(
            <BoostCMSAchievementTypeSelectorModal
                state={state}
                setState={setState}
                showCloseButton={false}
                handleCloseModal={() => closeSheetModal()}
                boostUserType={boostUserType}
                handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                customTypes={customTypes}
                setCustomTypes={setCustomTypes}
            />
        );
    };

    return (
        <AppRow className="w-full flex flex-col items-center justify-center max-w-[600px] mt-4">
            <button
                className="w-full bg-white ion-padding rounded-[20px] flex items-center justify-between"
                disabled={disabled}
                onClick={() => {
                    const isMobile = window.innerWidth < 992;
                    if (isMobile) {
                        presentSheetModal();
                    } else {
                        presentCenterModal();
                    }
                }}
            >
                <div className="flex items-center justify-start text-xl font-notoSans text-grayscale-900">
                    <Icon className={`w-[30px] h-[30px] text-${_color} mr-1`} />{' '}
                    {achievementTypeSelected}
                </div>
                <CaretLeft className="rtl-mirror rotate-180 text-grayscale-900" />
            </button>
        </AppRow>
    );
};

export default BoostCMSAchievementTypeSelectorButton;
