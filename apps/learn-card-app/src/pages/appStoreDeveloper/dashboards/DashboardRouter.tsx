import React from 'react';
import { Loader2 } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { UnifiedIntegrationDashboard } from './UnifiedIntegrationDashboard';

interface DashboardRouterProps {
    integration: LCNIntegration;
    isLoading?: boolean;
    onBack?: () => void;
}

/**
 * Routes to the appropriate dashboard based on integration config.
 * Now uses UnifiedIntegrationDashboard for all guide types.
 */
export const DashboardRouter: React.FC<DashboardRouterProps> = ({
    integration,
    isLoading = false,
    onBack,
}) => {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                    <p className="text-sm text-gray-500 mt-3">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <UnifiedIntegrationDashboard
            integration={integration}
            onBack={onBack}
        />
    );
};
