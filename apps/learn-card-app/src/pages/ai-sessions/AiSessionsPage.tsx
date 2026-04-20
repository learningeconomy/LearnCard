import React, { useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { IonContent, IonPage, IonSpinner } from '@ionic/react';
import MainHeader from '../../components/main-header/MainHeader';
import { AiFeatureGate } from '../../components/ai-feature-gate/AiFeatureGate';
import { ErrorBoundaryFallback } from '../../components/boost/boostErrors/BoostErrorsDisplay';
import AiSessionTopicItem from '../../components/ai-sessions/AiSessionTopics/AiSessionTopicItem';
import AiSessionTopicItemSkeleton from '../../components/ai-sessions/AiSessionTopics/AiSessionTopicItemSkeleton';
import {
    NewAiSessionButton,
    NewAiSessionButtonEnum,
} from '../../components/new-ai-session/NewAiSessionButton/NewAiSessionButton';

import { SubheaderTypeEnum } from '../../components/main-subheader/MainSubHeader.types';
import {
    CredentialCategoryEnum,
    pluralize,
    useGetCredentialList,
    useGetEnrichedTopicsList,
} from 'learn-card-base';
import Search from 'learn-card-base/svgs/Search';
import AiSessionsSearch from '../../components/ai-sessions/AiSessionsSearch/AiSessionsSearch';
import {
    AiSessionsFilterOptionsEnum,
    AiSessionsSortOptionsEnum,
} from '../../components/ai-sessions/AiSessionsSearch/aiSessions-search.helpers';

import useTheme from '../../theme/hooks/useTheme';

const AiSessionsPage: React.FC = () => {
    const { getThemedCategoryColors } = useTheme();

    const colors = getThemedCategoryColors(CredentialCategoryEnum.aiTopic);
    const { backgroundSecondaryColor } = colors;

    const [searchInput, setSearchInput] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [filterBy, setFilterBy] = useState<AiSessionsFilterOptionsEnum>(
        AiSessionsFilterOptionsEnum.showAll
    );
    const [sortBy, setSortBy] = useState<AiSessionsSortOptionsEnum>(
        AiSessionsSortOptionsEnum.newlyAdded
    );

    const { data: records, isLoading: credentialsLoading } = useGetCredentialList('AI Topic');

    const topicRecords = useMemo(() => {
        return records?.pages?.flatMap(page => page?.records) || [];
    }, [records?.pages]);

    const { data: topics, isLoading: topicsLoading } = useGetEnrichedTopicsList(topicRecords);

    const isLoading = credentialsLoading || topicsLoading;

    const topicsCount = topics?.length ?? 0;
    const totalSessionsCount = useMemo(
        () => topics?.reduce((acc, t) => acc + (t.sessions?.length || 0), 0) ?? 0,
        [topics]
    );
    const unfinishedCount = useMemo(
        () =>
            topics?.reduce(
                (acc, t) => acc + (t.sessions?.filter((s: any) => !s?.vc?.completed).length || 0),
                0
            ) ?? 0,
        [topics]
    );

    const displayTopics = useMemo(() => {
        if (!topics) return [];
        if (!searchInput) return topics;
        const lower = searchInput.toLowerCase();
        return topics.filter(t =>
            (t.topicVc?.boostCredential?.topicInfo?.title ?? '').toLowerCase().includes(lower)
        );
    }, [topics, searchInput]);

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
                                {/* Stats + search row */}
                                <div className="flex items-start justify-between mb-1 pt-6">
                                    <div>
                                        <h2 className="text-grayscale-800 font-poppins font-bold text-[22px] leading-tight">
                                            {isLoading ? (
                                                <IonSpinner
                                                    name="crescent"
                                                    color="dark"
                                                    className="scale-[0.8] mr-1"
                                                />
                                            ) : (
                                                <>
                                                    {topicsCount} {pluralize('Topic', topicsCount)},{' '}
                                                    {totalSessionsCount}{' '}
                                                    {pluralize('Session', totalSessionsCount)}
                                                </>
                                            )}
                                        </h2>
                                        {!isLoading && unfinishedCount > 0 && (
                                            <p className="flex items-center gap-1.5 text-red-500 font-poppins font-semibold text-[14px] mt-0.5">
                                                <span className="w-[8px] h-[8px] rounded-full bg-red-500 shrink-0" />
                                                {unfinishedCount} Unfinished{' '}
                                                {pluralize('Session', unfinishedCount)}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        className="p-2 text-grayscale-800"
                                        onClick={() => {
                                            setShowSearch(v => !v);
                                            if (showSearch) setSearchInput('');
                                        }}
                                    >
                                        {showSearch ? (
                                            <span className="text-[22px] leading-none font-light">
                                                ×
                                            </span>
                                        ) : (
                                            <Search className="w-[24px] h-[24px]" />
                                        )}
                                    </button>
                                </div>

                                {/* Search bar */}
                                {showSearch && (
                                    <AiSessionsSearch
                                        searchInput={searchInput}
                                        setSearchInput={setSearchInput}
                                        filterBy={filterBy}
                                        setFilterBy={setFilterBy}
                                        sortBy={sortBy}
                                        setSortBy={setSortBy}
                                    />
                                )}

                                {/* New Session button */}
                                <div className="mt-3 mb-4">
                                    <NewAiSessionButton type={NewAiSessionButtonEnum.mobile} />
                                </div>

                                {/* Topic list */}
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <AiSessionTopicItemSkeleton key={i} />
                                    ))
                                ) : displayTopics?.length ? (
                                    displayTopics.map((t, i) => (
                                        <AiSessionTopicItem
                                            key={i}
                                            topicVc={t.topicVc}
                                            topicBoost={t.topicBoost}
                                            topicRecord={t.topicRecord}
                                            topicSessionsCount={t.sessions?.length || 0}
                                            hasNewSessions={
                                                (t.sessions?.filter((s: any) => !s?.vc?.completed)
                                                    .length || 0) > 0
                                            }
                                        />
                                    ))
                                ) : (
                                    <p className="text-center text-grayscale-500 font-poppins text-sm mt-8">
                                        No topics yet
                                    </p>
                                )}
                            </div>
                        </div>
                    </AiFeatureGate>
                </IonContent>
            </ErrorBoundary>
        </IonPage>
    );
};

export default AiSessionsPage;
