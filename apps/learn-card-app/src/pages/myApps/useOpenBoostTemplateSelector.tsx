import React, { useCallback } from 'react';
import { useModal, ModalTypes } from 'learn-card-base';
import useBoostRecoveryCheck from '../../hooks/useBoostRecoveryCheck';
import BoostTemplateSelector from '../../components/boost/boost-template/BoostTemplateSelector';

/**
 * Opens the Boost template picker directly (skipping the Issue-Credential launcher),
 * mirroring the "Boost Someone" entry in AddToLearnCardMenu.
 */
const useOpenBoostTemplateSelector = (): (() => void) => {
    const { newModal, closeModal } = useModal();
    const { checkAndPromptRecovery } = useBoostRecoveryCheck();

    return useCallback(() => {
        closeModal();
        checkAndPromptRecovery(() => {
            newModal(
                <BoostTemplateSelector />,
                { hideButton: true, sectionClassName: '!max-w-[500px]' },
                { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
            );
        });
    }, [closeModal, checkAndPromptRecovery, newModal]);
};

export default useOpenBoostTemplateSelector;
