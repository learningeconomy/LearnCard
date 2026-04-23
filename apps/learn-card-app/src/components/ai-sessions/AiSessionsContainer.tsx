import React, { useEffect, useState } from 'react';

import AiSessions from './AiSessions/AiSessions';
import AiSessionsLayout from './layout/AiSessionsLayout';
import AiSessionLoader from '../new-ai-session/AiSessionLoader';
import AiSessionsSearch from './AiSessionsSearch/AiSessionsSearch';
import AiSessionsHeader from './AiSessionsHeader/AiSessionsHeader';
import { AiSessionsSubHeader } from './AiSessionsHeader/AiSessionsHeader';
import NewAiSessionContainer from '../new-ai-session/NewAiSessionContainer';
import AiSessionAssessmentPreviewContainer from '../ai-assessment/AiSessionAssessmentPreviewContainer';
import GenericErrorBoundary from '../generic/GenericErrorBoundary';
import { AiFeatureGate } from '../ai-feature-gate/AiFeatureGate';
import AiSessionsEmptyState from './AiSessions/AiSessionsEmptyState';

import { aiLoadingStore, useGetEnrichedSession, useGetCurrentLCNUser } from 'learn-card-base';
import { usePathQuery } from 'learn-card-base';
import { useHistory } from 'react-router-dom';

import {
    AiFilteringTypes,
    AiSessionsFilterOptionsEnum,
    AiSessionsSortOptionsEnum,
} from './AiSessionsSearch/aiSessions-search.helpers';
import { VC } from '@learncard/types';
import { getAiTopicTitle } from '../new-ai-session/newAiSession.helpers';

import sideMenuStore from 'learn-card-base/stores/sideMenuStore';

import { useIsCollapsed } from 'learn-card-base';
import { useDeviceTypeByWidth } from 'learn-card-base/hooks/useDeviceTypeByWidth';

import { getAiPassportAppByContractUri } from '../ai-passport-apps/aiPassport-apps.helpers';
import { chatBotStore } from '../../stores/chatBotStore';
import {
    NewAiSessionButton,
    NewAiSessionButtonEnum,
} from '../new-ai-session/NewAiSessionButton/NewAiSessionButton';
import { NewAiSessionStepEnum } from '../new-ai-session/newAiSession.helpers';
import {
    AiAssessmentQuestion,
    finishedAssessmentText,
} from '../ai-assessment/AiAssessment/ai-assessment.helpers';
import { useTheme } from '../../theme/hooks/useTheme';
import X from '../svgs/X';

export const AiSessionsContainer: React.FC<{
    topicUri?: string;
    hideNavBar?: boolean;
    handleGoBack?: () => void;
}> = ({ topicUri: _topicUri, hideNavBar = false, handleGoBack }) => {
    const query = usePathQuery();
    const isCollapsed = useIsCollapsed();
    const { isDesktop } = useDeviceTypeByWidth();
    const history = useHistory();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor ?? 'indigo-500';

    useEffect(() => {
        if (!isDesktop && !isCollapsed) {
            sideMenuStore.set.isCollapsed(true);
        }
    }, []);

    const [filterBy, setFilterBy] = useState<AiSessionsFilterOptionsEnum>(
        AiSessionsFilterOptionsEnum.showAll
    );
    const [sortBy, setSortBy] = useState<AiSessionsSortOptionsEnum>(
        AiSessionsSortOptionsEnum.newlyAdded
    );
    const [searchInput, setSearchInput] = useState<string>('');

    const [selectedSession, setSelectedSession] = useState<{
        topic?: VC;
        topicBoost?: VC;
        session?: VC;
        showAssessment?: boolean;
        assessment?: AiAssessmentQuestion[];
    } | null>(null);

    const [chatBotSelected, setChatBotSelected] = useState<NewAiSessionStepEnum | null>(null);

    // Producers URL-encode the `topicBoostUri` query param before navigation;
    // URLSearchParams.get() returns the decoded value, so no further decoding
    // is needed here.
    const topicUri = _topicUri ?? query.get('topicBoostUri') ?? '';
    const { data: enrichedSessionData, isLoading: isLoadingEnrichedSessions } =
        useGetEnrichedSession(topicUri);

    const topicRecord = enrichedSessionData?.topicRecord;
    const topicVc = enrichedSessionData?.topicVc;
    const topicBoost = enrichedSessionData?.topicBoost;
    const sessions = enrichedSessionData?.sessions ?? [];

    const topicsTitle = topicVc ? getAiTopicTitle(topicVc) : '';
    const appContractUri = topicRecord?.contractUri ?? '';
    const app = getAiPassportAppByContractUri(appContractUri);

    const isFinishingAssessment = aiLoadingStore.use.isFinishingAssessment();

    const handleSetChatBotSelected = (chatBotType: NewAiSessionStepEnum) => {
        setSelectedSession(null);
        setChatBotSelected(chatBotType);
    };

    const handleTopicSession = (session: {
        topic?: VC;
        topicBoost?: VC;
        session?: VC;
        showAssessment?: boolean;
        assessment?: AiAssessmentQuestion[];
    }) => {
        setChatBotSelected(null);
        setSelectedSession({
            ...session,
        });
    };

    const styles = isDesktop ? 'pt-[150px] ion-padding' : '';

    const leftColumn = (
        <div className="h-full w-full flex flex-col bg-white relative">
            <AiSessionsHeader
                topicTitle={topicsTitle}
                appContractUri={appContractUri}
                isLoading={isLoadingEnrichedSessions}
                handleGoBack={() => {
                    chatBotStore.set.resetStore();
                    if (handleGoBack) handleGoBack();
                    else history.push('/ai/topics');
                }}
            />

            <GenericErrorBoundary>
                <div
                    className={`flex flex-col max-w-[600px] w-full h-full overflow-x-hidden scrollbar-hide mx-auto ${styles} ${
                        !isDesktop ? 'pb-[90px]' : ''
                    }`}
                >
                    <div className="w-full ml-2 px-2 py-0">
                        {isDesktop && (
                            <AiSessionsSubHeader
                                isLoading={isLoadingEnrichedSessions}
                                sessions={sessions}
                                appContractUri={appContractUri}
                                topicTitle={topicsTitle}
                            />
                        )}
                        <AiSessionsSearch
                            searchInput={searchInput}
                            setSearchInput={setSearchInput}
                            filterBy={filterBy}
                            setFilterBy={setFilterBy}
                            sortBy={sortBy}
                            setSortBy={setSortBy}
                            showFilterOptions
                            filteringType={AiFilteringTypes.sessions}
                        />
                    </div>
                    {!isLoadingEnrichedSessions &&
                        !isDesktop &&
                        enrichedSessionData?.sessions?.length === 0 && (
                            <AiSessionsEmptyState
                                topicsTitle={topicsTitle}
                                topicBoost={topicBoost as VC}
                                app={app as any}
                                primaryColor={primaryColor}
                            />
                        )}
                    <GenericErrorBoundary>
                        <AiSessions
                            topicRecord={topicRecord}
                            topicVc={topicVc}
                            sessions={sessions}
                            searchInput={searchInput}
                            filterBy={filterBy}
                            sortBy={sortBy}
                            isLoading={isLoadingEnrichedSessions}
                            handleTopicSession={handleTopicSession}
                            selectedSession={selectedSession}
                            app={app}
                        />
                    </GenericErrorBoundary>
                </div>
            </GenericErrorBoundary>

            {!isDesktop && (
                <div
                    className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 px-4 py-4 bg-white border-t border-grayscale-200 safe-area-bottom-margin"
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        onClick={e => {
                            e.stopPropagation();
                            chatBotStore.set.resetStore();
                            history.goBack();
                        }}
                        className="rounded-full bg-white shadow-3xl p-4 mt-2"
                    >
                        <X className="text-grayscale-800 w-[20px] h-auto" strokeWidth="5" />
                    </button>

                    <NewAiSessionButton
                        iconType="light"
                        type={NewAiSessionButtonEnum.mobile}
                        className="!bg-indigo-500 !text-center !flex !items-center !justify-center !flex-row-reverse !text-white !rounded-full"
                    />
                </div>
            )}
        </div>
    );

    let rightColumn = null;

    if (
        chatBotSelected === NewAiSessionStepEnum.newTopic ||
        chatBotSelected === NewAiSessionStepEnum.aiAppSelector
    ) {
        rightColumn = (
            <NewAiSessionContainer
                showAiAppSelector
                shortCircuitStep={chatBotSelected}
                disableEdit
            />
        );
    } else if (selectedSession && !selectedSession?.showAssessment) {
        rightColumn = (
            <AiSessionAssessmentPreviewContainer
                app={app}
                topic={selectedSession?.topic as VC}
                topicBoost={selectedSession?.topicBoost as VC}
                session={selectedSession?.session as VC}
                handleTopicSession={handleTopicSession}
            />
        );
    } else if (!isLoadingEnrichedSessions && enrichedSessionData?.sessions?.length === 0) {
        rightColumn = (
            <AiSessionsEmptyState
                topicsTitle={topicsTitle}
                topicBoost={topicBoost as VC}
                app={app as any}
                primaryColor={primaryColor}
            />
        );
    }

    return (
        <AiFeatureGate>
            <>
                {isFinishingAssessment && topicRecord && isDesktop && (
                    <AiSessionLoader
                        topicRecord={topicRecord}
                        overrideText={finishedAssessmentText}
                    />
                )}
                <AiSessionsLayout
                    handleSetChatBotSelected={handleSetChatBotSelected}
                    leftColumn={leftColumn}
                    rightColumn={rightColumn}
                />
            </>
        </AiFeatureGate>
    );
};

export default AiSessionsContainer;
