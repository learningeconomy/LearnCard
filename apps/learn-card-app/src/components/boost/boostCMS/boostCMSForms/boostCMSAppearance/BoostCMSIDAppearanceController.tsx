import React from 'react';

import { useIonModal } from '@ionic/react';

import Pencil from '../../../../svgs/Pencil';
import BoostCMSAppearanceFormModal from './BoostCMSAppearanceFormModal';
import BoostCMSIDCard from '../../../boost-id-card/BoostIDCard';

import { BoostCategoryOptionsEnum, BoostUserTypeEnum } from '../../../boost-options/boostOptions';
import { BoostCMSState } from '../../../boost';
import { useModal } from 'learn-card-base';

const BoostCMSIDAppearanceController: React.FC<{
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
    showEditAppearanceText?: boolean;
}> = ({
    state,
    setState,
    boostUserType,
    customTypes,
    setCustomTypes,
    disabled = false,
    handleCategoryAndTypeChange,
    showEditButton = true,
    showEditAppearanceText = true,
}) => {
    const { newModal, closeModal } = useModal();
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
        <div className="flex items-center justify-center w-full mt-12 mb-8 relative">
            <div className="relative">
                {showEditAppearanceText && (
                    <p className="absolute right-[55px] top-[-30px]">Edit Appearance</p>
                )}

                {showEditButton && (
                    <button
                        onClick={() => {
                            newModal(
                                <BoostCMSAppearanceFormModal
                                    state={state}
                                    setState={setState}
                                    handleCloseModal={() => closeModal()}
                                    boostUserType={boostUserType}
                                    customTypes={customTypes}
                                    setCustomTypes={setCustomTypes}
                                    disabled={disabled}
                                    handleCategoryAndTypeChange={handleCategoryAndTypeChange}
                                />,
                                { sectionClassName: '!max-w-[500px]', hideButton: true }
                            );
                        }}
                        className="absolute bg-white h-[65px] w-12 z-15 right-[4px] top-[-40px] pt-[5px] rounded-tr-full rounded-tl-full flex items-start justify-center z-10"
                    >
                        <Pencil className="text-grayscale-800 w-[30px]" />
                    </button>
                )}

                <BoostCMSIDCard state={state} setState={setState} />
            </div>
        </div>
    );
};

export default BoostCMSIDAppearanceController;
