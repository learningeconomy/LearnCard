import React from 'react';

import { usePathQuery } from 'learn-card-base';

import AiSessionsPage from '../../pages/ai-sessions/AiSessionsPage';

type AiSessionsContainerProps = {
    topicUri?: string;
};

export const AiSessionsContainer: React.FC<AiSessionsContainerProps> = ({ topicUri }) => {
    const query = usePathQuery();
    const queryTopicUri = query.get('topicBoostUri') ?? '';

    return <AiSessionsPage topicUri={topicUri ?? queryTopicUri} />;
};

export default AiSessionsContainer;
