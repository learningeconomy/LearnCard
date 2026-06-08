import React from 'react';

import i18next from 'i18next';

export enum AiInsightsTabsEnum {
    MyInsights = 'my-insights',
    LearnerInsights = 'learner-insights',
    SharedInsights = 'shared-insights',
    ChildInsights = 'child-insights',
}

export const getAiInsightsTabs = () => {
    return [
        {
            label: i18next.i18next.t('aiInsights.tabs.myInsights', 'My insights'),
            value: AiInsightsTabsEnum.MyInsights,
        },
        {
            label: i18next.i18next.t('aiInsights.tabs.learnerInsights', 'Learner insights'),
            value: AiInsightsTabsEnum.LearnerInsights,
        },
        {
            label: i18next.i18next.t('aiInsights.tabs.sharedInsights', 'Shared insights'),
            value: AiInsightsTabsEnum.SharedInsights,
        },
        {
            label: i18next.i18next.t('aiInsights.tabs.childInsights', 'Child insights'),
            value: AiInsightsTabsEnum.ChildInsights,
        },
    ] as const;
};
