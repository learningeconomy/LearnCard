import React, { useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { IonContent, IonPage } from '@ionic/react';
import { VC } from '@learncard/types';
import { useHistory, useLocation } from 'react-router-dom';

import MainHeader from '../../components/main-header/MainHeader';
import { AiFeatureGate } from '../../components/ai-feature-gate/AiFeatureGate';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';
import {
    NewAiSessionButton,
    NewAiSessionButtonEnum,
} from '../../components/new-ai-session/NewAiSessionButton/NewAiSessionButton';
import AiSessionsSearch from '../../components/ai-sessions/AiSessionsSearch/AiSessionsSearch';
import AiSessionTopicItem from '../../components/ai-sessions/AiSessionTopics/AiSessionTopicItem';
import AiSessionItem from '../../components/ai-sessions/AiSessions/AiSessionItem';
import SlimCaretLeft from '../../components/svgs/SlimCaretLeft';

import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import {
    CredentialCategoryEnum,
    pluralize,
    useGetCredentialList,
    useGetEnrichedSession,
    useGetEnrichedTopicsList,
} from 'learn-card-base';
import { useDeviceTypeByWidth } from 'learn-card-base/hooks/useDeviceTypeByWidth';
import { LCR } from 'learn-card-base/types/credential-records';

import {
    AiFilteringTypes,
    AiSessionsFilterOptionsEnum,
    AiSessionsSortOptionsEnum,
} from '../../components/ai-sessions/AiSessionsSearch/aiSessions-search.helpers';
import useTheme from '../../theme/hooks/useTheme';

type ViewMode = 'topics' | 'sessions' | 'topicDetail';

const AiSessionsPage: React.FC<{ topicUri?: string }> = ({ topicUri }) => {
    const history = useHistory();
    const location = useLocation();
    const { getThemedCategoryColors } = useTheme();
    const { isDesktop } = useDeviceTypeByWidth();

    const colors = getThemedCategoryColors(CredentialCategoryEnum.aiTopic);
    const { backgroundSecondaryColor } = colors;

    const [view, setView] = useState<ViewMode>('topics');
    const [selectedTopicUri, setSelectedTopicUri] = useState<string>('');

    const [searchInput, setSearchInput] = useState('');
    const [filterBy, setFilterBy] = useState<AiSessionsFilterOptionsEnum>(
        AiSessionsFilterOptionsEnum.showAll
    );
    const [sortBy, setSortBy] = useState<AiSessionsSortOptionsEnum>(
        AiSessionsSortOptionsEnum.newlyAdded
    );

    const {
        data: records,
        isLoading: credentialsLoading,
        isFetching: credentialsFetching,
        hasNextPage,
        fetchNextPage,
    } = useGetCredentialList('AI Topic');

    useEffect(() => {
        if (hasNextPage && !credentialsFetching) {
            fetchNextPage();
        }
    }, [hasNextPage, credentialsFetching, fetchNextPage]);

    const topicRecords = useMemo(() => {
        return (records?.pages?.flatMap(page => page?.records) || []) as LCR[];
    }, [records?.pages]);

    const { data: topics, isLoading: topicsLoading } = useGetEnrichedTopicsList(topicRecords);

    const { data: selectedTopicData, isLoading: selectedTopicLoading } = useGetEnrichedSession(
        selectedTopicUri,
        undefined,
        Boolean(selectedTopicUri)
    );

    const isLoading = credentialsLoading || topicsLoading;

    const topicsCount = topics?.length ?? 0;
    const allSessions = useMemo(() => topics?.flatMap(topic => topic.sessions ?? []) ?? [], [topics]);
    const totalSessionsCount = allSessions.length;
    const unfinishedCount = useMemo(
        () => topics?.reduce((acc, t) => acc + (t.unfinishedSessionsCount ?? 0), 0) ?? 0,
        [topics]
    );

    const filteredTopics = useMemo(() => {
        const source = topics ?? [];
        const lower = searchInput.toLowerCase();

        const withSearch = source.filter(t =>
            (t.topicVc?.boostCredential?.topicInfo?.title ?? '').toLowerCase().includes(lower)
        );

        const withFilter =
            filterBy === AiSessionsFilterOptionsEnum.unfinished
                ? withSearch.filter(t => t.hasUnfinishedSessions)
                : withSearch;

        if (sortBy === AiSessionsSortOptionsEnum.alphabetical) {
            return withFilter
                .slice()
                .sort((a, b) =>
                    (a.topicVc?.boostCredential?.topicInfo?.title ?? '').localeCompare(
                        b.topicVc?.boostCredential?.topicInfo?.title ?? ''
                    )
                );
        }

        return withFilter
            .slice()
            .sort(
                (a, b) =>
                    new Date(b?.topicVc?.issuanceDate ?? '').getTime() -
                    new Date(a?.topicVc?.issuanceDate ?? '').getTime()
            );
    }, [topics, searchInput, filterBy, sortBy]);

    const filteredSessions = useMemo(() => {
        const source = view === 'sessions' ? allSessions : selectedTopicData?.sessions ?? [];

        const lower = searchInput.toLowerCase();

        let items = source.filter(session => {
            const title = (
                session?.vc?.boostCredential?.summaryInfo?.title ??
                session?.vc?.name ??
                ''
            ).toLowerCase();
            return title.includes(lower);
        });

        if (filterBy === AiSessionsFilterOptionsEnum.unfinished) {
            items = items.filter(session => !session?.vc?.completed);
        }

        if (sortBy === AiSessionsSortOptionsEnum.alphabetical) {
            return items.slice().sort((a, b) => {
                const aTitle = (
                    a?.vc?.boostCredential?.summaryInfo?.title ??
                    a?.vc?.name ??
                    ''
                ).toLowerCase();
                const bTitle = (
                    b?.vc?.boostCredential?.summaryInfo?.title ??
                    b?.vc?.name ??
                    ''
                ).toLowerCase();
                return aTitle.localeCompare(bTitle);
            });
        }

        return items;
    }, [view, allSessions, selectedTopicData?.sessions, searchInput, filterBy, sortBy]);

    const selectedTopicTitle =
        selectedTopicData?.topicVc?.boostCredential?.topicInfo?.title ?? 'Topic';
    const selectedTopicUnfinished =
        selectedTopicData?.sessions?.filter(session => !session?.vc?.completed).length ?? 0;

    const searchPlaceholder = view === 'topics' ? 'Browse topics...' : 'Browse sessions...';

    const resetFilters = () => {
        setSearchInput('');
        setFilterBy(AiSessionsFilterOptionsEnum.showAll);
        setSortBy(AiSessionsSortOptionsEnum.newlyAdded);
    };

    useEffect(() => {
        if (!topicUri) return;
        setSelectedTopicUri(topicUri);
        setView('topicDetail');
        resetFilters();
    }, [topicUri]);

    return (
        <IonPage className={`bg-${backgroundSecondaryColor}`}>
            <ErrorBoundary fallback={<ErrorBoundaryFallback />}>
                <IonContent fullscreen color={backgroundSecondaryColor}>
                    <MainHeader
                        category={CredentialCategoryEnum.aiTopic}
                        showBackButton={false}
                        subheaderType={SubheaderTypeEnum.AiSessions}
                        hidePlusBtn={true}
                        customClassName="bg-gradient-to-b from-white to-white/70 border-b border-white backdrop-blur-[5px] md:bg-white md:border-none md:bg-none md:backdrop-blur-none"
                    />

                    <AiFeatureGate>
                        <div className="flex justify-center w-full">
                            <div className="w-full max-w-[600px] px-4 pt-5 pb-[120px]">
                                <div className="flex items-center justify-between mb-4 pt-6">
                                    {view === 'topicDetail' ? (
                                        <button
                                            className="text-grayscale-800 font-poppins text-[22px] font-semibold flex items-center gap-2"
                                            onClick={() => {
                                                if (location.pathname === '/ai/sessions') {
                                                    history.push('/ai/topics');
                                                    return;
                                                }
                                                setView('topics');
                                                resetFilters();
                                            }}
                                        >
                                            <SlimCaretLeft className="text-grayscale-600" />
                                            <span className="text-[17px]">All Topics</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-1 pl-1">
                                            <button
                                                onClick={() => {
                                                    setView('topics');
                                                    resetFilters();
                                                }}
                                                className={`py-[8px] px-[16px] rounded-[5px] text-base ${
                                                    view === 'topics'
                                                        ? 'bg-white text-grayscale-900'
                                                        : 'text-grayscale-600'
                                                }`}
                                            >
                                                {topicsCount} Topics
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setView('sessions');
                                                    resetFilters();
                                                }}
                                                className={`py-[8px] px-[16px] rounded-[5px] text-base flex items-center gap-1 ${
                                                    view === 'sessions'
                                                        ? 'bg-white text-grayscale-900'
                                                        : 'text-grayscale-600'
                                                }`}
                                            >
                                                {totalSessionsCount} Sessions
                                                {unfinishedCount > 0 && (
                                                    <span className="w-[8px] h-[8px] rounded-full bg-rose-500" />
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    <NewAiSessionButton
                                        type={NewAiSessionButtonEnum.icon}
                                        className="!mt-0 !justify-center"
                                    />
                                </div>

                                {view === 'topicDetail' && (
                                    <div className="mb-4 border-t border-grayscale-200 pt-4">
                                        <h2 className="text-grayscale-900 text-[28px] font-semibold font-poppins leading-tight">
                                            {selectedTopicTitle}
                                        </h2>
                                        <p className="text-sm font-poppins mt-1">
                                            <span className="text-grayscale-700">
                                                {selectedTopicData?.sessions?.length ?? 0}{' '}
                                                {pluralize(
                                                    'Session',
                                                    selectedTopicData?.sessions?.length ?? 0
                                                )}
                                            </span>
                                            <span className="text-grayscale-500 mx-1">•</span>
                                            <span className="text-rose-500">
                                                {selectedTopicUnfinished} Unfinished
                                            </span>
                                        </p>
                                    </div>
                                )}

                                {view === 'sessions' && unfinishedCount > 0 && (
                                    <p className="text-rose-500 font-poppins font-semibold text-[14px] mb-2">
                                        {unfinishedCount} Unfinished Sessions
                                    </p>
                                )}

                                <AiSessionsSearch
                                    searchInput={searchInput}
                                    setSearchInput={setSearchInput}
                                    filterBy={filterBy}
                                    setFilterBy={setFilterBy}
                                    sortBy={sortBy}
                                    setSortBy={setSortBy}
                                    showFilterOptions
                                    filteringType={
                                        view === 'topics'
                                            ? AiFilteringTypes.topics
                                            : AiFilteringTypes.sessions
                                    }
                                    placeholder={searchPlaceholder}
                                    className="!bg-grayscale-200 !w-full"
                                />

                                {view === 'topicDetail' && (
                                    <div className="mt-3 mb-3">
                                        <NewAiSessionButton
                                            type={NewAiSessionButtonEnum.mobile}
                                            text={`New Session in ${selectedTopicTitle}`}
                                        />
                                    </div>
                                )}

                                <div className="mt-3">
                                    {view === 'topics' && (
                                        <>
                                            {isLoading ? (
                                                <p className="text-grayscale-500 font-poppins text-sm mt-8">
                                                    Loading topics...
                                                </p>
                                            ) : filteredTopics.length ? (
                                                filteredTopics.map((t, i) => (
                                                    <AiSessionTopicItem
                                                        key={i}
                                                        topicVc={t.topicVc}
                                                        topicBoost={t.topicBoost}
                                                        topicRecord={t.topicRecord}
                                                        topicSessionsCount={t.sessions?.length || 0}
                                                        hasUnfinishedSessions={
                                                            t.hasUnfinishedSessions
                                                        }
                                                        hasFinishedSessions={t.hasFinishedSessions}
                                                        onSelectTopic={() => {
                                                            const nextTopicUri =
                                                                t.topicBoost?.uri ?? '';
                                                            setSelectedTopicUri(nextTopicUri);
                                                            setView('topicDetail');
                                                            resetFilters();
                                                            if (nextTopicUri) {
                                                                history.push(
                                                                    `/ai/sessions?topicBoostUri=${encodeURIComponent(nextTopicUri)}`
                                                                );
                                                            } else {
                                                                history.push('/ai/sessions');
                                                            }
                                                        }}
                                                    />
                                                ))
                                            ) : (
                                                <p className="text-center text-grayscale-500 font-poppins text-sm mt-8">
                                                    No topics yet
                                                </p>
                                            )}
                                        </>
                                    )}

                                    {(view === 'sessions' || view === 'topicDetail') && (
                                        <>
                                            {selectedTopicLoading && view === 'topicDetail' ? (
                                                <p className="text-grayscale-500 font-poppins text-sm mt-8">
                                                    Loading sessions...
                                                </p>
                                            ) : filteredSessions.length ? (
                                                filteredSessions.map((session, index) => (
                                                    <AiSessionItem
                                                        key={index}
                                                        app={undefined as any}
                                                        session={session}
                                                        topicRecord={selectedTopicData?.topicRecord}
                                                        topicVc={selectedTopicData?.topicVc as VC}
                                                        handleTopicSession={() => {}}
                                                        index={index}
                                                        selectedSession={null}
                                                        forceSingleView={isDesktop}
                                                    />
                                                ))
                                            ) : (
                                                <p className="text-center text-grayscale-500 font-poppins text-sm mt-8">
                                                    No sessions found
                                                </p>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </AiFeatureGate>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiSessionsPage;
