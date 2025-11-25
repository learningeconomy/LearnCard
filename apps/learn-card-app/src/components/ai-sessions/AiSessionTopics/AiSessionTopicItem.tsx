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
}> = ({ topicRecord, topicBoost, topicVc, topicSessionsCount }) => {
    const history = useHistory();

    const app = aiPassportApps?.find(app => app?.contractUri === topicRecord?.contractUri);
    const topicTitle = getAiTopicTitle(topicVc) ?? '';

    return (
        <button
            onClick={() => history.push(`/ai/sessions?topicBoostUri=${topicBoost?.uri}`)}
            className="flex items-center justify-between w-full bg-white pb-[12px] pt-[12px]"
        >
            <div className="flex items-center justify-start">
                <div className="w-[45px] flex items-center justify-center mr-1">
                    <div className="h-[45px] w-[45px]">
                        <img
                            className="w-full h-full object-cover bg-white rounded-[12px] overflow-hidden border-[1px] border-solid"
                            alt={`${app?.name} logo`}
                            src={app?.img}
                        />
                    </div>
                </div>
                <p className="text-grayscale-900 text-[17px] font-notoSans font-semibold capitalize ml-2 text-left pr-4 line-clamp-2">
                    {topicTitle}
                </p>
            </div>

            <div className="flex items-center justify-end text-grayscale-600 font-poppins text-sm">
                <span>{topicSessionsCount}</span>
                <SlimCaretRight className="text-grayscale-400 w-[20px] h-auto" />
            </div>
        </button>
    );
};

export default AiSessionTopicItem;
