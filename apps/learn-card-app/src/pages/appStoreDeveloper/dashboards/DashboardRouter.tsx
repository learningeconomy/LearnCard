import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import type { LCNIntegration } from '@learncard/types';
import * as m from '../../../paraglide/messages.js';

import { UnifiedIntegrationDashboard } from './UnifiedIntegrationDashboard';
import { AppHome } from './AppHome';

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
    const [isAdvancedView, setIsAdvancedView] = useState(false);

    useEffect(() => {
        const savedView = localStorage.getItem(`lc-app-home-view:${integration.id}`);
        if (savedView === 'advanced') {
            setIsAdvancedView(true);
        }
    }, [integration.id]);

    const toggleAdvancedView = () => {
        const newValue = !isAdvancedView;
        setIsAdvancedView(newValue);
        localStorage.setItem(
            `lc-app-home-view:${integration.id}`,
            newValue ? 'advanced' : 'simple'
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-cyan-500 mx-auto animate-spin" />
                    <p className="text-sm text-gray-500 mt-3">
                        {m['developerPortal.dashboards.loading']()}
                    </p>
                </div>
            </div>
        );
    }

    if (integration.guideType === 'embed-app' && !isAdvancedView) {
        return (
            <AppHome
                integration={integration}
                onBack={onBack}
                onToggleAdvanced={toggleAdvancedView}
            />
        );
    }

    return (
        <div className="relative">
            {integration.guideType === 'embed-app' && (
                <div className="absolute top-4 right-4 z-10">
                    <button
                        onClick={toggleAdvancedView}
                        className="text-sm text-grayscale-600 hover:text-grayscale-900 transition-colors"
                    >
                        Simple view
                    </button>
                </div>
            )}
            <UnifiedIntegrationDashboard integration={integration} onBack={onBack} />
        </div>
    );
};
