import React from 'react';

import { m } from '../../../paraglide/messages.js';

export enum AiInsightsTabsEnum {
    MyInsights = 'my-insights',
    LearnerInsights = 'learner-insights',
    SharedInsights = 'shared-insights',
    ChildInsights = 'child-insights',
}

export const getAiInsightsTabs = () => {
    return [
        {
            label: m['aiInsights.tabs.myInsights'](),
            value: AiInsightsTabsEnum.MyInsights,
        },
        {
            label: m['aiInsights.tabs.learnerInsights'](),
            value: AiInsightsTabsEnum.LearnerInsights,
        },
        {
            label: m['aiInsights.tabs.sharedInsights'](),
            value: AiInsightsTabsEnum.SharedInsights,
        },
        {
            label: m['aiInsights.tabs.childInsights'](),
            value: AiInsightsTabsEnum.ChildInsights,
        },
    ] as const;
};
