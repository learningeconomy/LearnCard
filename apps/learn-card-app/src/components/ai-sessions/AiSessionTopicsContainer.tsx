import React, { useEffect, useState } from 'react';
import queryString from 'query-string';
import { useHistory, useLocation } from 'react-router-dom';

import useAiSession from '../../hooks/useAiSession';
import sideMenuStore from 'learn-card-base/stores/sideMenuStore';
import { newCredsStore } from 'learn-card-base/stores/newCredsStore';
import { useDeviceTypeByWidth } from 'learn-card-base/hooks/useDeviceTypeByWidth';
import { useGetCredentialList, useIsCollapsed } from 'learn-card-base';

import GenericErrorBoundary from '../generic/GenericErrorBoundary';
import AiSessionsLayout from './layout/AiSessionsLayout';
import AiSessionSuggestions from './AiSessionSuggestions/AiSessionSuggestions';
import AiSessionTopics from './AiSessionTopics/AiSessionTopics';
import AiSessionTopicsHeader from './AiSessionsHeader/AiSessionTopicsHeader';
import NewAiSessionContainer from '../new-ai-session/NewAiSessionContainer';
import { AiSessionsTabsEnum } from './aiSessions.helpers';
import {
    AiSessionsFilterOptionsEnum,
    AiSessionsSortOptionsEnum,
} from './AiSessionsSearch/aiSessions-search.helpers';

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

    const isCollapsed = useIsCollapsed();
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
    const handleStartOver = () => setChatBotSelected(null);

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
        if (!isCollapsed) {
            sideMenuStore.set.isCollapsed(true);
        }
    }, []);

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

    const [activeTab, setActiveTab] = useState<AiSessionsTabsEnum>(AiSessionsTabsEnum.all);

    const [filterBy, setFilterBy] = useState<AiSessionsFilterOptionsEnum>(
        AiSessionsFilterOptionsEnum.showAll
    );
    const [sortBy, setSortBy] = useState<AiSessionsSortOptionsEnum>(
        AiSessionsSortOptionsEnum.newlyAdded
    );
    const [searchInput, setSearchInput] = useState<string>('');

    const styles = isDesktop ? 'pt-[150px] ion-padding' : 'pt-[103px]';

    const leftColumn = (
        <div className="h-full w-full relative flex items-center justify-center">
            <AiSessionTopicsHeader activeTab={activeTab} />

            <div
                className={`flex flex-col max-w-[600px] w-full h-full overflow-x-hidden scrollbar-hide ${styles}`}
            >
                <GenericErrorBoundary>
                    <AiSessionTopics
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        searchInput={searchInput}
                        setSearchInput={setSearchInput}
                        filterBy={filterBy}
                        setFilterBy={setFilterBy}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                    />
                </GenericErrorBoundary>
            </div>
        </div>
    );

    let rightColumn = <AiSessionSuggestions handleSetChatBotSelected={handleSetChatBotSelected} />;

    if (
        chatBotSelected === NewAiSessionStepEnum.newTopic ||
        chatBotSelected === NewAiSessionStepEnum.revisitTopic ||
        chatBotSelected === NewAiSessionStepEnum.aiAppSelector
    ) {
        rightColumn = newAiSessionComponent;
    }

    return (
        <AiSessionsLayout
            handleSetChatBotSelected={handleSetChatBotSelected}
            leftColumn={leftColumn}
            rightColumn={rightColumn}
        />
    );
};

export default AiSessionTopicsContainer;
