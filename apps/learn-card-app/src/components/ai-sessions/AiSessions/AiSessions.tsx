import React, { useMemo } from 'react';

import AiSessionItem from './AiSessionItem';
import AiSessionItemSkeleton from './AiSessionItemSkeleton';

import {
    AiSessionsFilterOptionsEnum,
    AiSessionsSortOptionsEnum,
} from '../AiSessionsSearch/aiSessions-search.helpers';

import { VC, Boost } from '@learncard/types';
import { getAiSessionTitle } from '../aiSessions.helpers';
import { useDeviceTypeByWidth, LaunchPadAppListItem } from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';
import { AiSession } from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { AiAssessmentQuestion } from '../../ai-assessment/AiAssessment/ai-assessment.helpers';

export const AiSessions: React.FC<{
    app: LaunchPadAppListItem;
    sessions: AiSession[];
    searchInput: string;
    filterBy: AiSessionsFilterOptionsEnum;
    sortBy: AiSessionsSortOptionsEnum;
    isLoading: boolean;
    topicRecord?: LCR;
    topicVc?: VC;
    handleTopicSession: (session: {
        topic?: VC;
        topicBoost?: VC;
        session?: VC;
        showAssessment?: boolean;
        assessment?: AiAssessmentQuestion[];
    }) => void;
    selectedSession?: {
        topic?: VC;
        topicBoost?: VC;
        session?: VC;
        showAssessment?: boolean;
        assessment?: AiAssessmentQuestion[];
    } | null;
}> = ({
    app,
    sessions,
    searchInput,
    filterBy,
    sortBy,
    isLoading,
    topicRecord,
    topicVc,
    handleTopicSession,
    selectedSession,
}) => {
    const { isMobile } = useDeviceTypeByWidth();

    const aiSessions = useMemo(() => {
        if (filterBy === AiSessionsFilterOptionsEnum.completed) {
            return sessions?.filter(session => session?.vc?.completed);
        } else if (filterBy === AiSessionsFilterOptionsEnum.unfinished) {
            return sessions?.filter(session => !session?.vc?.completed);
        }
        return sessions;
    }, [sessions, filterBy]);

    const filteredSessions = useMemo(() => {
        const lowerSearch = searchInput?.toLowerCase() || '';

        return aiSessions.filter(item => {
            const sessionTitle =
                getAiSessionTitle(item?.vc ?? item?.boost.boost)?.toLowerCase() || '';

            return sessionTitle?.includes(lowerSearch);
        });
    }, [aiSessions, searchInput]);

    const sortedSessions = useMemo(() => {
        if (sortBy === AiSessionsSortOptionsEnum.alphabetical) {
            return filteredSessions.slice().sort((a, b) => {
                const nameA = (
                    unwrapBoostCredential(a?.vc ?? a?.boost.boost)?.summaryInfo?.title ||
                    unwrapBoostCredential(a?.vc ?? a?.boost.boost)?.name ||
                    ''
                )?.toLowerCase();
                const nameB = (
                    unwrapBoostCredential(b?.vc ?? b?.boost.boost)?.summaryInfo?.title ||
                    unwrapBoostCredential(b?.vc ?? b?.boost.boost)?.name ||
                    ''
                )?.toLowerCase();

                return nameA.localeCompare(nameB);
            });
        }

        // TODO add support for other sorting
        return filteredSessions;
    }, [filteredSessions, sortBy]);

    if (isLoading) {
        return (
            <section className="h-full w-full">
                <ul className="h-full ion-padding pt-0 ">
                    {Array.from({ length: 10 }).map((_, index) => (
                        <AiSessionItemSkeleton key={index} />
                    ))}
                </ul>
            </section>
        );
    }

    return (
        <section className="h-full w-full">
            <ul className={`h-full pt-0 ${isMobile ? 'px-4' : ''}`}>
                {searchInput.length > 0 && sortedSessions ? (
                    <>
                        {sortedSessions.map((session, index) => {
                            return (
                                <AiSessionItem
                                    app={app}
                                    key={index}
                                    session={session}
                                    topicRecord={topicRecord}
                                    topicVc={topicVc}
                                    handleTopicSession={handleTopicSession}
                                    selectedSession={selectedSession}
                                    index={index}
                                />
                            );
                        })}
                        {sortedSessions.length === 0 && (
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
                        {sortedSessions.map((session, index) => {
                            return (
                                <AiSessionItem
                                    app={app}
                                    key={index}
                                    session={session}
                                    topicRecord={topicRecord}
                                    topicVc={topicVc}
                                    handleTopicSession={handleTopicSession}
                                    selectedSession={selectedSession}
                                    index={index}
                                />
                            );
                        })}
                    </>
                )}
            </ul>
        </section>
    );
};

export default AiSessions;
