import React from 'react';
import { useHistory } from 'react-router-dom';

import SlimCaretRight from '../../svgs/SlimCaretRight';

import { aiPassportApps } from '../../ai-passport-apps/aiPassport-apps.helpers';
import { Boost, VC } from '@learncard/types';
import { getAiTopicTitle } from '../../new-ai-session/newAiSession.helpers';
import { LCR } from 'learn-card-base/types/credential-records';

export const AiSessionTopicItem: React.FC<{
    topicRecord?: LCR;
    topicBoost?: Boost;
    topicVc?: VC;
    topicSessionsCount: number;
    hasNewSessions?: boolean;
}> = ({ topicRecord, topicBoost, topicVc, topicSessionsCount, hasNewSessions }) => {
    const history = useHistory();

    const app = aiPassportApps?.find(app => app?.contractUri === topicRecord?.contractUri);
    const topicTitle = getAiTopicTitle(topicVc) ?? '';

    return (
        <button
            onClick={() => history.push(`/ai/sessions?topicBoostUri=${topicBoost?.uri}`)}
            className="flex items-center justify-between w-full bg-white rounded-2xl shadow-sm px-4 py-3 mb-3"
        >
            <div className="flex items-center justify-start flex-1 min-w-0">
                <div className="h-[50px] w-[50px] shrink-0">
                    <img
                        className="w-full h-full object-cover bg-white rounded-[12px] overflow-hidden border border-grayscale-200"
                        alt={`${app?.name} logo`}
                        src={app?.img}
                    />
                </div>
                <div className="flex flex-col items-start justify-center ml-3 min-w-0">
                    <p className="text-grayscale-900 text-[17px] font-poppins font-semibold capitalize text-left line-clamp-1">
                        {topicTitle}
                    </p>
                    {app?.name && (
                        <p className="text-grayscale-500 text-[13px] font-poppins font-normal text-left">
                            With {app.name}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-end gap-1 shrink-0 ml-3 text-grayscale-600 font-poppins text-sm">
                {hasNewSessions && (
                    <span className="w-[8px] h-[8px] rounded-full bg-red-500 shrink-0" />
                )}
                <span>{topicSessionsCount}</span>
                <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
            </div>
        </button>
    );
};

export default AiSessionTopicItem;
