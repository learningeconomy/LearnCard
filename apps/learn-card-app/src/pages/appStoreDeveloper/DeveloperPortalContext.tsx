import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import type { LCNIntegration } from '@learncard/types';

import { useDeveloperPortal } from './useDeveloperPortal';
import type { UseCaseId } from './guides/types';

interface DeveloperPortalContextValue {
    // Current state from URL
    currentIntegrationId: string | null;
    currentGuideType: UseCaseId | null;

    // Derived data
    integrations: LCNIntegration[];
    currentIntegration: LCNIntegration | null;
    isLoadingIntegrations: boolean;

    // Navigation actions
    selectIntegration: (id: string | null) => void;
    selectGuide: (guideType: UseCaseId) => void;
    goToIntegrationHub: () => void;
    goToApps: () => void;

    // Mutations
    createIntegration: (name: string) => Promise<string>;
    isCreatingIntegration: boolean;
}

const DeveloperPortalContext = createContext<DeveloperPortalContextValue | null>(null);

interface DeveloperPortalProviderProps {
    children: React.ReactNode;
}

export const DeveloperPortalProvider: React.FC<DeveloperPortalProviderProps> = ({ children }) => {
    const history = useHistory();
    const location = useLocation();

    // Extract IDs from URL - this is the source of truth
    const integrationMatch = location.pathname.match(/\/integrations\/([^/]+)/);
    const guideMatch = location.pathname.match(/\/guides\/([^/]+)/);

    const currentIntegrationId = integrationMatch?.[1] || null;
    const currentGuideType = (guideMatch?.[1] as UseCaseId) || null;

    // Fetch integrations
    const { useIntegrations, useCreateIntegration } = useDeveloperPortal();
    const { data: integrations = [], isLoading: isLoadingIntegrations } = useIntegrations();
    const createIntegrationMutation = useCreateIntegration();

    // Find current integration from the list
    const currentIntegration = useMemo(() => {
        if (!currentIntegrationId || !integrations.length) return null;

        return integrations.find(i => i.id === currentIntegrationId) || null;
    }, [currentIntegrationId, integrations]);

    // Navigation actions
    const selectIntegration = useCallback((id: string | null) => {
        if (!id) return;

        const integration = integrations.find(i => i.id === id);

        if (integration?.status === 'active') {
            // Active integrations go to their dashboard
            history.push(`/app-store/developer/integrations/${id}`);
        } else if (integration?.guideType) {
            // If integration has a guide type, go directly to that guide
            history.push(`/app-store/developer/integrations/${id}/guides/${integration.guideType}`);
        } else {
            // Otherwise go to the hub to choose a guide
            history.push(`/app-store/developer/integrations/${id}/guides`);
        }
    }, [history, integrations]);

    const selectGuide = useCallback((guideType: UseCaseId) => {
        if (!currentIntegrationId) return;

        history.push(`/app-store/developer/integrations/${currentIntegrationId}/guides/${guideType}`);
    }, [history, currentIntegrationId]);

    const goToIntegrationHub = useCallback(() => {
        if (currentIntegration?.status === 'active') {
            // Active integrations go to their dashboard
            history.push(`/app-store/developer/integrations/${currentIntegration.id}`);
        } else if (currentIntegrationId) {
            history.push(`/app-store/developer/integrations/${currentIntegrationId}`);
        } else if (integrations.length > 0) {
            history.push(`/app-store/developer/integrations/${integrations[0].id}`);
        } else {
            history.push('/app-store/developer/guides');
        }
    }, [history, currentIntegration, currentIntegrationId, integrations]);

    const goToApps = useCallback(() => {
        history.push('/app-store/developer');
    }, [history]);

    // Create integration action
    const createIntegration = useCallback(async (name: string): Promise<string> => {
        const id = await createIntegrationMutation.mutateAsync(name);

        // Navigate to the new integration's hub
        history.push(`/app-store/developer/integrations/${id}/guides`);

        return id;
    }, [createIntegrationMutation, history]);

    const value = useMemo<DeveloperPortalContextValue>(() => ({
        currentIntegrationId,
        currentGuideType,
        integrations,
        currentIntegration,
        isLoadingIntegrations,
        selectIntegration,
        selectGuide,
        goToIntegrationHub,
        goToApps,
        createIntegration,
        isCreatingIntegration: createIntegrationMutation.isPending,
    }), [
        currentIntegrationId,
        currentGuideType,
        integrations,
        currentIntegration,
        isLoadingIntegrations,
        selectIntegration,
        selectGuide,
        goToIntegrationHub,
        goToApps,
        createIntegration,
        createIntegrationMutation.isPending,
    ]);

    return (
        <DeveloperPortalContext.Provider value={value}>
            {children}
        </DeveloperPortalContext.Provider>
    );
};

export const useDeveloperPortalContext = (): DeveloperPortalContextValue => {
    const context = useContext(DeveloperPortalContext);

    if (!context) {
        throw new Error('useDeveloperPortalContext must be used within a DeveloperPortalProvider');
    }

    return context;
};

export default DeveloperPortalContext;
