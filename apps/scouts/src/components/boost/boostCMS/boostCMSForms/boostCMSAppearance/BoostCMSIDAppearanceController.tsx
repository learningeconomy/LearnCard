import React from 'react';

import Pencil from '../../../../svgs/Pencil';
import BoostCMSAppearanceFormModal from './BoostCMSAppearanceFormModal';
import BoostCMSIDCard from '../../../boost-id-card/BoostIDCard';

import { BoostUserTypeEnum } from '../../../boost-options/boostOptions';
import { BoostCategoryOptionsEnum, useModal, ModalTypes } from 'learn-card-base';
import { BoostCMSState } from '../../../boost';
import { SetState } from 'packages/shared-types/dist';

const BoostCMSIDAppearanceController: React.FC<{
    state: BoostCMSState;
    setState?: SetState<BoostCMSState>;
    boostUserType?: BoostUserTypeEnum;
    customTypes?: any;
    setCustomTypes?: SetState<any>;
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
            <BoostCMSAppearanceFormModal
                state={state}
                setState={setState as any}
                handleCloseModal={() => closeCenterModal()}
                boostUserType={boostUserType}
                customTypes={customTypes}
                setCustomTypes={setCustomTypes as any}
                showCloseButton={true}
                disabled={disabled}
                handleCategoryAndTypeChange={handleCategoryAndTypeChange}
            />
        );
    };

    const presentSheetModal = () => {
        newSheetModal(
            <BoostCMSAppearanceFormModal
                state={state}
                setState={setState as any}
                handleCloseModal={() => closeSheetModal()}
                boostUserType={boostUserType}
                customTypes={customTypes}
                setCustomTypes={setCustomTypes as any}
                disabled={disabled}
                handleCategoryAndTypeChange={handleCategoryAndTypeChange}
            />
        );
    };

    return (
        <div className="flex items-center justify-center w-full mt-12 mb-8 relative">
            <div className="relative">
                {showEditAppearanceText && (
                    <p className="absolute right-[55px] top-[-30px]">Edit Appearance</p>
                )}
                {showEditButton && (
                    <button
                        onClick={() => presentCenterModal()}
                        className="absolute bg-white h-[65px] w-12 z-15 right-[4px] top-[-40px] pt-[5px] rounded-tr-full rounded-tl-full flex items-start justify-center modal-btn-desktop z-10"
                    >
                        <Pencil className="text-grayscale-800 w-[30px]" />
                    </button>
                )}
                {showEditButton && (
                    <button
                        onClick={() => {
                            presentSheetModal();
                        }}
                        className="absolute bg-white h-[65px] w-12 z-15 right-[0] top-[-40px] pt-[5px] rounded-tr-full rounded-tl-full flex items-start justify-center modal-btn-mobile z-10"
                    >
                        <Pencil className="text-grayscale-800 w-[30px]" />
                    </button>
                )}
                <BoostCMSIDCard state={state} setState={setState as any} />
            </div>
        </div>
    );
};

export default BoostCMSIDAppearanceController;
