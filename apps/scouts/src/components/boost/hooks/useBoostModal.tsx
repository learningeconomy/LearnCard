import React from 'react';
import { BoostCategoryOptionsEnum, ModalTypes } from 'learn-card-base';
import type { NavigateFunction } from 'react-router';
import BoostVCTypeOptions from '../boost-options/boostVCTypeOptions/BoostVCTypeOptions';
import { closeAll } from '../../../helpers/uiHelpers';
import { useModal } from 'learn-card-base';

const useBoostModal = (
    history: NavigateFunction,
    boostCategoryType?: BoostCategoryOptionsEnum,
    hideBackButton: boolean = true,
    showCloseButton = true,
    otherUserProfileId?: string
) => {
    const { newModal, closeAllModals } = useModal({
        mobile: ModalTypes.Center,
        desktop: ModalTypes.Center,
    });

    const handlePresentBoostModal = () => {
        newModal(
            <BoostVCTypeOptions
                boostCategoryType={boostCategoryType}
                history={history}
                handleCloseModal={() => {
                    closeAll();
                    closeAllModals();
                }}
                hideBackButton={hideBackButton}
                showCloseButton={showCloseButton}
                otherUserProfileId={otherUserProfileId}
            />,
            { sectionClassName: 'max-w-[500px]! h-full!' }
        );
    };

    return {
        handlePresentBoostModal,
    };
};

export default useBoostModal;
