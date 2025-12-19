import React, { useState } from 'react';

import FinishedAiSessionAssessmentPreviewLearningPathwayItem from './AiAssessment/helpers/FinishedAiAssessmentLearningPathwayItem';
import FinishedAiSessionAssessmentPreviewDetails from './FinishedAiSessionAssessmentPreviewDetails';
import AiSessionAssessmentPreviewFooter from './AiSessionAssessmentPreviewFooter';
import AiAssessmentPreviewHeader from './AiSessionAssessmentPreviewHeader';
import ShareBoostLink from '../boost/boost-options-menu/ShareBoostLink';
import AiSessionLoader from '../new-ai-session/AiSessionLoader';
import Plus from 'learn-card-base/svgs/Plus';
import CirclePlus from '../svgs/CirclePlus';

import {
    getAiAppBackgroundStylesForApp,
    getAiPassportAppByContractUri,
} from '../ai-passport-apps/aiPassport-apps.helpers';
import { getLearningPathways } from '../new-ai-session/AiSessionLearningPathways/ai-learningPathways.helpers';
import {
    CredentialCategoryEnum,
    LaunchPadAppListItem,
    ModalTypes,
    useModal,
    useDeviceTypeByWidth,
} from 'learn-card-base';
import { VC } from '@learncard/types';
import useBoostMenu from '../boost/hooks/useBoostMenu';

import { DUMMY_REFLECTIONS } from './ai-assessment-preview.helpers';
import { BoostMenuType } from '../boost/hooks/useBoostMenu';
import { LCR } from 'learn-card-base/types/credential-records';
import { AiSession } from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

type Skill = {
    title: string;
    description: string;
};

export const FinishedAiSessionAssessmentPreview: React.FC<{
    topicRecord?: LCR;
    topicVc?: VC;
    session: AiSession;
    isCompleted?: boolean;
}> = ({ topicRecord, topicVc, session, isCompleted }) => {
    const { isDesktop } = useDeviceTypeByWidth();
    const { newModal, closeModal, closeAllModals } = useModal({
        desktop: ModalTypes.Center,
        mobile: ModalTypes.Center,
    });

    const handlePresentBoostMenuModal = useBoostMenu({
        categoryType: CredentialCategoryEnum.achievement,
        menuType: BoostMenuType.earned,
        credential: session.vc,
    });

    const [isFront, setIsFront] = useState<boolean>(true);
    const [showLoader, setShowLoader] = useState<boolean>(false);

    const app = getAiPassportAppByContractUri(topicRecord?.contractUri || '');
    const appStyles = getAiAppBackgroundStylesForApp(app as LaunchPadAppListItem);

    const summaryInfo = unwrapBoostCredential(session?.vc ?? session.boost.boost)?.summaryInfo;
    const skills = summaryInfo?.skills;
    const skillsCount = skills?.length || 0;

    const learningPathways = getLearningPathways([session?.vc]);
    const reflections: { title: string; description: string }[] =
        summaryInfo?.reflections ?? DUMMY_REFLECTIONS;

    const handleShare = () => {
        newModal(
            <ShareBoostLink
                handleClose={closeModal}
                boost={session?.vc}
                boostUri={session?.boost.uri}
                categoryType={CredentialCategoryEnum.achievement}
            />,
            {},
            { mobile: ModalTypes.FullScreen, desktop: ModalTypes.FullScreen }
        );
    };

    const handleOptions = () => {
        handlePresentBoostMenuModal();
    };

    if (!isFront) {
        return (
            <FinishedAiSessionAssessmentPreviewDetails
                topicRecord={topicRecord}
                topicVc={topicVc}
                session={session}
                isCompleted={isCompleted}
                isFront={isFront}
                setIsFront={setIsFront}
            />
        );
    }

    return (
        <div
            className="h-full w-full flex flex-col items-center justify-center safe-area-top-margin"
            style={{ ...appStyles }}
        >
            {showLoader && (
                <AiSessionLoader
                    topicRecord={session?.record || topicRecord}
                    overrideText="Building your assessment"
                />
            )}
            <div
                className={`h-full w-full ion-padding max-w-[600px] overflow-y-scroll pb-[200px] scrollbar-hide ${
                    isDesktop ? 'pt-[100px]' : ''
                }`}
            >
                <AiAssessmentPreviewHeader
                    topicRecord={topicRecord}
                    session={session}
                    isCompleted
                    handleShare={handleShare}
                />

                <div className="flex flex-col justify-center items-start rounded-[20px] bg-white mt-4 w-full ion-padding">
                    <div className="flex items-center justify-between w-full mb-4">
                        <h3 className="text-xl text-gray-900 font-notoSans">Skills Earned</h3>
                        <div className="flex items-center justify-start bg-indigo-100 text-indigo-500 rounded-full text-xs py-1 px-2 w-[45px] h-[45px] relative">
                            <CirclePlus className="min-w-[38px] h-auto absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2" />
                            <span className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[20px] h-[20px] rounded-full text-center text-base font-semibold">
                                {skillsCount}
                            </span>
                        </div>
                    </div>

                    {skills?.map((skill: Skill, index: number) => (
                        <div key={index} className="w-full mb-4">
                            <button
                                key={skill.title}
                                className="flex items-center justify-start bg-indigo-100 text-indigo-500 rounded-full text-xs py-1 px-2"
                            >
                                <Plus className="w-[16px] h-auto" />
                                &nbsp;
                                <span className="font-semibold">{skill.title}</span>
                            </button>
                            <p className="text-grayscale-700 text-sm font-notoSans text-left pl-1 mt-2">
                                {skill?.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="rounded-[20px] bg-white mt-4 w-full ion-padding">
                    <h3 className="text-xl text-gray-900 font-notoSans">Session Reflection</h3>
                    <div className="flex flex-col items-start justify-start">
                        {reflections?.map((reflection, index) => (
                            <div
                                key={index}
                                className="flex flex-col items-start justify-start mt-4 last:mb-4"
                            >
                                <p className="text-grayscale-700 text-sm font-notoSans font-semibold p-0 mt-0">
                                    {reflection.title}
                                </p>
                                <p className="text-grayscale-700 text-sm font-notoSans font-normal p-0 mt-0">
                                    {reflection.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-[20px] bg-white mt-4 w-full ion-padding">
                    <h3 className="text-xl text-gray-900 font-notoSans">Next Steps</h3>

                    {learningPathways?.map((pathway, index) => (
                        <FinishedAiSessionAssessmentPreviewLearningPathwayItem
                            pathway={pathway}
                            index={index}
                            sessionUri={session?.boost?.uri}
                            key={index}
                        />
                    ))}
                </div>
            </div>

            <AiSessionAssessmentPreviewFooter
                isCompleted
                isFront={isFront}
                setIsFront={setIsFront}
                handleOptions={handleOptions}
                handleShare={handleShare}
            />
        </div>
    );
};

export default FinishedAiSessionAssessmentPreview;
