import React, { useMemo, useRef, useCallback } from 'react';

import { IonSpinner } from '@ionic/react';
import AiSessionTopicItem from './AiSessionTopicItem';
import AiSessionTopicItemSkeleton from './AiSessionTopicItemSkeleton';
import AiSessionsTabs from '../AiSessionTopicsTabs/AiSessionTopicsTabs';

import {
    AiSessionsFilterOptionsEnum,
    AiSessionsSortOptionsEnum,
} from '../AiSessionsSearch/aiSessions-search.helpers';
import { AiSessionsTabsEnum } from '../aiSessions.helpers';
import { aiPassportApps, AiPassportAppsEnum } from '../../ai-passport-apps/aiPassport-apps.helpers';
import { useGetCredentialList, useGetEnrichedTopicsList } from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';
import ExperimentalFeatureBox from '../../generic/ExperimentalFeatureBox';
import { useDeviceTypeByWidth } from 'learn-card-base';

type AiSessionTopicsProps = {
    activeTab: AiSessionsTabsEnum;
    setActiveTab: React.Dispatch<React.SetStateAction<AiSessionsTabsEnum>>;

    searchInput: string;
    setSearchInput: React.Dispatch<React.SetStateAction<string>>;
    filterBy: AiSessionsFilterOptionsEnum;
    setFilterBy: React.Dispatch<React.SetStateAction<AiSessionsFilterOptionsEnum>>;
    sortBy: AiSessionsSortOptionsEnum;
    setSortBy: React.Dispatch<React.SetStateAction<AiSessionsSortOptionsEnum>>;
};

export const AiSessionTopics: React.FC<AiSessionTopicsProps> = ({
    activeTab,
    setActiveTab,
    searchInput,
    setSearchInput,
    filterBy,
    setFilterBy,
    sortBy,
    setSortBy,
}) => {
    const { isMobile } = useDeviceTypeByWidth();
    const {
        data: records,
        isLoading: credentialsLoading,
        isFetching: credentialsFetching,
        hasNextPage,
        fetchNextPage,
        refetch: earnedBoostsRefetch,
        error: earnedBoostsError,
    } = useGetCredentialList('AI Topic');

    const topicRecords = useMemo(() => {
        return records?.pages?.flatMap(page => page?.records) || [];
    }, [records?.pages]) as LCR[];

    const {
        data: topics,
        isLoading: topicsLoading,
        isFetching: topicsFetching,
    } = useGetEnrichedTopicsList(topicRecords);

    const containerRef = useRef<HTMLDivElement>(null);
    const handleScroll = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        if (
            el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
            hasNextPage &&
            !credentialsFetching
        ) {
            fetchNextPage();
        }
    }, [fetchNextPage, hasNextPage, credentialsFetching]);

    const aiTopics = useMemo(() => {
        if (!topics?.length) return [];

        if (activeTab === AiSessionsTabsEnum.chatGPT) {
            const chatGPTProfile = aiPassportApps?.find(
                app => app?.type === AiPassportAppsEnum.chatGPT
            );
            return topics?.filter(t => t?.topicRecord?.contractUri === chatGPTProfile?.contractUri);
        } else if (activeTab === AiSessionsTabsEnum.claude) {
            const claudeProfile = aiPassportApps?.find(
                app => app?.type === AiPassportAppsEnum.claude
            );
            return topics?.filter(t => t?.topicRecord?.contractUri === claudeProfile?.contractUri);
        } else if (activeTab === AiSessionsTabsEnum.gemini) {
            const geminiProfile = aiPassportApps?.find(
                app => app?.type === AiPassportAppsEnum.gemini
            );
            return topics?.filter(t => t?.topicRecord?.contractUri === geminiProfile?.contractUri);
        } else if (activeTab === AiSessionsTabsEnum.learnCard) {
            const learncardappProfile = aiPassportApps?.find(
                app => app?.type === AiPassportAppsEnum.learncardapp
            );
            return topics?.filter(
                t => t?.topicRecord?.contractUri === learncardappProfile?.contractUri
            );
        }
        return topics;
    }, [activeTab, topics, aiPassportApps]);

    const filteredTopics = useMemo(() => {
        if (!aiTopics) return [];
        const lowerSearch = searchInput?.toLowerCase() || '';

        return aiTopics?.filter(item => {
            const topicName = item?.topicVc?.boostCredential?.topicInfo?.title?.toLowerCase() || '';

            return topicName.includes(lowerSearch);
        });
    }, [aiTopics, searchInput]);

    const sortedTopics = useMemo(() => {
        if (!filteredTopics) return [];

        if (sortBy === AiSessionsSortOptionsEnum.alphabetical) {
            return filteredTopics.slice().sort((a, b) => {
                const nameA = a?.topicVc?.boostCredential?.topicInfo?.title?.toLowerCase() || '';
                const nameB = b?.topicVc?.boostCredential?.topicInfo?.title?.toLowerCase() || '';
                return nameA.localeCompare(nameB);
            });
        } else if (sortBy === AiSessionsSortOptionsEnum.newlyAdded) {
            return filteredTopics
                .slice()
                .sort(
                    (a, b) =>
                        new Date(b?.topicVc?.issuanceDate ?? '').getTime() -
                        new Date(a?.topicVc?.issuanceDate ?? '').getTime()
                );
        }

        return filteredTopics;
    }, [filteredTopics, sortBy]);

    const isLoading = credentialsLoading || topicsLoading;
    const isFetching = credentialsFetching || topicsFetching;

    const noTopics = !isFetching && !isLoading && !aiTopics?.length;

    return (
        <>
            <AiSessionsTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                filterBy={filterBy}
                setFilterBy={setFilterBy}
                sortBy={sortBy}
                setSortBy={setSortBy}
            />

            {isLoading && (
                <section className="h-full w-full relative scrollbar-hide">
                    <ul className="ion-padding pt-0 ">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <AiSessionTopicItemSkeleton key={index} />
                        ))}
                    </ul>
                </section>
            )}

            <section
                ref={containerRef}
                onScroll={handleScroll}
                className="h-full w-full overflow-y-scroll scrollbar-hide relative"
            >
                <ul className="ion-padding pt-1 pb-[200px] mt-[10px] mb-[20px]">
                    {isMobile && !isFetching && !isLoading && <ExperimentalFeatureBox />}
                    {searchInput.length > 0 && sortedTopics ? (
                        <>
                            {sortedTopics.map((t, index) => {
                                return (
                                    <AiSessionTopicItem
                                        key={index}
                                        topicVc={t.topicVc}
                                        topicBoost={t.topicBoost}
                                        topicRecord={t.topicRecord}
                                        topicSessionsCount={t.sessions?.length || 0}
                                    />
                                );
                            })}
                            {sortedTopics.length === 0 && (
                                <div className="w-full flex items-center justify-center z-10 mt-4">
                                    <div className="w-full max-w-[550px] flex items-center justify-start px-2 border-t-[1px] border-solid border-grayscale-200 pt-2">
                                        <p className="text-grayscale-800 text-base font-normal font-notoSans">
                                            No results found for{' '}
                                            <span className="text-black italic">{searchInput}</span>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {sortedTopics.map((t, index) => {
                                const topicSessionsCount = t.sessions?.length || 0;

                                return (
                                    <AiSessionTopicItem
                                        key={index}
                                        topicVc={t.topicVc}
                                        topicBoost={t.topicBoost}
                                        topicRecord={t.topicRecord}
                                        topicSessionsCount={topicSessionsCount}
                                    />
                                );
                            })}
                        </>
                    )}
                    {noTopics && (
                        <div className="w-full flex items-center justify-center z-10">
                            <div className="w-full max-w-[550px] flex items-center justify-center px-2 pt-4">
                                <p className="text-grayscale-800 text-base font-semibold font-notoSans">
                                    No topics yet
                                </p>
                            </div>
                        </div>
                    )}
                    {isFetching && !isLoading && !noTopics && (
                        <div className="w-full flex items-center justify-center">
                            <IonSpinner
                                name="crescent"
                                color="grayscale-900"
                                className="scale-[2] mb-8 mt-6"
                            />
                        </div>
                    )}
                </ul>
            </section>
        </>
    );
};

export default AiSessionTopics;
