import React, { useEffect, useState } from 'react';

import { m } from '../../../paraglide/messages.js';

import { AiInsightsTabsEnum, getAiInsightsTabs } from './ai-insights-tabs.helpers';

import { useGetCurrentUserRole, useContractSentRequests, useGetContracts } from 'learn-card-base';
import { LearnCardRolesEnum } from 'apps/learn-card-app/src/components/onboarding/onboarding.helpers';
import { useAnalytics, AnalyticsEvents, useEngagementSignal } from '@analytics';

export const AiInsightsTabs: React.FC<{
    className?: string;
    selectedTab?: AiInsightsTabsEnum;
    setSelectedTab?: (tab: AiInsightsTabsEnum) => void;
    showAgentDebugTab?: boolean;
}> = ({ className, selectedTab, setSelectedTab, showAgentDebugTab = false }) => {
    const isSelectedTab = (tab: AiInsightsTabsEnum) => selectedTab === tab;

    const [contractUri, setContractUri] = useState<string>('');

    const { data: paginatedContracts } = useGetContracts();
    const contracts = paginatedContracts?.records;
    const { data: requests = [] } = useContractSentRequests(contractUri);

    useEffect(() => {
        const existingTeacherContract = contracts?.find(c => c.name === 'AI Insights');

        if (existingTeacherContract) {
            setContractUri(existingTeacherContract.uri);
        }
    }, [contracts]);

    const newInsightsCount = requests.filter(r => r.readStatus === 'unseen').length ?? 0;

    const { track } = useAnalytics();
    const fireEngagement = useEngagementSignal();

    const handleSetSelectedTab = (tab: AiInsightsTabsEnum) => {
        track(AnalyticsEvents.AI_INSIGHTS_TAB_SWITCHED, { tab });

        // LC-1853 (review #7): per-session gate. Subsequent tab switches in
        // the same session won't re-fire — only the first AI Insights view
        // counts as an engagement signal for Q4 activation-threshold analysis.
        fireEngagement('ai_insights');

        setSelectedTab?.(tab);
    };

    const currentUserRole = useGetCurrentUserRole();

    return (
        <div
            className={`${className} flex items-center gap-[10px] overflow-x-auto scrollbar-hide flex-nowrap`}
        >
            {getAiInsightsTabs().map(tab => {
                if (
                    tab.value === AiInsightsTabsEnum.LearnerInsights &&
                    currentUserRole !== LearnCardRolesEnum.teacher
                ) {
                    return null;
                }

                if (
                    tab.value === AiInsightsTabsEnum.ChildInsights &&
                    currentUserRole !== LearnCardRolesEnum.guardian
                ) {
                    return null;
                }

                if (tab.value === AiInsightsTabsEnum.AgentDebug && !showAgentDebugTab) {
                    return null;
                }

                return (
                    <button
                        key={tab.value}
                        onClick={() => handleSetSelectedTab(tab.value)}
                        className={`text-sm font-medium flex items-center justify-center gap-[5px] px-[14px] py-[7px] rounded-[5px] whitespace-nowrap ${
                            isSelectedTab(tab.value)
                                ? 'bg-white text-grayscale-900'
                                : 'text-grayscale-600'
                        }`}
                    >
                        {tab.label}
                        {tab.value === AiInsightsTabsEnum.LearnerInsights &&
                            newInsightsCount > 0 && (
                                <span className="text-sm text-emerald-700 font-bold">
                                    {' '}
                                    • {m['aiInsights.tabs.newCount']({ count: newInsightsCount })}
                                </span>
                            )}
                    </button>
                );
            })}
        </div>
    );
};

export default AiInsightsTabs;
