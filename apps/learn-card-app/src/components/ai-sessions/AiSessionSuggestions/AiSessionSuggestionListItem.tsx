import React from 'react';

import LockSimple from 'learn-card-base/svgs/LockSimple';
import AiSessionAppSelector from '../../new-ai-session/AiSessionAppSelector/AiSessionAppSelector';

import { AiSessionTopic } from '../../ai-sessions/AiSessionTopics/aiSession-topics.helpers';
import { LaunchPadAppListItem } from 'learn-card-base';

const AiSessionSuggestionsListItem: React.FC<{ topic: AiSessionTopic }> = ({ topic }) => {
    const handleStartSession = (app: LaunchPadAppListItem) => {
        // TODO: Implement start session
        console.log(app);
    };

    return (
        <div className="w-full flex items-center justify-between border-solid border-b-[1px] border-grayscale-200">
            <div className="w-full flex items-center justify-between rounded-[16px] max-w-[800px]">
                <h1 className=" text-grayscale-900 font-semibold text-[17px] text-center flex">
                    {topic.title} |&nbsp;{' '}
                    <span className="bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center text-xs px-2 line-clamp-1 min-h-[24px] ml-1">
                        <LockSimple version="2" className="h-[16px] w-[16px]" />
                        &nbsp;
                        <span className="font-semibold min-w-[42px]">
                            {topic?.sessions.length ?? 0} Skills
                        </span>{' '}
                        &nbsp;in&nbsp;
                        <span className="font-semibold line-clamp-1 text-left">{topic.title}</span>
                    </span>
                </h1>
            </div>

            <div className="flex items-center justify-end">
                <AiSessionAppSelector handleSetAiApp={handleStartSession} minified />
            </div>
        </div>
    );
};

export default AiSessionSuggestionsListItem;
