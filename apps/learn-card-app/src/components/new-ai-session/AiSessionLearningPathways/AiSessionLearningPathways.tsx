import React, { useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

import AiSessionLearningPathwayPreview from './AiSessionLearningPathwayPreview';
import AiSessionLearningPathwayItemSkeleton from './AiSessionLearningPathwayItemSkeleton';
import LockSimple from 'learn-card-base/svgs/LockSimple';

import { ModalTypes, truncateWithEllipsis, useGetEnrichedSession, useModal } from 'learn-card-base';

import {
    ChatBotQA,
    ChatBotQuestionsEnum,
} from '../NewAiSessionChatBot/newAiSessionChatbot.helpers';
import { LearningPathway } from '../../ai-sessions/AiSessionTopics/aiSession-topics.helpers';
import { getAiTopicTitle } from '../../new-ai-session/newAiSession.helpers';
import { useGetLearningPathwaysForSession } from './ai-learningPathways.helpers';
import { Boost } from '@learncard/types';

import { useDeviceTypeByWidth } from 'learn-card-base';
import { useHistory } from 'react-router-dom';
import { useGetCurrentLCNUser } from 'learn-card-base';
import {
    AiPassportAppsEnum,
    getAiPassportAppByContractUri,
} from '../../ai-passport-apps/aiPassport-apps.helpers';

export const AiSessionLearningPathways: React.FC<{ chatBotQA: ChatBotQA[] }> = ({ chatBotQA }) => {
    const { newModal } = useModal();
    const { isDesktop } = useDeviceTypeByWidth();
    const history = useHistory();
    const { currentLCNUser } = useGetCurrentLCNUser();

    const sessionUri = chatBotQA?.find(qa => qa.type === ChatBotQuestionsEnum.ResumeTopic)?.answer;
    const { data, isLoading } = useGetEnrichedSession(sessionUri || '');

    const topicRecord = data?.topicRecord;
    const topicVc = data?.topicVc;
    const topicBoost = data?.topicBoost;
    const topicTitle = getAiTopicTitle(topicVc) ?? '';
    const sessions = data?.sessions ?? [];
    const app = getAiPassportAppByContractUri(topicRecord?.contractUri || '');

    const {
        data: learningPathwaysData,
        isLoading: isLoadingPathways,
    } = useGetLearningPathwaysForSession(sessions?.[0]?.boost?.uri || '');

    if (!sessionUri) return <></>;

    // Robust fallback: if there are no sessions OR, after loading, no pathways, go to chats
    useEffect(() => {
        if (!sessionUri) return;

        const noSessions = (sessions?.length ?? 0) === 0;
        const pathwaysLoaded = !isLoadingPathways;
        const noPathways = (learningPathwaysData?.length ?? 0) === 0;

        if (!isLoading && (noSessions || (pathwaysLoaded && noPathways))) {
            if (app?.type === AiPassportAppsEnum.learncardapp) {
                history.push(`/chats?topicUri=${encodeURIComponent(sessionUri)}`);
            } else {
                const url = app?.url;
                if (url) {
                    window.location.href = `${url}/chats?topicUri=${encodeURIComponent(
                        sessionUri
                    )}&did=${encodeURIComponent(currentLCNUser?.did ?? '')}`;
                } else {
                    history.push(`/chats?topicUri=${encodeURIComponent(sessionUri)}`);
                }
            }
        }
    }, [
        sessionUri,
        isLoading,
        sessions,
        isLoadingPathways,
        learningPathwaysData,
        history,
        app,
        currentLCNUser?.did,
    ]);

    const handleLearningPathwayPreview = (learningPathway: {
        boost: Boost;
        learningPathway: LearningPathway;
    }) => {
        newModal(
            <AiSessionLearningPathwayPreview
                learningPathway={learningPathway.learningPathway}
                pathwayBoost={learningPathway.boost}
                topicRecord={topicRecord ?? undefined}
                topicVc={topicVc}
                topicBoost={topicBoost}
            />,
            { hideButton: true },
            { mobile: ModalTypes.Right, desktop: ModalTypes.Right }
        );
    };

    if (isLoading) {
        return (
            <div className="w-full bg-grayscale-100 ion-padding">
                <Swiper spaceBetween={16} slidesPerView={'auto'} style={{ paddingBottom: '2px' }}>
                    {Array.from({ length: 3 }).map((_, index) => (
                        <SwiperSlide key={index} style={{ width: '240px', height: '194px' }}>
                            <AiSessionLearningPathwayItemSkeleton />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        );
    }

    return (
        <div
            className={`w-full bg-grayscale-100 ion-padding ${
                isDesktop ? 'rounded-[20px] mt-4' : ''
            }`}
        >
            <Swiper spaceBetween={16} slidesPerView={'auto'} style={{ paddingBottom: '2px' }}>
                {learningPathwaysData?.length === 0 ? (
                    <SwiperSlide
                        key={'empty-results-pathways'}
                        style={{ width: '100%', height: '194px' }}
                    >
                        <p className="text-grayscale-900 font-semibold text-medium">
                            0 topics found, select another
                        </p>
                    </SwiperSlide>
                ) : (
                    learningPathwaysData?.map(({ learningPathway, boost }) => {
                        return (
                            <SwiperSlide
                                key={learningPathway.title}
                                style={{ width: '240px', height: '194px' }}
                            >
                                <div
                                    className="flex flex-col items-start justify-between bg-white h-full w-full ion-padding shadow-box-bottom rounded-[20px] cursor-pointer"
                                    onClick={() =>
                                        handleLearningPathwayPreview({ learningPathway, boost })
                                    }
                                >
                                    <div>
                                        <h4 className="text-grayscale-800 font-semibold text-[17px] text-left line-clamp-2">
                                            {learningPathway.title}
                                        </h4>
                                        <p className="text-grayscale-900 line-clamp-3 text-sm my-4 text-left">
                                            {learningPathway.description}
                                        </p>
                                    </div>
                                    <p className="bg-indigo-100 text-indigo-500 font-medium rounded-full grid grid-flow-col auto-cols-max items-center gap-1 text-xs py-1 px-2 min-h-[24px]">
                                        <LockSimple version="2" className="h-[16px] w-[16px]" />
                                        <span>{learningPathway?.skills?.length ?? 0} Skills</span>
                                        <span className="font-normal">in</span>
                                        <span className="truncate max-w-[100px]">
                                            {truncateWithEllipsis(topicTitle, 15)}
                                        </span>
                                    </p>
                                </div>
                            </SwiperSlide>
                        );
                    })
                )}
            </Swiper>
        </div>
    );
};

export default AiSessionLearningPathways;
