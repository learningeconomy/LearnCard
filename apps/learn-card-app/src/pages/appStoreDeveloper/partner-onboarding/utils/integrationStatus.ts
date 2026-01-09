import type { LCNIntegration, LCNIntegrationStatus } from '@learncard/types';

import { IntegrationStatus } from '../types';

/**
 * Guide state for partner onboarding wizard
 */
export interface PartnerOnboardingGuideState {
    setupStep?: number;
    integrationMethod?: string;
    completedAt?: string;
}

/**
 * Extract status data from an integration object
 */
export const getIntegrationStatusFromObject = (
    integration: LCNIntegration | null | undefined
): { status: LCNIntegrationStatus; guideType?: string; guideState?: Record<string, unknown> } => {
    if (!integration) {
        return { status: 'setup' };
    }

    return {
        status: integration.status ?? 'setup',
        guideType: integration.guideType,
        guideState: integration.guideState,
    };
};

/**
 * Get the setup step from an integration's guideState
 */
export const getSetupStep = (integration: LCNIntegration | null | undefined): number => {
    const guideState = integration?.guideState as PartnerOnboardingGuideState | undefined;

    return guideState?.setupStep ?? 0;
};

/**
 * Check if an integration has completed setup
 */
export const isIntegrationActive = (integration: LCNIntegration | null | undefined): boolean => {
    return integration?.status === 'active';
};

/**
 * Get the route for an integration based on its status and guide type
 */
export const getIntegrationRoute = (integration: LCNIntegration): string => {
    const { status, guideType } = integration;

    if (status === 'active') {
        return `/app-store/developer/integrations/${integration.id}`;
    }

    // Setup status - check if guide type has been chosen
    if (guideType === 'partner-onboarding') {
        // Partner onboarding goes to the setup wizard
        return `/app-store/developer/integrations/${integration.id}/setup`;
    }

    if (guideType) {
        // Other guide types go to their specific guide page
        return `/app-store/developer/integrations/${integration.id}/guides/${guideType}`;
    }

    // No guide type chosen yet - go to IntegrationHub to choose
    return `/app-store/developer/integrations/${integration.id}/guides`;
};

/**
 * Get the route for an integration by ID (simplified version for when you only have the ID)
 * Use getIntegrationRoute with the full integration object when available
 */
export const getIntegrationRouteById = (
    integrationId: string,
    status?: LCNIntegrationStatus,
    guideType?: string
): string => {
    if (status === 'active') {
        return `/app-store/developer/integrations/${integrationId}`;
    }

    if (guideType === 'partner-onboarding') {
        return `/app-store/developer/integrations/${integrationId}/setup`;
    }

    if (guideType) {
        return `/app-store/developer/integrations/${integrationId}/guides/${guideType}`;
    }

    return `/app-store/developer/integrations/${integrationId}/guides`;
};
