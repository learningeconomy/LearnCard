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
 * Get the current step from integration's server-side guideState
 */
export const getGuideCurrentStep = (integration: LCNIntegration): number => {
    const guideState = integration.guideState as { currentStep?: number } | undefined;
    return guideState?.currentStep ?? 0;
};

/**
 * Get the route for an integration based on its status and guide type
 * If active, routes to the dashboard. If in setup mode, routes to the guide.
 */
export const getIntegrationRoute = (integration: LCNIntegration): string => {
    const { guideType, status } = integration;

    // If integration is active, go straight to the dashboard
    if (status === 'active') {
        return `/app-store/developer/integrations/${integration.id}`;
    }

    // If in setup mode, route to the guide
    if (guideType) {
        const currentStep = getGuideCurrentStep(integration);
        const baseRoute = `/app-store/developer/integrations/${integration.id}/guides/${guideType}`;

        if (currentStep > 0) {
            return `${baseRoute}?step=${currentStep}`;
        }

        return baseRoute;
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
    // If integration is active, go straight to the dashboard
    if (status === 'active') {
        return `/app-store/developer/integrations/${integrationId}`;
    }

    // If in setup mode, route to the guide
    if (guideType) {
        return `/app-store/developer/integrations/${integrationId}/guides/${guideType}`;
    }

    return `/app-store/developer/integrations/${integrationId}/guides`;
};
