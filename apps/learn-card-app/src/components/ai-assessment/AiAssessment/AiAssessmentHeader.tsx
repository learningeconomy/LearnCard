import React from 'react';

import SlimCaretLeft from '../../svgs/SlimCaretLeft';
import IDSleeve from 'learn-card-base/svgs/IDSleeve';

import { LCR } from 'learn-card-base/types/credential-records';
import { VC } from '@learncard/types';
import { AiSession } from 'learn-card-base';
import { getAiPassportAppByContractUri } from '../../ai-passport-apps/aiPassport-apps.helpers';

import { useModal } from 'learn-card-base';

export const AiAssessmentPreviewHeader: React.FC<{
    topicRecord?: LCR;
    topicVc?: VC;
    session: AiSession;
    showBackButton?: boolean;
}> = ({ topicRecord, topicVc, session, showBackButton }) => {
    const { closeModal } = useModal();

    const app = getAiPassportAppByContractUri(
        session?.record?.contractUri || topicRecord?.contractUri || ''
    );
    return (
        <div className="w-full absolute top-0 overflow-hidden flex flex-col z-50 safe-area-top-margin">
            <div className="w-full flex items-center justify-center flex-col bg-transparent relative">
                {showBackButton && (
                    <button
                        onClick={() => closeModal()}
                        className="absolute top-[20px] left-[15px] z-[99999]"
                    >
                        <SlimCaretLeft className="shrink-0 text-grayscale-600" />
                    </button>
                )}
                <div className="w-full relative flex items-center justify-center flex-col">
                    <div className="w-full absolute top-[0] h-[90px] bg-white" />
                    <div className="w-full flex flex-col items-center justify-center mb-4 mt-6 z-50">
                        <h4 className="font-semibold text-indigo-500 text-sm">
                            AI Session <span className="text-grayscale-900">• {app?.name}</span>
                        </h4>
                    </div>
                </div>

                <div className="w-full flex flex-col items-center justify-center relative pb-[40px]">
                    <div className="w-full flex items-center justify-center relative mb-[-3.4px]">
                        <IDSleeve className="h-auto w-full rotate-180" />
                    </div>

                    <div className="absolute bg-white min-w-[70px] min-h-[70px] max-w-[70px] max-h-[70px] rounded-full mb-6 shadow-soft-bottom top-[10px] overflow-hidden border-solid border-white border-[3px]">
                        <img
                            className="w-full h-full object-cover"
                            alt={`${app?.name} logo`}
                            src={app?.img}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiAssessmentPreviewHeader;
