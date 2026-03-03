import React, { useMemo, useState } from 'react';

import { IonSpinner } from '@ionic/react';
import TopicsItem from './TopicsItem';
import TopicsItemSkeleton from './TopicsItemSkeleton';
import { LaunchPadAppListItem, useGetCredentialList } from 'learn-card-base';

import { useGetEnrichedTopicsList } from 'learn-card-base/react-query/queries/aiPassport-queries';
import { LCR } from 'learn-card-base/types/credential-records';

import { useTheme } from '../../../theme/hooks/useTheme';

export const AiPassportAppProfileTopics: React.FC<{ app: LaunchPadAppListItem }> = ({ app }) => {
    // TODO: Pagination
    const { data: aiTopics, isLoading } = useGetCredentialList('AI Topic');
    const aiTopicsRecords = aiTopics?.pages?.flatMap(page => page?.records) as LCR[];

    const { data: enrichedTopics } = useGetEnrichedTopicsList(aiTopicsRecords);

    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const topics = useMemo(() => {
        return enrichedTopics?.filter(t => t?.topicRecord?.contractUri === app?.contractUri);
    }, [aiTopics, enrichedTopics]);

    const [showAll, setShowAll] = useState<boolean>(false);

    const topicsCount = topics?.length ?? 0;
    const showAllButton = topicsCount > 5;
    let _topics = topics?.slice(0, 5);
    if (showAll) _topics = topics;

    return (
        <div className="bg-white ion-padding rounded-b-[20px] shadow-soft-bottom">
            <div className="w-full">
                <div className="w-full flex items-center justify-center">
                    <p className="text-grayscale-700 font-poppins font-semibold text-[17px] flex items-center justify-center">
                        AI Sessions<span className="text-2xl">&nbsp;&middot;&nbsp;</span>
                        {isLoading ? (
                            <IonSpinner name="crescent" color="dark" className="scale-[1] mr-1" />
                        ) : (
                            topicsCount
                        )}{' '}
                        &nbsp;Topics
                    </p>
                </div>

                {isLoading
                    ? Array.from({ length: 8 }).map((_, index) => (
                          <TopicsItemSkeleton key={index} />
                      ))
                    : _topics?.map(topic => (
                          <TopicsItem
                              topicVc={topic?.topicVc}
                              topicBoost={topic?.topicBoost}
                              sessions={topic?.sessions}
                              key={topic?.topicRecord?.id}
                          />
                      ))}

                {!isLoading && showAllButton && (
                    <>
                        <div className="mb-2 border-solid border-b-[2px] pb-4 border-grayscale-100" />

                        <div className="w-full flex items-center justify-center mt-4">
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className={`text-${primaryColor} font-poppins font-semibold text-sm`}
                            >
                                {!showAll ? 'Show All' : 'Show Less'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AiPassportAppProfileTopics;
