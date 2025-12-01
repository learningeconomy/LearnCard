import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import useLCNGatedAction from '../../network-prompts/hooks/useLCNGatedAction';
import BoostVCTypeOptions from '../boost-options/boostVCTypeOptions/BoostVCTypeOptions';

import { useModal, ModalTypes, CredentialCategoryEnum } from 'learn-card-base';
import { BoostUserTypeEnum } from '../boost-options/boostOptions';

const useBoostModal = (
    _history?: RouteComponentProps['history'] | undefined,
    boostCategoryType?: CredentialCategoryEnum,
    hideBackButton: boolean = true,
    showCloseButton = true,
    otherUserProfileId?: string,
    directToCMS?: boolean,
    directToNewTemplateType?: boolean,
    hideAiBoostWizard?: boolean
) => {
    const { newModal } = useModal();
    const { gate } = useLCNGatedAction();

    const handlePresentBoostModal = async () => {
        const { prompted } = await gate();
        if (prompted) return;

        newModal(
            <BoostVCTypeOptions
                boostUserType={BoostUserTypeEnum.someone}
                boostCategoryType={boostCategoryType}
                hideBackButton={hideBackButton}
                showCloseButton={showCloseButton}
                otherUserProfileId={otherUserProfileId}
                directToCMS={directToCMS}
                directToNewTemplateType={directToNewTemplateType}
                hideAiBoostWizard={hideAiBoostWizard}
            />,
            {
                sectionClassName: '!max-w-[500px]',
                usePortal: true,
                hideButton: true,
                portalClassName: '!max-w-[500px]',
            },
            { desktop: ModalTypes.Cancel, mobile: ModalTypes.Cancel }
        );
    };

    return {
        handlePresentBoostModal,
    };
};

export default useBoostModal;
