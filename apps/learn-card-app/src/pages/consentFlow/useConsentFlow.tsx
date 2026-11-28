import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
    useModal,
    useContract,
    useUpdateTerms,
    ModalTypes,
    LaunchPadAppListItem,
    useConsentedContracts,
} from 'learn-card-base';

import { getLogger } from 'learn-card-base';
const log = getLogger('use-consent-flow');

import { lazyModalContent } from '../../components/generic/lazyModalContent';

import { ConsentFlowContractDetails, ConsentFlowTerms, LCNProfile } from '@learncard/types';

// AppRouter calls this hook on every start; the flows (game login, phone input...) load when opened.
const FullScreenConsentFlow = lazyModalContent(() => import('./FullScreenConsentFlow'));
const FullScreenGameFlow = lazyModalContent(
    () => import('../consentFlow/GameFlow/FullScreenGameFlow')
);

export const useConsentFlow = (
    contract?: ConsentFlowContractDetails,
    app?: LaunchPadAppListItem,
    contractUri?: string
) => {
    const navigate = useNavigate();
    const { newModal, closeAllModals } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });

    // fetch contract if needed
    const { data: _contract } = useContract(contractUri, !contract);
    contract = contract ?? _contract;

    const { data: consentedContracts, isLoading: consentedContractLoading } =
        useConsentedContracts();
    const consentedContract = consentedContracts?.find(
        c =>
            c?.contract?.uri === contract?.uri &&
            c?.status !== 'withdrawn' &&
            c?.status !== 'consumed'
    );
    const hasConsented = !!consentedContract;

    const { mutateAsync: updateTermsMutation } = useUpdateTerms(
        consentedContract?.uri ?? '',
        consentedContract?.contract?.owner.did ?? '',
        consentedContract?.contract?.uri
    );
    // isPending from useUpdateTerms isn't working, so we'll do it ourselves 😤
    const [updatingTerms, setUpdatingTerms] = useState(false);

    const openConsentFlowModal = async (
        hideProfileButton?: boolean,
        successCallback?: () => void,
        insightsProfile?: LCNProfile | string,
        childInsightsProfile?: LCNProfile | string,
        disableRedirect?: boolean,
        onCloseCallback?: () => void,
        onBackCallback?: () => void,
        keepParentModalsOpen?: boolean
    ) => {
        if (
            contract &&
            (consentedContract?.status === 'needs_reconsent' ||
                consentedContract?.status === 'suspended')
        ) {
            closeAllModals();
            navigate(`/consent-flow/review?uri=${encodeURIComponent(contract.uri)}`);
            return;
        }
        if (contract?.needsGuardianConsent && !hasConsented) {
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
                    insightsProfile={insightsProfile}
                    childInsightsProfile={childInsightsProfile}
                    disableRedirect={disableRedirect}
                    keepParentModalsOpen={keepParentModalsOpen}
                    onCloseCallback={onCloseCallback}
                    onBackCallback={onBackCallback}
                />,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
        } else {
            log.info('Failed to open ConsentFlow modal: contract not yet loaded');
        }
    };

    const updateTerms = async (
        terms: ConsentFlowTerms,
        shareDuration: {
            oneTimeShare: boolean;
            customDuration: string;
        },
        beforeSubmit?: () => Promise<void>
    ) => {
        try {
            setUpdatingTerms(true);
            await updateTermsMutation({
                terms,
                oneTime: shareDuration.oneTimeShare,
                expiresAt: shareDuration.customDuration,
                beforeSubmit,
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
