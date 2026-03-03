import React, { useMemo } from 'react';

import ExistingAiTopicItem from './ExistingAiTopicItem';

import { ChatBotQuestionsEnum } from '../newAiSessionChatbot.helpers';
import {
    useGetCredentialList,
    useGetEnrichedTopicsList,
    LaunchPadAppListItem,
} from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';
import { aiPassportApps } from '../../../ai-passport-apps/aiPassport-apps.helpers';

export const ExistingAiTopics: React.FC<{
    search: string | null | undefined;
    handleChatBotAnswer: (
        question: ChatBotQuestionsEnum,
        answer?: string,
        currentIndex?: number
    ) => void;
    currentQuestionIndex: number;
    selectedAppId?: number | null;
}> = ({ search, handleChatBotAnswer, currentQuestionIndex, selectedAppId }) => {
    const {
        data: records,
        isLoading: credentialsLoading,
        isFetching: credentialsFetching,
    } = useGetCredentialList('AI Topic');

    const topicRecords = useMemo(() => {
        return records?.pages?.flatMap(page => page?.records) || [];
    }, [records, credentialsLoading, credentialsFetching]) as LCR[];

    const { data: topics } = useGetEnrichedTopicsList(topicRecords);

    const app = aiPassportApps.find(app => app?.id === selectedAppId);
    const aiTopics = useMemo(() => {
        // if a selected app is passed in, filter topics to only include topics for that app
        if (app && selectedAppId) {
            return topics?.filter(item => item?.topicRecord?.contractUri === app?.contractUri);
        }

        return topics || [];
    }, [topics, selectedAppId]);

    const filteredTopics = useMemo(() => {
        const lowerSearch = search?.toLowerCase() || '';

        return aiTopics?.filter(item => {
            const topicName = item?.topicVc?.boostCredential?.topicInfo?.title?.toLowerCase() || '';

            return topicName?.includes(lowerSearch);
        });
    }, [aiTopics, search, selectedAppId]);

    return (
        <section className="w-full bg-white ion-padding border-t-[1px] border-solid border-grayscale-200 z-50">
            <ul className="pt-0">
                {(search?.length ?? 0) > 0 && filteredTopics ? (
                    <>
                        {filteredTopics.map((t, index) => (
                            <ExistingAiTopicItem
                                key={t?.topicRecord?.uri}
                                topicVc={t?.topicVc}
                                topicBoost={t?.topicBoost}
                                index={index}
                                handleChatBotAnswer={handleChatBotAnswer}
                                currentQuestionIndex={currentQuestionIndex}
                                contractUri={t?.topicRecord?.contractUri}
                                sessions={t?.sessions}
                            />
                        ))}
                        {filteredTopics.length === 0 && (
                            <div className="w-full flex items-center justify-center">
                                <div className="w-full max-w-[550px] flex items-center justify-start px-2 pt-2">
                                    <p className="text-grayscale-800 text-base font-normal font-notoSans">
                                        No results found for{' '}
                                        <span className="text-black italic">{search}</span>
                                    </p>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {filteredTopics?.map((t, index) => (
                            <ExistingAiTopicItem
                                key={t?.topicRecord?.uri}
                                topicVc={t?.topicVc}
                                topicBoost={t?.topicBoost}
                                index={index}
                                handleChatBotAnswer={handleChatBotAnswer}
                                currentQuestionIndex={currentQuestionIndex}
                                contractUri={t?.topicRecord?.contractUri}
                                sessions={t?.sessions}
                            />
                        ))}
                    </>
                )}
            </ul>
        </section>
    );
};

export default ExistingAiTopics;
