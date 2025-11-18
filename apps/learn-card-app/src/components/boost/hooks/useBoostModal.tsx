import React from 'react';
import { RouteComponentProps } from 'react-router-dom';

import useJoinLCNetworkModal from '../../network-prompts/hooks/useJoinLCNetworkModal';
import BoostVCTypeOptions from '../boost-options/boostVCTypeOptions/BoostVCTypeOptions';

import {
    useModal,
    ModalTypes,
    useIsCurrentUserLCNUser,
    BoostCategoryOptionsEnum,
    CredentialCategoryEnum,
} from 'learn-card-base';

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
    const { handlePresentJoinNetworkModal } = useJoinLCNetworkModal();

    const { data: currentLCNUser, isLoading: currentLCNUserLoading } = useIsCurrentUserLCNUser();

    const handlePresentBoostModal = () => {
        if (!currentLCNUser && !currentLCNUserLoading) {
            handlePresentJoinNetworkModal();
            return;
        }

        newModal(
            <BoostVCTypeOptions
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
