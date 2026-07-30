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
    const { newModal } = useModal({
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

    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const { isDesktop } = useDeviceTypeByWidth();

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
    const handleModalClose = () => {
        setChatBotSelected(null);
        setIsModalOpen(false);
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
        if (!chatBotSelected) {
            if (isModalOpen) setIsModalOpen(false);
            return;
        }

        if (isModalOpen) return;

        newModal(
            newAiSessionComponent,
            {
                hideButton: true,
                onClose: handleModalClose,
            },
            {
                mobile: ModalTypes.Right,
                desktop: ModalTypes.Right,
            }
        );
        setIsModalOpen(true);
    }, [isModalOpen, chatBotSelected, newModal]);

    return (
        <AiFeatureGate>
            <AiSessionsPage />
        </AiFeatureGate>
    );
};

export default AiSessionTopicsContainer;
