import React from 'react';
import { Capacitor } from '@capacitor/core';

import { VC } from '@learncard/types';
import { getAiSessionTitle } from '../../ai-sessions/aiSessions.helpers';

export const AiAssessmentIntro: React.FC<{ session: VC }> = ({ session }) => {
    const sessionTitle = getAiSessionTitle(session);

    return (
        <>
            <div className="w-full">
                <h1
                    className={`text-grayscale-900 text-[22px] font-semibold font-notoSans capitalize ${
                        Capacitor.isNativePlatform() ? 'pt-[75px]' : ''
                    }`}
                >
                    {sessionTitle}
                </h1>
            </div>
            <div className="w-full mt-4">
                <h4 className="text-grayscale-900 font-semibold font-notoSans text-lg">
                    Final Assessment
                </h4>
                <p className="text-grayscale-700 text-base font-notoSans mt-2">
                    Answer each of these one at a time.
                </p>
            </div>
        </>
    );
};

export default AiAssessmentIntro;
