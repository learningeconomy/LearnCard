import React from 'react';

import AiSessionLearningPathwayPreview from '../../../new-ai-session/AiSessionLearningPathways/AiSessionLearningPathwayPreview';
import SlimCaretRight from '../../../../components/svgs/SlimCaretRight';
import LockSimple from 'learn-card-base/svgs/LockSimple';

import { useModal, useGetEnrichedSession, ModalTypes } from 'learn-card-base';

import { LearningPathway } from '../../../ai-sessions/AiSessionTopics/aiSession-topics.helpers';
import { Boost } from '@learncard/types';

type Skill = {
    title: string;
    description: string;
};

export const FinishedAiSessionAssessmentPreviewLearningPathwayItem: React.FC<{
    sessionUri: string;
    pathway: LearningPathway;
    index: number;
}> = ({ sessionUri, pathway, index }) => {
    const { newModal } = useModal();

    const { data, isLoading } = useGetEnrichedSession(sessionUri || '');

    const topicRecord = data?.topicRecord;
    const topicVc = data?.topicVc;
    const topicBoost = data?.topicBoost;

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
            <div className="flex flex-col justify-between bg-white h-full w-full ion-padding border border-gray-200 rounded-2xl cursor-pointer mb-4 mt-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-3/5 mb-4" />

                <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>

                <div className="flex space-x-2 overflow-x-auto">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-6 bg-gray-200 rounded-full w-16 flex-shrink-0" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div
            role="button"
            onClick={() =>
                handleLearningPathwayPreview({
                    boost: topicBoost,
                    learningPathway: pathway,
                })
            }
            key={index}
            className="flex flex-col items-start justify-between bg-white h-full w-full ion-padding border-solid border-[1px] border-grayscale-100 rounded-[20px] cursor-pointer mb-4 mt-4"
        >
            <div>
                <div className="flex items-center justify-between w-full">
                    <h4 className="pr-1 text-grayscale-800 font-semibold text-[17px] text-left line-clamp-1">
                        {pathway?.title}
                    </h4>

                    <div>
                        <SlimCaretRight className="text-grayscale-800 w-[24px] h-auto" />
                    </div>
                </div>
                <p className="text-grayscale-900 line-clamp-3 text-sm my-4 text-left">
                    {pathway?.description}
                </p>
            </div>
            <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
                {pathway?.skills?.map((skill: Skill, index: number) => (
                    <span
                        key={index}
                        className="font-semibold bg-indigo-100 text-indigo-500 rounded-full text-xs px-2 py-1 min-h-[24px] mr-2 inline-block align-top"
                    >
                        <LockSimple version="2" className="h-[16px] w-[16px] inline mr-1" />

                        {skill?.title}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default FinishedAiSessionAssessmentPreviewLearningPathwayItem;
