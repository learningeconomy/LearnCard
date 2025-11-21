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

import {
    AiPassportAppsEnum,
    getAiPassportAppByContractUri,
} from '../ai-passport-apps/aiPassport-apps.helpers';
import { NewAiSessionStepEnum } from '../new-ai-session/newAiSession.helpers';
import {
    AiAssessmentQuestion,
    finishedAssessmentText,
} from '../ai-assessment/AiAssessment/ai-assessment.helpers';
import SadCloud from '../svgs/SadCloud';

import { useTheme } from '../../theme/hooks/useTheme';

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
    const primaryColor = colors?.defaults?.primaryColor;

    useEffect(() => {
        if (!isCollapsed) {
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

    const topicUri = _topicUri || query.get('topicBoostUri');
    const { data: enrichedSessionData, isLoading: isLoadingEnrichedSessions } =
        useGetEnrichedSession(topicUri as string);

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

    const styles = isDesktop ? 'pt-[150px] ion-padding' : 'pt-[103px]';

    const leftColumn = (
        <div className="h-full w-full relative flex items-center justify-center  bg-white">
            <AiSessionsHeader
                topicTitle={topicsTitle}
                appContractUri={appContractUri}
                isLoading={isLoadingEnrichedSessions}
                handleGoBack={handleGoBack}
            />

            <GenericErrorBoundary>
                <div
                    className={`flex flex-col max-w-[600px] w-full h-full overflow-x-hidden scrollbar-hide ${styles}`}
                >
                    <div className="w-full ml-2 px-2 py-0">
                        <AiSessionsSubHeader
                            isLoading={isLoadingEnrichedSessions}
                            sessions={sessions}
                            appContractUri={appContractUri}
                            topicTitle={topicsTitle}
                        />
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
            <div className="flex flex-col items-center justify-center h-full w-full text-center p-6">
                <SadCloud className="w-[120px] h-auto text-grayscale-300 mb-4" />
                <h3 className="text-[20px] font-semibold text-grayscale-900">
                    No sessions for this topic
                </h3>
                <p className="text-grayscale-700 mt-2 max-w-[520px]">
                    You don’t have any sessions for “{topicsTitle}” yet. Start a new one to begin
                    chatting about this topic.
                </p>
                <button
                    className={`mt-6 bg-${primaryColor} hover:bg-${primaryColor} text-white px-5 py-3 rounded-[16px] font-semibold shadow-soft-bottom disabled:opacity-50 disabled:cursor-not-allowed`}
                    disabled={!topicBoost?.uri}
                    onClick={() => {
                        const uri = topicBoost?.uri;
                        if (!uri) return;

                        if (app?.type === AiPassportAppsEnum.learncardapp) {
                            history.push(`/chats?topicUri=${encodeURIComponent(uri)}`);
                        } else if (app?.url) {
                            window.location.href = `${app.url}/chats?topicUri=${encodeURIComponent(
                                uri
                            )}&did=${encodeURIComponent(currentLCNUser?.did ?? '')}`;
                        } else {
                            history.push(`/chats?topicUri=${encodeURIComponent(uri)}`);
                        }
                    }}
                >
                    Start a new session
                </button>
            </div>
        );
    }

    return (
        <>
            {isFinishingAssessment && topicRecord && isDesktop && (
                <AiSessionLoader topicRecord={topicRecord} overrideText={finishedAssessmentText} />
            )}
            <AiSessionsLayout
                handleSetChatBotSelected={handleSetChatBotSelected}
                leftColumn={leftColumn}
                rightColumn={rightColumn}
            />
        </>
    );
};

export default AiSessionsContainer;
