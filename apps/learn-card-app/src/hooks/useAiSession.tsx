import React from 'react';

import NewAiSessionContainer from '../components/new-ai-session/LazyNewAiSessionContainer';

import { ModalTypes, useGetCredentialList, useModal } from 'learn-card-base';
import { useConsentedContracts } from 'learn-card-base/hooks/useConsentedContracts';

import {
    aiPassportApps,
    areAiPassportAppsAvailable,
} from '../components/ai-passport-apps/aiPassport-apps.helpers';

export const useAiSession = () => {
    const { newModal } = useModal();

    const { data: topics } = useGetCredentialList('AI Topic');
    const existingTopics = topics?.pages?.[0]?.records || [];

    const openNewAiSessionModal = () => {
        newModal(
            <NewAiSessionContainer existingTopics={existingTopics} />,
            {
                hideButton: true,
            },
            {
                mobile: ModalTypes.Right,
                desktop: ModalTypes.Right,
            }
        );
    };

    return { openNewAiSessionModal };
};

export const useHasConsentedToAiApp = () => {
    const aiAppsAvailable = areAiPassportAppsAvailable();
    const { data: consentedContracts } = useConsentedContracts();
    // Preserve the three supported entries previously checked by this hook.
    // Reading consent status does not need contract details or the consent UI.
    const appContractUris = new Set(aiPassportApps.slice(0, 3).map(app => app.contractUri));
    const hasConsentedToAiApps =
        aiAppsAvailable &&
        Boolean(
            consentedContracts?.some(
                c => appContractUris.has(c.contract?.uri) && c.status !== 'withdrawn'
            )
        );

    return {
        hasConsentedToAiApps,
    };
};

export default useAiSession;
