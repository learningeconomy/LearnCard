import React, { useEffect } from 'react';

import { IonSpinner } from '@ionic/react';
import SlimCaretRight from '../../svgs/SlimCaretRight';
import VerifiedBadge from 'learn-card-base/svgs/VerifiedBadge';
import AiSessionAssessmentPreviewContainer from '../../ai-assessment/AiSessionAssessmentPreviewContainer';

import { VC } from '@learncard/types';
import { getAiSessionTitle } from '../aiSessions.helpers';
import {
    ModalTypes,
    useDeviceTypeByWidth,
    useGetSummaryInfo,
    useModal,
    LaunchPadAppListItem,
} from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';
import { AiSession } from 'learn-card-base';
import { AiAssessmentQuestion } from '../../ai-assessment/AiAssessment/ai-assessment.helpers';

export const AiSessionItem: React.FC<{
    app: LaunchPadAppListItem;
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
    };
    index: number;
}> = ({ app, session, topicRecord, topicVc, handleTopicSession, selectedSession, index }) => {
    const { newModal } = useModal();

    const { data: { assessmentVc } = {}, isLoading } = useGetSummaryInfo(session?.record?.uri);

    const { isDesktop } = useDeviceTypeByWidth();

    useEffect(() => {
        if (index === 0) {
            handleTopicSession({
                topic: topicVc,
                topicBoost: topicRecord?.boostCredential,
                session,
            });
        }
    }, []);

    const handleViewSession = () => {
        if (isDesktop) {
            handleTopicSession({
                topic: topicVc,
                topicBoost: topicRecord?.boostCredential,
                session,
            });
            return;
        } else {
            newModal(
                <AiSessionAssessmentPreviewContainer
                    app={app}
                    topicRecord={topicRecord}
                    topicVc={topicVc}
                    session={session}
                />,
                {},
                { desktop: ModalTypes.Right, mobile: ModalTypes.Right }
            );
        }
    };

    const isSelectedSession =
        selectedSession && selectedSession?.session?.vc?.id === session?.vc?.id;
    const selectedStyles =
        isSelectedSession && isDesktop
            ? 'bg-cyan-50 rounded-[16px] px-2'
            : 'bg-white last:pb-[200px] first:mt-1';
    const styles = isDesktop ? 'first:mt-4 px-2' : '';

    return (
        <button
            disabled={isLoading}
            onClick={handleViewSession}
            className={`flex items-center justify-between w-full pb-[12px] pt-[12px] cursor-pointer ${styles} ${selectedStyles}`}
        >
            <div className="flex items-center justify-start w-full">
                <p className="w-full text-grayscale-900 text-[17px] font-notoSans font-semibold capitalize ml-2 text-left line-clamp-2">
                    {getAiSessionTitle(session.vc ?? session.boost.boost)}
                </p>
            </div>

            {isLoading && (
                <span className="flex items-center justify-end text-grayscale-600 font-poppins text-sm">
                    <IonSpinner name="crescent" color="dark" className="scale-[1] mr-1" />
                </span>
            )}

            {!isLoading && (
                <span className="flex items-center justify-end text-grayscale-600 font-poppins text-sm">
                    {session?.vc?.completed || assessmentVc ? (
                        <VerifiedBadge size="20" />
                    ) : (
                        <div className="w-[10px] h-[10px] bg-rose-500  font-bold rounded-full z-50" />
                    )}
                    <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
                </span>
            )}
        </button>
    );
};

export default AiSessionItem;
