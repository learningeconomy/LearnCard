import React, { useEffect, useState } from 'react';
import queryString from 'query-string';
import { useHistory, useLocation } from 'react-router-dom';

import useAiSession from '../../hooks/useAiSession';
import { newCredsStore } from 'learn-card-base/stores/newCredsStore';
import { useDeviceTypeByWidth } from 'learn-card-base/hooks/useDeviceTypeByWidth';
import { useGetCredentialList } from 'learn-card-base';

import { AiFeatureGate } from '../ai-feature-gate/AiFeatureGate';
import AiSessionsPage from '../../pages/ai-sessions/AiSessionsPage';
import NewAiSessionContainer from '../new-ai-session/NewAiSessionContainer';

import { NewAiSessionStepEnum } from '../new-ai-session/newAiSession.helpers';

import { chatBotStore } from '../../stores/chatBotStore';
import { useModal, ModalTypes } from 'learn-card-base';

export const AiSessionTopicsContainer: React.FC = () => {
    const { newModal, closeAllModals } = useModal({
        desktop: ModalTypes.Right,
        mobile: ModalTypes.Right,
    });
    const history = useHistory();
    const { search } = useLocation();
    const {
        startNewSession: _startNewSession,
        shortCircuitStep: _shortCircuitStep,
        ...restParams
    } = queryString.parse(search);
    const startNewSession: boolean = _startNewSession === 'true';
    const shortCircuitStep: NewAiSessionStepEnum = _shortCircuitStep as NewAiSessionStepEnum;

    const [isMobileModalOpen, setIsMobileModalOpen] = useState<boolean>(false);
    const { isDesktop, isMobile } = useDeviceTypeByWidth();

    const { data: topics, isLoading: topicsLoading } = useGetCredentialList('AI Topic');
    const existingTopics = topics?.pages?.[0]?.records || [];

    const chatBotSelected = chatBotStore.useTracked.chatBotSelected();
    const setChatBotSelected = chatBotStore.set.setChatBotSelected;

    // const [chatBotSelected, setChatBotSelected] = useState<NewAiSessionStepEnum | null>(null);
    const handleSetChatBotSelected = (chatBotType: NewAiSessionStepEnum) => {
        setChatBotSelected(chatBotType);
    };
    const handleStartOver = () => {
        chatBotStore.set.resetStore();
        setChatBotSelected(null);
    };

    const { openNewAiSessionModal } = useAiSession();

    useEffect(() => {
        if (startNewSession) {
            if (isDesktop) {
                handleSetChatBotSelected(NewAiSessionStepEnum.newTopic);
            } else {
                openNewAiSessionModal();
            }

            // Set the param to false to prevent repeated triggering
            const newParams = { ...restParams, startNewSession: 'false' };
            history.replace({
                search: `?${queryString.stringify(newParams)}`,
            });
        }
    }, [startNewSession]);

    useEffect(() => {
        if (shortCircuitStep) {
            handleSetChatBotSelected(shortCircuitStep);
        }
    }, [shortCircuitStep]);

    useEffect(() => {
        newCredsStore.set.clearNewCreds('AI Topic');
    }, []);

    const newAiSessionComponent = (
        <NewAiSessionContainer
            existingTopics={existingTopics}
            showAiAppSelector
            shortCircuitStep={chatBotSelected}
            handleStartOver={handleStartOver}
        />
    );

    useEffect(() => {
        if (isMobile && !isMobileModalOpen && chatBotSelected) {
            newModal(
                newAiSessionComponent,
                {
                    hideButton: true,
                },
                {
                    mobile: ModalTypes.Right,
                    desktop: ModalTypes.Right,
                }
            );
            setIsMobileModalOpen(true);
            return;
        }

        if (isMobileModalOpen && isDesktop && chatBotSelected) {
            closeAllModals();
            setIsMobileModalOpen(false);
            return;
        }
    }, [isMobile, isMobileModalOpen, isDesktop, chatBotSelected]);

    return (
        <AiFeatureGate>
            <AiSessionsPage />
        </AiFeatureGate>
    );
};

export default AiSessionTopicsContainer;
