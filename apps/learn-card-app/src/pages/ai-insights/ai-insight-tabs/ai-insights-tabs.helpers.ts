import React from 'react';

export enum AiInsightsTabsEnum {
    MyInsights = 'my-insights',
    LearnerInsights = 'learner-insights',
    SharedInsights = 'shared-insights',
    ChildInsights = 'child-insights',
}

export const aiInsightsTabs: {
    label: string;
    value: AiInsightsTabsEnum;
}[] = [
    {
        label: 'My insights',
        value: AiInsightsTabsEnum.MyInsights,
    },
    {
        label: 'Learner insights',
        value: AiInsightsTabsEnum.LearnerInsights,
    },
    {
        label: 'Shared insights',
        value: AiInsightsTabsEnum.SharedInsights,
    },
    {
        label: 'Child insights',
        value: AiInsightsTabsEnum.ChildInsights,
    },
];
