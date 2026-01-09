import { IntegrationStatus } from '../types';

const STORAGE_KEY_PREFIX = 'lc_integration_status_';

export interface IntegrationStatusData {
    status: IntegrationStatus;
    setupStep?: number;
    completedAt?: string;
    /** The guide type selected for this integration (e.g., 'issue-credentials', 'partner-onboarding') */
    guideType?: string;
}

/**
 * Get the status of an integration from localStorage
 * Returns 'setup' if no status is stored (new integrations default to setup)
 */
export const getIntegrationStatus = (integrationId: string): IntegrationStatusData => {
    try {
        const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${integrationId}`);

        if (stored) {
            return JSON.parse(stored);
        }
    } catch (err) {
        console.warn('Failed to read integration status:', err);
    }

    // Default to setup status for new/unknown integrations
    return { status: 'setup', setupStep: 0 };
};

/**
 * Set the status of an integration in localStorage
 */
export const setIntegrationStatus = (
    integrationId: string,
    data: Partial<IntegrationStatusData>
): void => {
    try {
        const current = getIntegrationStatus(integrationId);
        const updated = { ...current, ...data };

        localStorage.setItem(`${STORAGE_KEY_PREFIX}${integrationId}`, JSON.stringify(updated));
    } catch (err) {
        console.warn('Failed to save integration status:', err);
    }
};

/**
 * Mark an integration as active (setup complete)
 */
export const markIntegrationActive = (integrationId: string): void => {
    setIntegrationStatus(integrationId, {
        status: 'active',
        completedAt: new Date().toISOString(),
    });
};

/**
 * Update the setup step for an integration
 */
export const updateSetupStep = (integrationId: string, step: number): void => {
    setIntegrationStatus(integrationId, { setupStep: step });
};

/**
 * Set the guide type for an integration
 */
export const setGuideType = (integrationId: string, guideType: string): void => {
    setIntegrationStatus(integrationId, { guideType });
};

/**
 * Check if an integration has completed setup
 */
export const isIntegrationActive = (integrationId: string): boolean => {
    const { status } = getIntegrationStatus(integrationId);

    return status === 'active';
};

/**
 * Get the route for an integration based on its status and guide type
 */
export const getIntegrationRoute = (integrationId: string): string => {
    const { status, guideType } = getIntegrationStatus(integrationId);

    if (status === 'active') {
        return `/app-store/developer/integrations/${integrationId}`;
    }

    // Setup status - check if guide type has been chosen
    if (guideType === 'partner-onboarding') {
        // Partner onboarding goes to the setup wizard
        return `/app-store/developer/integrations/${integrationId}/setup`;
    }

    if (guideType) {
        // Other guide types go to their specific guide page
        return `/app-store/developer/integrations/${integrationId}/guides/${guideType}`;
    }

    // No guide type chosen yet - go to IntegrationHub to choose
    return `/app-store/developer/integrations/${integrationId}/guides`;
};
