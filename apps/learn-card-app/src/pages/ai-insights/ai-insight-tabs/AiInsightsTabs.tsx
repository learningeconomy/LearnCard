import React, { useEffect, useState } from 'react';

import { AiInsightsTabsEnum, aiInsightsTabs } from './ai-insights-tabs.helpers';

import { useGetCurrentUserRole, useContractSentRequests, useGetContracts } from 'learn-card-base';
import { LearnCardRolesEnum } from 'apps/learn-card-app/src/components/onboarding/onboarding.helpers';

export const AiInsightsTabs: React.FC<{
    className?: string;
    selectedTab?: AiInsightsTabsEnum;
    setSelectedTab?: (tab: AiInsightsTabsEnum) => void;
}> = ({ className, selectedTab, setSelectedTab }) => {
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

    const handleSetSelectedTab = (tab: AiInsightsTabsEnum) => {
        setSelectedTab?.(tab);
    };

    const currentUserRole = useGetCurrentUserRole();

    if (currentUserRole === LearnCardRolesEnum.learner) {
        return null;
    }

    return (
        <div className={`${className} flex items-center gap-[10px]`}>
            {aiInsightsTabs.map(tab => {
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

                return (
                    <button
                        key={tab.value}
                        onClick={() => handleSetSelectedTab(tab.value)}
                        className={`text-sm font-medium flex items-center justify-center gap-[5px] px-[14px] py-[7px] rounded-[5px]  ${
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
                                    • {newInsightsCount} New
                                </span>
                            )}
                    </button>
                );
            })}
        </div>
    );
};

export default AiInsightsTabs;
