import React from 'react';

import NewAiSessionContainer from '../components/new-ai-session/NewAiSessionContainer';

import { ModalTypes, useGetCredentialList, useModal } from 'learn-card-base';
import { useConsentFlowByUri } from '../pages/consentFlow/useConsentFlow';

import {
    aiPassportApps,
    areAiPassportAppsAvailable,
} from '../components/ai-passport-apps/aiPassport-apps.helpers';

export const useAiSession = () => {
    const { newModal } = useModal();

    const { data: topics, isLoading: topicsLoading } = useGetCredentialList('AI Topic');
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
    const [chatGPTApp, claudeApp, geminiApp] = aiPassportApps;
    const { hasConsented: chatGPTHasConsented } = useConsentFlowByUri(
        aiAppsAvailable ? chatGPTApp.contractUri : undefined
    ); // chatGPT
    const { hasConsented: claudeHasConsented } = useConsentFlowByUri(
        aiAppsAvailable ? claudeApp.contractUri : undefined
    ); // claude
    const { hasConsented: geminiHasConsented } = useConsentFlowByUri(
        aiAppsAvailable ? geminiApp.contractUri : undefined
    ); // gemini

    const hasConsentedToAiApps = chatGPTHasConsented || claudeHasConsented || geminiHasConsented;

    return {
        hasConsentedToAiApps,
    };
};

export default useAiSession;
