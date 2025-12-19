import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';

import AiSessionLearningPathwayPreviewFooter from './AiSessionLearningPathwayPreviewFooter';
import AiSessionLearningPathwayPreviewHeader from './AiSessionLearningPathwayPreviewHeader';
import AiSessionLoader from '../AiSessionLoader';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import LockSimple from 'learn-card-base/svgs/LockSimple';

import {
    AiPassportAppsEnum,
    getAiAppBackgroundStylesForApp,
    getAiPassportAppByContractUri,
} from '../../ai-passport-apps/aiPassport-apps.helpers';
import { LaunchPadAppListItem, useGetCurrentLCNUser, useModal } from 'learn-card-base';
import { VC } from '@learncard/types';
import { LCR } from 'learn-card-base/types/credential-records';
import { LearningPathway } from '../../ai-sessions/AiSessionTopics/aiSession-topics.helpers';
import { Boost } from '@learncard/types';
import { sessionLoadingText } from '../newAiSession.helpers';

export const AiSessionLearningPathwayPreview: React.FC<{
    topicRecord?: LCR;
    topicBoost?: Boost;
    topicVc?: VC;
    learningPathway: LearningPathway;
    pathwayBoost?: Boost;
}> = ({ topicRecord, topicBoost, topicVc, learningPathway, pathwayBoost }) => {
    const { closeAllModals } = useModal();
    const { currentLCNUser } = useGetCurrentLCNUser();
    const history = useHistory();

    const [showLoader, setShowLoader] = useState<boolean>(false);

    const app = getAiPassportAppByContractUri(topicRecord?.contractUri || '');
    const appStyles = getAiAppBackgroundStylesForApp(app as LaunchPadAppListItem);

    const handleStartAiSession = async () => {
        setShowLoader(true);
        closeAllModals();

        if (app?.type === AiPassportAppsEnum.learncardapp) {
            history.push(
                `/chats?topicUri=${encodeURIComponent(
                    topicBoost?.uri || ''
                )}&did=${encodeURIComponent(currentLCNUser?.did || '')}${
                    pathwayBoost ? `&pathwayUri=${encodeURIComponent(pathwayBoost?.uri || '')}` : ''
                }`
            );
            return;
        }

        const url = app?.url;

        // window.location.href = `http://localhost:4321/chats?topicUri=${topicBoost?.uri}&did=${currentLCNUser?.did}`;
        window.location.href = `${url}/chats?topicUri=${encodeURIComponent(
            topicBoost?.uri || ''
        )}&did=${encodeURIComponent(currentLCNUser?.did || '')}${
            pathwayBoost ? `&pathwayUri=${encodeURIComponent(pathwayBoost?.uri || '')}` : ''
        }`;
    };

    return (
        <div
            className="h-full w-full flex flex-col items-start justify-center safe-area-top-margin"
            style={{ ...appStyles }}
        >
            {showLoader && (
                <AiSessionLoader topicRecord={topicRecord} overrideText={sessionLoadingText} />
            )}
            <div className="h-full w-full ion-padding max-w-[600px] overflow-y-scroll pb-[200px]">
                <AiSessionLearningPathwayPreviewHeader
                    topicRecord={topicRecord}
                    topicVc={topicVc}
                    learningPathway={learningPathway}
                />

                <div className="rounded-[20px] bg-white mt-4 w-full ion-padding">
                    <h3 className="text-xl text-gray-900 font-notoSans">What You’ll Learn</h3>
                    <div className="flex items-start justify-start mt-2">
                        <Checkmark className="w-[24px] h-auto mr-2 shrink-0 text-emerald-500" />
                        <p className="text-grayscale-700 text-sm font-notoSans font-normal p-0 m0">
                            {learningPathway?.description}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col justify-center items-start rounded-[20px] bg-white mt-4 w-full ion-padding">
                    <h3 className="text-xl text-gray-900 font-notoSans mb-4">
                        Skills You Can Earn
                    </h3>

                    {learningPathway?.skills?.map((skill, index) => (
                        <div key={index} className="w-full mb-4">
                            <button
                                key={skill.title}
                                className="flex items-center justify-start bg-indigo-100 text-indigo-500 rounded-full text-xs py-1 px-2"
                            >
                                <LockSimple version="2" />
                                &nbsp;
                                <span className="font-semibold">{skill.title}</span>
                            </button>
                            <p className="text-grayscale-700 text-sm font-notoSans text-left pl-1 mt-1">
                                {skill?.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <AiSessionLearningPathwayPreviewFooter handleStartAiSession={handleStartAiSession} />
        </div>
    );
};

export default AiSessionLearningPathwayPreview;
