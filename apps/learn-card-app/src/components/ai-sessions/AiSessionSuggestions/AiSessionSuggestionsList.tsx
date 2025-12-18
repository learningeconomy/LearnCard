import React from 'react';

import AiSessionSuggestionListItem from './AiSessionSuggestionListItem';

import { AI_TOPICS_AND_SESSIONS_DUMMY_DATA } from '../../ai-sessions/AiSessionTopics/aiSession-topics.helpers';

export const AiSessionSuggestionsList: React.FC = () => {
    return (
        <div className="w-full flex flex-col items-center justify-start max-h-[600px] overflow-y-auto mt-6">
            {AI_TOPICS_AND_SESSIONS_DUMMY_DATA?.slice?.(0, 3)?.map(topic => (
                <AiSessionSuggestionListItem key={topic.id} topic={topic} />
            ))}
        </div>
    );
};

export default AiSessionSuggestionsList;
