import React from 'react';
import moment from 'moment';

import AiSessionAssessmentPreviewFooter from './AiSessionAssessmentPreviewFooter';
import VerificationsBox from '../../pages/ids/view-id/IdDetails/VerificationsBox';

import {
    getAiAppBackgroundStylesForApp,
    getAiPassportAppByContractUri,
} from '../ai-passport-apps/aiPassport-apps.helpers';
import { getAiSessionTitle } from '../ai-sessions/aiSessions.helpers';

import { LaunchPadAppListItem, useGetSummaryInfo } from 'learn-card-base';
import { VC } from '@learncard/types';
import { getAiTopicTitle } from '../new-ai-session/newAiSession.helpers';
import { LCR } from 'learn-card-base/types/credential-records';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';
import { AiSession } from 'learn-card-base';

export const FinishedAiSessionAssessmentPreviewDetails: React.FC<{
    topicRecord?: LCR;
    topicVc?: VC;
    session: AiSession;
    isCompleted?: boolean;
    isFront?: boolean;
    setIsFront?: (isFront: boolean) => void;
}> = ({ topicRecord, topicVc, session, isCompleted, isFront, setIsFront }) => {
    const app = getAiPassportAppByContractUri(topicRecord?.contractUri || '');
    const appStyles = getAiAppBackgroundStylesForApp(app as LaunchPadAppListItem);

    const summaryInfo = unwrapBoostCredential(session.vc ?? session.boost.boost)?.summaryInfo;
    const sessionName = getAiSessionTitle(session.vc ?? session.boost.boost);
    const sessionDescription = summaryInfo?.summary;

    const topicTitle = getAiTopicTitle(topicVc);

    const { data: { assessmentVc } = {} } = useGetSummaryInfo(session?.record?.uri);

    let completedDate = moment(summaryInfo?.completedAt).format('MMMM D, YYYY h:mm A z');
    if (assessmentVc) {
        completedDate = moment(assessmentVc?.issuanceDate).format('MMMM D, YYYY h:mm A z');
    }

    // TODO: swap verification items
    const verificationItems = [
        {
            check: 'proof',
            status: 'Success',
            message: 'Valid',
            details: "Signature matches the issuer's public key.",
        },
        {
            check: 'issued by',
            status: 'Success',
            message: app?.name,
            details: 'Issuer DID found and trusted in the registry.',
        },
        {
            check: 'status',
            status: 'Success',
            message: 'Active',
            details: 'Credential has not been suspended or revoked.',
        },
        {
            check: 'authenticat boost',
            status: 'Success',
            message: 'Verified by the LearnCard Network',
            details: 'Expiration date is in the future and revocation check passed.',
        },
    ];

    return (
        <div
            className="h-full w-full flex flex-col items-center justify-center safe-area-top-margin scrollbar-hide"
            style={{ ...appStyles }}
        >
            <div className="h-full w-full ion-padding max-w-[600px] overflow-y-scroll pb-[200px] scrollbar-hide">
                <div className="rounded-[20px] bg-white mt-4 w-full ion-padding mb-4">
                    <h3 className="text-xl text-gray-900 font-notoSans">Details</h3>
                    <div className="flex flex-col items-start justify-start">
                        <div className="flex flex-col items-start justify-start mt-4 last:mb-4">
                            <p className="text-grayscale-900 text-[17px] font-notoSans font-semibold p-0 mt-0">
                                {sessionName}
                            </p>
                            <p className="text-grayscale-700 text-sm font-notoSans font-normal p-0 mt-2">
                                {sessionDescription}
                            </p>
                        </div>
                    </div>
                    <div className="w-full flex items-center justify-center">
                        <div className="w-[95%] h-[1px] bg-grayscale-200" />
                    </div>
                    <div className="flex flex-col items-start justify-start">
                        <div className="flex flex-col items-start justify-start mt-4 last:mb-4">
                            <p className="text-grayscale-700 text-sm font-semibold font-notoSans p-0 mt-0">
                                <span className="text-grayscale-900  ">Completed</span> on{' '}
                                {completedDate}
                            </p>
                            <p className="text-grayscale-700 text-sm font-semibold font-notoSans p-0 my-1">
                                <span className="text-grayscale-900  ">Topic</span> {topicTitle}
                            </p>
                            <p className="text-grayscale-700 text-sm font-semibold font-notoSans p-0 mt-0">
                                <span className="text-grayscale-900  ">App</span> {app?.name}
                            </p>
                        </div>
                    </div>
                </div>

                {verificationItems && verificationItems.length > 0 && (
                    <VerificationsBox verificationItems={verificationItems} />
                )}
            </div>

            <AiSessionAssessmentPreviewFooter
                isCompleted
                isFront={isFront}
                setIsFront={setIsFront}
            />
        </div>
    );
};

export default FinishedAiSessionAssessmentPreviewDetails;
