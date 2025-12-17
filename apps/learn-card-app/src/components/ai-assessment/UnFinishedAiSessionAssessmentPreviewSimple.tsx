import React, { useEffect, useState } from 'react';

import AiAssessmentPreviewHeader from './AiSessionAssessmentPreviewHeader';
import AiSessionLoader from '../new-ai-session/AiSessionLoader';
import Checkmark from 'learn-card-base/svgs/Checkmark';
import LockSimple from 'learn-card-base/svgs/LockSimple';

import {
    getAiAppBackgroundStylesForApp,
    getAiPassportAppByContractUri,
} from '../ai-passport-apps/aiPassport-apps.helpers';
import { LaunchPadAppListItem, useModal, useDeviceTypeByWidth } from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';
import { VC } from '@learncard/types';
import { AiSession } from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { AiAssessmentQuestion } from './AiAssessment/ai-assessment.helpers';

interface UnfinishedAiSessionAssessmentPreviewSimpleProps {
    topicRecord?: LCR;
    topicVc?: VC;
    session: AiSession;

    preLoadAssessment?: () => void;
}

export const UnfinishedAiSessionAssessmentPreviewSimple: React.FC<
    UnfinishedAiSessionAssessmentPreviewSimpleProps
> = ({ topicRecord, topicVc, session, preLoadAssessment }) => {
    const { newModal } = useModal();
    const [showLoader, setShowLoader] = useState<boolean>(false);

    const app = getAiPassportAppByContractUri(
        session?.record?.contractUri || topicRecord?.contractUri || ''
    );
    const appStyles = getAiAppBackgroundStylesForApp(app as LaunchPadAppListItem);

    const summaryInfo = unwrapBoostCredential(session?.vc ?? session.boost.boost)?.summaryInfo;
    const skills = summaryInfo?.skills;
    const thingsLearned = summaryInfo?.learned;

    const { isDesktop } = useDeviceTypeByWidth();

    useEffect(() => {
        preLoadAssessment?.();
    }, []);

    return (
        <div className="w-full flex flex-col items-center justify-center safe-area-top-margin">
            {showLoader && (
                <AiSessionLoader
                    topicRecord={session?.record || topicRecord}
                    overrideText="Building your assessment..."
                />
            )}
            <div
                className={`h-full w-full max-w-[600px] pb-[50px] scrollbar-hide ${
                    isDesktop ? 'pt-[100px]' : ''
                }`}
            >
                <AiAssessmentPreviewHeader
                    topicRecord={topicRecord}
                    session={session}
                    hideApp
                    hideUser
                />

                <div className="rounded-[20px] bg-white mt-4 w-full ion-padding">
                    <h3 className="text-xl text-gray-900 font-notoSans">What You’ve Learned</h3>
                    <div className="flex flex-col items-start justify-start mt-2">
                        {thingsLearned?.map((thing, index) => (
                            <div key={index} className="flex items-start justify-start mt-2">
                                <Checkmark className="w-[24px] h-auto mr-2 shrink-0 text-emerald-500" />
                                <p className="text-grayscale-700 text-sm font-notoSans font-normal p-0 m0">
                                    {thing}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col justify-center items-start rounded-[20px] bg-white mt-4 w-full ion-padding">
                    <h3 className="text-xl text-gray-900 font-notoSans mb-4">
                        Skills You Can Earn
                    </h3>

                    {skills?.map((skill, index) => (
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

                <div className="w-full flex items-center justify-center mt-4">
                    <div className="w-full h-[1px] bg-grayscale-200" />
                </div>
            </div>
        </div>
    );
};

export default UnfinishedAiSessionAssessmentPreviewSimple;
