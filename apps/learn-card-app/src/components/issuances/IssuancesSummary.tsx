import React from 'react';
import { useIntegrationActivity } from 'src/pages/appStoreDeveloper/dashboards/hooks/useIntegrationActivity';

interface IssuancesSummaryProps {
    boostUri: string;
    onManage: () => void;
}

export const IssuancesSummary: React.FC<IssuancesSummaryProps> = ({ boostUri, onManage }) => {
    const { stats } = useIntegrationActivity([], { boostUri, limit: 1 });
    const pending = stats.pendingClaims ?? 0;

    return (
        <div className="flex flex-col gap-2">
            <p className="text-sm text-gray-500">
                {stats.totalSent ?? 0} issued · {stats.totalClaimed ?? 0} claimed
                {pending > 0 ? ` · ${pending} pending` : ''}
            </p>
            <button
                type="button"
                onClick={onManage}
                className="text-sm font-semibold text-indigo-500 text-left"
            >
                Manage Issuances
            </button>
        </div>
    );
};
