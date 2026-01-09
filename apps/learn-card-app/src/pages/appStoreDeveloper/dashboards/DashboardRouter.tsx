import React from 'react';
import { useHistory } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';

import { IssueCredentialsDashboard } from './IssueCredentialsDashboard';
import { EmbedClaimDashboard } from './EmbedClaimDashboard';
import { ConsentFlowDashboard } from './ConsentFlowDashboard';
import { IntegrationDashboard } from './IntegrationDashboard';

interface DashboardRouterProps {
    integration: LCNIntegration;
    isLoading?: boolean;
}

/**
 * Routes to the appropriate dashboard based on the integration's guideType.
 * Each guide type has its own specialized dashboard for managing that integration.
 */
export const DashboardRouter: React.FC<DashboardRouterProps> = ({
    integration,
    isLoading = false,
}) => {
    const history = useHistory();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                    <p className="text-sm text-gray-500 mt-3">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    // If integration is still in setup, redirect to the appropriate guide
    if (integration.status === 'setup' || !integration.status) {
        const guideType = integration.guideType;

        if (guideType === 'partner-onboarding') {
            history.replace(`/app-store/developer/integrations/${integration.id}/setup`);
        } else if (guideType) {
            history.replace(`/app-store/developer/integrations/${integration.id}/guides/${guideType}`);
        } else {
            history.replace(`/app-store/developer/integrations/${integration.id}/guides`);
        }

        return null;
    }

    const handleBack = () => {
        history.push('/app-store/developer/integrations');
    };

    // Route to appropriate dashboard based on guideType
    switch (integration.guideType) {
        case 'issue-credentials':
            return (
                <IssueCredentialsDashboard
                    integration={integration}
                    onBack={handleBack}
                />
            );

        case 'embed-claim':
            return (
                <EmbedClaimDashboard
                    integration={integration}
                    onBack={handleBack}
                />
            );

        case 'consent-flow':
            return (
                <ConsentFlowDashboard
                    integration={integration}
                    onBack={handleBack}
                />
            );

        case 'partner-onboarding':
        default:
            // Default to the full integration dashboard (partner onboarding)
            return (
                <IntegrationDashboard
                    integration={integration}
                    onBack={handleBack}
                />
            );
    }
};
