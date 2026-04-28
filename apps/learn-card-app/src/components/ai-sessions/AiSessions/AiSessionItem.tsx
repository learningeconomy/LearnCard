import React from 'react';

import { IonSpinner } from '@ionic/react';
import VerifiedBadge from 'learn-card-base/svgs/VerifiedBadge';
import AiSessionAssessmentPreviewContainer from '../../ai-assessment/AiSessionAssessmentPreviewContainer';
import { ellipsisVertical } from 'ionicons/icons';
import { IonIcon } from '@ionic/react';

import { VC } from '@learncard/types';
import { getAiSessionTitle } from '../aiSessions.helpers';
import { ModalTypes, useGetSummaryInfo, useModal, LaunchPadAppListItem } from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';
import { AiSession } from 'learn-card-base';
import { AiAssessmentQuestion } from '../../ai-assessment/AiAssessment/ai-assessment.helpers';
import { aiPassportApps } from '../../ai-passport-apps/aiPassport-apps.helpers';

export const AiSessionItem: React.FC<{
    app?: LaunchPadAppListItem;
    session: AiSession;
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
    index: number;
    forceSingleView?: boolean;
}> = ({
    app,
    session,
    topicRecord,
    topicVc,
    handleTopicSession,
    selectedSession,
    forceSingleView,
}) => {
    const { newModal } = useModal();
    const { data: { assessmentVc } = {}, isLoading } = useGetSummaryInfo(session?.record?.uri);

    const handleViewSession = () => {
        if (forceSingleView || !app) {
            newModal(
                <AiSessionAssessmentPreviewContainer
                    app={app as any}
                    topicRecord={topicRecord}
                    topicVc={topicVc}
                    session={session}
                />,
                {},
                { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
            );
            return;
        }

        handleTopicSession({
            topic: topicVc,
            topicBoost: topicRecord?.boostCredential,
            session,
        });
    };

    const isSelectedSession =
        selectedSession && selectedSession?.session?.vc?.id === session?.vc?.id;

    const sessionCredential = session?.vc ?? session?.boost?.boost;
    const isCompleted = Boolean(session?.vc?.completed || assessmentVc);
    const subtitleTopic = topicVc?.boostCredential?.topicInfo?.title || 'Session';
    const sessionApp = aiPassportApps?.find(
        appItem => appItem?.contractUri === session?.record?.contractUri
    );
    const subtitleTutor = sessionApp?.name || session?.record?.app || 'AI Tutor';
    const sessionImage = sessionApp?.img || session?.vc?.image || topicVc?.image;
    const dateLabel = isCompleted
        ? new Date(session?.vc?.issuanceDate ?? Date.now()).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
          })
        : 'Unfinished';

    return (
        <button
            disabled={isLoading}
            onClick={handleViewSession}
            className={`flex items-center justify-between w-full bg-white rounded-2xl shadow-sm px-4 py-3 mb-3 ${
                isSelectedSession ? 'ring-2 ring-cyan-200' : ''
            }`}
        >
            <div className="flex items-center justify-start w-full min-w-0">
                <div className="h-[34px] w-[34px] shrink-0">
                    {sessionImage ? (
                        <img
                            className="w-full h-full object-cover bg-white rounded-[10px] overflow-hidden border border-grayscale-200"
                            alt="AI tool logo"
                            src={sessionImage}
                        />
                    ) : (
                        <div className="h-[34px] w-[34px] rounded-[10px] border border-grayscale-200 bg-grayscale-100" />
                    )}
                </div>
                <div className="flex flex-col items-start w-full min-w-0">
                    <p className="w-full text-grayscale-900 text-[17px] leading-tight font-poppins font-semibold text-left line-clamp-1 ml-3">
                        {getAiSessionTitle(sessionCredential as any) || 'Untitled Session'}
                    </p>
                    <p className="text-grayscale-600 text-sm font-poppins text-left line-clamp-1 ml-3">
                        <span className="font-semibold text-grayscale-700">{subtitleTopic}</span>
                        <span> • {subtitleTutor}</span>
                        <span className="text-grayscale-500"> • </span>
                        <span className={isCompleted ? 'text-grayscale-600' : 'text-rose-500'}>
                            {dateLabel}
                        </span>
                    </p>
                </div>
            </div>

            <span className="flex items-center justify-end text-grayscale-600 font-poppins text-sm ml-2 shrink-0 gap-3">
                {isLoading ? (
                    <IonSpinner name="crescent" color="dark" className="scale-[0.9] mr-1" />
                ) : isCompleted ? (
                    <VerifiedBadge size="20" />
                ) : (
                    <div className="w-[9px] h-[9px] bg-rose-500 rounded-full" />
                )}
                {/* <IonIcon icon={ellipsisVertical} className="text-grayscale-400 text-[18px]" /> */}
            </span>
        </button>
    );
};

export default AiSessionItem;
