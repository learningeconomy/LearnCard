import React, { useState } from 'react';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';
import {
    useModal,
    useContract,
    useUpdateTerms,
    ModalTypes,
    LaunchPadAppListItem,
} from 'learn-card-base';

import PostConsentFlowSyncCard from '../launchPad/PostConsentFlowSyncCard';
import FullScreenConsentFlow from './FullScreenConsentFlow';
import FullScreenGameFlow from '../consentFlow/GameFlow/FullScreenGameFlow';

import { ConsentFlowContractDetails, ConsentFlowTerms } from '@learncard/types';

export const useConsentFlow = (
    contract?: ConsentFlowContractDetails,
    app?: LaunchPadAppListItem,
    contractUri?: string
) => {
    const { newModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    // fetch contract if needed
    const { data: _contract } = useContract(contractUri, !Boolean(contract));
    contract = contract ?? _contract;

    const { data: consentedContracts, isLoading: consentedContractLoading } =
        useConsentedContracts();
    const consentedContract = consentedContracts?.find(
        c => c?.contract?.uri === contract?.uri && c?.status !== 'withdrawn'
    );
    const hasConsented = !!consentedContract;

    const { mutateAsync: updateTermsMutation } = useUpdateTerms(
        consentedContract?.uri ?? '',
        consentedContract?.contract?.owner.did ?? ''
    );
    // isPending from useUpdateTerms isn't working, so we'll do it ourselves 😤
    const [updatingTerms, setUpdatingTerms] = useState(false);

    const openConsentFlowModal = async (
        hideProfileButton?: boolean,
        successCallback?: () => void
    ) => {
        if (hasConsented && false) {
            // handled by FullScreenConsentFlow with isPostConsent
            //   this is removable, just keeping it around as a reference for now
            newModal(<PostConsentFlowSyncCard consentedContract={consentedContract} />, {
                sectionClassName: '!max-w-[400px]',
            });
        } else if (contract?.needsGuardianConsent && !hasConsented) {
            newModal(
                <FullScreenGameFlow contractDetails={contract} />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        } else if (contract) {
            newModal(
                <FullScreenConsentFlow
                    contractDetails={contract}
                    app={app}
                    isPostConsent={hasConsented}
                    hideProfileButton={hideProfileButton}
                    successCallback={successCallback}
                />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        } else {
            console.log('🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥');
            console.log('Failed to open ConsentFlow modal: contract not yet loaded');
        }
    };

    const updateTerms = async (
        terms: ConsentFlowTerms,
        shareDuration: {
            oneTimeShare: boolean;
            customDuration: string;
        }
    ) => {
        try {
            setUpdatingTerms(true);
            await updateTermsMutation({
                terms,
                oneTime: shareDuration.oneTimeShare,
                expiresAt: shareDuration.customDuration,
            });
        } finally {
            setUpdatingTerms(false);
        }
    };

    return {
        contract,
        consentedContract,
        consentedContractLoading,
        hasConsented,
        openConsentFlowModal,
        updateTerms,
        updatingTerms,
    };
};

export const useConsentFlowByUri = (
    contractUri: string | undefined,
    app?: LaunchPadAppListItem
) => {
    const { data: contract, isLoading: contractLoading } = useContract(contractUri);
    return { ...useConsentFlow(contract, app), contractLoading };
};

export default useConsentFlow;
