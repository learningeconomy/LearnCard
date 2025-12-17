import React from 'react';

import AiSessionLoader from '../new-ai-session/AiSessionLoader';
import AiAssessmentContainer from './AiAssessment/AiAssessmentContainer';
import FinishedAiSessionAssessmentPreview from './FinishedAiSessionAssessmentPreview';

import { VC } from '@learncard/types';
import { LCR } from 'learn-card-base/types/credential-records';
import { AiSession, LaunchPadAppListItem, useGetSummaryInfo } from 'learn-card-base';

export const AiSessionAssessmentPreviewContainer: React.FC<{
    app?: LaunchPadAppListItem;
    topicRecord?: LCR;
    topicVc?: VC;
    session?: AiSession;
    summaryUri?: string;
}> = ({
    app,
    topicRecord: passedTopicRecord,
    topicVc: passedTopicVc,
    session: _session,
    summaryUri,
}) => {
    const {
        data: {
            summaryVc,
            summaryRecord,
            summaryBoost,
            topicVc: hookTopicVc,
            topicRecord: hookTopicRecord,
            assessmentVc,
        } = {},
        isLoading,
    } = useGetSummaryInfo(summaryUri ?? _session?.record?.uri);

    const session =
        (summaryBoost &&
            ({ boost: summaryBoost, vc: summaryVc, record: summaryRecord } as AiSession)) ||
        _session;

    if (isLoading) {
        return (
            <div className="h-[100vh] w-full flex items-center justify-center bg-grayscale-200">
                <AiSessionLoader overrideText="Loading Session Summary..." />
            </div>
        );
    }

    // TODO: Check if the session has been completed by checking for session children
    if (session?.vc?.completed || assessmentVc) {
        return (
            <FinishedAiSessionAssessmentPreview
                topicRecord={hookTopicRecord || passedTopicRecord}
                topicVc={hookTopicVc || passedTopicVc}
                session={session}
                isCompleted
            />
        );
    }

    return (
        <AiAssessmentContainer
            app={app}
            topicRecord={hookTopicRecord || passedTopicRecord}
            topicVc={hookTopicVc || passedTopicVc}
            session={session}
        />
    );
};

export default AiSessionAssessmentPreviewContainer;
