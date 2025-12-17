import React from 'react';
import moment from 'moment';

import IDSleeve from 'learn-card-base/svgs/IDSleeve';
import SolidCircleIcon from 'learn-card-base/svgs/SolidCircleIcon';
import BlueMagicWand from 'learn-card-base/svgs/BlueMagicWand';

import { ProfilePicture, useCurrentUser } from 'learn-card-base';

import { getAiPassportAppByContractUri } from '../ai-passport-apps/aiPassport-apps.helpers';
import { getAiSessionTitle } from '../ai-sessions/aiSessions.helpers';
import QRCodeScanner from 'learn-card-base/svgs/QRCodeScanner';
import { Checkmark } from '@learncard/react';

import BlueCheckMark from '../svgs/BlueCheckMark';
import { LCR } from 'learn-card-base/types/credential-records';
import { AiSession } from 'learn-card-base';
import { unwrapBoostCredential } from 'learn-card-base/helpers/credentialHelpers';

import { useTheme } from '../../theme/hooks/useTheme';

export const AiAssessmentPreviewHeader: React.FC<{
    topicRecord?: LCR;
    session: AiSession;
    isCompleted?: boolean;
    handleShare?: () => void;
    hideApp?: boolean;
    hideUser?: boolean;
}> = ({ topicRecord, session, isCompleted, handleShare, hideApp, hideUser }) => {
    const currentUser = useCurrentUser();
    const { colors } = useTheme();
    const primaryColor = colors?.defaults?.primaryColor;

    const app = getAiPassportAppByContractUri(
        session?.record?.contractUri || topicRecord?.contractUri || ''
    );

    const sessionName = getAiSessionTitle(session?.vc ?? session?.boost.boost);
    const startDate = moment(
        unwrapBoostCredential(session?.vc ?? session?.boost.boost)?.issuanceDate
    ).format('MMMM D, YYYY');

    const summaryInfo = unwrapBoostCredential(session?.vc ?? session?.boost.boost)?.summaryInfo;
    const thingsLearned = summaryInfo?.learned;

    return (
        <div className="w-full rounded-t-[24px] rounded-b-[24px] overflow-hidden flex flex-col border-solid border-white border-[3px] safe-area-top-margin">
            <div className="w-full flex items-center justify-center flex-col bg-opacity-70 rounded-t-[20px] backdrop-blur-[5px] bg-white">
                {!hideApp && (
                    <div className="w-full relative flex items-center justify-center flex-col pt-[25px] bg-white">
                        <div className="w-full flex flex-col items-center justify-center mb-[25px]">
                            <div className="flex flex-col items-center justify-center rounded-3xl mr-2 w-[50px] h-[50px] absolute top-[10px] left-[10px]">
                                <SolidCircleIcon className="absolute top-0 w-[45px] h-[45px]" />
                                <BlueMagicWand className="z-50 w-[45px] h-auto" />
                            </div>
                            <h4 className={`font-semibold text-${primaryColor} text-[27px] my-1`}>
                                Ai Session
                            </h4>
                            <div className="absolute bg-white min-w-[50px] min-h-[50px] max-w-[50px] max-h-[50px] rounded-full mb-6 shadow-soft-bottom top-[10px] right-[10px] overflow-hidden">
                                <img
                                    className="w-full h-full object-cover"
                                    alt={`${app?.name} logo`}
                                    src={app?.img}
                                />
                            </div>
                            <h5 className="text-[20px] flex items-center justify-center font-semibold text-grayscale-900 font-notoSans px-4">
                                {isCompleted && <BlueCheckMark className="w-[22px] h-auto" />}
                                {app?.name}
                            </h5>
                        </div>
                    </div>
                )}

                <div className="w-full flex flex-col items-center justify-center relative pb-[24px]">
                    {!hideUser && (
                        <>
                            <div className="w-full flex items-center justify-center relative mb-[-3.4px]">
                                <IDSleeve className="h-auto w-full rotate-180" />
                            </div>
                            <div className="absolute bg-white min-w-[70px] min-h-[70px] max-w-[70px] max-h-[70px] rounded-full mb-6 shadow-soft-bottom top-[10px] overflow-hidden border-solid border-white border-[3px]">
                                <ProfilePicture
                                    customContainerClass="flex w-[70px] h-[70px] items-center justify-center rounded-full overflow-hidden object-cover"
                                    customImageClass="w-full h-full object-cover flex-shrink-0"
                                    customSize={120}
                                />
                            </div>

                            <p className="text-center font-semibold text-[17px] text-grayscale-900 mt-[50px] pb-[10px] px-6">
                                {currentUser?.name}
                                <br />
                                {isCompleted && (
                                    <span className="text-grayscale-700 text-[14px] font-notoSans ml-2">
                                        has successfully completed
                                    </span>
                                )}
                            </p>
                        </>
                    )}

                    <p className="text-grayscale-600 text-[17px] font-semibold mb-2 tracking-[0.25px]">
                        AI Session Summary
                    </p>

                    <p className="text-center font-semibold text-xl text-grayscale-900 pb-[10px] capitalize">
                        {sessionName}
                    </p>

                    <p className="text-grayscale-700 text-[14px] font-notoSans">
                        Started on {startDate}
                    </p>

                    {!isCompleted && (
                        <>
                            <p className="text-rose-500 text-[14px] font-semibold font-notoSans flex items-center justify-center bg-rose-50 py-2 px-4 rounded-[12px] mt-4">
                                <span className="bg-rose-500 w-[10px] h-[10px] rounded-full mr-2" />
                                Unfinished
                            </p>
                        </>
                    )}
                </div>

                {isCompleted && (
                    <div className="w-full flex flex-col items-center justify-center relative">
                        <div className="w-full flex items-center justify-center relative mb-[-3.4px]">
                            <IDSleeve className="h-auto w-full" />
                        </div>

                        <button
                            onClick={handleShare}
                            className="absolute bg-white p-3 rounded-full mb-6 shadow-soft-bottom"
                        >
                            <QRCodeScanner className="h-[30px] text-grayscale-900" />
                        </button>
                    </div>
                )}

                <div className="bg-white w-full flex flex-col items-center justify-center">
                    {isCompleted && (
                        <div className="rounded-[20px] bg-white w-full ion-padding px-6">
                            <h3 className="text-xl text-gray-900 font-notoSans">
                                Learning Overview
                            </h3>
                            <div className="flex flex-col items-start justify-start mt-2">
                                {thingsLearned?.map((thing: string, index: number) => (
                                    <div
                                        key={index}
                                        className="flex items-start justify-start mt-2"
                                    >
                                        <Checkmark className="w-[24px] h-auto mr-2 shrink-0 text-emerald-500" />
                                        <p className="text-grayscale-700 text-sm font-notoSans font-normal p-0 m0">
                                            {thing}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="w-full flex items-center justify-center">
                        <div
                            className={` h-[1px] bg-grayscale-200 ${
                                hideApp && hideUser ? 'w-full' : 'w-[95%]'
                            }`}
                        />
                    </div>

                    {isCompleted && (
                        <p className="text-blue-500 text-[12px] font-semibold font-notoSans py-2 flex items-center justify-center">
                            <BlueCheckMark className="w-[18px] h-auto" /> TRUSTED
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AiAssessmentPreviewHeader;
