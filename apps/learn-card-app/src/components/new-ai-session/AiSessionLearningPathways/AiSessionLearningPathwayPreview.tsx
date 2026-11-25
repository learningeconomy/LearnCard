import React, { useState } from 'react';

import AiSessionLearningPathwayPreviewFooter from './AiSessionLearningPathwayPreviewFooter';
import AiSessionLearningPathwayPreviewHeader from './AiSessionLearningPathwayPreviewHeader';
import AiSessionLoader from '../AiSessionLoader';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import LockSimple from 'learn-card-base/svgs/LockSimple';

import {
    AiPassportAppContractUri,
    AiPassportAppsEnum,
    getAiAppBackgroundStylesForApp,
    getAiPassportAppByContractUri,
} from '../../ai-passport-apps/aiPassport-apps.helpers';
import { LaunchPadAppListItem, useModal } from 'learn-card-base';
import { LearnCardAiChatBot } from '../LearnCardAiChatBot/LearnCardAiChatBot';
import { VC } from '@learncard/types';
import { LCR } from 'learn-card-base/types/credential-records';
import { LearningPathway } from '../../ai-sessions/AiSessionTopics/aiSession-topics.helpers';
import { Boost } from '@learncard/types';
import { getSessionLoadingText } from '../newAiSession.helpers';

export const AiSessionLearningPathwayPreview: React.FC<{
    topicRecord?: LCR;
    topicBoost?: Boost;
    topicVc?: VC;
    learningPathway: LearningPathway;
    pathwayBoost?: Boost;
}> = ({ topicRecord, topicBoost, topicVc, learningPathway, pathwayBoost }) => {
    const { closeAllModals } = useModal();

    const [showLoader, setShowLoader] = useState<boolean>(false);
    const [showInModalChat, setShowInModalChat] = useState<boolean>(false);

    const app = getAiPassportAppByContractUri(topicRecord?.contractUri || '');
    const appStyles = getAiAppBackgroundStylesForApp(app as LaunchPadAppListItem);

    // LearnCard AI resumes in the modal. Any other app needs a URL to send the
    // user to. Retired apps (ChatGPT, Claude) no longer resolve, so their
    // historical pathways stay readable but can't be started.
    const opensInModal = app?.type === AiPassportAppsEnum.learncardapp;
    const externalAppUrl = opensInModal ? undefined : app?.url;
    const canStartSession = opensInModal || Boolean(externalAppUrl);

    const handleStartAiSession = async () => {
        // For LearnCard's internal chat keep the user inside the existing right
        // modal — same pattern as the New Topic flow's startInternalAiChatBot
        // and the topic-detail "New Session" gate. Avoids history-pushing to
        // /chats which on desktop replaces the topic-detail page with a full
        // width chat.
        if (opensInModal) {
            setShowInModalChat(true);
            return;
        }

        if (!externalAppUrl) return;

        setShowLoader(true);
        closeAllModals();
        window.location.href = `${externalAppUrl}/chats?topicUri=${encodeURIComponent(
            topicBoost?.uri || ''
        )}${pathwayBoost ? `&pathwayUri=${encodeURIComponent(pathwayBoost?.uri || '')}` : ''}`;
    };

    if (showInModalChat) {
        return (
            <LearnCardAiChatBot
                initialMessages={[]}
                initialTopicUri={topicBoost?.uri}
                initialPathwayUri={pathwayBoost?.uri}
                contractUri={AiPassportAppContractUri.learncardapp}
                handleStartOver={closeAllModals}
            />
        );
    }

    return (
        <div
            className="h-full w-full flex flex-col items-start justify-center mt-[var(--ion-safe-area-top,0px)]"
            style={{ ...appStyles }}
        >
            {showLoader && (
                <AiSessionLoader topicRecord={topicRecord} overrideText={getSessionLoadingText()} />
            )}
            <div className="h-full w-full ion-padding max-w-[600px] overflow-y-scroll pb-[200px]">
                <AiSessionLearningPathwayPreviewHeader
                    topicRecord={topicRecord}
                    topicVc={topicVc}
                    learningPathway={learningPathway}
                />

                {!canStartSession && (
                    <div role="status" className="rounded-[20px] bg-white mt-4 w-full ion-padding">
                        <h3 className="text-xl text-gray-900 font-notoSans">Session unavailable</h3>
                        <p className="text-grayscale-700 text-sm font-notoSans mt-2">
                            The AI tutor for this pathway has been retired, so it can’t start or
                            resume a session. Your topic, pathway, and session history are still
                            here to review.
                        </p>
                    </div>
                )}

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

            <AiSessionLearningPathwayPreviewFooter
                handleStartAiSession={canStartSession ? handleStartAiSession : undefined}
                startDisabled={!canStartSession}
            />
        </div>
    );
};

export default AiSessionLearningPathwayPreview;
