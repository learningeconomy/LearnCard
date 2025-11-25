import React from 'react';

import IDSleeve from 'learn-card-base/svgs/IDSleeve';

import { getAiPassportAppByContractUri } from '../../ai-passport-apps/aiPassport-apps.helpers';
import { VC } from '@learncard/types';
import { getAiTopicTitle } from '../newAiSession.helpers';
import { LCR } from 'learn-card-base/types/credential-records';
import { LearningPathway } from '../../ai-sessions/AiSessionTopics/aiSession-topics.helpers';

export const AiSessionLearningPathwayPreviewHeader: React.FC<{
    topicRecord?: LCR;
    topicVc?: VC;
    learningPathway: LearningPathway;
}> = ({ topicRecord, topicVc, learningPathway }) => {
    const app = getAiPassportAppByContractUri(topicRecord?.contractUri || '');
    const topicTitle = learningPathway?.title ?? getAiTopicTitle(topicVc) ?? '';

    return (
        <div className="w-full rounded-t-[24px] rounded-b-[24px] overflow-hidden flex flex-col border-solid border-white border-[3px]">
            <div className="w-full flex items-center justify-center flex-col bg-opacity-70 rounded-t-[20px] backdrop-blur-[5px] bg-white">
                <div className="w-full relative flex items-center justify-center flex-col pt-[25px] bg-white">
                    <div className="w-full flex flex-col items-center justify-center mb-[25px]">
                        <h6 className="text-sm font-medium text-grayscale-700 font-notoSans">
                            Lesson Overview
                        </h6>
                        <h4 className="font-semibold text-indigo-500 text-[27px] my-1">
                            Ai Session
                        </h4>
                        <h5 className="text-sm font-medium text-grayscale-900 font-notoSans px-4 line-clamp-2">
                            {app?.name}
                        </h5>
                    </div>
                </div>

                <div className="w-full flex flex-col items-center justify-center relative pb-[10px]">
                    <div className="w-full flex items-center justify-center relative mb-[-3.4px]">
                        <IDSleeve className="h-auto w-full rotate-180" />
                    </div>

                    <div className="absolute bg-white min-w-[70px] min-h-[70px] max-w-[70px] max-h-[70px] rounded-full mb-6 shadow-soft-bottom top-[10px] overflow-hidden">
                        <img
                            className="w-full h-full object-cover"
                            alt={`${app?.name} logo`}
                            src={app?.img}
                        />
                    </div>

                    <p className="text-center font-semibold text-xl text-grayscale-900 mt-[50px] pb-[10px] px-6">
                        {topicTitle}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AiSessionLearningPathwayPreviewHeader;
