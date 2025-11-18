import React from 'react';

import NewAiSessionContainer from '../components/new-ai-session/NewAiSessionContainer';

import { ModalTypes, useGetCredentialList, useModal } from 'learn-card-base';
import { useConsentFlowByUri } from '../pages/consentFlow/useConsentFlow';

import { aiPassportApps } from '../components/ai-passport-apps/aiPassport-apps.helpers';

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
    const [chatGPTApp, claudeApp, geminiApp] = aiPassportApps;
    const { hasConsented: chatGPTHasConsented } = useConsentFlowByUri(chatGPTApp.contractUri); // chatGPT
    const { hasConsented: claudeHasConsented } = useConsentFlowByUri(claudeApp.contractUri); // claude
    const { hasConsented: geminiHasConsented } = useConsentFlowByUri(geminiApp.contractUri); // gemini

    const hasConsentedToAiApps = chatGPTHasConsented || claudeHasConsented || geminiHasConsented;

    return {
        hasConsentedToAiApps,
    };
};

export default useAiSession;
